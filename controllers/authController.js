const Joi = require("joi");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const {BACKEND_SERVER_PATH, CLOUD_NAME,
    API_SECRET,
    API_KEY,}= require("../config/index");
const JWTService = require("../services/JWTService");
const RefreshToken = require("../models/token");
const UserDTO = require("../dto/userDto");
const cloudinary = require("cloudinary").v2;


// Configuration
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });
  
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;


const authController = {
    async register(req, res, next) {
        // validate user input
        const userRegisterSchema = Joi.object({
            name: Joi.string().max(30).required(),
            username: Joi.string().min(5).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(passwordPattern).required(),
            confirmPassword: Joi.ref("password"),
            role: Joi.string().required(),
            profilePicture: Joi.string().allow().required(),
        });

        const { error } = userRegisterSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {

            const { name, username, email, password, role, profilePicture } = req.body;

            // email or username already registerwed?

            try {
                const emailInUse = await User.exists({ email });
                const usernameInUse = await User.exists({ username });

                if (emailInUse) {
                    return res.status(400).json({ message: 'email already registered, use another email' });
                };

                if (usernameInUse) {
                    return res.status(400).json({ message: 'username not available, choose another username' });
                };
            }
            catch (error) {
                return next(error);
            }

            // password hash
            const hashedPassword = await bcrypt.hash(password, 10);

            // handle photo storage
            // const buffer = Buffer.from(
            //     profilePicture.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
            //     "base64"
            // );

            // // allot a random name
            // const imagePath = `${Date.now()}-${username}.png`

            // save image to local storage
            // save image to cloudinary
    let response;
            
            try {
      response = await cloudinary.uploader.upload(profilePicture);

                // fs.writeFileSync(`storage/${imagePath}`, buffer);
            }
            catch (error) {
                return next(error)
            }
            // store user data in db
            let user;
            let accessToken;
            let refreshToken;

            try {
                const userToRegister = new User({
                    name,
                    username,
                    email,
                    password: hashedPassword,
                    role,
                    // profilePicture: `${BACKEND_SERVER_PATH}/storage/${imagePath}`
                    profilePicturePath: response.url,
                });

                user = await userToRegister.save();

                accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");
                refreshToken = JWTService.signRefreshToken({ _id: user._id }, "60m");
            }
            catch (error) {
                return next(error);
            }

            // store refresh token in db
            await JWTService.storeRefreshToken(refreshToken, user._id);

            // send tokens in cookies
            res.cookie("accessToken", accessToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true,
                sameSite: "None",
                secure: true,
            });
            res.cookie("refreshToken", refreshToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true,
                sameSite: "None",
                secure: true,
            });
            const userDto = new UserDTO(user);
            return res.status(201).json({ auth: true, message: 'User Successfully Registered', user: userDto });
        } catch (error) {
            return next(error);
        }
    },

    async login(req, res, next) {
        const userLoginSchema = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            password: Joi.string().pattern(passwordPattern),
        });

        const { error } = userLoginSchema.validate(req.body);

        if (error) {
            return next(error);
        }
        try {
            const { username, password } = req.body;

            let user;

            try {
                // mathing username
                user = await User.findOne({ username: username });

                if (!user) {
                    return res.status(401).json({ message: 'Invalid Username' });
                };

                const match = await bcrypt.compare(password, user.password);

                if (!match) {
                    return res.status(401).json({ message: 'Invalid Password' });
                }
            }
            catch (error) {
                return next(error);
            }

            const accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");
            const refreshToken = JWTService.signRefreshToken({ _id: user._id }, "60m");

            // update refresh token in database
            try {
                await RefreshToken.updateOne(
                    {
                        _id: user._id,
                    },
                    { token: refreshToken },
                    { upsert: true }
                );
            } catch (error) {
                return next(error);
            }

            res.cookie("accessToken", accessToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true,
                sameSite: "None",
                secure: true,
            });

            res.cookie("refreshToken", refreshToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true,
                sameSite: "None",
                secure: true,
            });
            const userDto = new UserDTO(user);

            return res.status(201).json({ auth: true, message: 'User Successfully login', user: userDto });
        }
        catch (error) {
            return next(error);
        }
    },

    async logout(req, res, next) {
        try {
            // delete refresh token from db
            const { refreshToken } = req.cookies;

            try {
                await RefreshToken.deleteOne({ token: refreshToken });
            }
            catch (error) {
                return next(error);
            }
            // clear cookies
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");

            res.status(200).json({ message: 'logout Successfull', user: null, auth: false });
        }
        catch (error) {
            return next(error);
        }
    },

    async refresh(req, res) {
        try {
            const originalRefreshToken = req.cookies.refreshToken;

            if (!originalRefreshToken) {
                return res.status(401).json({ message: 'Refresh token not found' });
            }

            let id;

            try {
                id = JWTService.verifyRefreshToken(originalRefreshToken)._id;
            }
            catch (error) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            try {
                const match = await RefreshToken.findOne({
                    _id: id,
                    token: originalRefreshToken,
                });

                if (!match) {
                    return res.status(401).json({ success: false, message: 'Unauthorized' });
                }
            }
            catch (error) {
                return next(error);
            }

            try {
                const accessToken = JWTService.signAccessToken({ _id: id }, "30m");

                const refreshToken = JWTService.signRefreshToken({ _id: id }, "60m");

                await RefreshToken.updateOne({ _id: id }, { token: refreshToken });

                res.cookie("accessToken", accessToken, {
                    maxAge: 1000 * 60 * 60 * 24,
                    httpOnly: true,
                    sameSite: "None",
                    secure: true,
                });

                res.cookie("refreshToken", refreshToken, {
                    maxAge: 1000 * 60 * 60 * 24,
                    httpOnly: true,
                    sameSite: "None",
                    secure: true,
                });
            }
            catch (error) {
                return next(error);
            }

            const user = await User.findOne({ _id: id });

            const userDto = new UserDTO(user);

            return res.status(200).json({ message: 'Token refreshed Successfully', auth: true, user: userDto});
        }
        catch (error) {
            return next(error);
        }
    },

    // async updateProfile(req, res, next) {
    //     const updateProfileSchema = Joi.object({
    //         name: Joi.string().max(30).allow(''),
    //         email: Joi.string().email().allow(''),
    //         password: Joi.string().pattern(passwordPattern).allow(''),
    //         confirmPassword: Joi.ref("password"),
    //         role: Joi.string().allow(''),
    //         profilePicture: Joi.string().allow(''),
    //     });

    //     const { error } = updateProfileSchema.validate(req.body);

    //     if (error) {
    //         return next(error);
    //     }
    //     try {
    //         const { name, email, password, role, profilePicture } = req.body;
    //         const userId = req.user._id;
    //         let user;

    //         try {
    //             user = await User.findOne({ _id: userId });
    //             if (!user) {
    //                 return res.status(401).json({ message: 'User not found' });
    //             }

    //         } catch (error) {
    //             return next(error);
    //         }
    //         const hashedPassword = await bcrypt.hash(password, 10);

    //         if (profilePicture) {
    //             let previousPhoto = user.profilePicture;

    //             if (previousPhoto) {
    //                 previousPhoto = previousPhoto.split("/").at(-1);

    //                 // Check if the file exists before trying to delete it
    //                 const previousPhotoPath = `storage/${previousPhoto}`;
    //                 if (fs.existsSync(previousPhotoPath)) {
    //                     try {
    //                         fs.unlinkSync(previousPhotoPath);
    //                     } catch (error) {
    //                         return next(error);
    //                     }
    //                 }
    //             }

    //             // Handle photo storage
    //             const buffer = Buffer.from(
    //                 profilePicture.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
    //                 "base64"
    //             );

    //             // Allot a random name
    //             const imagePath = `${Date.now()}-${user.username}.png`;

    //             try {
    //                 fs.writeFileSync(`storage/${imagePath}`, buffer);
    //             } catch (error) {
    //                 return next(error);
    //             }

    //             await User.updateOne(
    //                 { _id: userId },
    //                 {
    //                     name,
    //                     email,
    //                     password: hashedPassword,
    //                     role,
    //                     profilePicture: `${BACKEND_SERVER_PATH}/storage/${imagePath}`,
    //                 }
    //             );
    //         } else {
    //             await User.updateOne(
    //                 { _id: userId },
    //                 { name, email, password: hashedPassword, role }
    //             );
    //         }

    //         // Refresh the user object with updated data
    //         user = await User.findOne({ _id: userId });

    //         const userDto = new UserDTO(user);

    //         return res.status(200).json({ message: 'User updated successfully', user: userDto });
    //     }
    //     catch (error) {
    //         return next(error);
    //     }
    // },

    async updateProfile(req, res, next) {
        const updateProfileSchema = Joi.object({
            name: Joi.string().max(30).allow(''),
            email: Joi.string().email().allow(''),
            password: Joi.string().pattern(passwordPattern).allow(''),
            confirmPassword: Joi.ref("password"),
            role: Joi.string().allow(''),
            profilePicture: Joi.string().allow(''),
        });
    
        const { error } = updateProfileSchema.validate(req.body);
    
        if (error) {
            return next(error);
        }
        try {
            const { name, email, password, role, profilePicture } = req.body;
            const userId = req.user._id;
            let user;
    
            try {
                user = await User.findOne({ _id: userId });
                if (!user) {
                    return res.status(401).json({ message: 'User not found' });
                }
            } catch (error) {
                return next(error);
            }
    
            let updateData = { name, email, role };
    
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateData.password = hashedPassword;
            }
    
            if (profilePicture) {
                let previousPhoto = user.profilePicturePath;
    
                if (previousPhoto) {
                    previousPhoto = previousPhoto.split("/").at(-1);
                    const previousPhotoPath = `storage/${previousPhoto}`;
    
                    if (fs.existsSync(previousPhotoPath)) {
                        try {
                            fs.unlinkSync(previousPhotoPath);
                        } catch (error) {
                            return next(error);
                        }
                    }
                }
    
                // const buffer = Buffer.from(
                //     profilePicture.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
                //     "base64"
                // );
    
                // const imagePath = `${Date.now()}-${user.username}.png`;
                let response;
    
                try {
        response = await cloudinary.uploader.upload(profilePicture);

                    // fs.writeFileSync(`storage/${imagePath}`, buffer);
                } catch (error) {
                    return next(error);
                }
    
                updateData.profilePicturePath = response.url;
            }
    
            await User.updateOne({ _id: userId }, updateData);
    
            user = await User.findOne({ _id: userId });
    
            const userDto = new UserDTO(user);
    
            return res.status(200).json({ message: 'User updated successfully', user: userDto });
        } catch (error) {
            return next(error);
        }
    },
    
    async getProfile(req, res, next) {
        // const getByIdSchema = Joi.object({
        //     id: Joi.string().regex(mongodbIdPattern).required(),
        // });

        // const { error } = getByIdSchema.validate(req.user._id);

        // if (error) {
        //     return next(error);
        // }
        // try {
        //     let user;
        //     const { id } = req.user._id;
        //     try {
        //         user = await User.findOne({ _id: id }).select('-password');
        //         if (!user) {
        //             return res.status(404).json({ msg: 'User not found' });
        //         }
        //     } catch (error) {
        //         return next(error);
        //     }
        //     const userDto = new UserDTO(user);

        //     return res.status(200).json({ user: userDto });
        // }
        // catch (error) {
        //     return next(error);
        // }
        try {
            const user = await User.findById(req.user._id).select('-password');
            if (!user) {
              return res.status(404).json({ msg: 'User not found' });
            }
        
            res.json(user);
          } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
          }
    },
}
module.exports = authController;
