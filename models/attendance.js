const { required } = require('joi');
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  userId: {type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true},
  date: {type: Date, default: Date.now},
  status: {type: String, enum: ['present', 'absent'], default: 'present', required: true}
});

module.exports = mongoose.model('Attendance', AttendanceSchema, 'attendances');
