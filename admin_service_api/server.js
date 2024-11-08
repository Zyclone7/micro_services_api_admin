const express = require('express');
const path = require('path'); 
const colors = require('colors');
const dotenv = require('dotenv').config();
const errorHandler = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const amqp = require('amqplib');
const port = process.env.PORT || 5001;

connectDB();

const app = express();

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use('/api/admin', require('./routes/userRoutes'));

// RabbitMQ connection
let channel;
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        channel = await connection.createChannel();
        await channel.assertQueue('taskQueue', { durable: true });
        console.log('Connected to RabbitMQ');

        // Consume messages from 'taskQueue'
        channel.consume('taskQueue', (msg) => {
            if (msg !== null) {
                console.log("Received message:", msg.content.toString());
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error("RabbitMQ connection error:", error);
    }
}

connectRabbitMQ();

// Function to send message to RabbitMQ
function sendMessageToQueue(queue, message) {
    if (channel) {
        channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
        console.log(`Message sent to queue ${queue}: ${message}`);
    } else {
        console.error("RabbitMQ channel is not available.");
    }
}

// Example route that sends a message to RabbitMQ
app.post('/api/sendMessage', (req, res) => {
    const { queue, message } = req.body;
    sendMessageToQueue(queue, message);
    res.status(200).json({ status: 'Message sent' });
});

// Serve Frontend
if (process.env.NODE_ENV == 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../', 'frontend', 'build', 'index.html')));
} else {
    app.get('/', (req, res) => res.send('Please set to production'));
}

app.use(errorHandler);

app.listen(port, () => console.log(`Admin API is running on port ${port}`));
