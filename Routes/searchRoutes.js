const express = require('express');
const router = express.Router();
const { searchUsers, searchDiaries } = require('../controllers/searchController');

// Route for searching users by fname and lname
router.get('/search/users', searchUsers);

// Route for searching diary entries by keyword in title
router.get('/search/diaries', searchDiaries);

module.exports = router;
