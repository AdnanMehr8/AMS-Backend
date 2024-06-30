const User = require('../models/user');
const Joi = require('joi');
const Attendance = require('../models/attendance');
const LeaveRequest = require('../models/leaveRequest');
const Grade = require('../models/grade');

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const adminController = {
// Get all students
async getAllStudents(req, res, next)  {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.status(200).json(students);
  } catch (error) {
    return next(error)
  }
},

// Manage attendance
async manageAttendance (req, res, next) {
  const { userId, date, status } = req.body;
  try {
    let attendance = await Attendance.findOne({ userId, date });
    if (!attendance) {
      attendance = new Attendance({ userId, date, status });
    } else {
      attendance.status = status;
    }

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
},

// CRUD operations on attendance records
async createAttendance (req, res, next) {
  const createAttendanceSchema = Joi.object({
    userId: Joi.string().regex(mongodbIdPattern).required(),
    date: Joi.string().required(),
    status: Joi.string().valid('present', 'absent').required()
  });
  const {error} = createAttendanceSchema.validate(req.body);
  
  if (error) {
    return next(error);
  }
  
  const { userId, date, status } = req.body;
  try {
    const newAttendance = new Attendance({
      userId,
      date,
      status,
    });

    await newAttendance.save();
    res.status(200).json({message: 'New Attendance Created', newAttendance});
  } catch (error) {
   return next (error)
  }
},

  async getAllAttendance(req, res, next) {
    try {
        let attendance = await Attendance.find({});
        const allAttendances = [];
        for (let i = 0; i < attendance.length; i++) {
            const attendies = new Attendance(attendance[i]);
            allAttendances.push(attendies)
        }
        return res.status(200).json(allAttendances);
    }
    catch (error) {
        return next(error);
    }
},

async updateAttendance (req, res, next) {
  const updateAttendanceSchema = Joi.object({
    id: Joi.string().regex(mongodbIdPattern).required(),
    date: Joi.string().required(),
    status: Joi.string().valid('present', 'absent').required()
  });
   
  const { error } = updateAttendanceSchema.validate(req.body);

  if(error){
    return next(error);
  }

  const { id, date, status } = req.body;
  let attendance;
  try {
    attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }
    attendance.status = status;
    attendance.date = new Date(date); 
    await attendance.save();

    res.status(200).json({message: 'Attendance updated', attendance});
  } catch (error) {
    return next (error);
  }
},

async deleteAttendance (req, res, next) {
  const deleteAttendanceSchema = Joi.object ({
    id: Joi.string().regex(mongodbIdPattern).required()
  });

  const {error} = deleteAttendanceSchema.validate(req.params);

  if(error){
    return next (error);
  }
  const { id } = req.params;
  try {
    await Attendance.findByIdAndDelete(id);
    res.status(200).json({ message: 'Attendance record deleted' });
  } catch (error) {
    return next (error);
  }
},  

// Manage leave requests
async manageLeaveRequest (req, res, next) {
  const manageLeaveRequestSchema = Joi.object({
    leaveRequestId: Joi.string().regex(mongodbIdPattern).required(),
    status: Joi.string().valid('pending', 'approved', 'rejected').required()
  });

  const {error} = manageLeaveRequestSchema.validate(req.body);
  if (error) {
    return next (error);
  }
  const { leaveRequestId, status } = req.body;
  try {
    const leaveRequest = await LeaveRequest.findById(leaveRequestId);
    if (!leaveRequest) {
      return res.status(404).json({ msg: 'Leave request not found' });
    }

    leaveRequest.status = status;
    await leaveRequest.save();
    res.status(200).json(leaveRequest);
  } catch (error) {
    return next (error);
  }
},

// Generate reports
async generateReport (req, res, next) {
  const generateReportSchema = Joi.object({
    userId: Joi.string().regex(mongodbIdPattern).required(),
  });
  const { error } = generateReportSchema.validate(req.params);
  if (error) {
    return next (error);
  }
  const { userId } = req.params;
  let attendanceRecords;
  let leaveRequests;
  try {
    attendanceRecords = await Attendance.find({userId: userId }).sort({ date: -1 });
   leaveRequests = await LeaveRequest.find({userId: userId }).sort({ startDate: -1 });

    const report = {
      attendanceRecords,
      leaveRequests,
    };

    res.status(200).json({message: 'Report Generated', report});
  } catch (error) {
return next (error);
  }
},

// Set grading criteria
async setGradingCriteria (req, res, next) {
  const setGradingCriteriaSchema = Joi.object ({
    attendancePercentage: Joi.number().min(0).max(100).required(),
    grade: Joi.string().valid('A', 'B', 'C', 'D', 'E', 'F').required()
  });

  const {error} = setGradingCriteriaSchema.validate(req.body);

  if(error){
    return next(error);
  }
  const { attendancePercentage, grade } = req.body;
  let grading;
  try {
    grading = await Grade.findOne({ attendancePercentage });
    if (!grading) {
      grading = new Grade({ attendancePercentage, grade });
    } else {
      grading.grade = grade;
    }

    await grading.save();
    res.status(200).json({message: 'Grading Criteria', grading});
  } catch (error) {
    return next(error);
  }
},
}

module.exports = adminController;