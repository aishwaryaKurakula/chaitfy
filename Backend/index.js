const connectDB = require("./src/lib/db.js");
const { app } = require("./src/server.js");

let dbReadyPromise = null;

function ensureDbReady() {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB().catch((error) => {
      dbReadyPromise = null;
      throw error;
    });
  }

  return dbReadyPromise;
}

module.exports = async (req, res) => {
  await ensureDbReady();
  return app(req, res);
};
