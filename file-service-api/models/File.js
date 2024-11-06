const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Optionally use UUID instead of ObjectId

const bookSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 }, // Custom _id field using UUID
  originalName: { type: String, required: true },
  publicId: { type: String, required: true },
  url: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  coverImage: {
    originalName: { type: String, required: true },
    publicId: { type: String, required: true },
    url: { type: String, required: true },
  },
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String },
});

module.exports = mongoose.model('Book', bookSchema);
