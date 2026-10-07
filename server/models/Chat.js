import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "model"], required: true },
    text: { type: String, default: "" },
    hasImage: { type: Boolean, default: false },
    outfits: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  { messages: { type: [messageSchema], default: [] } },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
