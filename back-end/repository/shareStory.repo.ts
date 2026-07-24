import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
import { generateContentHash } from "../utils/generalFunctions";
import https from "https";

dotenv.config();

const db = new Firestore({
  projectId: "generate-380122",
  keyFilename: process.env.APP_CRED,
});

const storage = new Storage({
  projectId: "generate-380122",
  keyFilename: process.env.APP_CRED,
});

const bucketName = "images-gen";

// Only images this system generated itself (via generateImage.controller.ts) may be copied —
// storeImage's URL comes from client-supplied request bodies, so this closes off an
// arbitrary-server-side-fetch gap.
const ALLOWED_SOURCE_PATTERN =
  /^https:\/\/storage\.googleapis\.com\/images-gen\/temp\/[A-Za-z0-9-]+\.(jpg|jpeg|png)$/;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

async function shareStory(story: string) {
  // Store in firestore
  try {
    // Content-based hashing for doc id
    const docId = generateContentHash(story);
    const docRef = db.collection("stories").doc(docId);
    await docRef.set({ story });
    return docId;
  } catch (err) {
    throw err;
  }
}

async function getStory(storyId: string) {
  // Get story in firestore
  try {
    const storyRef = db.collection("stories").doc(storyId);
    const story = await storyRef.get();
    if (!story.exists) {
      throw new Error("Story not found!");
    }
    return story.data();
  } catch (err) {
    throw err;
  }
}

async function setImageExts(storyId: string, imageExts: string[]) {
  await db.collection("stories").doc(storyId).update({ imageExts });
}

// Downloads one already-generated image (must match ALLOWED_SOURCE_PATTERN) and copies it to
// its permanent per-story location, skipping the copy if it's already there. Resolves with the
// real file extension of the copied bytes (jpg/png) so callers can persist it and build correct
// public URLs later.
function copyOneImage(
  storyId: string,
  index: number,
  sourceUrl: string
): Promise<string> {
  if (!ALLOWED_SOURCE_PATTERN.test(sourceUrl)) {
    return Promise.reject(
      new Error(`Rejected image source outside allowlist: ${sourceUrl}`)
    );
  }

  const bucket = storage.bucket(bucketName);

  return new Promise<string>((resolve, reject) => {
    https
      .get(sourceUrl, (response) => {
        const contentType = response.headers["content-type"] || "";
        if (!contentType.startsWith("image/")) {
          response.destroy();
          reject(
            new Error(`Unexpected content-type for image ${index}: ${contentType}`)
          );
          return;
        }

        const ext = contentType.includes("png") ? "png" : "jpg";
        const destFile = bucket.file(`${storyId}/image-${index}.${ext}`);

        destFile.exists().then(([exists]) => {
          if (exists) {
            response.destroy();
            resolve(ext);
            return;
          }

          let bytesRead = 0;
          response.on("data", (chunk: Buffer) => {
            bytesRead += chunk.length;
            if (bytesRead > MAX_IMAGE_BYTES) {
              response.destroy();
              writeStream.destroy();
              reject(new Error(`Image ${index} exceeded max size`));
            }
          });

          const writeStream = destFile.createWriteStream({
            metadata: { contentType },
          });

          response
            .pipe(writeStream)
            .on("error", (err) => {
              console.error(`store img ${index} err`, err);
              reject(err);
            })
            .on("finish", () => {
              console.log(`Image uploaded to ${bucketName}/${storyId}/image-${index}.${ext}`);
              resolve(ext);
            });
        }, reject);
      })
      .on("error", (err) => {
        console.error(`https.get img ${index} err`, err);
        reject(err);
      });
  });
}

async function storeImage(storyId: string, images: string[]): Promise<string[]> {
  return Promise.all(
    images.map((url, i) => copyOneImage(storyId, i + 1, url))
  );
}

// Same as storeImage but tolerates individual image failures — used for the legacy-doc
// backfill path, where the story text is still worth showing even if one source image is
// gone or invalid.
async function storeImagesSettled(
  storyId: string,
  images: string[]
): Promise<(string | null)[]> {
  const results = await Promise.allSettled(
    images.map((url, i) => copyOneImage(storyId, i + 1, url))
  );
  return results.map((r) => {
    if (r.status === "fulfilled") return r.value;
    console.error("legacy image backfill failed", r.reason);
    return null;
  });
}

export default {
  shareStory,
  getStory,
  storeImage,
  storeImagesSettled,
  setImageExts,
};
