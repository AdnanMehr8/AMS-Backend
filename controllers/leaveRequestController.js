const LeaveRequest = require('../models/leaveRequest');
const Joi = require("joi").extend(require('@hapi/joi-date'));
const moment = require('moment');

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const leaveRequestController = {
    async submitLeaveRequest(req, res, next) {
        console.log('Request Body:', req.body); // Log the request body
        const submitLeaveRequestSchema = Joi.object({
            // name: Joi.string().required(),
            startDate: Joi.string().required(), // Accept startDate as string in 'MMM Do YY' format
            endDate: Joi.string().required(),  // Accept endDate as string in 'MMM Do YY' format
            reason: Joi.string().max(255).required()
        });

        const { error } = submitLeaveRequestSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const userId = req.user._id;
        const { startDate, endDate, reason } = req.body;

        // No need to parse dates if they are already in ISO format
        // const parsedStartDate = moment(startDate).toDate();
        // const parsedEndDate = moment(endDate).toDate();

        let leaveRequest;
        try {
            leaveRequest = new LeaveRequest({
                
                userId: userId,
                startDate,
                endDate,
                reason,
            });

            await leaveRequest.save();

            res.json(leaveRequest);
        } catch (error) {
            return next(error);
        }
    },

    // Get all leave requests
    async getLeaveRequests(req, res, next) {
        try {
            let leaveRequests = await LeaveRequest.find({});
            const allLeaveRequests = [];
            for (let i = 0; i < leaveRequests.length; i++) {
                const leaveRequest = new LeaveRequest(leaveRequests[i]);
                allLeaveRequests.push(leaveRequest);
            }
            return res.status(200).json(allLeaveRequests);
        } catch (error) {
            return next(error);
        }
    },

    async getLeaveRequestById(req, res, next) {
        const getByIdSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required(),
        });

        const { error } = getByIdSchema.validate(req.params);

        if (error) {
            return next(error);
        }

        let leaveRequest;
        try {
            const { id } = req.params;

            leaveRequest = await LeaveRequest.find({ userId: id }).sort({ date: -1 });
            res.status(200).json(leaveRequest);
        } catch (error) {
            return next(error);
        }
    },
};

module.exports = leaveRequestController;
