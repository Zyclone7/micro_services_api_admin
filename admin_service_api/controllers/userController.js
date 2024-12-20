require('dotenv').config(); // Load .env variables
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Set up NodeMailer transport
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT == 465, // SSL for port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Generate random ID and password
const generateIDAndPassword = (course) => {
    const year = new Date().getFullYear();

    // Map course to abbreviation
    const courseAbbr = {
        'Information Technology': 'ITE',
        'Education': 'EDU',
        'Accountancy': 'ACI',
    };

    // Get the abbreviation based on the course, default to 'GEN' if not found
    const courseCode = courseAbbr[course] || 'GEN';
    
    // Generate a random ID
    const idNo = `${year}-${courseCode}-${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;
    
    // Generate a random password
    const password = Array.from({ length: 3 }, () =>
        String.fromCharCode(65 + Math.random() * 26)
    ).join('') + Math.floor(100000 + Math.random() * 900000);

    return { idNo, password };
};

// @desc Create new user (Admin only)
// @route POST /api/users
// @access Private (Admin only)
const createUser = asyncHandler(async (req, res) => {
    const { firstName, secondName, middleInitial, email, course, courseId, role } = req.body;

    // Check if required fields are provided
    if (!firstName || !secondName || !email || !course || !courseId) {
        res.status(400);
        throw new Error('Please enter all required fields');
    }

    // If the user is trying to assign the 'admin' role, ensure they are an admin
    if (role === 'admin' && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Unauthorized to assign admin role');
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Generate ID and password
    const { idNo, password: generatedPassword } = generateIDAndPassword(course);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);

    const user = await User.create({
        firstName,
        secondName,
        middleInitial,
        email,
        password: hashedPassword,
        course,
        courseId,
        idNo,
        role: role || 'student',  // Default role is 'student'
    });

    if (user) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to the System - Your Credentials',
            html: `
                <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    <style>
        :root {
            --text: #2c2c2c;
            --background: #ffffff;
            --accent: #0066ff;
            --light-gray: #f7f7f7;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: var(--text);
            background-color: var(--light-gray);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background-color: var(--background);
            max-width: 500px;
            width: 100%;
            padding: 40px;
        }

        .header {
            margin-bottom: 40px;
        }

        h1 {
            font-size: 24px;
            font-weight: 500;
            letter-spacing: -0.5px;
        }

        .content {
            margin-bottom: 40px;
        }

        .credentials {
            background-color: var(--light-gray);
            padding: 20px;
            margin: 20px 0;
        }

        .credentials p {
            margin: 10px 0;
        }

        .btn {
            display: inline-block;
            background-color: var(--accent);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            margin: 20px 0;
        }

        .notice {
            font-size: 14px;
            color: #666;
            margin: 20px 0;
        }

        .footer {
            font-size: 14px;
            color: #666;
            padding-top: 20px;
            border-top: 1px solid var(--light-gray);
        }

        @media (max-width: 480px) {
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome</h1>
        </div>

        <div class="content">
            <p>Hello ${firstName},</p>
            <p>Your account is ready. Here are your login details:</p>
            
            <div class="credentials">
                <p><strong>ID:</strong> ${idNo}</p>
                <p><strong>Password:</strong> ${generatedPassword}</p>
            </div>

            <a href="#" class="btn">Sign In</a>

            <p class="notice">Please change your password after your first login.</p>
        </div>
        
        <div class="footer">
            <p>© 2024 Company Name</p>
        </div>
    </div>
</body>
</html>
            `,
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending email:', error);
                res.status(500).json({ message: 'Failed to send registration email' });
                return;
            }
        });

        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            secondName: user.secondName,
            email: user.email,
            course: user.course,
            courseId: user.courseId,
            idNo,
            role: user.role,  // Include role in the response
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
    const { identifier, password } = req.body; // 'identifier' can be email or ID number

    // Find user by either email or ID number
    const user = await User.findOne({
        $or: [{ email: identifier }, { idNo: identifier }], // Check both email and ID number
    });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user._id,
            firstName: user.firstName,
            secondName: user.secondName,
            email: user.email,
            course: user.course,
            courseId: user.courseId,
            idNo: user.idNo,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
});

// @desc Get current user data
// @route GET /api/users/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
});

// @desc Read all users (admin only)
// @route GET /api/users/all
// @access Private
const readAllUsersWithRoles = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Unauthorized access');
    }

    const users = await User.find({ role: { $ne: 'admin' } }).select('_id firstName secondName email role course');
    res.status(200).json(users);
});

// @desc Get user by ID
// @route GET /api/users/:id
// @access Private
const getUserById = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Unauthorized access');
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json({
        _id: user._id,
        firstName: user.firstName,
        secondName: user.secondName,
        email: user.email,
        course: user.course,
        courseId: user.courseId, // Include courseId in the response
        idNo: user.idNo,
    });
});

// @desc Update user
// @route PUT /api/users/:id
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // Check if the logged-in user is the same as the user being updated or an admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Unauthorized access');
    }

    const { firstName, secondName, middleInitial, email, password, course } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Update the user fields only if new values are provided
    user.firstName = firstName || user.firstName;
    user.secondName = secondName || user.secondName;
    user.middleInitial = middleInitial || user.middleInitial;
    user.email = email || user.email;
    user.course = course || user.course;

    // If a password is provided, hash it and update
    if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
    }

    // Save the updated user information
    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
});

// @desc Delete user (admin only)
// @route DELETE /api/users/:id
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Unauthorized access');
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json({ message: 'User removed' });
});

module.exports = {
    createUser,
    loginUser,
    getMe,
    readAllUsersWithRoles,
    getUserById,
    updateUser,
    deleteUser,
};
