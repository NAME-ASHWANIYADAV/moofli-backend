const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  entry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiaryEntry',
    required: true
  }
});

module.exports = mongoose.model('Comment', commentSchema);
