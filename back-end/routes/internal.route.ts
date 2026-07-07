import express from "express";
import InternalController from "../controllers/internal.controller";

const router = express.Router();

router.get("/llm-metrics", InternalController.llmMetrics);

export default router;
