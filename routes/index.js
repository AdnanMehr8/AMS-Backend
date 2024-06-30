const express = require('express');
const authController = require('../controllers/authController');
const attendanceController = require('../controllers/attendanceController');
const leaveRequestController = require('../controllers/leaveRequestController');
const adminController = require('../controllers/adminController');
const { auth, admin } = require('../middlewares/auth');

const router = express.Router();

// User
router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/logout', auth, authController.logout);

router.post('/refresh', auth, authController.refresh);

router.get('/profile', auth,  authController.getProfile);

router.put('/update-profile', auth, authController.updateProfile);


// Attendance
router.post('/mark',auth,  attendanceController.markAttendance);

router.get('/all-attendance',auth,  attendanceController.getAllAttendance);

router.get('/attendance/:userId',auth,  attendanceController.getAttendance);


// leave
router.post('/submit-leave',auth, leaveRequestController.submitLeaveRequest);

router.get('/leave-requests',auth, leaveRequestController.getLeaveRequests);

router.get('/leave-request/:userId',auth, leaveRequestController.getLeaveRequestById);


// Admin
// Get all students
router.get('/students', auth, admin, adminController.getAllStudents);

// Manage attendance
router.post('/students-attendance/manage', auth, admin, adminController.manageAttendance);

// CRUD operations on attendance 
router.post('/students-attendance/create', auth, admin, adminController.createAttendance);

router.get('/students-attendance', auth, admin, adminController.getAllAttendance);

router.put('/students-attendance/update', auth, admin, adminController.updateAttendance);

router.delete('/students-attendance/:id', auth, admin, adminController.deleteAttendance);

router.put('/leave', auth, admin, adminController.manageLeaveRequest);

router.get('/report/:userId', auth, admin, adminController.generateReport);

router.post('/grading', auth, admin, adminController.setGradingCriteria);

module.exports = router;
