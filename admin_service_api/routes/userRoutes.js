const express = require('express');
const router = express.Router();
const {
    createUser,
    loginUser,
    getMe,
    readAllUsersWithRoles,
    deleteUser,
    getUserById,
    updateUser
} = require('../controllers/userController');

const { protect, admin } = require('../middleware/authMiddleware');

// Register new user
router.post('/', protect, admin, createUser);

// Login user
router.post('/login', loginUser);

// Get all users with roles (Admin only)
router.get('/all', protect, admin, readAllUsersWithRoles);

// Get user by ID (Admins can access any user, users can access their own data)
router.get('/:id', protect, getUserById);

// Delete user by ID (Admin only)
router.delete('/:id', protect, admin, deleteUser);

// Update user by ID (Users can update their own data, admin can update any user)
router.put('/:id', protect, admin, updateUser);

// Get current user (Logged-in user info)
router.get('/me', protect, getMe);

module.exports = router;
