const mongoose = require("mongoose");
const ENV = require("./env.js");

let connectionPromise = null;

const connectDB = async () => {
  const { MONGO_URI } = ENV;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGO_URI)
      .then((conn) => {
        console.log("MONGODB CONNECTED:", conn.connection.host);
        return conn.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        console.error("Error connecting to mongodb:", error);
        throw error;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;
