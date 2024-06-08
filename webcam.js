const cameraFeed = document.getElementById("camerafeed");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const stopButton = document.getElementById("stopButton");
const recordingStatus = document.getElementById("recordingStatus");
const recordingTime = document.getElementById("recordingTime");
let cameraStream;
let webcamMediaRecorder;
let webcamChunks = [];
let timerInterval;
let recordingStartedAt;

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

function startRecording() {
    if (cameraFeed && cameraFeed.srcObject) {
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
            recordingStatus.style.display = "block";
            clearInterval(timerInterval);
        };
        webcamMediaRecorder.start();
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

export { startRecording, stopWebCam };
