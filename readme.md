## D2O
**Use Dify on your favorite OpenAI client.**

This project converts the Dify API to the OpenAI API format, giving you access to Dify's LLMs, knowledge base, tools, and workflows within your preferred OpenAI clients.


## Features
- Convert Dify API into an OpenAI API
- Support streaming and blocking
- Support Chat, Completion, Agent and Workflow bots API on dify

## Deployment
### Zeabur
[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/92RLEZ?referralCode=fatwang2)

### Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/fatwang2/dify2openai&env=DIFY_API_URL&envDescription=https://api.dify.ai/v1)

**Note:** Vercel's serverless functions have a 10-second timeout limit.


### Local Deployment
1. Set the environment variable in the .env file
```bash
DIFY_API_URL=https://api.dify.ai/v1
```

2. Install dependencies 
```bash
pnpm install
```

3. Run the project
```bash
pnpm start
```

## Usage
1. OpenAI Clients

![botgem](pictures/usage.png)

2. Code

```JavaScript
const response = await fetch('http://localhost:3000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_DFIY_API_KEY',
  },
  body: JSON.stringify({
    model: 'dify',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how are you?' },
    ],
  }),
});

const data = await response.json();
console.log(data);
```

### Docker Deployment

- Build the image
```bash
docker build -t dify2openai:latest .
```

- Run the container
```bash
docker run -d -name dify2openai \
    --network bridge \
    -p 3000:3000 \
    -e DIFY_API_URL=https://api.dify.ai/v1 \
    -e BOT_TYPE=Chat \
    --restart always
    dify2openai:latest
```

- You can also use Docker Compose to build the image and run the container:
```bash
version: '3.5'
services:
  dify2openai:
    container_name: dify2openai
    build:
      context: .
      dockerfile: Dockerfile
    network_mode: bridge
    ports:
      - "3000:3000"
    restart: always
    environment: 
      - DIFY_API_URL=https://api.dify.ai/v1
      - BOT_TYPE=Chat
```

### Docker Image Deployment
Prepared a Docker image for those who find it difficult to build.
- Run the containerb
```bash
docker run -d  \
    --network=bridge \
    -p 3000:3000 \
    -e DIFY_API_URL=https://api.dify.ai/v1 \
    -e BOT_TYPE=Chat \
    --restart always
    fatwang2/dify2openai:latest
```
- Run the container with docker-compose-image.yml
```bash
docker compose -f docker-compose-image.yml up -d
```

Please change the environment variables according to your needs.See [Environment Variable](#environment-variable) for more information.

## Environment Variable
This project provides some additional configuration items set with environment variables:

| Environment Variable | Required | Description                                                                                                                                                               | Example                                                                                                              |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `DIFY_API_URL`     | Yes      | Your Dify API if you self-host it                                                                                                                  | `https://api.dify.ai/v1`                                                                                                 |
| `BOT_TYPE`     | Yes      | The type of your dify bots                                                                                                                  | `Chat,Completion,Workflow`                                                                                                 |
| `INPUT_VARIABLE`     | No      | The name of input variable in your own dify workflow bot                                                                                                                  | `query,text`                                                                                                 |
| `OUTPUT_VARIABLE`     | No      | The name of output variable in your own dify workflow bot                                                                                                                  | `text`                                                                                                 |
| `MODELS_NAME`     | No      | The value is the model name output by the /v1/models endpoint. The default value is `dify`.                                                                                                                 | `dify`                                                                                                 |
## Roadmap
**Coming Soon**
*   Image support
*   Audio-to-text
*   Text-to-audio
*   Docker support

**Available Now**
*   Workflow Bot
*   Variables support
*   Continuous dialogue
*   Zeabur & Vercel deployment
*   Streaming & Blocking
*   Agent & Chat bots

## Contact
Feel free to reach out for any questions or feedback

[X](https://sum4all.site/twitter)\
[telegram](https://sum4all.site/telegram)

<a href="https://www.buymeacoffee.com/fatwang2" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## License
This project is licensed under the MIT License.
