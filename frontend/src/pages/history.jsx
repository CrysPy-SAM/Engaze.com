import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField, Snackbar } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [error, setError] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const { addToUserHistory } = useContext(AuthContext);

    const handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) {
            setError("Please enter a meeting code");
            setOpenSnackbar(true);
            return;
        }

        try {
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode}`);
        } catch (error) {
            console.error("Error joining meeting:", error);
            setError("Failed to join meeting. Please try again.");
            setOpenSnackbar(true);
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleJoinVideoCall();
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/auth");
    }

    return (
        <>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>ENGAZE.com</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <IconButton onClick={() => navigate("/history")}>
                        <RestoreIcon />
                    </IconButton>
                    <p style={{ margin: 0 }}>History</p>

                    <Button onClick={handleLogout} variant="outlined">
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Providing Quality Video Call Just Like Quality Education</h2>

                        <div style={{ display: 'flex', gap: "10px", marginTop: '20px' }}>
                            <TextField 
                                onChange={e => setMeetingCode(e.target.value)} 
                                onKeyPress={handleKeyPress}
                                value={meetingCode}
                                id="outlined-basic" 
                                label="Meeting Code" 
                                variant="outlined" 
                            />
                            <Button 
                                onClick={handleJoinVideoCall} 
                                variant='contained'
                                disabled={!meetingCode.trim()}
                            >
                                Join
                            </Button>
                        </div>
                    </div>
                </div>
                <div className='rightPanel'>
                    <img src='/logo3.png' alt="ENGAZE Logo" />
                </div>
            </div>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={() => setOpenSnackbar(false)}
                message={error}
            />
        </>
    )
}

export default withAuth(HomeComponent)