const http = require("http");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Room = require("./models/roommodel");

dotenv.config();

const userroutes = require("./routes/userroutes");
const roomroutes = require("./routes/roomroutes");

const app = express();
const server = http.createServer(app);

//DB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Database connected"))
    .catch(err => console.log("Database connection failed:", err));

//Socket Connection
const io = new Server(server, {
    cors: {
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    roomroutes(io, socket);
});


//Middlewares
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));



//routes
app.use("/api", userroutes);
app.get("/", (req, res) => res.render("index"));
app.get("/login", (req, res) => res.render("login", { error: null }));
app.get("/register", (req, res) => res.render("register", { error: null }));
app.get("/chatroom", (req, res) => res.render("chatroom"));
app.get("/postlogin", (req, res) => res.render("postlogin"));
// Example: GET /chat
app.get("/chat", async (req, res) => {
    const { roomId } = req.query;
    if (!roomId) return res.redirect("/chatroom");

    const room = await Room.findOne({ roomId });
    if (!room) return res.redirect("/chatroom");

    let username;
    try {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
        username = decoded.username;
    } catch {
        return res.redirect("/login");
    }

    // Admin always enters chat
    if (username === room.admin) {
        return res.render("chat", {
            roomId,
            username,
            admin: room.admin
        });
    }

    // Approved participant
    if (room.participants.includes(username)) {
        return res.render("chat", {
            roomId,
            username,
            admin: room.admin
        });
    }

    // Otherwise → waiting room
    res.render("waitingroom", { roomId });
});


app.get("/waitingroom", (req, res) => {
    const { roomId } = req.query;
    if (!roomId) return res.redirect("/chatroom");
    res.render("waitingroom", { roomId });
});


//Server Listener
server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
