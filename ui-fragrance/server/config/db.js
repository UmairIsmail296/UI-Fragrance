const mongoose = require('mongoose');

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (typeof process.env.MONGODB_URI !== 'string' || !process.env.MONGODB_URI.trim()) {
    throw new Error('MONGODB_URI is missing or empty in the server environment');
  }

  connectionPromise = mongoose.connect(process.env.MONGODB_URI)
    .then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn.connection;
    })
    .catch((error) => {
      connectionPromise = undefined;
      throw error;
    });

  try {
    return await connectionPromise;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
