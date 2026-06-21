import OpenAI from "openai";
import dotenv from "dotenv";
import { IBody, IMessage } from "../interfaces/IPrompt";
import sleep from "../utils/generalFunctions";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generate(input: IBody, kw: string, age: string) {
  const instructions = `
  Você é um modelo de linguagem AI treinado para gerar histórias para crianças entre ${age.replace(
    "_",
    " e "
  )} anos sobre a palavra "${kw}". Ao receber a palavra, gere o início de uma história de até 200 palavras, seguida de 3 opções de continuação de até 5 palavras por opção. As opções devem ser rotuladas como "Opção 1", "Opção 2" e "Opção 3". Depois que o usuário selecionar uma opção, continue a parte do meio da história de acordo com a opção escolhida e novamente dê 3 opçoes para o usuário escolher. Se a palavra dada não levar a uma história, responda com "erro". Sempre forneça 3 opções para o usuário escolher e siga as instruções do usuário ao longo da conversa.
`;

  const messagesInstructions: IMessage[] = [
    { role: "system", content: instructions.trim() },
    { role: "user", content: kw },
  ];

  input.messages.unshift(...messagesInstructions);

  let delay = 500;
  const maxRetries = 5;

  for (let retries = 0; retries < maxRetries; retries++) {
    try {
      return await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: input.messages,
        temperature: input.temperature,
      });
    } catch (error) {
      console.error(
        `Attempt ${retries + 1} failed. Retrying in ${delay} ms...`
      );
      await sleep(delay);
      delay *= 2;
    }
  }

  throw new Error("Failed to generate text after multiple retries");
}

export default {
  generate,
};
