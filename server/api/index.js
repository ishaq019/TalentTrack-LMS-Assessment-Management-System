// server/api/index.js
// Vercel Serverless Function – wraps the Express app
const { app, connectDB } = require("../src/server");

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
