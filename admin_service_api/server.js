const path = require('path');
const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const cors = require('cors');
const morgan = require('morgan');
const { connectRabbitMQ, sendToQueue } = require('./config/rabbitmq'); // Import RabbitMQ functions
const port = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Connect to RabbitMQ
connectRabbitMQ();

const app = express();

// Use Morgan for HTTP request logging
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use('/api/users', require('./routes/userRoutes'));
app.use(express.static(path.join(__dirname, 'public')));

// Error Handler Middleware
app.use(errorHandler);

// Example of sending a message to RabbitMQ from an endpoint
app.post('/api/send-message', (req, res) => {
    const message = req.body.message || 'Hello RabbitMQ!';
    sendToQueue('myQueue', message); // Replace 'myQueue' with your RabbitMQ queue name
    res.status(200).json({ message: 'Message sent to RabbitMQ' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`.green.bold);
  console.log(`Running USERS API.......... :D`.blue.bold);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`.yellow.bold);
});
