import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";


export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    //functions
    getUsers: async () => { 
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data })
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false })
        }
    },

    getMessages: async (userId) => {            //passing userId so that we find out which user chat to get 
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`)  
            set({ messages: res.data })
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isMessagesLoading: false })
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] })
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    subscribeToMessages: () => {                                 //listens to new messages
        const { selectedUser } = get();   
        if(!selectedUser) return;
        
        const socket = useAuthStore.getState().socket;            //getting socket from auth store
        
        socket.on("newMessage", (newMessage) => {
            const isMessageSendFromSelectedUser = newMessage.senderId === selectedUser._id;
            if(!isMessageSendFromSelectedUser) return;       //if the message is not from the selected user then return 
            set({
                messages: [...get().messages, newMessage],  
            })
        })
    },

    unsubscribeFromMessages: () => {                               //unlistens to new messages
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");               
    },
 
    setSelectedUser: (selectedUser) => set({ selectedUser }),
}))