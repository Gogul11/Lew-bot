import express, { Express } from "express";
import { connectDB } from "./db/connection";
import Router from "./router";


const app: Express = express();

app.use(express.json());
app.use(Router)

app.listen(5000, '0.0.0.0' ,async () => {
    await connectDB();
    console.log("Server running on port 3000");
});
