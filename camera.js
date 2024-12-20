const cameraStream = document.getElementById("camera-stream");
const captureButton = document.getElementById("capture-button");
const switchCameraButton = document.getElementById("switch-camera");
const qrScanButton = document.getElementById("qr-scan");
let videoStream = null;
let useFrontCamera = false; // Default to rear camera
let scanning = false;

// Start the camera
async function startCamera() {
  if (videoStream) {
    // Stop any existing video streams before starting a new one
    videoStream.getTracks().forEach((track) => track.stop());
  }

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: useFrontCamera ? "user" : "environment" },
    });
    cameraStream.srcObject = videoStream;
  } catch (error) {
    alert("Unable to access camera: " + error.message);
  }
}

// Capture photo and download
captureButton.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  const video = cameraStream;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert the canvas image to a data URL
  const imageUrl = canvas.toDataURL("image/png");

  // Create a link to download the image
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = "captured-image.png";
  link.click();
});

// Switch camera between front and back
switchCameraButton.addEventListener("click", () => {
  useFrontCamera = !useFrontCamera; // Toggle camera
  startCamera();
});

// Automatic QR Scanning functionality
async function startQrScanning() {
  if (scanning) {
    return; // Prevent multiple scans
  }

  scanning = true;
  const codeReader = new ZXing.BrowserQRCodeReader();

  // Continuously scan the camera feed
  codeReader.decodeFromVideoDevice(
    undefined, // Automatically selects the active camera
    "camera-stream",
    (result, error) => {
      if (result) {
        // If the result is a valid URL, redirect to it
        if (isValidUrl(result.text)) {
          window.location.href = result.text; // Redirect to the scanned URL
        }

        // If you want to stop scanning after detecting a URL, you can call codeReader.reset();
        scanning = false;
        codeReader.reset(); // Stop scanning if a URL is found
      }

      if (error && !(error instanceof ZXing.NotFoundException)) {
        console.error("QR Scan Error:", error);
      }
    }
  );
}

// Helper function to validate if a string is a valid URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;  
  }
}

// Initialize camera on page load and start QR scanning
startCamera();
startQrScanning();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}

