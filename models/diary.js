const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DiaryEntrySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  deactivateComments: { type: Boolean, default: false }
});

module.exports = mongoose.model('DiaryEntry', DiaryEntrySchema);
