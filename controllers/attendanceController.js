const Attendance = require('../models/attendance');
const Joi = require("joi");

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const attendanceController = {
    async markAttendance(req, res, next) {
        const markAttendanceSchema = Joi.object({
            status: Joi.string().valid('present', 'absent').required()
        });

        const { error } = markAttendanceSchema.validate(req.body);

        if (error) {
            return next(error);
        }
        const { status } = req.body;
        const userId = req.user._id;
        try {
            // Check if attendance already marked for today
            let attendance = await Attendance.findOne({ userId: userId, date: { $gte: new Date().setHours(0o0, 0o0, 0o0), $lt: new Date().setHours(23, 59, 59) } });
            if (attendance) {
                return res.status(400).json({ msg: 'Attendance already marked for today' });
            }

            // Create new attendance record
            attendance = new Attendance({
                userId: userId,
                status,
            });

            await attendance.save();

            res.status(200).json({ message: 'Attendance Marked For today', attendance });
        } catch (error) {
            return next(error);
        }
    },

    // Get all attendance records
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

    // Get attendance by id
    async getAttendance(req, res, next) {
        const getByIdSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required(),
        });

        const { error } = getByIdSchema.validate(req.params);

        if (error) {
            return next(error);
        }

        try {
            let attendance;
            const { id } = req.params;

            attendance = await Attendance.find({ userId: id }).sort({ date: -1 });
            res.status(200).json(attendance);
        } catch (error) {
            return next(error);
        }
    },
}
module.exports = attendanceController;
