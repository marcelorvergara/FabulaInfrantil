import { Request, Response, NextFunction } from "express";
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import GenerateImageService from "../services/generateImage.service";
import axios from "axios";

const storage = new Storage({
  projectId: "generate-380122",
  keyFilename: process.env.APP_CRED,
});
const bucket = storage.bucket("images-gen");

async function generateImage(req: Request, res: Response, next: NextFunction) {
  try {
    const falUrl = await GenerateImageService.generate(req.body);

    const download = await axios.get<Buffer>(falUrl, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(download.data);
    const contentType =
      (download.headers["content-type"] as string) || "image/jpeg";

    const ext = contentType.includes("png") ? "png" : "jpg";
    const fileName = `temp/${randomUUID()}.${ext}`;
    const file = bucket.file(fileName);
    await file.save(buffer, { contentType });

    const url = `https://storage.googleapis.com/images-gen/${fileName}`;
    res.status(201).json({ result: url });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export default { generateImage };
