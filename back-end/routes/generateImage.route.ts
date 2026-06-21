import express from "express";
import GenerateImageController from "../controllers/generateImage.controller";

const router = express.Router();

router.post("/", GenerateImageController.generateImage);

export default router;
