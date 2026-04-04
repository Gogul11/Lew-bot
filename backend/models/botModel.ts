import mongoose, { Schema } from "mongoose";

interface IBot {
  device_id: string;
  mac_address: string;
  user_id?: mongoose.Types.ObjectId | null;
  is_active: boolean;
  token?: string;
}

const botSchema = new Schema<IBot>({
  device_id: { type: String, required: true, unique: true },
  mac_address: { type: String, required: true, unique: true },
  user_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
  is_active: { type: Boolean, default: false },
  token: { type: String },
}, { timestamps: true });

export const BotModel = mongoose.model<IBot>("Bot", botSchema);