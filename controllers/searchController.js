const users = require('../models/userSchema'); // Assuming correct model import
const DiaryEntry = require('../models/diary');

// Search for users by fname and lname
exports.searchUsers = async (req, res) => {
    const { fname, lname } = req.query;

    try {
        let query = {};

        // Build query based on provided parameters
        if (fname) {
            query.fname = { $regex: fname, $options: 'i' }; // Case-insensitive match for fname
        }
        if (lname) {
            query.lname = { $regex: lname, $options: 'i' }; // Case-insensitive match for lname
        }

        const user= await users.find(query);

        if (user.length === 0) {
            return res.status(404).json({
                result: [],
                message: "No users found with the given username",
            });
        }

        res.status(200).json({
            result: user,
            message: "Users fetched successfully",
        });
    } catch (error) {
        res.status(500).json({
            result: false,
            err: error.message,
            message: "Internal server error",
        });
    }
};

// Search for diary entries by keyword in title
exports.searchDiaries = async (req, res) => {
    const { keyword } = req.query;

    try {
        const diaries = await DiaryEntry.find({
            content: { $regex: keyword, $options: 'i' } // Case-insensitive match for keyword in title
        });

        if (diaries.length === 0) {
            return res.status(404).json({
                result: [],
                message: "No diaries found with the given keywords",
            });
        }
        res.status(200).json({
            result: diaries,
            message: "Diaries fetched successfully",
        });
    } catch (error) {
        res.status(500).json({
            result: false,
            err: error.message,
            message: "Internal server error",
        });
    }
};
