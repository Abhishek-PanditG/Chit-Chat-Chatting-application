const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
     admin: {
        type: String,
        required: true
    },
    adminSocketId: {
        type: String,
        required: false
    },
    participants: {
        type: [String],
        default: []
    },
    pending: {
        type: [{ username: String, socketId: String }],
        default: []
    },
   messages: {
    type: [
        {
            sender: { type: String, required: true },
            text: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    default: []
}

});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;