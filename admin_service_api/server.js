require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const colors = require('colors');
const morgan = require('morgan'); // Import morgan for logging
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const port = process.env.PORT || 5001;

// Initialize DB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // Use morgan for HTTP request logging

// Routes
app.use('/api/admin', require('./routes/userRoutes'));

// Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`.green.bold);
  console.log(`Running ADMIN API.......... :D`.blue.bold);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`.yellow.bold);
});
