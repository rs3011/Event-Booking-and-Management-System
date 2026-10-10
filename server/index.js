const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const { verifyConnection } = require('./utils/emailService');

// Connect to DB, then start server
connectDB().then(() => {
  verifyConnection();

  app.listen(env.PORT, () => {
    console.log(
      `Server running in ${env.NODE_ENV} mode on port ${env.PORT}`
    );
  });
});

module.exports = app;
