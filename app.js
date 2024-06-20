import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();



if (!process.env.DIFY_API_URL) throw new Error("DIFY API URL is required.");
function generateId() {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 29; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
const app = express();
app.use(bodyParser.json());
const botType = process.env.BOT_TYPE || 'Chat';
const inputVariable = process.env.INPUT_VARIABLE || '';
const outputVariable = process.env.OUTPUT_VARIABLE || '';

let apiPath;
switch (botType) {
  case 'Chat':
    apiPath = '/chat-messages';
    break;
  case 'Completion':
    apiPath = '/completion-messages';
    break;
  case 'Workflow':
    apiPath = '/workflows/run';
    break;
  default:
    throw new Error('Invalid bot type in the environment variable.');
}
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization",
  "Access-Control-Max-Age": "86400",
};

app.use((req, res, next) => {
  res.set(corsHeaders);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  console.log('Request Method:', req.method); 
  console.log('Request Path:', req.path);
  next();
});

// new router '/v1/models'
app.get('/v1/models', (req, res) => {
  const models = {
    "object": "list",
    "data": [
      {
        "id": "dify",
        "object": "model",
        "owned_by": "dify",
        "permission": null,
      }
    ]
  };
  res.json(models);
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>DIFY2OPENAI</title>
      </head>
      <body>
        <h1>Dify2OpenAI</h1>
        <p>Congratulations! Your project has been successfully deployed.</p>
      </body>
    </html>
  `);
});

app.post("/v1/chat/completions", async (req, res) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader) {
    return res.status(401).json({
      code: 401,
      errmsg: "Unauthorized.",
    });
  } else {
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        code: 401,
        errmsg: "Unauthorized.",
      });
    }
  }
  try {
    const data = req.body;
    const messages = data.messages;
    let queryString;
    if (botType === 'Chat') {
      const lastMessage = messages[messages.length - 1];
      queryString = `here is our talk history:\n'''\n${messages
        .slice(0, -1) 
        .map((message) => `${message.role}: ${message.content}`)
        .join('\n')}\n'''\n\nhere is my question:\n${lastMessage.content}`;
    } else if (botType === 'Completion' || botType === 'Workflow') {
      queryString = messages[messages.length - 1].content;
    }
    const stream = data.stream !== undefined ? data.stream : false;
    let requestBody;
    if (inputVariable) {
      requestBody = {
        inputs: { [inputVariable]: queryString },
        response_mode: "streaming",
        conversation_id: "",
        user: "apiuser",
        auto_generate_name: false
      };
    } else {
      requestBody = {
        "inputs": {},
        query: queryString,
        response_mode: "streaming",
        conversation_id: "",
        user: "apiuser",
        auto_generate_name: false
      };
    }
    const resp = await fetch(process.env.DIFY_API_URL + apiPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authHeader.split(" ")[1]}`,
      },
      body: JSON.stringify(requestBody),
    });

    let isResponseEnded = false;

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      const stream = resp.body;
      let buffer = "";
      let isFirstChunk = true;

      stream.on("data", (chunk) => {

        buffer += chunk.toString();
        let lines = buffer.split("\n");

        for (let i = 0; i < lines.length - 1; i++) {
          let line = lines[i].trim();

          if (!line.startsWith("data:")) continue;
          line = line.slice(5).trim();
          let chunkObj;
          try {
            if (line.startsWith("{")) {
              chunkObj = JSON.parse(line);
            } else {
              continue;
            }
          } catch (error) {
            console.error("Error parsing chunk:", error);
            continue;
          }

          if (chunkObj.event === "message" || chunkObj.event === "agent_message" || chunkObj.event === "text_chunk") {
            let chunkContent;
            if (chunkObj.event === "text_chunk") {
              chunkContent = chunkObj.data.text;
            } else {
              chunkContent = chunkObj.answer;
            }
    
            if (isFirstChunk) {
              chunkContent = chunkContent.trimStart();
              isFirstChunk = false;
            }
            if (chunkContent !== "") {
              const chunkId = `chatcmpl-${Date.now()}`;
              const chunkCreated = chunkObj.created_at;
              
              if (!isResponseEnded) {
              res.write(
                "data: " +
                  JSON.stringify({
                    id: chunkId,
                    object: "chat.completion.chunk",
                    created: chunkCreated,
                    model: data.model,
                    choices: [
                      {
                        index: 0,
                        delta: {
                          content: chunkContent,
                        },
                        finish_reason: null,
                      },
                    ],
                  }) +
                  "\n\n"
              );
            }
          } } else if (chunkObj.event === "workflow_finished" || chunkObj.event === "message_end") {
            const chunkId = `chatcmpl-${Date.now()}`;
            const chunkCreated = chunkObj.created_at;
            if (!isResponseEnded) {
            res.write(
              "data: " +
                JSON.stringify({
                  id: chunkId,
                  object: "chat.completion.chunk",
                  created: chunkCreated,
                  model: data.model,
                  choices: [
                    {
                      index: 0,
                      delta: {},
                      finish_reason: "stop",
                    },
                  ],
                }) +
                "\n\n"
            );
          }
          if (!isResponseEnded) {
            res.write("data: [DONE]\n\n");
          }

            res.end();
            isResponseEnded = true;
          } else if (chunkObj.event === "agent_thought") {
          } else if (chunkObj.event === "ping") {
          } else if (chunkObj.event === "error") {
            console.error(`Error: ${chunkObj.code}, ${chunkObj.message}`);
            res
              .status(500)
              .write(
                `data: ${JSON.stringify({ error: chunkObj.message })}\n\n`
              );
              
            if (!isResponseEnded) {
            res.write("data: [DONE]\n\n");
            }

            res.end();
            isResponseEnded = true;
          }
        }

        buffer = lines[lines.length - 1];
      });
    } else {
      let result = "";
      let usageData = "";
      let hasError = false;
      let messageEnded = false;
      let buffer = "";
      let skipWorkflowFinished = false;


      const stream = resp.body;
      stream.on("data", (chunk) => {
        buffer += chunk.toString();
        let lines = buffer.split("\n");

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line === "") continue;
          let chunkObj;
          try {
            const cleanedLine = line.replace(/^data: /, "").trim();
            if (cleanedLine.startsWith("{") && cleanedLine.endsWith("}")) {
              chunkObj = JSON.parse(cleanedLine);
            } else {
              continue;
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
            continue;
          }

          if (
            chunkObj.event === "message" ||
            chunkObj.event === "agent_message"
          ) {
            result += chunkObj.answer;
            skipWorkflowFinished = true;
          } else if (chunkObj.event === "message_end") {
            messageEnded = true;
            usageData = {
              prompt_tokens: chunkObj.metadata.usage.prompt_tokens || 100,
              completion_tokens:
                chunkObj.metadata.usage.completion_tokens || 10,
              total_tokens: chunkObj.metadata.usage.total_tokens || 110,
            };
          } else if (chunkObj.event === "workflow_finished" && !skipWorkflowFinished) {
            messageEnded = true;
            const outputs = chunkObj.data.outputs;
            if (outputVariable) {
              result = outputs[outputVariable];
            } else {
              result = outputs;
            }
            result = String(result);
            usageData = {
              prompt_tokens: chunkObj.metadata?.usage?.prompt_tokens || 100,
              completion_tokens: chunkObj.metadata?.usage?.completion_tokens || 10,
              total_tokens: chunkObj.data.total_tokens || 110,
            };
          } else if (chunkObj.event === "agent_thought") {
          } else if (chunkObj.event === "ping") {
          } else if (chunkObj.event === "error") {
            console.error(`Error: ${chunkObj.code}, ${chunkObj.message}`);
            hasError = true;
            break;
          } 
        }

        buffer = lines[lines.length - 1];
      });

      stream.on("end", () => {
        if (hasError) {
          res
            .status(500)
            .json({ error: "An error occurred while processing the request." });
        } else if (messageEnded) {
          const formattedResponse = {
            id: `chatcmpl-${generateId()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: data.model,
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: result.trim(),
                },
                logprobs: null,
                finish_reason: "stop",
              },
            ],
            usage: usageData,
            system_fingerprint: "fp_2f57f81c11",
          };
          const jsonResponse = JSON.stringify(formattedResponse, null, 2);
          res.set("Content-Type", "application/json");
          res.send(jsonResponse);
        } else {
          res.status(500).json({ error: "Unexpected end of stream." });
        }
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
});

app.listen(process.env.PORT || 3000);
