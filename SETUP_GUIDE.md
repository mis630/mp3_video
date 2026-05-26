# 🚀 COMPLETE SETUP GUIDE - Smart Video & MP3 Downloader

## Professional Architecture

This extension now uses a **professional backend architecture** instead of redirecting to third-party websites:

```
┌─────────────────┐
│ Chrome Extension│
│   (Frontend)    │
└────────┬────────┘
         │ HTTP Request
         ↓
┌─────────────────┐
│  Your Backend   │
│  (Node.js +     │
│   Express)      │
└────────┬────────┘
         │ yt-dlp
         ↓
┌─────────────────┐
│ Video Platforms │
│ (YouTube, etc.) │
└────────┬────────┘
         │ Stream URLs
         ↓
┌─────────────────┐
│  Direct Download│
│  (No Redirect!) │
└─────────────────┘
```

---

## PART 1: BACKEND SETUP (Required for Production)

### Step 1: Install Prerequisites

#### A. Node.js (v16+)
```bash
# Check if installed
node --version

# If not installed, download from https://nodejs.org/
# Or use nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### B. yt-dlp (Video Extraction Tool)
```bash
# macOS
brew install yt-dlp

# Linux (Debian/Ubuntu)
sudo apt update
sudo apt install yt-dlp

# Linux (CentOS/RHEL)
sudo yum install yt-dlp

# Windows (with Chocolatey)
choco install yt-dlp

# Or via pip (any OS)
pip install yt-dlp

# Verify installation
yt-dlp --version
```

#### C. FFmpeg (For MP3 Conversion)
```bash
# macOS
brew install ffmpeg

# Linux (Debian/Ubuntu)
sudo apt install ffmpeg

# Linux (CentOS/RHEL)
sudo yum install ffmpeg

# Windows (with Chocolatey)
choco install ffmpeg

# Verify installation
ffmpeg -version
```

### Step 2: Setup Backend Server

```bash
# Navigate to backend directory
cd backend

# Install Node.js dependencies
npm install

# Create environment file
cp .env.example .env

# Start the server
npm start
```

You should see:
```
╔═══════════════════════════════════════════════╗
║   Video Downloader Backend API                ║
║                                               ║
║   Server running on port 3000                 ║
║   Environment: development                    ║
╚═══════════════════════════════════════════════╝
```

### Step 3: Test Backend API

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test video extraction
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

---

## PART 2: EXTENSION SETUP

### Step 1: Configure Backend URL

Edit `/workspace/scripts/background.js`:

```javascript
// Line 5 - Change this to your deployed backend URL
const BACKEND_API_URL = 'http://localhost:3000/api'; 
// For production, change to:
// const BACKEND_API_URL = 'https://your-backend-url.com/api';
```

### Step 2: Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `/workspace` folder
6. Extension icon should appear in toolbar

### Step 3: Test the Extension

1. Click the extension icon
2. Paste a YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click "Fetch Video"
4. You should see video information
5. Click "Download Video" or "Download MP3"

---

## PART 3: DEPLOYMENT TO PRODUCTION

### Option A: Deploy Backend to Railway (Recommended for Beginners)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Navigate to backend
cd backend

# 4. Initialize Railway project
railway init

# 5. Deploy
railway up

# 6. Get your public URL
railway domain
```

Railway will give you a URL like: `https://your-project.railway.app`

Update your extension:
```javascript
const BACKEND_API_URL = 'https://your-project.railway.app/api';
```

### Option B: Deploy to Render

1. Push your code to GitHub
2. Go to https://render.com
3. Create new **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**: Add any from `.env`
6. Deploy!

### Option C: Deploy to DigitalOcean VPS

```bash
# SSH into your droplet
ssh root@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://nodesource.com/setup_18.x | sudo bash
sudo apt install nodejs -y

# Install yt-dlp and ffmpeg
sudo apt install yt-dlp ffmpeg -y

# Install Git
sudo apt install git -y

# Clone your repository
git clone https://github.com/your-username/your-repo.git
cd your-repo/backend

# Install dependencies
npm install

# Install PM2 (process manager)
sudo npm install -g pm2

# Start server with PM2
pm2 start server.js --name video-downloader

# Setup PM2 to start on boot
pm2 startup
pm2 save

# Setup firewall
sudo ufw allow 3000
```

---

## PART 4: TROUBLESHOOTING

### Backend Issues

**Problem**: `yt-dlp not found`
```bash
# Solution: Install yt-dlp
pip install yt-dlp
# or
brew install yt-dlp
```

**Problem**: `ffmpeg not found`
```bash
# Solution: Install FFmpeg
sudo apt install ffmpeg
# or
brew install ffmpeg
```

**Problem**: Server won't start
```bash
# Check Node version
node --version  # Should be 16+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Extension Issues

**Problem**: CORS errors
```javascript
// Ensure backend has CORS enabled (it does by default)
// In server.js: app.use(cors());
```

**Problem**: Network request failed
```javascript
// Make sure backend is running
// Check console for exact error
// Verify BACKEND_API_URL is correct
```

**Problem**: Downloads not starting
```javascript
// Check Chrome's download permissions
// Go to chrome://extensions/
// Ensure extension has download permission
```

---

## PART 5: HOW IT WORKS

### Video Download Flow

1. **User pastes URL** → Extension captures it
2. **Extension sends to backend** → `POST /api/extract`
3. **Backend runs yt-dlp** → Extracts video info and stream URLs
4. **Backend returns JSON** → Title, thumbnail, formats, direct URLs
5. **Extension shows UI** → Quality options, download buttons
6. **User clicks download** → `chrome.downloads.download()` with direct URL
7. **Download starts** → No redirect, direct from browser!

### MP3 Conversion Flow

1. **User selects MP3** → Extension sends request
2. **Backend downloads audio** → Using yt-dlp
3. **FFmpeg converts** → To MP3 format
4. **File saved temporarily** → In `/temp` folder
5. **URL returned** → `/api/files/audio_xxx.mp3`
6. **Extension downloads** → Direct download via Chrome API
7. **Auto cleanup** → Files deleted after 1 hour

---

## PART 6: IMPORTANT NOTES

### ⚠️ Legal Disclaimer

**Only download content you:**
- Own
- Have permission to download
- Is licensed for download (Creative Commons, etc.)

**Respect:**
- Copyright laws
- Platform terms of service
- Content creator rights

### 🔒 Security Best Practices

For production deployment:

1. **Add API Authentication**
```javascript
// In server.js
const API_KEY = process.env.API_KEY;

app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

2. **Enable Rate Limiting**
```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

3. **Use HTTPS** (via reverse proxy like Nginx)
4. **Set up monitoring** (logs, alerts)
5. **Regular updates** (yt-dlp, dependencies)

### 📊 Performance Optimization

1. **Cache extracted data** (Redis or in-memory)
2. **Use CDN** for serving temporary files
3. **Implement queue system** (Bull + Redis) for heavy loads
4. **Monitor disk space** (temp files accumulate)
5. **Database for analytics** (optional)

---

## PART 7: TESTING CHECKLIST

- [ ] Backend server starts successfully
- [ ] `GET /health` returns OK
- [ ] `POST /api/extract` works with YouTube URL
- [ ] Video metadata is returned correctly
- [ ] `POST /api/download/audio` converts to MP3
- [ ] `GET /api/download/video` returns stream URL
- [ ] Extension loads in Chrome without errors
- [ ] Extension can fetch video info
- [ ] Video download starts directly (no redirect)
- [ ] MP3 download starts directly (no redirect)
- [ ] Recent downloads are saved
- [ ] Dark mode works
- [ ] Multiple platforms work (YouTube, Instagram, TikTok)

---

## 🎉 SUCCESS!

You now have a **professional video downloader** that:

✅ Uses your own backend (no third-party redirects)  
✅ Extracts videos with yt-dlp (most reliable tool)  
✅ Converts to MP3 with FFmpeg  
✅ Downloads directly via Chrome API  
✅ Supports 1000+ platforms  
✅ Has automatic file cleanup  
✅ Is production-ready  

**Next Steps:**
1. Deploy backend to cloud (Railway, Render, or VPS)
2. Update `BACKEND_API_URL` in extension
3. Test with real videos
4. Publish to Chrome Web Store (if desired)

---

**Questions?** Check the individual README files:
- `/backend/README.md` - Backend API documentation
- `/README.md` - Extension documentation

**Happy downloading!** 🚀
