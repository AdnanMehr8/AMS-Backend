const mongoose = require('mongoose');
const { MONGODB_CONNECTION } = require('../config/index');

const dbConnect = async () => {
    try {
        mongoose.set('strictQuery', false);
        const conn = await mongoose.connect(MONGODB_CONNECTION);
        console.log(`Database Connected to Host: ${conn.connection.host}`)
    }
    catch(error){
        console.log(`Error: ${error}`)
    }
}

module.exports = dbConnect;