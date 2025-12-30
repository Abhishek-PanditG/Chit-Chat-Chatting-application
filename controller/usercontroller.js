const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Usermodel = require("../models/usermodel");
dotenv.config();


exports.registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render("register", { error: "Username and Password are required" });
    }

    const existing = await Usermodel.findOne({ username });
    if (existing) {
      return res.render("register", { error: "Username already exists" });
    }

    const newUser = await Usermodel.create({ username, password });

    const token = jwt.sign(
      { username: newUser.username, id: newUser._id },
      process.env.ACCESS_SECRET_KEY,
      { expiresIn: "1h" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: false,     
      sameSite: "lax"
    };

    res.cookie("token", token, cookieOptions);

    return res.render("login", {
    message: "Registration successful. Please log in.",
    error: null
    });


  } catch (error) {
    console.log(error);
    return res.render("register", { error: "Registration failed. Please try again." });
  }
};


exports.loginUser = async (req, res) => {
    // Login logic here
    try {
        const { username, password } = req.body;

        if(!username || !password) {
            return res.status(400).send("Username and password are required");
        }
        const notfound = await Usermodel.findOne({ username });
        if(!notfound){
            return res.status(404).send("User not found");
        }

        const compare = notfound.password === password;
        if(!compare){
            return res.status(401).send("Invalid password");
        }

        jwt.sign(
            { username, password },
            process.env.ACCESS_SECRET_KEY,
            (err, token) => {
                if(err){
                    return res.status(500).send("Error generating token");
                }
                res.cookie("token", token, { httpOnly: true, secure: true }).status(200);
            }
        );

        res.render("postlogin", {message: "Login successful."});

    } catch (error) {
        res.render("login", {error: "Login failed. Please try again."});        
    }
}
