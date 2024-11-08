const path = require('path');
const express = require('express');
const morgan = require('morgan');
require('colors'); // Import colors for terminal coloring
const connectDB = require('./config/db'); // Database connection
const corsConfig = require('./middleware/corsConfig'); // CORS configuration middleware
const timeSpentRoutes = require('./routes/timeSpentRoutes'); // Routes for handling time spent
require('dotenv').config(); // Load environment variables from .env
const { connectRabbitMQ, sendToQueue } = require('./config/rabbitmq'); // RabbitMQ connection and queue functions

const app = express();
const PORT = process.env.PORT || 5002;

// Connect to the MongoDB database
connectDB();

// Connect to RabbitMQ
connectRabbitMQ();

// Middleware
app.use(corsConfig); // Apply CORS middleware
app.use(express.json()); // Body parser for JSON
app.use(morgan('dev')); // HTTP request logging

// Routes
app.use('/api/time-spent', timeSpentRoutes); // Use timeSpentRoutes for all time-spent related routes

// Example of sending a message to RabbitMQ
app.post('/send-message', async (req, res) => {
    const { queue, message } = req.body;
  
    if (!queue || !message) {
      return res.status(400).json({ error: 'Queue and message are required' });
    }
  
    try {
      await sendToQueue(queue, message);
      res.status(200).json({ success: `Message sent to queue ${queue}` });
    } catch (error) {
      console.error('Failed to send message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.cyan); // Server running message in cyan
  console.log(`Running Time Spent API.......... :D`.green.bold);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`.yellow.bold);
});

