import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";


export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id; 
        const filterdUsers = await User.find({ _id: { $ne: loggedInUserId}}).select("-password")    //Exclude logged in user from the list

        res.status(200).json(filterdUsers);


    } catch (error) {
        console.log("Error in getUsersForSidebar", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;       // given a temp name userToChatId
        const myId = req.user._id;                    // logged in user id (our id)

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: userToChatId},        //find all the messages where senderId is me and receiverId is the userToChatId
                {senderId: userToChatId, receiverId: myId}        //find all the messages where senderId is userToChatId and receiverId is me
            ]
        })

        res.status(200).json(messages); 

    } catch (error) {
        console.log("Error in getMessages controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
        
    }
}


export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;  // given a temp name receiverId is the id of the user to whom we are sending the message
        const senderId = req.user._id;          // my id

        let imageUrl;
        if(image) {
            //upload base64 image to cloudinary
            const uploadedResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadedResponse.secure_url;
        }

        //create a new message
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })

        //save the message to the database
        await newMessage.save()


        //realtime functionality here using socket.io
        const receiverSocketId = getReceiverSocketId(receiverId)
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)            //send the message to the receiver
        }

        res.status(200).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}