const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  entry: { type: Schema.Types.ObjectId, ref: 'DiaryEntry', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', CommentSchema);
