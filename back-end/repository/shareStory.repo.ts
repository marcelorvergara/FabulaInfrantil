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

async function storeImage(storyId: string, images: string[]) {
  const bucket = storage.bucket(bucketName);
  const uploads = images.map((url, i) => {
    return new Promise<void>((resolve, reject) => {
      const file = bucket.file(`${storyId}/image-${i + 1}.webp`);
      const writeStream = file.createWriteStream();
      https
        .get(url, (response) => {
          response
            .pipe(writeStream)
            .on("error", (err) => {
              console.error(`store img ${i + 1} err`, err);
              reject(err);
            })
            .on("finish", () => {
              console.log(`Image uploaded to ${bucketName}/${storyId}/image-${i + 1}`);
              resolve();
            });
        })
        .on("error", (err) => {
          console.error(`https.get img ${i + 1} err`, err);
          reject(err);
        });
    });
  });
  await Promise.all(uploads);
}

async function checkReady(storyId: string): Promise<boolean> {
  const bucket = storage.bucket(bucketName);
  const checks = await Promise.all(
    [1, 2, 3].map((i) => bucket.file(`${storyId}/image-${i}.webp`).exists())
  );
  return checks.every(([exists]) => exists);
}

export default {
  shareStory,
  getStory,
  storeImage,
  checkReady,
};
