const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Restrict roles to 'user' and 'admin'
    default: 'user'          // Default role is 'user'
  },
  // Additional user-related fields
});

const User = mongoose.model('User', userSchema);

module.exports = User;
