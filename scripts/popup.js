// Popup Script for Smart Video & MP3 Downloader
// 100% Client-Side Processing with FFmpeg.wasm

let ffmpeg = null;
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
  
  showStatus("Analyzing media link...");
  
  // For direct .mp4 links, we use the URL directly
  if (url.match(/\.mp4(\?.*)?$/i)) {
    directMediaUrl = url;
    showStatus("Direct video link detected! Ready to process.");
    videoTitle.textContent = "Video Ready";
    downloadSection.classList.remove('hidden');
    return;
  }
  
  try {
    // Try to find direct media stream file (.mp4) from HTML page
    const response = await fetch(url, { 
      method: 'GET',
      mode: 'cors'
    });
    const html = await response.text();
    
    // Search for video source links in the page
    const match = html.match(/src="([^\"]+\.mp4[^\"]*)"/i) || 
                  html.match(/<source[^>]+src="([^\"]+\.mp4[^\"]*)"/i);
    
    if (match && match[1]) {
      directMediaUrl = match[1];
      showStatus("Video stream found successfully!");
      videoTitle.textContent = "Video Detected";
      downloadSection.classList.remove('hidden');
    } else {
      // Fallback: use the URL directly for testing
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
      showStatus("Download started! Check your Downloads folder.");
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
    // Initialize FFmpeg.wasm
    if (!ffmpeg) {
      const { createFFmpeg, fetchFile } = FFmpeg;
      ffmpeg = createFFmpeg({ log: true });
    }
    
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    
    showStatus("Downloading video to browser memory...");
    
    // Download file into browser virtual filesystem
    const fileData = await fetchFile(directMediaUrl);
    ffmpeg.FS('writeFile', 'input.mp4', fileData);
    
    showStatus("Converting to MP3 audio... (Please wait)");
    
    // Run FFmpeg conversion inside browser
    await ffmpeg.run('-i', 'input.mp4', '-q:a', '0', '-map', 'a', 'output.mp3');
    
    showStatus("Conversion finished! Saving file...");
    
    // Read the resulting MP3 file from memory
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
        showStatus("Download complete! Check your Downloads folder.");
      }
    });
    
    // Cleanup memory
    try {
      ffmpeg.FS('unlink', 'input.mp4');
      ffmpeg.FS('unlink', 'output.mp3');
    } catch (e) {
      console.warn('Cleanup warning:', e);
    }
    
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
