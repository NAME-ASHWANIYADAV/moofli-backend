const express = require("express");
const router = new express.Router();
const controllers = require("../controllers/userController");
const upload = require("../middleware/multerConfig");
const passwordResetController = require('../controllers/passwordResetController');


// Routes
router.post("/user/register",upload,controllers.userregister);
router.post("/user/sendotp",controllers.userOtpSend);
router.post("/user/login",controllers.userLogin);
router.post('/user/request-password-reset', passwordResetController.requestPasswordReset);
router.post('/user/reset-password', passwordResetController.resetPassword);



module.exports = router;