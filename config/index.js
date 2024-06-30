const dotenv = require("dotenv");
dotenv.config();

const MONGODB_CONNECTION = process.env.MONGODB_CONNECTION;
const BACKEND_SERVER_PATH = process.env.BACKEND_SERVER_PATH;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const PORT = process.env.PORT;
const CLOUD_NAME = process.env.CLOUD_NAME;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

module.exports = {
    MONGODB_CONNECTION,
    BACKEND_SERVER_PATH,
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    PORT,
    CLOUD_NAME,
    API_KEY,
    API_SECRET,
}