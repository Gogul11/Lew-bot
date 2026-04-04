import { Request, Response } from "express";
import { BotModel } from "../models/botModel";
import crypto from "crypto";

const createBot = async (req: Request, res: Response) => {
  try {
    const macAddress: string = req.body?.macAddress;

    console.log("BODY:", req.body);


    if (!macAddress) {
      return res.status(400).json({
        status: 0,
        message: "Provide a proper Mac Address"
      });
    }


    const isExisting = await BotModel.findOne({
      mac_address: macAddress
    });

    if (isExisting) {
      return res.status(200).json({
        status: 0,
        message: "Device already registered",
        data: isExisting
      });
    }

    
    const deviceId = "Lew-" + crypto.randomUUID();

    const newBot = await BotModel.create({
      device_id: deviceId,
      mac_address: macAddress,
      is_active: false
    });

    return res.status(201).json({
      status: 1,
      message: "Device registered successfully",
      data: newBot
    });

  } catch (error) {
    console.error("Create Bot Error:", error);

    return res.status(500).json({
      status: 0,
      message: "Internal server error"
    });
  }
};

const bookBot = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        status: 0,
        message: "user_id is required"
      });
    }

    const freeBot = await BotModel.findOne({ is_active: false });

    if (!freeBot) {
      return res.status(404).json({
        status: 0,
        message: "No available devices"
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    freeBot.user_id = user_id;
    freeBot.token = token;
    freeBot.is_active = true;

    await freeBot.save();

    return res.status(200).json({
      status: 1,
      message: "Device booked successfully",
      data: freeBot
    });

  } catch (error) {
    console.error("Book Bot Error:", error);

    return res.status(500).json({
      status: 0,
      message: "Internal server error"
    });
  }
};


const releaseBot = async (req: Request, res: Response) => {
  try {
    const { user_id, device_id } = req.body;

    if (!user_id || !device_id) {
      return res.status(400).json({
        status: 0,
        message: "user_id or device_id is missing"
      });
    }

    const bot = await BotModel.findOne({ device_id });

    if (!bot) {
      return res.status(404).json({
        status: 0,
        message: "Device not found"
      });
    }

    if (bot.user_id?.toString() !== user_id) {
      return res.status(403).json({
        status: 0,
        message: "You are not allowed to release this device"
      });
    }

    bot.token = "";
    bot.user_id = null;
    bot.is_active = false;

    await bot.save();

    return res.status(200).json({
      status: 1,
      message: "Device released successfully"
    });

  } catch (error) {
    console.error("Release Bot Error:", error);

    return res.status(500).json({
      status: 0,
      message: "Internal server error"
    });
  }
};


const verifyBot = async (req: Request, res: Response) => {
  try {
    const { token, device_id, user_id } = req.body;
    console.log(req.body);

    if (!token || !device_id || !user_id) {
      console.log("1");
      return res.status(400).send("0");
    }

    const bot = await BotModel.findOne({ device_id });

    if (!bot) {
      console.log("2");
      return res.status(404).send("0");
    }

    console.log(user_id, bot.user_id?.toString());

    if (bot.token !== token || !bot.user_id?.equals(user_id)) {
      console.log("3");
      return res.status(401).send("0");
    }

    return res.status(200).send("1");

  } catch (error) {
    console.error("Verify Bot Error:", error);
    return res.status(500).send("0");
  }
};

export { createBot, bookBot, releaseBot, verifyBot };