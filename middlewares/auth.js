
// const JWTService = require("../services/JWTService");

// const auth = async (req, res, next) => {
//     const token = req.cookies.accessToken;

//     if (!token) {
//         return res.status(401).json({ message: 'Access Token Missing' });
//     }

//     try {
//         const decoded = JWTService.verifyAccessToken(token);
//         req.user = decoded; // This sets the user information in the request
//         next();
//     } catch (error) {
//         return res.status(401).json({ message: 'Invalid Access Token' });
//     }
// };

// module.exports = auth;

const JWTService = require('../services/JWTService');
const User = require('../models/user');
const UserDTO = require('../dto/userDto');

const auth = async (req, res, next) => {
    try{
        // 1. refresh, access token validation
    const {refreshToken, accessToken} = req.cookies;

    if (!refreshToken || !accessToken){
        const error = {
            status: 401,
            message: 'Unauthorized'
        }

        return next(error)
    }

    let _id;

    try{
        _id = JWTService.verifyAccessToken(accessToken)._id;
    }
    catch(error){
        return next(error);
    }

    let user;

    try{
        user = await User.findOne({_id: _id});
    }
    catch(error){
        return next(error);
    }

    const userDto = new UserDTO(user);

    req.user = userDto;

    req.user.role = user.role;

    next();
    }
    catch(error){
        return next(error);
    }
}

const admin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    next();
  };

module.exports = {auth, admin};