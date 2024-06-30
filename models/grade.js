const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
  attendancePercentage: {type: Number, required: true, unique: true},
  grade: {type: String, required: true},
});

module.exports = mongoose.model('Grade', GradeSchema, 'grades');
