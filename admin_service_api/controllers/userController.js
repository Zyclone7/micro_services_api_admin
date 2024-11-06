const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// @desc Register new user
// @route POST /api/users
// @access Public

 // @desc Register new user
    // @route POST /api/users
    // @access Public
    const registerUser = asyncHandler(async (req, res) => {
        const { firstName, secondName, middleInitial, email, password, course } = req.body;

        if (!firstName || !secondName || !email || !password || !course) {
            res.status(400);
            throw new Error('Please enter all required fields');
        }

        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            res.status(400);
            throw new Error('Password must be at least 8 characters long and contain lowercase, uppercase letters, and a number');
        }

        // Check if user exists
        const userExist = await User.findOne({ email });

        if (userExist) {
            res.status(400);
            throw new Error('User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const user = await User.create({
            firstName,
            secondName,
            middleInitial, // Optional
            email,
            password: hashedPassword,
            course,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                firstName: user.firstName,
                secondName: user.secondName,
                email: user.email,
                course: user.course,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    });

// @desc Authenticate user
// @route POST /api/users/login
// @access Public

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        // Check if the user has the admin role
        if (user.role !== 'admin') {
            res.status(403);
            throw new Error('Access denied: Admins only');
        }

        // If the role is admin, allow login
        res.json({
            _id: user._id,
            firstName: user.firstName,
            secondName: user.secondName,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
});

// @desc Get all users except admins
// @route GET /api/users
// @access Admin

const getAllUsersExceptAdmin = asyncHandler(async (req, res) => {
    // Check if the user making the request is an admin
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Access denied: Admins only');
    }

    // Find all users where the role is not 'admin'
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password'); // Exclude the password field

    if (users) {
        res.json(users);
    } else {
        res.status(404);
        throw new Error('No users found');
    }
});

// @desc Update user information
// @route PUT /api/users/:id
// @access Admin

const updateUser = asyncHandler(async (req, res) => {
    const { firstName, secondName, email, role, course } = req.body;

    // Find the user by ID
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Update the user's details
    user.firstName = firstName || user.firstName;
    user.secondName = secondName || user.secondName;
    user.email = email || user.email;
    user.role = role || user.role;
    user.course = course || user.course;

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        secondName: updatedUser.secondName,
        email: updatedUser.email,
        role: updatedUser.role,
        course: updatedUser.course,
    });
});


// @desc Get user by ID
// @route GET /api/users/:id
// @access Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password'); // Exclude the password field

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc Delete user by ID
// @route DELETE /api/users/:id
// @access Admin
const deleteUserById = asyncHandler(async (req, res) => {
    // Check if the user making the request is an admin
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Access denied: Admins only');
    }

    // Find the user by ID and delete
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({ message: 'User removed' });
});


// Generate token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = {
    registerUser,
    loginUser,
    getAllUsersExceptAdmin,
    updateUser,
    getUserById,
    deleteUserById
};
