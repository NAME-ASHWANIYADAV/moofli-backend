const jwt = require('jsonwebtoken');
const users = require('../models/userSchema'); // Adjust the path based on your project structure

const authMiddleware = async (req, res, next) => {
    // Check if Authorization header is present
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    // Extract token from Authorization header (Bearer <token>)
    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user from database based on decoded ID
        const user = await users.findById(decoded._id);
        if (!user) {
            throw new Error('User not found');
        }

        // Attach user object to request object
        req.user = user;
        next(); // Proceed to next middleware or route handler
    } catch (error) {
        console.error('Authentication error:', error.message);
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

module.exports = authMiddleware;
