import { Server } from "socket.io";
import http from "http";
import express from "express";


const app = express();
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"]
    }
})

export function getReceiverSocketId(userId) {                //used to get socketId of receiver
    return userSocketMap[userId];
}

// used to add/store online users
const userSocketMap = {};                                   //format - {userId: socketId} as key value pair & userId coming from db and socketId coming from socket.io

io.on("connection", (socket) => {                           // whenever a user connects
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;              //userId is coming from frontend
    if(userId) userSocketMap[userId] = socket.id;              //storing userId and socketId in map
    
    //io.emits() is used to send events to all connected users
    io.emit("getOnlineUsers", Object.keys(userSocketMap))       //send online users to all users
    
    socket.on("disconnect", () => {                             // whenever a user disconnects
        console.log("A user disconnected", socket.id);
        delete userSocketMap[userId];                             //deleting user from map
        io.emit("getOnlineUsers", Object.keys(userSocketMap))  
    })
})

export { io, app, server }