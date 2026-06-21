import OpenAI from "openai";
import type { ImagesResponse } from "openai/resources";
import dotenv from "dotenv";
import sleep from "../utils/generalFunctions";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generate(input: { prompt: string }): Promise<ImagesResponse> {
  let delay = 500;
  const maxRetries = 5;

  for (let retries = 0; retries < maxRetries; retries++) {
    try {
      return await openai.images.generate({
        model: "gpt-image-1",
        prompt: input.prompt,
        n: 1,
        size: "1024x1024",
        output_format: "webp",
      });
    } catch (error: any) {
      console.error(
        `Image: attempt ${retries + 1} failed. Retrying in ${delay} ms...\n ${error}`
      );
      await sleep(delay);
      delay *= 2;
    }
  }

  throw new Error("Failed to generate image after multiple retries");
}

export default {
  generate,
};
