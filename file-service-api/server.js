const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileRoutes = require('./routes/files');
const { connectRabbitMQ, sendToQueue } = require('./config/cloudinary'); // Adjust the path if needed
require('dotenv').config();

const app = express();

//connectRabbitMQ();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));



// Middleware
app.use(cors());
app.use(express.json());

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

// Routes
app.use('/api/files', fileRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`File service running on port ${PORT}`));
