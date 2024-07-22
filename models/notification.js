const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  type: { type: String, enum: ["like", "comment"], required: true },
  message: { type: String, required: true },
  entry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DiaryEntry",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
