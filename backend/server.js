import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { extractVideoInfo, downloadAudioAsMp3 } from './services/videoExtractor.js';
import { cleanupOldFiles } from './utils/fileUtils.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'video-downloader-api'
  });
});

/**
 * POST /api/extract
 * Extract video information from URL
 */
app.post('/api/extract', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL is required' 
      });
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format' 
      });
    }

    console.log(`Extracting info for: ${url}`);
    
    // Extract video information using yt-dlp
    const videoInfo = await extractVideoInfo(url);

    if (!videoInfo) {
      return res.status(404).json({ 
        success: false, 
        error: 'Could not extract video information. The video may be private, unavailable, or unsupported.' 
      });
    }

    // Format the response
    const formattedFormats = videoInfo.formats
      .filter(f => f.height && f.vcodec !== 'none')
      .map(f => ({
        formatId: f.format_id,
        quality: `${f.height}p`,
        height: f.height,
        width: f.width,
        ext: f.ext,
        filesize: f.filesize,
        filesize_approx: f.filesize_approx,
        vcodec: f.vcodec,
        acodec: f.acodec,
        fps: f.fps,
        tbr: f.tbr,
        formatNote: f.format_note
      }))
      .sort((a, b) => b.height - a.height);

    // Remove duplicates based on quality
    const uniqueFormats = [];
    const seenQualities = new Set();
    for (const format of formattedFormats) {
      if (!seenQualities.has(format.quality)) {
        uniqueFormats.push(format);
        seenQualities.add(format.quality);
      }
    }

    // Format audio options
    const audioFormats = videoInfo.formats
      .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
      .map(f => ({
        formatId: f.format_id,
        quality: f.abr ? `${Math.round(f.abr)}kbps` : '128kbps',
        abr: f.abr,
        ext: f.ext,
        filesize: f.filesize,
        filesize_approx: f.filesize_approx,
        acodec: f.acodec
      }))
      .sort((a, b) => (b.abr || 0) - (a.abr || 0));

    res.json({
      success: true,
      data: {
        id: videoInfo.id,
        title: videoInfo.title,
        description: videoInfo.description?.substring(0, 500),
        thumbnail: videoInfo.thumbnail,
        duration: videoInfo.duration,
        viewCount: videoInfo.view_count,
        likeCount: videoInfo.like_count,
        uploader: videoInfo.uploader,
        uploadDate: videoInfo.upload_date,
        platform: videoInfo.extractor_key,
        formats: uniqueFormats.length > 0 ? uniqueFormats : [
          { quality: '720p', height: 720, ext: 'mp4' },
          { quality: '480p', height: 480, ext: 'mp4' },
          { quality: '360p', height: 360, ext: 'mp4' }
        ],
        audioFormats: audioFormats.length > 0 ? audioFormats : [
          { quality: '128kbps', ext: 'm4a' },
          { quality: '256kbps', ext: 'm4a' }
        ]
      }
    });

  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to extract video information' 
    });
  }
});

/**
 * POST /api/download/audio
 * Convert video to MP3 and return download URL
 */
app.post('/api/download/audio', async (req, res) => {
  try {
    const { url, quality = '128' } = req.body;

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL is required' 
      });
    }

    console.log(`Converting to MP3: ${url} (${quality}kbps)`);
    
    // Download and convert to MP3
    const result = await downloadAudioAsMp3(url, quality);

    if (!result) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to convert audio' 
      });
    }

    res.json({
      success: true,
      data: {
        downloadUrl: `/api/files/${result.filename}`,
        filename: result.filename,
        title: result.title,
        filesize: result.filesize,
        expiresAt: result.expiresAt
      }
    });

  } catch (error) {
    console.error('Audio conversion error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to convert audio' 
    });
  }
});

/**
 * GET /api/download/video/:formatId
 * Get direct video download URL
 */
app.get('/api/download/video', async (req, res) => {
  try {
    const { url, formatId } = req.query;

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL is required' 
      });
    }

    console.log(`Getting video download URL: ${url}`);
    
    // Extract video info to get direct URL
    const videoInfo = await extractVideoInfo(url);

    if (!videoInfo || !videoInfo.formats) {
      return res.status(404).json({ 
        success: false, 
        error: 'Could not get video information' 
      });
    }

    // Find the requested format or best video format
    let selectedFormat;
    if (formatId) {
      selectedFormat = videoInfo.formats.find(f => f.format_id === formatId);
    }
    
    if (!selectedFormat) {
      // Get best video+audio combined format
      selectedFormat = videoInfo.formats.find(
        f => f.height && f.vcodec !== 'none' && f.acodec !== 'none'
      ) || videoInfo.formats.find(
        f => f.height && f.vcodec !== 'none'
      );
    }

    if (!selectedFormat || !selectedFormat.url) {
      return res.status(404).json({ 
        success: false, 
        error: 'No downloadable format found' 
      });
    }

    res.json({
      success: true,
      data: {
        downloadUrl: selectedFormat.url,
        title: videoInfo.title,
        quality: selectedFormat.height ? `${selectedFormat.height}p` : 'unknown',
        ext: selectedFormat.ext,
        filesize: selectedFormat.filesize || selectedFormat.filesize_approx
      }
    });

  } catch (error) {
    console.error('Video download error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get video download URL' 
    });
  }
});

/**
 * Serve temporary files
 */
app.use('/api/files', express.static(join(__dirname, '../temp')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   Video Downloader Backend API                ║
║                                               ║
║   Server running on port ${PORT}                 ║
║   Environment: ${process.env.NODE_ENV || 'development'}                       ║
║                                               ║
║   Endpoints:                                  ║
║   POST /api/extract       - Extract video info║
║   POST /api/download/audio - Convert to MP3   ║
║   GET  /api/download/video - Get video URL    ║
║   GET  /health            - Health check      ║
╚═══════════════════════════════════════════════╝
  `);
  
  // Start cleanup job
  setInterval(() => {
    cleanupOldFiles();
  }, 3600000); // Clean up every hour
});

export default app;
