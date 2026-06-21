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
  try {
    const bucket = storage.bucket(bucketName);
    for (let i = 0; i < images.length; i++) {
      const file = bucket.file(`${storyId}/image-${i + 1}.webp`);
      https.get(images[i], (response) => {
        response
          .pipe(file.createWriteStream())
          .on("error", function (err) {
            console.log("store img err", err);
          })
          .on("finish", function () {
            console.log(`Image uploaded to ${bucketName}/image-${i + 1}`);
          });
      });
    }
  } catch (err) {
    throw err;
  }
}

export default {
  shareStory,
  getStory,
  storeImage,
};
