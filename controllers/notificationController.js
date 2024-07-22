const Notification = require('../models/notification');
const users = require('../models/userSchema');
const io = require('../server').io; // Assuming you have exported io from your server file

// Fetch notifications for the logged-in user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });

        res.status(200).send({
            result: notifications,
            message: "Notifications fetched successfully",
        });
    } catch (error) {
        res.status(500).send({
            result: false,
            err: error.message,
            message: "Internal server error",
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).send({
                result: false,
                message: "Notification not found",
            });
        }

        if (notification.user.toString() !== req.user._id.toString()) {
            return res.status(401).send({
                result: false,
                message: "Unauthorized",
            });
        }

        notification.read = true;
        await notification.save();

        res.status(200).send({
            result: notification,
            message: "Notification marked as read",
        });
    } catch (error) {
        res.status(500).send({
            result: false,
            err: error.message,
            message: "Internal server error",
        });
    }
};

// Emit notification to the user
exports.emitNotification = async (userId, message) => {
    try {
        const user = await users.findById(userId);

        if (user && user.socketId) {
            io.to(user.socketId).emit('notification', {
                message: message,
            });
        }
    } catch (error) {
        console.error("Error emitting notification: ", error.message);
    }
};
