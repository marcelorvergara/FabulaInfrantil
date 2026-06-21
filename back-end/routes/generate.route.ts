import express from "express";
import GenerateController from "../controllers/generate.controller";

const router = express.Router();

router.post("/:kw/:age", GenerateController.generate);

export default router;
