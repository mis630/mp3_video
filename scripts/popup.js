// Popup Script for Smart Video & MP3 Downloader

// DOM Elements
const elements = {
  themeToggle: document.getElementById('themeToggle'),
  sunIcon: document.querySelector('.sun-icon'),
  moonIcon: document.querySelector('.moon-icon'),
  videoUrl: document.getElementById('videoUrl'),
  pasteBtn: document.getElementById('pasteBtn'),
  fetchBtn: document.getElementById('fetchBtn'),
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  errorMessage: document.getElementById('errorMessage'),
  retryBtn: document.getElementById('retryBtn'),
  videoCard: document.getElementById('videoCard'),
  videoThumbnail: document.getElementById('videoThumbnail'),
  platformBadge: document.getElementById('platformBadge'),
  platformName: document.getElementById('platformName'),
  videoTitle: document.getElementById('videoTitle'),
  videoMeta: document.getElementById('videoMeta'),
  qualityOptions: document.getElementById('qualityOptions'),
  downloadVideoBtn: document.getElementById('downloadVideoBtn'),
  downloadAudioBtn: document.getElementById('downloadAudioBtn'),
  fileSizeText: document.getElementById('fileSizeText'),
  hdBadge: document.getElementById('hdBadge'),
  recentSection: document.getElementById('recentSection'),
  recentList: document.getElementById('recentList')
};

// State
let currentVideoData = null;
let selectedQuality = '720p';
let selectedAudioQuality = '128kbps';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadRecentDownloads();
  setupEventListeners();
  
  // Auto-focus input
  elements.videoUrl.focus();
});

// Initialize theme from storage
async function initTheme() {
  try {
    const result = await chrome.storage.local.get(['theme']);
    const theme = result.theme || 'light';
    applyTheme(theme);
  } catch (error) {
    console.error('Error loading theme:', error);
  }
}

// Apply theme
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    elements.sunIcon.classList.add('hidden');
    elements.moonIcon.classList.remove('hidden');
  } else {
    document.documentElement.removeAttribute('data-theme');
    elements.sunIcon.classList.remove('hidden');
    elements.moonIcon.classList.add('hidden');
  }
}

// Toggle theme
async function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  applyTheme(newTheme);
  
  try {
    await chrome.storage.local.set({ theme: newTheme });
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Paste button
  elements.pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      elements.videoUrl.value = text;
      elements.videoUrl.dispatchEvent(new Event('input'));
    } catch (error) {
      showError('Unable to access clipboard. Please paste manually.');
    }
  });
  
  // Fetch button
  elements.fetchBtn.addEventListener('click', handleFetch);
  
  // Enter key to fetch
  elements.videoUrl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleFetch();
    }
  });
  
  // URL input validation
  elements.videoUrl.addEventListener('input', () => {
    const url = elements.videoUrl.value.trim();
    if (url.length > 10) {
      validateUrl(url);
    }
  });
  
  // Retry button
  elements.retryBtn.addEventListener('click', () => {
    hideError();
    elements.videoUrl.focus();
  });
  
  // Download buttons
  elements.downloadVideoBtn.addEventListener('click', () => handleDownload('video'));
  elements.downloadAudioBtn.addEventListener('click', () => handleDownload('audio'));
}

// Validate URL
async function validateUrl(url) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'validateUrl',
      url
    });
    
    return response;
  } catch (error) {
    console.error('Error validating URL:', error);
    return { valid: false, platform: 'invalid' };
  }
}

// Handle fetch
async function handleFetch() {
  const url = elements.videoUrl.value.trim();
  
  if (!url) {
    showError('Please paste a video URL first.');
    return;
  }
  
  // Show loading state
  showLoading();
  
  try {
    // Validate URL first
    const validation = await validateUrl(url);
    if (!validation.valid) {
      throw new Error('Invalid URL format. Please check and try again.');
    }
    
    if (validation.platform === 'unknown' || validation.platform === 'invalid') {
      throw new Error('This platform is not supported yet.');
    }
    
    // Fetch metadata
    const response = await chrome.runtime.sendMessage({
      action: 'fetchMetadata',
      url
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch video information.');
    }
    
    // Display video info
    currentVideoData = response.data;
    displayVideoInfo(currentVideoData);
    
  } catch (error) {
    console.error('Fetch error:', error);
    showError(error.message);
  }
}

// Show loading state
function showLoading() {
  hideAll();
  elements.loadingState.classList.remove('hidden');
}

// Show error state
function showError(message) {
  hideAll();
  elements.errorMessage.textContent = message;
  elements.errorState.classList.remove('hidden');
}

// Hide error state
function hideError() {
  elements.errorState.classList.add('hidden');
}

// Hide all states
function hideAll() {
  elements.loadingState.classList.add('hidden');
  elements.errorState.classList.add('hidden');
  elements.videoCard.classList.add('hidden');
}

// Display video information
function displayVideoInfo(data) {
  hideAll();
  
  // Set thumbnail
  elements.videoThumbnail.src = data.thumbnail;
  elements.videoThumbnail.onerror = () => {
    elements.videoThumbnail.src = 'https://via.placeholder.com/640x360?text=No+Thumbnail';
  };
  
  // Set platform badge
  elements.platformName.textContent = capitalizeFirst(data.platform);
  
  // Set video title
  elements.videoTitle.textContent = data.title;
  
  // Set video meta
  elements.videoMeta.textContent = `${data.duration} • ${data.views}`;
  
  // Generate quality options
  generateQualityOptions(data.formats);
  
  // Set initial file size
  updateFileSize(data.formats[0]);
  
  // Show video card
  elements.videoCard.classList.remove('hidden');
  
  // Load recent downloads
  loadRecentDownloads();
}

// Generate quality options
function generateQualityOptions(formats) {
  elements.qualityOptions.innerHTML = '';
  
  formats.forEach((format, index) => {
    const option = document.createElement('div');
    option.className = `quality-option ${index === 0 ? 'selected' : ''}`;
    option.dataset.quality = format.quality;
    option.dataset.size = format.size;
    
    option.innerHTML = `
      <div class="resolution">${format.quality}</div>
      <div class="size">${format.size}</div>
    `;
    
    option.addEventListener('click', () => selectQuality(format));
    
    elements.qualityOptions.appendChild(option);
  });
  
  // Set initial selection
  if (formats.length > 0) {
    selectedQuality = formats[0].quality;
  }
}

// Select quality
function selectQuality(format) {
  // Update UI
  document.querySelectorAll('.quality-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  const selectedOption = document.querySelector(`[data-quality="${format.quality}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
  }
  
  selectedQuality = format.quality;
  updateFileSize(format);
}

// Update file size display
function updateFileSize(format) {
  elements.fileSizeText.textContent = format.size;
  
  // Show HD badge for 720p and above
  const isHD = ['720p', '1080p', '2K', '4K'].includes(format.quality);
  elements.hdBadge.style.display = isHD ? 'block' : 'none';
}

// Handle download
async function handleDownload(type) {
  if (!currentVideoData) {
    showError('No video data available. Please fetch a video first.');
    return;
  }
  
  const format = type === 'video' ? selectedQuality : selectedAudioQuality;
  const formats = type === 'video' ? currentVideoData.formats : currentVideoData.audioFormats;
  const formatData = formats.find(f => 
    type === 'video' ? f.quality === selectedQuality : f.quality === selectedAudioQuality
  ) || formats[0];
  
  try {
    // Show loading briefly
    elements.downloadVideoBtn.disabled = true;
    elements.downloadAudioBtn.disabled = true;
    
    const response = await chrome.runtime.sendMessage({
      action: 'download',
      data: currentVideoData,
      type,
      format: formatData.format
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Download failed. Please try again.');
    }
    
    // Show success feedback
    showDownloadSuccess(type);
    
  } catch (error) {
    console.error('Download error:', error);
    showError(error.message);
  } finally {
    elements.downloadVideoBtn.disabled = false;
    elements.downloadAudioBtn.disabled = false;
  }
}

// Show download success feedback
function showDownloadSuccess(type) {
  const btn = type === 'video' ? elements.downloadVideoBtn : elements.downloadAudioBtn;
  const originalContent = btn.innerHTML;
  
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    <span>Downloading...</span>
  `;
  
  setTimeout(() => {
    btn.innerHTML = originalContent;
  }, 2000);
}

// Load recent downloads
async function loadRecentDownloads() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getRecentDownloads'
    });
    
    const recent = response || [];
    
    if (recent.length === 0) {
      elements.recentSection.classList.add('hidden');
      return;
    }
    
    elements.recentList.innerHTML = '';
    
    recent.forEach(item => {
      const recentItem = document.createElement('div');
      recentItem.className = 'recent-item';
      recentItem.innerHTML = `
        <img src="${item.thumbnail}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/48x36'">
        <div class="recent-item-info">
          <div class="recent-item-title">${item.title}</div>
          <div class="recent-item-meta">${capitalizeFirst(item.platform)} • ${item.type.toUpperCase()}</div>
        </div>
      `;
      
      elements.recentList.appendChild(recentItem);
    });
    
    elements.recentSection.classList.remove('hidden');
    
  } catch (error) {
    console.error('Error loading recent downloads:', error);
  }
}

// Utility: Capitalize first letter
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
