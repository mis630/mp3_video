# 100% Backend-Free Video Downloader Extension

This Chrome extension uses **WebAssembly (FFmpeg.wasm)** to process videos entirely in your browser - no servers, no costs, no redirects.

## File Structure

```
smart-downloader/
├── manifest.json       (Extension configuration with COOP/COEP headers)
├── popup.html          (UI with FFmpeg.wasm script)
├── popup.js            (Client-side logic engine)
└── styles/
    └── popup.css       (Dark theme styling)
```

## How It Works

### Architecture
```
User Pastes URL
      ↓
Extension Analyzes Page (finds .mp4 stream)
      ↓
User Clicks Download
      ↓
┌─────────────────┐
│ MP4 Download    │ → Direct Chrome Downloads API
├─────────────────┤
│ MP3 Conversion  │ → FFmpeg.wasm in browser memory
│                 │ → Convert → Blob → Download
└─────────────────┘
```

### Key Features

1. **Zero Backend Costs** - Everything runs in the user's browser
2. **No Redirects** - Downloads happen directly via Chrome Downloads API
3. **FFmpeg.wasm** - Real video/audio conversion inside Chrome
4. **COOP/COEP Headers** - Required for SharedArrayBuffer (FFmpeg.wasm)

## Installation

### Step 1: Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `/workspace` folder
5. Extension icon appears in toolbar

### Step 2: Use the Extension

1. Click the extension icon
2. Paste a video URL
3. Click **Analyze Link**
4. Choose:
   - **Download Video (MP4)** - Direct download
   - **Convert & Download MP3** - Browser-side conversion

## Technical Details

### Why COOP/COEP Headers?

The `cross_origin_opener_policy` and `cross_origin_embedder_policy` headers in `manifest.json` are **required** for FFmpeg.wasm to work. They enable `SharedArrayBuffer`, which FFmpeg needs for multi-threading.

```json
"cross_origin_opener_policy": {
  "value": "same-origin"
},
"cross_origin_embedder_policy": {
  "value": "require-corp"
}
```

### FFmpeg.wasm Commands

The MP3 conversion uses real FFmpeg commands:

```javascript
await ffmpeg.run('-i', 'input.mp4', '-q:a', '0', '-map', 'a', 'output.mp3');
```

This extracts audio from video at highest quality (`-q:a 0`).

### Memory Management

Files are stored in browser virtual memory:

```javascript
// Write to memory filesystem
ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(url));

// Read result after conversion
const data = ffmpeg.FS('readFile', 'output.mp3');

// Cleanup
ffmpeg.FS('unlink', 'input.mp4');
ffmpeg.FS('unlink', 'output.mp3');
```

## Limitations

### What Works
- Direct .mp4 video URLs
- Sites with accessible media streams
- Small to medium videos (< 500MB recommended)

### What Doesn't Work
- YouTube (encrypted streams, DASH, signature ciphers)
- Netflix/Prime/Hulu (DRM protected)
- Very large files (browser memory limits)

### Why YouTube Doesn't Work Client-Side

YouTube uses:
- Encrypted media streams
- Signature ciphers that change frequently
- DASH streaming (separate audio/video tracks)
- Bot detection

**For YouTube support, you need the backend approach** (see `SETUP_GUIDE.md`).

## Comparison: Backend vs No-Backend

| Feature | Backend Approach | No-Backend (Wasm) |
|---------|-----------------|-------------------|
| Cost | Server hosting fees | Free |
| YouTube Support | ✅ Yes (yt-dlp) | ❌ No |
| Simple Sites | ✅ Yes | ✅ Yes |
| MP3 Conversion | Server CPU | User's CPU |
| Speed | Fast (server bandwidth) | Depends on user connection |
| Privacy | Files touch server | 100% local |
| Setup | Complex | Simple |

## When to Use Each Approach

### Use No-Backend (This Version)
- Testing/prototyping
- Simple video hosting sites
- You want zero costs
- Privacy-focused users

### Use Backend Approach
- YouTube/Instagram/TikTok support
- Production app
- Need reliable extraction
- Want to handle all platforms

## Troubleshooting

### "FFmpeg failed to load"
- Check internet connection (FFmpeg.wasm loads from CDN)
- Ensure COOP/COEP headers are in manifest.json

### "Download failed"
- Some sites block direct downloads (CORS)
- Try a different video source

### "Conversion takes too long"
- Large files take time in browser
- User's CPU speed affects conversion
- Consider backend for large files

## Legal Notice

⚠️ **Only download content you own or have permission to use.**

Respect copyright laws and terms of service of video platforms.

## Next Steps

To add YouTube support:
1. See `SETUP_GUIDE.md` for backend setup
2. Deploy Node.js + yt-dlp backend
3. Update extension to call your API

This version is perfect for learning, testing, and simple use cases!
