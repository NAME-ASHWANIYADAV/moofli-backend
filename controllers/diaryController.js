const DiaryEntry = require('../models/diary');
const Comment = require('../models/comments');
const users = require('../models/userSchema'); // Corrected model import
const authMiddleware = require('../middleware/auth');
const Notification = require('../models/notification');
const notificationController = require('./notificationController');

// Create a new diary entry
exports.createEntry = async (req, res) => {
    try {
        const newEntryData = {
            content: req.body.content,
            user: req.user._id,
        };

        const newEntry = new DiaryEntry(newEntryData);
        await newEntry.save();

        // Update user's entries array
        const user = await users.findById(req.user._id);
        if (!user) {
            return res.status(404).send({
                result: false,
                message: "User not found",
            });
        }
        if (!user.entries) {
            user.entries = []; // Initialize if not already initialized
        }
        user.entries.push(newEntry._id);
        await user.save();

        res.status(201).send({
            result: newEntry,
            message: "Diary entry created successfully",
        });
    } catch (err) {
        res.status(500).send({
            result: false,
            err: err.message,
            message: "Internal server error",
        });
    }
};

// Add a comment to a diary entry
exports.addComment = async (req, res) => {
    try {
        const entryId = req.params.entryId;
        const userId = req.user._id;
        const content = req.body.content;

        const entry = await DiaryEntry.findById(entryId);
        if (!entry) {
            return res.status(404).send({
                result: false,
                message: "Diary entry not found",
            });
        }

        if (entry.deactivateComments) {
            return res.status(403).send({
                result: false,
                message: "Comments are deactivated for this entry",
            });
        }

        const newComment = new Comment({
            user: userId,
            entry: entryId,
            content: content
        });
        await newComment.save();

        entry.comments.push(newComment._id);
        await entry.save();

        // Create notification
        const entryAuthor = await users.findById(entry.user);
        const user = await users.findById(userId);
        if (!entryAuthor || !user) {
            return res.status(404).send({
                result: false,
                message: "User not found",
            });
        }

        const notification = new Notification({
            user: entryAuthor._id,
            type: 'comment',
            message: `${user.fname} ${user.lname} commented on your diary entry.`,
            entry: entryId,
        });
        await notification.save();

        // Emit notification
        await notificationController.emitNotification(entryAuthor._id, notification.message);

        res.status(201).send({
            result: newComment,
            message: "Comment added successfully",
        });
    } catch (err) {
        res.status(500).send({
            result: false,
            err: err.message,
        });
    }
};


// Disable comments on a diary entry
exports.disableComments = async (req, res) => {
    try {
        const entryId = req.params.entryId;
        const userId = req.user._id;

        const entry = await DiaryEntry.findById(entryId);
        if (!entry) {
            return res.status(404).send({
                result: false,
                message: "Diary entry not found",
            });
        }
        if (entry.user.toString() !== userId.toString()) {
            return res.status(401).send({
                result: false,
                message: "Unauthorized to deactivate comments on this entry",
            });
        }
        entry.deactivateComments = !entry.deactivateComments;
        await entry.save();

        res.status(200).send({
            result: true,
            message: `Comments ${entry.deactivateComments ? "deactivated" : "activated"} successfully`,
        });
    } catch (err) {
        res.status(500).send({
            result: false,
            err: err.message,
        });
    }
};

// Delete a diary entry
exports.deleteEntry = async (req, res) => {
    try {
        const entryId = req.params.entryId;
        const userId = req.user._id;

        const entry = await DiaryEntry.findById(entryId);
        if (!entry) {
            return res.status(404).send({
                result: false,
                message: "Diary entry not found",
            });
        }
        if (entry.user.toString() !== userId.toString()) {
            return res.status(401).send({
                result: false,
                message: "Unauthorized to delete this entry",
            });
        }

        // Remove likes and comments
        const deletePromises = [];

        for (let like of entry.likes) {
            deletePromises.push(users.findByIdAndUpdate(like, { $pull: { likedEntries: entryId } }));
        }
        for (let comment of entry.comments) {
            deletePromises.push(Comment.findByIdAndDelete(comment));
        }

        await Promise.all(deletePromises);

        await DiaryEntry.findByIdAndDelete(entryId);

        // Update user's entries array
        const user = await users.findById(userId);
        if (user) {
            user.entries.pull(entryId);
            await user.save();
        }

        res.status(200).send({
            result: true,
            message: "Diary entry deleted successfully",
        });
    } catch (err) {
        res.status(500).send({
            result: false,
            err: err.message,
        });
    }
};

exports.likeEntry = async (req, res) => {
    try {
        const entryId = req.params.entryId;
        const userId = req.user._id;

        const entry = await DiaryEntry.findById(entryId);
        if (!entry) {
            return res.status(404).send({
                result: false,
                message: "Diary entry not found",
            });
        }

        // Toggle like
        const user = await users.findById(userId);
        if (!user) {
            return res.status(404).send({
                result: false,
                message: "User not found",
            });
        }

        const isLiked = entry.likes.includes(userId);

        if (isLiked) {
            entry.likes.pull(userId);
            if (user.likedEntries) {
                user.likedEntries.pull(entryId);
                await user.save();
            }
            await entry.save();

            // Create and emit notification for unlike
            const notification = new Notification({
                user: entry.user,
                type: 'unlike',
                message: `${user.fname} ${user.lname} unliked your diary entry.`,
                entry: entryId,
            });
            await notification.save();

            // Emit notification
            await notificationController.emitNotification(entry.user, notification.message);

            return res.status(200).send({
                result: true,
                message: "Diary entry unliked successfully",
            });
        }

        entry.likes.push(userId);
        if (!user.likedEntries) {
            user.likedEntries = []; // Initialize if not already initialized
        }
        user.likedEntries.push(entryId);
        await entry.save();
        await user.save();

        // Create and emit notification for like
        const notification = new Notification({
            user: entry.user,
            type: 'like',
            message: `${user.fname} ${user.lname} liked your diary entry.`,
            entry: entryId,
        });
        await notification.save();

        // Emit notification
        await notificationController.emitNotification(entry.user, notification.message);

        res.status(200).send({
            result: true,
            message: "Diary entry liked successfully",
        });
    } catch (err) {
        res.status(500).send({
            result: false,
            err: err.message,
        });
    }
};
// Fetch all diary entries
exports.getEntries = async (req, res) => {
    try {
        const entries = await DiaryEntry.find()
            .populate('user', 'fname lname profilePicture')
            .populate({
                path: 'comments',
                populate: { path: 'user', select: 'fname lname profilePicture' }
            });

        res.status(200).send({
            result: entries,
            message: "Diary entries fetched successfully",
        });
    } catch (err) {
        res.status(500).send({
            result: false,
            err: err.message,
        });
    }
};

// Fetch a single diary entry
exports.getEntry = async (req, res) => {
    try {
        const entry = await DiaryEntry.findById(req.params.entryId)
            .populate('user', 'fname lname profilePicture')
            .populate({
                path: 'comments',
                populate: { path: 'user', select: 'fname lname profilePicture' }
            });

        if (!entry) {
            return res.status(404).send({
                result: false,
                message: "Diary entry not found",
            });
        }

        res.status(200).send({
            result: entry,
            message: "Diary entry fetched successfully",
        });
    } catch (err) {
        res.status(500).send({
            result: false,
            err: err.message,
        });
    }
};

// Fetch diary entries from a user
exports.getEntriesFromUser = async (req, res) => {
    try {
        const entries = await DiaryEntry.find({ user: req.params.userId })
            .populate('user', 'fname lname profilePicture')
            .populate({
                path: 'comments',
                populate: { path: 'user', select: 'fname lname profilePicture' }
            });

        if (!entries || entries.length === 0) {
            return res.status(404).send({
                result: false,
                message: "No diary entries found for this user",
            });
        }

        res.status(200).send({
            result: entries,
            message: "Diary entries fetched successfully",
        });
    } catch (err) {
        res.status(500).send({
            result: false,
            err: err.message,
        });
    }
};
