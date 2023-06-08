import { Configuration, OpenAIApi } from "openai";
import { Client } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';

dotenv.config();

const configuration = new Configuration({
  organization: process.env.ORGANIZATION,
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const openai = new OpenAIApi(configuration);
  const client = new Client();

  client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
  });

  client.on('ready', () => {
    console.log('Client is ready!');
  });

  client.on('error', (error) => { console.log(error) });

  client.on('message_create', async (message) => {
    try {
      const { body } = message;
      console.log(message);
      
      if (!body.toLocaleLowerCase().startsWith('gpt:')) return;

      const prompt = body.slice(4).trim();
      const { data } = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        temperature: 1,
        n: 1,
        max_tokens: 400,
      });

      const reply = data.choices[0].text;
      const replyWithoutLineBreaks = reply.replace(/^\s+|\s+$/g, '');

      const finalReply = `*[RESPOSTA DO CHATGPT]*\n\n${replyWithoutLineBreaks}`
      await message.reply(finalReply);
    } catch (error) {
      console.log(error);
    }
  })

  client.initialize();
}

main();
