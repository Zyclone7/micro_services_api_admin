const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getAllUsersExceptAdmin, 
    updateUser, 
    getUserById, // Include the new function
    deleteUserById // Include the delete function
} = require('../controllers/userController');

const { protect, admin } = require('../middleware/authMiddleware');

// User registration
router.post('/', registerUser);

// User login
router.post('/login', loginUser);

// Get all users except admins
router.get('/', protect, admin, getAllUsersExceptAdmin);

// Get user by ID
router.get('/:id', protect, admin, getUserById);

// Update user by ID
router.put('/:id', protect, admin, updateUser);

// Delete user by ID
router.delete('/:id', protect, admin, deleteUserById); // New route for deleting a user by ID

module.exports = router;
