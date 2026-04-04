import { Router } from "express";
import { createBot, bookBot, releaseBot, verifyBot } from "../controller/bot";

const botRouter = Router();

botRouter.post("/createBot", createBot);
botRouter.post("/bookBot", bookBot);
botRouter.post("/releaseBot", releaseBot);
botRouter.post("/verifyBot", verifyBot);

export default botRouter;