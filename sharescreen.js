const cameraFeed = document.getElementById("camerafeed");
const screenFeed = document.getElementById("screenfeed");
const shareScreenButton = document.getElementById("shareScreenButton");
const stopSharingButton = document.getElementById("stopSharingButton");
let screenStream;
let screenSharingMediaRecorder;
let screenSharingChunks = [];
let isScreenSharingActive = false;

shareScreenButton.addEventListener("click", shareScreen);

async function shareScreen() {
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

        if (cameraFeed.srcObject) {
            const cameraStream = cameraFeed.srcObject;
            cameraStream.getVideoTracks().forEach((track) => {
                screenStream.addTrack(track);
            });
        }

        // Share audio from both the screen and the webcam
        const audioTracks = shareAudio(screenStream, cameraFeed.srcObject);
        if (audioTracks.length > 0) {
            screenStream.addTrack(audioTracks[0]);
        }

        screenFeed.srcObject = screenStream;
        isScreenSharingActive = true;

        // ... rest of the code
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
    } catch (error) {
        console.error("Error stopping sharing screen:", error);
    }
}

function shareAudio(screenStream, webcamStream) {
    if (screenStream && webcamStream) {
        const audioContext = new AudioContext();

        // Create audio sources for the screen and webcam streams
        const screenAudioSource = audioContext.createMediaStreamSource(screenStream);
        const webcamAudioSource = audioContext.createMediaStreamSource(webcamStream);

        // Create a destination stream that combines both audio sources
        const audioDestination = audioContext.createMediaStreamDestination();
        screenAudioSource.connect(audioDestination);
        webcamAudioSource.connect(audioDestination);

        // Get the audio track from the combined stream
        const combinedAudioTrack = audioDestination.stream.getAudioTracks();

        return combinedAudioTrack;
    }

    return [];
}



export { shareScreen, stopSharingScreen };