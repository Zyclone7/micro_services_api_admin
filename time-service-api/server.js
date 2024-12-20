const express = require('express');
const morgan = require('morgan');
require('colors'); // Import colors for terminal coloring
const connectDB = require('./config/db');
const corsConfig = require('./middleware/corsConfig');
const timeSpentRoutes = require('./routes/timeSpentRoutes');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 5002;

// Connect to the database
connectDB();

// Middleware
app.use(corsConfig);
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/time-spent', timeSpentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.cyan); // Output in cyan
});
