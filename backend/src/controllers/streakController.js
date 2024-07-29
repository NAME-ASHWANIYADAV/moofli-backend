const User = require("../models/user");

const updateStreak = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const currentDate = new Date();
    const lastEntryDate = new Date(user.lastEntryDate);

    // Check if the entry is for today
    if (
        currentDate.getFullYear() === lastEntryDate.getFullYear() &&
        currentDate.getMonth() === lastEntryDate.getMonth() &&
        currentDate.getDate() === lastEntryDate.getDate()
    ) {
        return; // Entry for today already exists
    }

    // Check if the entry is consecutive
    const oneDay = 24 * 60 * 60 * 1000;
    if (currentDate - lastEntryDate <= oneDay) {
        user.streak += 1;
    } else {
        user.streak = 1; // Reset streak if not consecutive
    }

    user.lastEntryDate = currentDate;
    await user.save();
};

module.exports = {
    updateStreak,
};
