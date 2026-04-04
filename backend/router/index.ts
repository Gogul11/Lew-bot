import express from "express"
import botRouter from "./botRouter"
import userRouter from "./userRouter"

const Router = express.Router()


Router.get("/", (req, res) => {
    res.status(200).json({message : "Lew backend"})
})

Router.use("/bots", botRouter)
Router.use("/user", userRouter)

export default Router;