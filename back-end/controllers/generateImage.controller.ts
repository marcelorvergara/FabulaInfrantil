import { Request, Response, NextFunction } from "express";
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import GenerateImageService from "../services/generateImage.service";

const storage = new Storage({
  projectId: "generate-380122",
  keyFilename: process.env.APP_CRED,
});
const bucket = storage.bucket("images-gen");

async function generateImage(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await GenerateImageService.generate(req.body);
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image generation returned no data");

    const fileName = `temp/${randomUUID()}.webp`;
    const file = bucket.file(fileName);
    await file.save(Buffer.from(b64, "base64"), { contentType: "image/webp" });

    const url = `https://storage.googleapis.com/images-gen/${fileName}`;
    res.status(201).json({ result: url });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export default {
  generateImage,
};
