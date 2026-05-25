// Background Service Worker for Smart Video & MP3 Downloader

// Platform detection patterns
const PLATFORM_PATTERNS = {
  youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
  instagram: /^(https?:\/\/)?(www\.)?(instagram\.com)\/.+$/,
  tiktok: /^(https?:\/\/)?(www\.)?(tiktok\.com)\/.+$/,
  facebook: /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.+$/,
  twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+$/,
  vimeo: /^(https?:\/\/)?(www\.)?(vimeo\.com)\/.+$/,
  dailymotion: /^(https?:\/\/)?(www\.)?(dailymotion\.com)\/.+$/
};

// Detect platform from URL
function detectPlatform(url) {
  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url)) {
      return platform;
    }
  }
  return 'unknown';
}

// Extract video ID from URL based on platform
function extractVideoId(url, platform) {
  try {
    const urlObj = new URL(url);
    
    switch (platform) {
      case 'youtube':
        if (urlObj.hostname.includes('youtu.be')) {
          return urlObj.pathname.slice(1);
        }
        return urlObj.searchParams.get('v');
      
      case 'instagram':
        const igMatch = url.match(/\/reel\/([^/?]+)/) || url.match(/\/p\/([^/?]+)/);
        return igMatch ? igMatch[1] : null;
      
      case 'tiktok':
        const ttMatch = url.match(/\/video\/(\d+)/);
        return ttMatch ? ttMatch[1] : null;
      
      case 'facebook':
        const fbMatch = url.match(/\/videos\/\/(\d+)/) || url.match(/\/(\d+)\/?/);
        return fbMatch ? fbMatch[1] : null;
      
      case 'twitter':
        const twMatch = url.match(/\/status\/(\d+)/);
        return twMatch ? twMatch[1] : null;
      
      case 'vimeo':
        return urlObj.pathname.slice(1);
      
      case 'dailymotion':
        const dmMatch = url.match(/\/video\/([^/?]+)/);
        return dmMatch ? dmMatch[1] : null;
      
      default:
        return null;
    }
  } catch (e) {
    return null;
  }
}

// Validate URL format
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Fetch video metadata (simulated for demo - would use actual API in production)
async function fetchVideoMetadata(url, platform) {
  const videoId = extractVideoId(url, platform);
  
  if (!videoId) {
    throw new Error('Could not extract video ID');
  }
  
  // Simulated metadata - in production, this would call a real API
  const mockMetadata = {
    youtube: {
      title: 'Amazing Video Title',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: '3:45',
      views: '1.2M views',
      formats: [
        { quality: '1080p', size: '45 MB', format: 'mp4' },
        { quality: '720p', size: '28 MB', format: 'mp4' },
        { quality: '480p', size: '15 MB', format: 'mp4' },
        { quality: '360p', size: '8 MB', format: 'mp4' }
      ],
      audioFormats: [
        { quality: '320kbps', size: '8 MB', format: 'mp3' },
        { quality: '256kbps', size: '6 MB', format: 'mp3' },
        { quality: '128kbps', size: '3 MB', format: 'mp3' }
      ]
    },
    instagram: {
      title: 'Instagram Reel',
      thumbnail: `https://instagram.fcdn.net/v/t51.2885-15/${videoId}.jpg`,
      duration: '0:30',
      views: '500K views',
      formats: [
        { quality: '720p', size: '12 MB', format: 'mp4' },
        { quality: '480p', size: '6 MB', format: 'mp4' }
      ],
      audioFormats: [
        { quality: '128kbps', size: '1 MB', format: 'mp3' }
      ]
    },
    tiktok: {
      title: 'TikTok Video',
      thumbnail: `https://p16-sign.tiktokcdn.com/obj/${videoId}`,
      duration: '0:15',
      views: '2.5M views',
      formats: [
        { quality: '720p', size: '8 MB', format: 'mp4' },
        { quality: '480p', size: '4 MB', format: 'mp4' }
      ],
      audioFormats: [
        { quality: '128kbps', size: '0.5 MB', format: 'mp3' }
      ]
    },
    default: {
      title: 'Video Content',
      thumbnail: 'https://via.placeholder.com/640x360?text=Video+Thumbnail',
      duration: 'Unknown',
      views: 'Unknown',
      formats: [
        { quality: '720p', size: '20 MB', format: 'mp4' },
        { quality: '480p', size: '10 MB', format: 'mp4' }
      ],
      audioFormats: [
        { quality: '128kbps', size: '3 MB', format: 'mp3' }
      ]
    }
  };
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return mockMetadata[platform] || mockMetadata.default;
}

// Generate download URL (simulated)
function generateDownloadUrl(videoData, format, type) {
  // In production, this would call a real download service API
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  
  if (type === 'video') {
    return `https://download.example.com/video/${randomId}/${timestamp}.${format}`;
  } else {
    return `https://download.example.com/audio/${randomId}/${timestamp}.mp3`;
  }
}

// Message handler for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handleMessage = async () => {
    switch (request.action) {
      case 'validateUrl':
        const isValid = isValidUrl(request.url);
        const platform = isValid ? detectPlatform(request.url) : 'invalid';
        return { valid: isValid, platform };
      
      case 'fetchMetadata':
        try {
          const platform = detectPlatform(request.url);
          if (platform === 'unknown') {
            throw new Error('Unsupported platform');
          }
          const metadata = await fetchVideoMetadata(request.url, platform);
          return { success: true, data: { ...metadata, platform, url: request.url } };
        } catch (error) {
          return { success: false, error: error.message };
        }
      
      case 'download':
        try {
          const downloadUrl = generateDownloadUrl(request.data, request.format, request.type);
          
          // Use Chrome downloads API
          chrome.downloads.download({
            url: downloadUrl,
            filename: `${request.data.title.substring(0, 50).replace(/[^a-z0-9]/gi, '_')}.${request.type === 'video' ? 'mp4' : 'mp3'}`,
            saveAs: false
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              throw new Error(chrome.runtime.lastError.message);
            }
            
            // Save to recent downloads
            saveRecentDownload(request.data, request.type, request.format);
          });
          
          return { success: true, message: 'Download started' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      
      case 'getRecentDownloads':
        return await getRecentDownloads();
      
      default:
        return { error: 'Unknown action' };
    }
  };
  
  handleMessage().then(sendResponse);
  return true; // Keep channel open for async response
});

// Save recent download to storage
async function saveRecentDownload(videoData, type, format) {
  try {
    const recent = await getRecentDownloads();
    const newItem = {
      id: Date.now(),
      title: videoData.title,
      thumbnail: videoData.thumbnail,
      type,
      format,
      platform: videoData.platform,
      timestamp: new Date().toISOString()
    };
    
    // Keep only last 10 items
    recent.unshift(newItem);
    if (recent.length > 10) {
      recent.pop();
    }
    
    await chrome.storage.local.set({ recentDownloads: recent });
  } catch (error) {
    console.error('Error saving recent download:', error);
  }
}

// Get recent downloads from storage
async function getRecentDownloads() {
  try {
    const result = await chrome.storage.local.get(['recentDownloads']);
    return result.recentDownloads || [];
  } catch (error) {
    console.error('Error getting recent downloads:', error);
    return [];
  }
}

// Install event listener
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Smart Video & MP3 Downloader installed', details);
  
  // Initialize storage
  chrome.storage.local.set({
    recentDownloads: [],
    theme: 'light',
    settings: {
      defaultQuality: '720p',
      defaultAudioQuality: '128kbps',
      autoDownload: false
    }
  });
});
