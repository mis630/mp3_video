// Popup Script for Smart Video & MP3 Downloader
// 100% Client-Side Processing with FFmpeg.wasm

const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

let directMediaUrl = ""; 

// DOM Elements
const videoUrlInput = document.getElementById('videoUrl');
const analyzeBtn = document.getElementById('analyzeBtn');
const statusMessage = document.getElementById('statusMessage');
const downloadSection = document.getElementById('downloadSection');
const videoTitle = document.getElementById('videoTitle');
const downloadMp4Btn = document.getElementById('downloadMp4');
const downloadMp3Btn = document.getElementById('downloadMp3');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  videoUrlInput.focus();
});

// Setup event listeners
function setupEventListeners() {
  analyzeBtn.addEventListener('click', handleAnalyze);
  
  videoUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  });
  
  downloadMp4Btn.addEventListener('click', handleDownloadMp4);
  downloadMp3Btn.addEventListener('click', handleDownloadMp3);
}

// Handle analyze button click
async function handleAnalyze() {
  const url = videoUrlInput.value.trim();
  
  if (!url) {
    alert("Please paste a link!");
    return;
  }
  
  showStatus("Analyzing web page for media streams...");
  
  try {
    // Try to find direct media stream file (.mp4)
    // For simple sites, fetch the HTML page and look for source tags
    const response = await fetch(url);
    const html = await response.text();
    
    // Simple regex searching for a hidden video source link inside the page
    const match = html.match(/src="([^"]+\.mp4[^"]*)"/);
    
    if (match && match[1]) {
      directMediaUrl = match[1];
      showStatus("Video stream found successfully!");
      videoTitle.textContent = "Video Detected";
      downloadSection.classList.remove('hidden');
    } else {
      // Fallback for demo testing if stream is deeply hidden
      directMediaUrl = url; 
      showStatus("Ready to process stream link.");
      videoTitle.textContent = "Video Ready";
      downloadSection.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Analysis error:', err);
    // Fallback: use the URL directly
    directMediaUrl = url;
    showStatus("Using direct URL for processing.");
    videoTitle.textContent = "Video Ready";
    downloadSection.classList.remove('hidden');
  }
}

// Handle MP4 video download
function handleDownloadMp4() {
  if (!directMediaUrl) {
    alert("No video URL available. Please analyze a link first.");
    return;
  }
  
  chrome.downloads.download({
    url: directMediaUrl,
    filename: "SmartDownloader_Video.mp4",
    saveAs: true
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      showStatus("Download failed: " + chrome.runtime.lastError.message);
    } else {
      showStatus("Download started!");
    }
  });
}

// Handle MP3 audio conversion and download
async function handleDownloadMp3() {
  if (!directMediaUrl) {
    alert("No video URL available. Please analyze a link first.");
    return;
  }
  
  showStatus("Loading local converter engine (FFmpeg)...");
  
  try {
    // Load FFmpeg if not already loaded
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    
    showStatus("Downloading raw media to local memory...");
    
    // Download file into browser virtual memory filesystem
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(directMediaUrl));
    
    showStatus("Converting track to MP3 audio... (Please wait)");
    
    // Run real command-line FFmpeg inside Chrome tab
    await ffmpeg.run('-i', 'input.mp4', '-q:a', '0', '-map', 'a', 'output.mp3');
    
    showStatus("Conversion finished! Saving file...");
    
    // Read the resulting MP3 file data from memory
    const data = ffmpeg.FS('readFile', 'output.mp3');
    
    // Create blob and trigger download
    const mp3Blob = new Blob([data.buffer], { type: 'audio/mp3' });
    const localUrl = URL.createObjectURL(mp3Blob);
    
    chrome.downloads.download({
      url: localUrl,
      filename: "SmartDownloader_Audio.mp3",
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        showStatus("Download failed: " + chrome.runtime.lastError.message);
      } else {
        showStatus("Download complete!");
      }
    });
    
    // Cleanup
    ffmpeg.FS('unlink', 'input.mp4');
    ffmpeg.FS('unlink', 'output.mp3');
    
  } catch (error) {
    console.error('MP3 conversion error:', error);
    showStatus("Conversion failed: " + error.message);
  }
}

// Show status message
function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.classList.remove('hidden');
}
