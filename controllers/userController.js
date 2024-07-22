const users = require("../models/userSchema");
const userotp = require("../models/userOtp");
const upload = require("../middleware/multerConfig");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const multer= require("multer")


// email config
const tarnsporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});


exports.userregister = async (req, res) => {
    upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: 'File size exceeds 2MB' });
        } else if (err) {
            return res.status(400).json({ error: err });
        }

        const { fname, lname, email, password, dateOfBirth, country, state, city, postalcode, termsAccepted } = req.body;

        if (!fname || !lname || !email || !password || !dateOfBirth || !country || !state || !city || !postalcode || !termsAccepted) {
            return res.status(400).json({ error: "Please enter all required fields" });
        }

        try {
            const existingUser = await users.findOne({ email: email });

            if (existingUser) {
                return res.status(400).json({ error: "User already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = new users({
                fname,
                lname,
                email,
                password: hashedPassword,
                dateOfBirth,
                country,
                state,
                city,
                postalCode: postalcode,
                termsAccepted,
                profilePicture: req.file ? req.file.filename : null // Save filename if file was uploaded
            });

            const savedUser = await newUser.save();
            console.log(`User registered successfully: ${savedUser}`);

            const token = await newUser.generateAuthToken();

            return res.status(200).json({
                message: "User signed up successfully",
                user: {
                    _id: newUser._id,
                    fname: newUser.fname,
                    lname: newUser.lname,
                    email: newUser.email,
                    dateOfBirth: newUser.dateOfBirth,
                    country: newUser.country,
                    state: newUser.state,
                    city: newUser.city,
                    postalCode: newUser.postalCode,
                    termsAccepted: newUser.termsAccepted,
                    profilePicture: newUser.profilePicture
                },
                userToken: token
            });
        } catch (error) {
            console.error("Error registering user:", error);
            return res.status(400).json({ error: "Invalid details", error });
        }
    });
};



// user send otp
exports.userOtpSend = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400).json({ error: "Please Enter Your Email" })
    }


    try {
        const presuer = await users.findOne({ email: email });

        if (presuer) {
            const OTP = Math.floor(100000 + Math.random() * 900000);

            const existEmail = await userotp.findOne({ email: email });


            if (existEmail) {
                const updateData = await userotp.findByIdAndUpdate({ _id: existEmail._id }, {
                    otp: OTP
                }, { new: true }
                );
                await updateData.save();

                const mailOptions = {
                    from: process.env.EMAIL,
                    to: email,
                    subject: "Sending Email For Otp Validation",
                    text: `OTP:- ${OTP}`
                }


                tarnsporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log("error", error);
                        res.status(400).json({ error: "email not send" })
                    } else {
                        console.log("Email sent", info.response);
                        res.status(200).json({ message: "Email sent Successfully" })
                    }
                })

            } else {

                const saveOtpData = new userotp({
                    email, otp: OTP
                });

                await saveOtpData.save();
                const mailOptions = {
                    from: process.env.EMAIL,
                    to: email,
                    subject: "Sending Eamil For Otp Validation",
                    text: `OTP:- ${OTP}`
                }

                tarnsporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log("error", error);
                        res.status(400).json({ error: "email not send" })
                    } else {
                        console.log("Email sent", info.response);
                        res.status(200).json({ message: "Email sent Successfully" })
                    }
                })
            }
        } else {
            res.status(400).json({ error: "This User Not Exist In our Db" })
        }
    } catch (error) {
        res.status(400).json({ error: "Invalid Details", error })
    }
};


exports.userLogin = async(req,res)=>{
    const {email,otp} = req.body;

    if(!otp || !email){
        res.status(400).json({ error: "Please Enter Your OTP and email" })
    }

    try {
        const otpverification = await userotp.findOne({ email: email });

        if (otpverification.otp === otp) {
            const preuser = await users.findOne({ email: email });

            // token generate
            const token = await preuser.generateAuthToken();
            console.log("User login successfully:", preuser);
            return res.status(200).json({ message: "User Login Successfully Done", userToken: token });
        } else {
            return res.status(400).json({ error: "Invalid OTP" });
        }
    } catch (error) {
        res.status(400).json({ error: "Invalid Details", error })
    }
}