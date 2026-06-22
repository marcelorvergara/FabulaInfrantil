import express from "express";
import ShareStory from "../controllers/shareStory.controller";

const router = express.Router();

router.post("/", ShareStory.shareStory);
router.get("/:storyId/ready", ShareStory.checkReady);
router.get("/:storyId", ShareStory.getStory);

export default router;
