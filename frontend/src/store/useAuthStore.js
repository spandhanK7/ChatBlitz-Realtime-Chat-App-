import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

//creating a state for Authenticated user using zustand

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001": "/"

export const useAuthStore = create((set, get) => ({
    authUser: null,

    isSigningUp: false,                     //state for checking if user is signing up
    isLoggingIng: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,                    //state for checking if user is authenticated or not
    onlineUsers: [],                         //state for online users
    socket: null,                            //state for socket

    checkAuth: async () => {                  //already have check endpoint in backend as checkAuth with protectRoute to check if user is authenticated or not
        try {
            const res = await axiosInstance.get("/auth/check")

            set({ authUser: res.data })            //if user is authenticated then set the user to authUser
            get().connectSocket()                  //connect socket

        } catch (error) {
            console.log("Error in checkAuth", error)
            set({ authUser: null })                 //if user is not authenticated then set the user to null

        } finally {
            set({ isCheckingAuth: false })
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true })                     //set isSigningUp to true
        try {
            const res = await axiosInstance.post("/auth/signup", data)   //call the signup endpoint with data
            set({ authUser: res.data })               //set the user to authUser
            toast.success("Account created successfully")

            get().connectSocket()                       //connect socket
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isSigningUp: false })                  //set isSigningUp to false
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true })
        try {
            const res = await axiosInstance.post("/auth/login", data)         //call the login endpoint with data
            set({ authUser: res.data })
            toast.success("Logged in successfully")

            get().connectSocket()               //connect socket
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isLoggingIn: false })
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout")           //call the logout endpoint
            set({ authUser: null })
            toast.success("Logged out successfully")
            get().disconnectSocket()                          //disconnect socket
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true })
        try {
            const res = await axiosInstance.put("/auth/update-profile", data)   //call the update-profile endpoint with data
            set({ authUser: res.data })
            toast.success("Profile updated successfully")
        } catch (error) {
            console.log("Error in update Profile", error)
            toast.error(error.response.data.message)
        } finally {
            set({ isUpdatingProfile: false })
        }
    },



    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;            //if user is not authenticated or socket is already connected then return

        const socket = io(BASE_URL, {
            query: {                                               //passing userId to socket server
                userId: authUser._id
            }
        })
        socket.connect()                                           //connect to socket server
        set({ socket: socket });

        socket.on("getOnlineUsers", (userIds) => {                 //listening to getOnlineUsers event
            set({ onlineUsers: userIds })
        })
    },
    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();        //if socket is connected only then try to disconnect
    },

}))

