import { Request, Response, NextFunction } from "express";
import ShareStory from "../services/shareStory.service";
import ejs from "ejs";

const publicImgUrlPrefix = "https://storage.googleapis.com/images-gen/";

async function shareStory(req: Request, res: Response, next: NextFunction) {
  try {
    const story = req.body;
    if (
      !story.story ||
      !story.firstImage ||
      !story.secondImage ||
      !story.thirdImage
    ) {
      throw new Error("Invalid request");
    }
    res.status(201).json(await ShareStory.shareStory(story));
  } catch (err) {
    next(err);
  }
}

async function getStory(req: Request, res: Response, next: NextFunction) {
  try {
    const storyData = await ShareStory.getStory(req.params.storyId);
    if (storyData !== undefined) {
      // store images in GCS and wait for all uploads to complete
      await ShareStory.storeImage(
        req.params.storyId,
        storyData.story.firstImage,
        storyData.story.secondImage,
        storyData.story.thirdImage
      );

      // replace images in html template
      storyData.story.firstImage = `${publicImgUrlPrefix}${req.params.storyId}/image-1.webp`;
      storyData.story.secondImage = `${publicImgUrlPrefix}${req.params.storyId}/image-2.webp`;
      storyData.story.thirdImage = `${publicImgUrlPrefix}${req.params.storyId}/image-3.webp`;

      // story Id for sharing in social networks
      storyData.story.storyId = req.params.storyId;

      ejs.renderFile("public/index.ejs", storyData, (err, html) => {
        if (err) {
          console.log(err);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Error rendering template");
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
        }
      });
    } else {
      res.status(500).send({ error: "Could not share story" });
    }
  } catch (err) {
    next(err);
  }
}

async function checkReady(req: Request, res: Response, next: NextFunction) {
  try {
    const ready = await ShareStory.checkReady(req.params.storyId);
    res.json({ ready });
  } catch (err) {
    next(err);
  }
}

export default {
  shareStory,
  getStory,
  checkReady,
};
