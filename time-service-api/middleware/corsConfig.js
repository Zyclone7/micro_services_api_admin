const cors = require('cors');

const corsOptions = {
  origin: '*', // Update with your front-end URL in production
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
