import { Request, Response, NextFunction } from "express";
import { IBody } from "../interfaces/IPrompt";
import GenerateService from "../services/generate.service";

async function generate(req: Request, res: Response, next: NextFunction) {
  const kw = req.params.kw;
  const age = req.params.age;
  const hero = typeof req.query.hero === "string" ? req.query.hero : undefined;
  try {
    const msgs: IBody = req.body;
    const startTime = new Date().getTime() / 1000;
    const result = await GenerateService.generate(msgs, kw, age, hero);
    const endTime = new Date().getTime() / 1000;
    const elapsedTime = endTime - startTime;
    console.log("elapsedTime", elapsedTime);
    res.status(201).json({ result: result.choices[0] });
  } catch (err) {
    next(err);
  }
}

export default {
  generate,
};
