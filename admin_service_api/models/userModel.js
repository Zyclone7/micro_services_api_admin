const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        firstName: { type: String, required: true },
        secondName: { type: String, required: true },
        middleInitial: { type: String },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        course: { type: String, required: true },
        courseId: { type: String, required: true }, // New field for course ID
        idNo: { type: String, required: true, unique: true },
        role: { type: String, default: 'user' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
