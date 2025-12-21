//Insert Routes here.
const {Router} = require("express");
const router = Router();
const usercontroller = require("../controller/usercontroller");

router.post("/register", usercontroller.registerUser);
router.post("/login", usercontroller.loginUser);






module.exports = router;