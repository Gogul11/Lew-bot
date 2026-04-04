import { Router } from "express";
import { createUser, loginUser } from "../controller/user";

const userRouter = Router();

userRouter.post("/create", createUser);
userRouter.post("/login", loginUser);

export default userRouter;