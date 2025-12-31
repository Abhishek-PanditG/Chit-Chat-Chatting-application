const Room = require("../models/roommodel");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

//Helpers
function getUsernameFromSocket(socket) {
    try {
        const cookieHeader = socket.request.headers.cookie;
        if (!cookieHeader) return null;

        const cookies = Object.fromEntries(
            cookieHeader.split("; ").map(c => c.split("="))
        );

        const token = cookies.token;
        if (!token) return null;

        const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
        return decoded.username;
    } catch {
        return null;
    }
}

const roomController = {
    //Create Room
    createRoom: async (io, socket) => {
        try {
            const username = getUsernameFromSocket(socket);
            if (!username) return socket.emit("error_message", "Unauthorized");

            const roomId = uuidv4().slice(0, 5).toUpperCase();

            const room = await Room.create({
                roomId,
                admin: username,
                participants: [username],
                pending: [],
                messages: []
            });

            socket.join(roomId);

            socket.emit("room_created", { roomId });
            socket.emit("role_info", { role: "admin" });
            socket.emit("your_username", username);
            socket.emit("participants_update", { users: room.participants, admin: room.admin });
            socket.emit("chat_history", room.messages);

        } catch (err) {
            console.error(err);
            socket.emit("error_message", "Room creation failed");
        }
    },

    // Join Room
    joinRoom: async (io, socket, { roomId }) => {
        try {
            const username = getUsernameFromSocket(socket);
            if (!username) return socket.emit("error_message", "Unauthorized");

            const room = await Room.findOne({ roomId });
            if (!room) return socket.emit("error_message", "Room not found");

            //Admin Join
            if (room.admin === username) {
                socket.join(roomId);

                socket.emit("role_info", { role: "admin" });
                socket.emit("your_username", username);
                socket.emit("participants_update", { users: room.participants, admin: room.admin });
                socket.emit("chat_history", room.messages);
                return;
            }

            //Already a participant
            if (room.participants.includes(username)) {
                socket.join(roomId);

                socket.emit("role_info", { role: "member" });
                socket.emit("your_username", username);
                socket.emit("participants_update", { users: room.participants, admin: room.admin });
                socket.emit("chat_history", room.messages);
                return;
            }

            //Prevention of Duplicate Pending Requests
            const alreadyPending = room.pending.some(p => p.username === username);
            if (alreadyPending) {
                const pendingUser = room.pending.find(p => p.username === username);
                pendingUser.socketId = socket.id;
                await room.save();
                socket.emit("join_pending", "Waiting for admin approval");
                return;
            }

            //New Join Request
            room.pending.push({ username, socketId: socket.id });
            await room.save();

            socket.emit("join_pending", "Waiting for admin approval");

            //Notify Admin
            const adminSocket = [...io.sockets.sockets.values()]
                .find(s => getUsernameFromSocket(s) === room.admin);

            if (adminSocket) {
                adminSocket.emit("join_request", {
                    username,
                    socketId: socket.id
                });
            }

        } catch (err) {
            console.error(err);
            socket.emit("error_message", "Join failed");
        }
    },

    //Admin Actions
    handleAdminAction: async (io, socket, { roomId, targetUsername, action }) => {
        try {
            const adminUsername = getUsernameFromSocket(socket);
            if (!adminUsername) return;

            const room = await Room.findOne({ roomId });
            if (!room || room.admin !== adminUsername) return;

            const pendingUser = room.pending.find(p => p.username === targetUsername);
            if (!pendingUser) return;

            const targetSocketId = pendingUser.socketId;

            room.pending = room.pending.filter(p => p.socketId !== targetSocketId);

            if (action === "accept") {
                if (!room.participants.includes(targetUsername)) {
                    room.participants.push(targetUsername);
                }

                room.pending = room.pending.filter(p => p.socketId !== targetSocketId);
                await room.save();

                const targetSocket = io.sockets.sockets.get(targetSocketId);

                if (targetSocket) {
                    targetSocket.join(roomId);

                    //CRITICAL EVENTS
                    targetSocket.emit("join_success", { roomId });
                    targetSocket.emit("role_info", { role: "member" });
                    targetSocket.emit("your_username", targetUsername);
                    targetSocket.emit("participants_update", { users: room.participants, admin: room.admin });
                    targetSocket.emit("chat_history", room.messages);
                }

                io.to(roomId).emit("participants_update", { users: room.participants, admin: room.admin });
                const text = `${targetUsername} has joined the room.`;
                const message = {
                    sender: "Join",
                    text,
                    timestamp: Date.now()
                };
                room.messages.push(message);
                await room.save();
                io.to(roomId).emit("new_message", message);
            }
            if (action === "deny") {
                await room.save();
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                targetSocket?.emit("join_denied", "Join request denied");
            }

        } catch (err) {
            console.error(err);
        }
    },

    // Send Message
    sendMessage: async (io, socket, { roomId, text }) => {
        try {
            const username = getUsernameFromSocket(socket);
            if (!username) return;

            const room = await Room.findOne({ roomId });
            if (!room || !room.participants.includes(username)) return;

            const message = {
                sender: username,
                text,
                timestamp: Date.now()
            };

            room.messages.push(message);
            await room.save();

            io.to(roomId).emit("new_message", message);

        } catch (err) {
            console.error(err);
        }
    },

    LeaveRoom: async (io, socket, { roomId }) => {
    try {
        const username = getUsernameFromSocket(socket);
        if (!username) return;

        const room = await Room.findOne({ roomId });
        if (!room) return;

        //Admin Leaving
        if (room.admin === username) {

            io.to(roomId).emit("admin_left");

            const socketsInRoom = await io.in(roomId).fetchSockets();
            for (const s of socketsInRoom) {
                s.leave(roomId);
            }

            await Room.deleteOne({ roomId });
            return;
        }

        //Normal User Leaving
        room.participants = room.participants.filter(u => u !== username);
        const message = {
            sender: "Leave",
            text : `${username} has left the room.`,
            timestamp: Date.now()
        };

        room.messages.push(message);
        await room.save();
        io.to(roomId).emit("new_message", message);
        socket.emit("Leave_Success");

        socket.leave(roomId);

        io.to(roomId).emit("participants_update", {
            users: room.participants,
            admin: room.admin
        });

        

        

    } catch (err) {
        console.error("LeaveRoom error:", err);
    }
}


};


module.exports = roomController;
