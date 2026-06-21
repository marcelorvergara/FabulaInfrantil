import { fal } from "@fal-ai/client";
import dotenv from "dotenv";

dotenv.config();

fal.config({ credentials: process.env.FAL_KEY });

async function generate(input: { prompt: string }): Promise<string> {
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt: input.prompt,
      num_images: 1,
      image_size: "square_hd",
      enable_safety_checker: true,
    },
  });

  const images = (result.data as any).images as Array<{ url: string }>;
  const url = images?.[0]?.url;
  if (!url) throw new Error("No image URL returned from fal.ai");
  return url;
}

export default { generate };
