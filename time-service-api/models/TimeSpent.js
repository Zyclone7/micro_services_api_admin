const mongoose = require('mongoose');

const timeSpentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  bookId: {
    type: String,
    required: true,
  },
  timeSpent: {
    type: Number,
    required: true,
    default: 0, // Time is stored in seconds
  },
});

module.exports = mongoose.model('TimeSpent', timeSpentSchema);
