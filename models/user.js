const { required } = require('joi');
const mongoose = require('mongoose');

const {Schema} = mongoose;

const userSchema = new Schema({
    name: {type: String, required: true},
    username: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    role: {type: String, default: 'student'},
    profilePicturePath: {type: String, required: false}
},
    {timestamps: true}
);

module.exports = mongoose.model('User', userSchema, 'users');