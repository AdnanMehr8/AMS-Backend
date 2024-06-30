const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  startDate: {type: String, required: true},
  endDate: {type: String, required: true},
  reason: {type: String},
  status: {type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending'},
});

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema, 'leaveRequests');
