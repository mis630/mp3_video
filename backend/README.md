# Video Downloader Backend API

Professional backend service for the Smart Video & MP3 Downloader Chrome Extension.

## Architecture

This backend uses **yt-dlp** (the most reliable video extraction tool) to extract video information and download streams from various platforms.

### Flow:
```
Chrome Extension
      ↓ (HTTP Request)
Backend API (/api/extract)
      ↓ (yt-dlp execution)
Video Platform (YouTube, Instagram, etc.)
      ↓ (Stream URLs)
Backend API → Extension → Direct Download
```

## Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   ```bash
   # Check installation
   node --version
   
   # Install from https://nodejs.org/
   ```

2. **yt-dlp** (Video extraction tool)
   ```bash
   # macOS
   brew install yt-dlp
   
   # Linux
   sudo apt install yt-dlp
   # or
   sudo yum install yt-dlp
   
   # Windows (with Chocolatey)
   choco install yt-dlp
   
   # Or via pip
   pip install yt-dlp
   ```

3. **FFmpeg** (Required for audio conversion to MP3)
   ```bash
   # macOS
   brew install ffmpeg
   
   # Linux
   sudo apt install ffmpeg
   # or
   sudo yum install ffmpeg
   
   # Windows (with Chocolatey)
   choco install ffmpeg
   ```

## Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment** (optional - defaults work for development)
   ```bash
   # Edit .env file
   PORT=3000
   NODE_ENV=development
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### 1. Extract Video Information
**POST** `/api/extract`

Extract metadata and available formats from a video URL.

**Request:**
```json
{
  "url": "https://youtube.com/watch?v=xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "video_id",
    "title": "Video Title",
    "thumbnail": "https://...",
    "duration": 225,
    "viewCount": 1234567,
    "uploader": "Channel Name",
    "platform": "YouTube",
    "formats": [
      {
        "quality": "1080p",
        "height": 1080,
        "ext": "mp4",
        "filesize": 123456789
      }
    ],
    "audioFormats": [
      {
        "quality": "128kbps",
        "ext": "m4a",
        "filesize": 12345678
      }
    ]
  }
}
```

### 2. Convert to MP3
**POST** `/api/download/audio`

Download audio stream and convert to MP3.

**Request:**
```json
{
  "url": "https://youtube.com/watch?v=xxxxx",
  "quality": "128"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "/api/files/audio_1234567890_video_title.mp3",
    "filename": "audio_1234567890_video_title.mp3",
    "title": "Video Title",
    "filesize": 3456789,
    "expiresAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 3. Get Video Download URL
**GET** `/api/download/video?url=xxx&formatId=best`

Get direct download URL for video.

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://direct_stream_url_from_platform",
    "title": "Video Title",
    "quality": "720p",
    "ext": "mp4",
    "filesize": 12345678
  }
}
```

### 4. Health Check
**GET** `/health`

Check if server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "video-downloader-api"
}
```

## Supported Platforms

- ✅ YouTube
- ✅ Instagram (Reels & Posts)
- ✅ TikTok
- ✅ Facebook
- ✅ Twitter/X
- ✅ Vimeo
- ✅ Dailymotion
- ✅ And 1000+ more sites (via yt-dlp)

## Project Structure

```
backend/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── .env                   # Environment variables
├── services/
│   └── videoExtractor.js  # yt-dlp integration
├── utils/
│   └── fileUtils.js       # File cleanup utilities
├── temp/                  # Temporary file storage
└── README.md             # This file
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `TEMP_DIR` | ./temp | Temporary files location |
| `CACHE_DURATION` | 3600 | Cache duration in seconds |

## File Cleanup

The server automatically cleans up temporary files older than 1 hour. You can also manually trigger cleanup:

```javascript
import { cleanupOldFiles } from './utils/fileUtils.js';
cleanupOldFiles();
```

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `yt-dlp not found` | yt-dlp not installed | Install yt-dlp (see Prerequisites) |
| `ffmpeg not found` | FFmpeg not installed | Install FFmpeg for MP3 conversion |
| `Private video` | Video is private/unavailable | Use public videos only |
| `Request timed out` | Slow connection or large video | Increase timeout in videoExtractor.js |

## Deployment

### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Deploy to Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables

### Deploy to DigitalOcean

```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm yt-dlp ffmpeg -y

# Clone repository
git clone <your-repo>
cd backend

# Install packages
npm install

# Run with PM2
npm install -g pm2
pm2 start server.js --name video-downloader
pm2 startup
pm2 save
```

## Performance Tips

1. **Use a VPS** with good bandwidth for video downloads
2. **Enable caching** for frequently requested videos
3. **Set up CDN** for serving temporary files
4. **Monitor disk space** - temp files accumulate quickly
5. **Rate limiting** - Implement to prevent abuse

## Security Considerations

1. **API Authentication** - Add API key verification for production
2. **Rate Limiting** - Prevent abuse with request limits
3. **Input Validation** - Validate all URLs before processing
4. **File Size Limits** - Limit maximum download size
5. **HTTPS** - Always use HTTPS in production

## Legal Disclaimer

⚠️ **Important**: Only download content you own or have permission to download. Respect:
- Copyright laws
- Terms of service of platforms
- Content creator rights

This software is provided for educational purposes only.

## Troubleshooting

### yt-dlp not working
```bash
# Update yt-dlp
pip install -U yt-dlp
# or
brew upgrade yt-dlp
```

### FFmpeg conversion fails
```bash
# Check FFmpeg installation
ffmpeg -version

# Reinstall if needed
brew reinstall ffmpeg  # macOS
sudo apt reinstall ffmpeg  # Linux
```

### Server won't start
```bash
# Check Node version (need 16+)
node --version

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### CORS errors from extension
Ensure your backend has CORS enabled (it does by default). For production, update allowed origins in `server.js`.

## Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:3000/health

# Extract video info
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## License

MIT License - See LICENSE file for details.

## Support

For issues:
1. Check this README
2. Review error logs in console
3. Ensure all prerequisites are installed
4. Check yt-dlp is working: `yt-dlp --version`

---

**Made with ❤️ using yt-dlp and Express.js**
