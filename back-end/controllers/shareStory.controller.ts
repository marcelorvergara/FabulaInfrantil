import { Request, Response, NextFunction } from "express";
import ShareStory from "../services/shareStory.service";

const publicImgUrlPrefix = "https://storage.googleapis.com/images-gen/";
const frontendBaseUrl = "https://fabulainfantil.com";

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

    const docId = await ShareStory.shareStory(story);

    // Copy images to their permanent location before responding — the response itself is the
    // readiness signal, no client-side polling needed.
    const imageExts = await ShareStory.storeImage(
      docId,
      story.firstImage,
      story.secondImage,
      story.thirdImage
    );
    await ShareStory.setImageExts(docId, imageExts);

    res.status(201).json(docId);
  } catch (err) {
    next(err);
  }
}

// Legacy link support: story.fabulainfantil.com/shareStory/:id used to render an EJS page
// directly. Redirect to the new in-app Next.js page instead. 302 (not 301) while this rolls
// out, so it isn't permanently cached before we've confirmed it in production.
async function getStory(req: Request, res: Response, next: NextFunction) {
  try {
    res.redirect(302, `${frontendBaseUrl}/historias/${req.params.storyId}`);
  } catch (err) {
    next(err);
  }
}

function buildImageUrls(storyId: string, imageExts: (string | null)[]) {
  return imageExts.map((ext, i) =>
    ext ? `${publicImgUrlPrefix}${storyId}/image-${i + 1}.${ext}` : null
  );
}

async function getStoryData(req: Request, res: Response, next: NextFunction) {
  try {
    const storyId = req.params.storyId;
    const docData = await ShareStory.getStory(storyId).catch(() => undefined);

    if (!docData) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    const narrative: string[] = docData.story.story;
    let imageExts: (string | null)[] | undefined = docData.imageExts;

    if (!imageExts) {
      // Legacy doc from before this change: images were never copied at share time. The
      // original (temp) image URLs are still recoverable from the doc itself, so back-fill
      // on demand instead of requiring a separate migration.
      const { firstImage, secondImage, thirdImage } = docData.story;
      if (firstImage && secondImage && thirdImage) {
        imageExts = await ShareStory.storeImagesSettled(
          storyId,
          firstImage,
          secondImage,
          thirdImage
        );
        if (imageExts.every((ext) => ext !== null)) {
          await ShareStory.setImageExts(storyId, imageExts as string[]);
        }
      } else {
        imageExts = [null, null, null];
      }
    }

    res.status(200).json({
      title: narrative[0],
      paragraphs: [narrative[1], narrative[3], narrative[5]],
      images: buildImageUrls(storyId, imageExts),
    });
  } catch (err) {
    next(err);
  }
}

export default {
  shareStory,
  getStory,
  getStoryData,
};
