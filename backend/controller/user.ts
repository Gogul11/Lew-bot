import { Request, Response } from "express";
import { UserModel } from "../models/userModel";
import bcrypt from "bcrypt";

const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        status: 0,
        message: "username, email, password required"
      });
    }

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        status: 0,
        message: "User already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      username,
      email,
      password: hashedPassword
    });

    return res.status(201).json({
      status: 1,
      message: "User created successfully",
    });

  } catch (error) {
    console.error("Create User Error:", error);

    return res.status(500).json({
      status: 0,
      message: "Internal server error"
    });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 0,
        message: "email and password required"
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 0,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 0,
        message: "Invalid credentials"
      });
    }


    return res.status(200).json({
      status: 1,
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      status: 0,
      message: "Internal server error"
    });
  }
};


export { createUser, loginUser };