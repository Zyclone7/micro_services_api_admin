const amqp = require('amqplib');

let channel = null;

// Function to connect to RabbitMQ
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log('RabbitMQ connected!'.cyan.bold);
    } catch (error) {
        console.error('Failed to connect to RabbitMQ', error);
    }
}

// Function to send messages to a queue
function sendToQueue(queue, message) {
    if (!channel) {
        throw new Error('RabbitMQ channel not created yet');
    }
    channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(message));
    console.log(`Message sent to queue ${queue}`.green);
}

module.exports = {
    connectRabbitMQ,
    sendToQueue,
};
