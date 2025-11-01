import React, { useEffect, useRef, useState, useCallback } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();
    const videoRef = useRef([])

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);
    const [screen, setScreen] = useState(false);
    const [showModal, setModal] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([])

    const silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    const black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    useEffect(() => {
        getPermissions();
        // Cleanup function
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
        }
        // eslint-disable-next-line
    }, [])

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
                videoPermission.getTracks().forEach(track => track.stop());
            }
        } catch (error) {
            setVideoAvailable(false);
            console.log('Video permission denied');
        }

        try {
            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
                audioPermission.getTracks().forEach(track => track.stop());
            }
        } catch (error) {
            setAudioAvailable(false);
            console.log('Audio permission denied');
        }

        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        } else {
            setScreenAvailable(false);
        }
    };

    const getUserMediaSuccess = useCallback((stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop())
            }
        } catch (e) { 
            console.log(e) 
        }

        window.localStream = stream
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => {
            track.onended = () => {
                setVideo(false);
                setAudio(false);

                try {
                    let tracks = localVideoref.current.srcObject.getTracks()
                    tracks.forEach(track => track.stop())
                } catch (e) { 
                    console.log(e) 
                }

                let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                window.localStream = blackSilence()
                localVideoref.current.srcObject = window.localStream

                for (let id in connections) {
                    connections[id].addStream(window.localStream)

                    connections[id].createOffer().then((description) => {
                        connections[id].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                            })
                            .catch(e => console.log(e))
                    })
                }
            }
        })
    }, []);

    const getUserMedia = useCallback(() => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e))
        } else {
            try {
                if (localVideoref.current && localVideoref.current.srcObject) {
                    let tracks = localVideoref.current.srcObject.getTracks()
                    tracks.forEach(track => track.stop())
                }
            } catch (e) {
                console.log(e)
            }
        }
    }, [video, audio, videoAvailable, audioAvailable, getUserMediaSuccess]);

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio, getUserMedia])

    const getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    const getDislayMediaSuccess = useCallback((stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { 
            console.log(e) 
        }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => {
            track.onended = () => {
                setScreen(false)

                try {
                    let tracks = localVideoref.current.srcObject.getTracks()
                    tracks.forEach(track => track.stop())
                } catch (e) { 
                    console.log(e) 
                }

                let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                window.localStream = blackSilence()
                localVideoref.current.srcObject = window.localStream

                getUserMedia()
            }
        })
    }, [getUserMedia]);

    const getDislayMedia = useCallback(() => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => console.log(e))
            }
        }
    }, [screen, getDislayMediaSuccess]);

    useEffect(() => {
        if (screen !== undefined && screen !== false) {
            getDislayMedia();
        }
    }, [screen, getDislayMedia])

    const gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { 
                            console.log(e)
                        }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    const handleVideo = () => {
        setVideo(!video);
    }

    const handleAudio = () => {
        setAudio(!audio)
    }

    const handleScreen = () => {
        setScreen(!screen);
    }

    const handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { 
            console.log(e)
        }
        window.location.href = "/"
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    const sendMessage = () => {
        if (message.trim() !== "") {
            socketRef.current.emit('chat-message', message, username)
            setMessage("");
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    }

    const connect = () => {
        if (username.trim() === "") {
            alert("Please enter a username");
            return;
        }
        setAskForUsername(false);
        getMedia();
    }

    return (
        <div>
            {askForUsername === true ? (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    minHeight: '100vh',
                    gap: '20px',
                    padding: '20px'
                }}>
                    <h2>Enter into Lobby</h2>
                    <TextField 
                        id="outlined-basic" 
                        label="Username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && connect()}
                        variant="outlined" 
                    />
                    <Button variant="contained" onClick={connect}>Connect</Button>

                    <div style={{ marginTop: '20px' }}>
                        <video 
                            ref={localVideoref} 
                            autoPlay 
                            muted
                            style={{
                                width: '400px',
                                height: 'auto',
                                borderRadius: '10px',
                                background: '#000'
                            }}
                        ></video>
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {showModal ? (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>

                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? messages.map((item, index) => (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )) : <p>No Messages Yet</p>}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField 
                                        value={message} 
                                        onChange={(e) => setMessage(e.target.value)} 
                                        onKeyPress={handleKeyPress}
                                        id="outlined-basic" 
                                        label="Enter Your chat" 
                                        variant="outlined" 
                                        fullWidth
                                    />
                                    <Button variant='contained' onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ? (
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton>
                        ) : null}

                        <Badge badgeContent={newMessages} max={999} color='secondary'>
                            <IconButton onClick={() => {
                                setModal(!showModal);
                                if (!showModal) {
                                    setNewMessages(0);
                                }
                            }} style={{ color: "white" }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                >
                                </video>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}