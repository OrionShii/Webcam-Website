const cameraFeed = document.getElementById("camerafeed");
const screenFeed = document.getElementById("screenfeed");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const stopButton = document.getElementById("stopButton");
const startRecordingButton = document.getElementById("startRecordingButton");
const stopRecordingButton = document.getElementById("stopRecordingButton");
const recordingStatus = document.getElementById("recordingStatus");
const recordingTime = document.getElementById("recordingTime");
const downloadMP4Button = document.getElementById("downloadMP4Button");
const downloadMKVButton = document.getElementById("downloadMKVButton");
const shareScreenButton = document.getElementById("shareScreenButton");
const stopSharingButton = document.getElementById("stopSharingButton");
let cameraStream;
let screenStream;
let webcamMediaRecorder;
let screenSharingMediaRecorder;
let webcamChunks = [];
let screenSharingChunks = [];
let timerInterval;
let recordingStartedAt;
let isScreenSharingActive = false;

shareScreenButton.addEventListener("click", shareScreen);

async function shareScreen() {
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

        if (cameraFeed.srcObject) {
            const cameraStream = cameraFeed.srcObject;
            cameraStream.getVideoTracks().forEach(track => {
                screenStream.addTrack(track);
            });
        }

        screenFeed.srcObject = screenStream;
        isScreenSharingActive = true;

        // Start audio recording
        shareAudio(screenStream);

        if (screenSharingMediaRecorder) {
            screenSharingMediaRecorder = null;
        }

        // Display "Recording started" message
        recordingStatus.textContent = "Recording started";
        recordingStatus.style.display = "block";
    } catch (error) {
        console.error("Error sharing the screen:", error);
    }
}

stopSharingButton.addEventListener("click", () => {
    stopSharingScreen();
});

async function stopSharingScreen() {
    try {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            isScreenSharingActive = false;
        }

        // Display "Recording stopped" message
        recordingStatus.textContent = "Recording stopped";
        recordingStatus.style.display = "block";
    } catch (error) {
        console.error("Error stopping sharing screen:", error);
    }
}

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
            audio: true,
        });
        cameraFeed.srcObject = stream;
        cameraStream = stream;
    } catch (error) {
        console.error("Error Accessing Camera:", error);
    }
}

setupCamera();

playButton.addEventListener("click", () => {
    if (cameraFeed && cameraFeed.srcObject) {
        cameraFeed.play().catch((error) => console.error("Error playing the video:", error));
    }
});

pauseButton.addEventListener("click", () => {
    if (cameraFeed && cameraFeed.srcObject) {
        cameraFeed.pause();
    }
});

stopButton.addEventListener("click", () => {
    stopWebCam();
});

function stopWebCam() {
    if (cameraFeed) {
        if (cameraFeed.srcObject) {
            cameraFeed.srcObject.getTracks().forEach((track) => track.stop());
            cameraFeed.srcObject = null;
        }
    }
}

startRecordingButton.addEventListener("click", () => {
    startRecording();
});

stopRecordingButton.addEventListener("click", () => {
    stopRecording();
});

function startRecording() {
    if (cameraFeed && cameraFeed.srcObject) {
        if (isScreenSharingActive) {
            screenSharingMediaRecorder = new MediaRecorder(screenStream, {
                mimeType: "video/webm;codecs=h264,opus",
            });
            screenSharingChunks = [];
            screenSharingMediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    screenSharingChunks.push(event.data);
                }
            };
            screenSharingMediaRecorder.onstart = () => {
                recordingStatus.textContent = "Recording started";
                recordingStatus.style.display = "block";
                recordingStartedAt = new Date();
                timerInterval = setInterval(updateRecordingTime, 1000);
            };
            screenSharingMediaRecorder.onstop = () => {
                recordingStatus.textContent = "Recording stopped";
                clearInterval(timerInterval);
                downloadMP4Button.style.display = "block";
                downloadMKVButton.style.display = "block";
            };
            screenSharingMediaRecorder.start();
        } else {
            webcamMediaRecorder = new MediaRecorder(cameraFeed.srcObject, {
                mimeType: "video/webm;codecs=h264,opus",
            });
            webcamChunks = [];
            webcamMediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    webcamChunks.push(event.data);
                }
            };
            webcamMediaRecorder.onstart = () => {
                recordingStatus.textContent = "Recording started";
                recordingStatus.style.display = "block";
                recordingStartedAt = new Date();
                timerInterval = setInterval(updateRecordingTime, 1000);
            };
            webcamMediaRecorder.onstop = () => {
                recordingStatus.textContent = "Recording stopped";
                clearInterval(timerInterval);
                downloadMP4Button.style.display = "block";
                downloadMKVButton.style.display = "block";
            };
            webcamMediaRecorder.start();
        }
    }
}

function stopRecording() {
    if (webcamMediaRecorder && webcamMediaRecorder.state === "recording") {
        webcamMediaRecorder.stop();
    }
    if (screenSharingMediaRecorder && screenSharingMediaRecorder.state === "recording") {
        screenSharingMediaRecorder.stop();
    }
}

function updateRecordingTime() {
    const currentTime = new Date();
    const elapsedTime = new Date(currentTime - recordingStartedAt);
    recordingTime.textContent = formatTime(elapsedTime);
}

function formatTime(time) {
    const minutes = time.getUTCMinutes().toString().padStart(2, "0");
    const seconds = time.getUTCSeconds().toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
}

downloadMP4Button.addEventListener("click", () => {
    let blobsToDownload = [];
    if (webcamChunks.length > 0) {
        blobsToDownload.push(new Blob(webcamChunks, { type: "video/mp4" }));
    }
    if (screenSharingChunks.length > 0) {
        blobsToDownload.push(new Blob(screenSharingChunks, { type: "video/mp4" }));
    }
    if (blobsToDownload.length > 0) {
        const blob = new Blob(blobsToDownload, { type: "video/mp4" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "webcam-video.mp4";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    }
});

downloadMKVButton.addEventListener("click", () => {
    let blobsToDownload = [];
    if (webcamChunks.length > 0) {
        blobsToDownload.push(new Blob(webcamChunks, { type: "video/x-matroska" }));
    }
    if (screenSharingChunks.length > 0) {
        blobsToDownload.push(new Blob(screenSharingChunks, { type: "video/x-matroska" }));
    }
    if (blobsToDownload.length > 0) {
        const blob = new Blob(blobsToDownload, { type: "video/x-matroska" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "webcam-video.mkv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    }
});
