
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const User = require('../models/userSchema');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "User with this email does not exist" });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(resetToken, 12);

        // Set token and expiration
        user.passwordResetToken = hash;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send email
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click this link to reset your password: ${resetUrl}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: "Error sending email" });
            }
            res.status(200).json({ message: "Password reset link sent to email" });
        });

    } catch (error) {
        console.error("Error requesting password reset:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.resetPassword = async (req, res) => {
    const { resetToken, newPassword } = req.body;

    try {
        const hashedToken = await bcrypt.hash(resetToken, 12);
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        // Update password and clear reset token fields
        user.password = await bcrypt.hash(newPassword, 12);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successful" });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
