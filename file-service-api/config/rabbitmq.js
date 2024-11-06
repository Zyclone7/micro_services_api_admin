const amqp = require('amqplib');

let channel;

// Function to connect to RabbitMQ and create a channel
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URI);
    channel = await connection.createChannel();
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
  }
}

// Function to send a message to a specific queue
async function sendToQueue(queue, message) {
  if (!channel) {
    console.error('Channel not initialized');
    return;
  }
  try {
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log(`Message sent to queue ${queue}:`, message);
  } catch (error) {
    console.error('Error sending message to queue:', error);
  }
}

// Connect to RabbitMQ when the module is loaded
connectRabbitMQ();

module.exports = { sendToQueue };
