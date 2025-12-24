const roomController = require("../controller/roomcontroller");

module.exports = (io, socket, onlineUsers) => {

    socket.on("create_room", () => {
        roomController.createRoom(io, socket);
    });

    socket.on("join_room", (data) => {
        roomController.joinRoom(io, socket, data, onlineUsers);
    });

    socket.on("admin_decision", (data) => {
        roomController.handleAdminAction(io, socket, data, onlineUsers);
    });

    socket.on("send_message", (data) => {
        roomController.sendMessage(io, socket, data);
    });

    socket.on("Leave_Room", (data) => {
        roomController.LeaveRoom(io, socket, data);
    });
};
