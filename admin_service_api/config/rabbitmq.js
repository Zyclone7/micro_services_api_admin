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

// Function to declare an exchange, bind a queue, and send messages
function sendToQueue(exchange, routingKey, queue, message) {
    if (!channel) {
        throw new Error('RabbitMQ channel not created yet');
    }

    // Declare an exchange (e.g., direct, topic, fanout)
    channel.assertExchange(exchange, 'direct', { durable: true });

    // Declare a queue
    channel.assertQueue(queue, { durable: true });

    // Bind the queue to the exchange with a routing key
    channel.bindQueue(queue, exchange, routingKey);

    // Send a message to the exchange with the routing key
    channel.publish(exchange, routingKey, Buffer.from(message));
    console.log(`Message sent to exchange ${exchange} with routingKey ${routingKey}`.green);
}

// Function to consume messages from a queue bound to an exchange
function consumeFromQueue(exchange, routingKey, queue, callback) {
    if (!channel) {
        throw new Error('RabbitMQ channel not created yet');
    }

    // Declare the exchange
    channel.assertExchange(exchange, 'direct', { durable: true });

    // Declare the queue
    channel.assertQueue(queue, { durable: true });

    // Bind the queue to the exchange with the routing key
    channel.bindQueue(queue, exchange, routingKey);

    // Consume messages from the queue
    channel.consume(queue, (msg) => {
        if (msg !== null) {
            console.log(`Message received from queue ${queue}: ${msg.content.toString()}`.yellow);
            callback(msg.content.toString());
            channel.ack(msg); // Acknowledge the message after processing
        }
    });
}

module.exports = {
    connectRabbitMQ,
    sendToQueue,
    consumeFromQueue,
};
