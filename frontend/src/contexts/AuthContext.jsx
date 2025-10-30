import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

// 👇 FIX: directly define correct backend URL here OR ensure ../environment exports it properly
const server = "http://localhost:8000";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
    const authContext = useContext(AuthContext);
    const [userData, setUserData] = useState(authContext);
    const router = useNavigate();

    // ✅ REGISTER
    const handleRegister = async (name, username, password) => {
        try {
            if (!name || !username || !password) {
                throw new Error("All fields are required");
            }

            const response = await client.post("/register", {
                name,
                username,
                password,
            });

            if (response.status === httpStatus.CREATED) {
                return response.data.message || "Registration successful!";
            } else {
                throw new Error(response.data?.message || "Registration failed");
            }
        } catch (err) {
            console.error("Registration error:", err);
            const msg =
                err.response?.data?.message ||
                err.message ||
                "Server connection error. Please try again.";
            throw new Error(msg);
        }
    };

    // ✅ LOGIN
    const handleLogin = async (username, password) => {
        try {
            if (!username || !password) {
                throw new Error("Username and password are required");
            }

            const response = await client.post("/login", {
                username,
                password,
            });

            if (response.status === httpStatus.OK) {
                localStorage.setItem("token", response.data.token);
                setUserData(response.data);
                router("/home");
            } else {
                throw new Error(response.data?.message || "Invalid credentials");
            }
        } catch (err) {
            console.error("Login error:", err);
            const msg =
                err.response?.data?.message ||
                err.message ||
                "Unable to reach the server. Please check backend.";
            throw new Error(msg);
        }
    };

    // ✅ USER HISTORY FETCH
    const getHistoryOfUser = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No authentication token found");

            const response = await client.get("/get_all_activity", {
                params: { token },
            });
            return response.data;
        } catch (err) {
            console.error("Get history error:", err);
            throw new Error("Failed to fetch history");
        }
    };

    // ✅ ADD TO HISTORY
    const addToUserHistory = async (meetingCode) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.warn("No token found, skipping history save");
                return;
            }

            const response = await client.post("/add_to_activity", {
                token,
                meeting_code: meetingCode,
            });
            return response.data;
        } catch (e) {
            console.error("Add to history error:", e);
            throw new Error("Unable to save meeting history");
        }
    };

    const data = {
        userData,
        setUserData,
        addToUserHistory,
        getHistoryOfUser,
        handleRegister,
        handleLogin,
    };

    return (
        <AuthContext.Provider value={data}>{children}</AuthContext.Provider>
    );
};
