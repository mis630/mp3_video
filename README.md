# Smart Video & MP3 Downloader - Chrome Extension

The easiest video & MP3 downloader on the internet. Download videos from YouTube, Instagram, TikTok, Facebook, Twitter/X and more with one click.

## 🚀 Features

### Core Features
- **Smart Link Detection** - Auto-detects platform and fetches video metadata instantly
- **Multiple Quality Options** - Choose from 360p, 480p, 720p, 1080p, 2K, 4K
- **MP3 Converter** - Extract audio from any video in high quality (128kbps, 256kbps, 320kbps)
- **Beautiful UI** - Clean, modern interface inspired by Spotify and Netflix
- **Dark Mode** - Easy on the eyes with theme toggle
- **Recent Downloads** - Quick access to your download history

### Supported Platforms
- ✅ YouTube
- ✅ Instagram (Reels & Posts)
- ✅ TikTok
- ✅ Facebook
- ✅ Twitter/X
- ✅ Vimeo
- ✅ Dailymotion

### User Experience
- ⚡ Fast response under 3 seconds
- 🎯 One-click simplicity
- 🔒 Safe and secure
- 📱 Mobile-style easy experience
- 🎨 Clean, professional design

## 📦 Installation

### For Development/Testing:

1. **Download/Clone this repository**
   ```bash
   git clone <repository-url>
   cd smart-video-downloader
   ```

2. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load Unpacked Extension**
   - Click "Load unpacked"
   - Select the folder containing this extension

4. **Start Using**
   - Click the extension icon in your toolbar
   - Paste any supported video URL
   - Click "Fetch Video"
   - Choose quality and download!

## 🎯 How to Use

### Step 1: Open Extension
Click the extension icon in your Chrome toolbar.

### Step 2: Paste Video Link
Copy any video URL from supported platforms and paste it in the input field.

### Step 3: Fetch Video
Click "Fetch Video" or press Enter. The extension will automatically:
- Detect the platform
- Fetch thumbnail
- Get video title
- Show available quality options

### Step 4: Download
Choose between:
- **Download Video** - Save as MP4 in your chosen quality
- **Download MP3** - Extract and save audio only

## 🛠️ Project Structure

```
smart-video-downloader/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup UI
├── styles/
│   └── popup.css         # Stylesheet with dark mode support
├── scripts/
│   ├── background.js     # Service worker for background tasks
│   └── popup.js          # Popup interaction logic
├── icons/
│   ├── icon16.svg        # 16x16 icon
│   ├── icon48.svg        # 48x48 icon
│   └── icon128.svg       # 128x128 icon
└── README.md             # This file
```

## 🔧 Technical Details

### Technologies Used
- **Manifest V3** - Latest Chrome Extension API
- **Vanilla JavaScript** - No framework dependencies
- **CSS Variables** - Easy theming and dark mode
- **Chrome Storage API** - Persistent settings and history
- **Chrome Downloads API** - Native download management

### Key Components

#### Background Service Worker (`scripts/background.js`)
- Platform detection and URL validation
- Video metadata fetching
- Download management
- Recent downloads storage

#### Popup UI (`popup.html` + `styles/popup.css`)
- Responsive, mobile-first design
- Dark/Light theme support
- Smooth animations
- Intuitive user flow

#### Popup Logic (`scripts/popup.js`)
- User interaction handling
- Real-time URL validation
- Quality selection
- Download initiation

## ⚠️ Important Notes

### Legal Disclaimer
This extension is intended for downloading content that you own or have permission to download. Always respect:
- Copyright laws
- Terms of service of platforms
- Content creator rights

### Limitations
- Some videos may be protected and cannot be downloaded
- Quality availability depends on the source video
- Platform APIs may change, requiring updates

## 🚧 Future Enhancements

Planned features for future versions:
- [ ] Batch download support
- [ ] Playlist download
- [ ] Auto subtitle download
- [ ] Download queue management
- [ ] Custom quality presets
- [ ] Cloud conversion fallback
- [ ] Browser sync support
- [ ] Keyboard shortcuts

## 🐛 Troubleshooting

### Extension not working?
1. Make sure you're using the latest version of Chrome
2. Check if the extension is enabled in `chrome://extensions/`
3. Try reloading the extension
4. Clear browser cache and try again

### Can't download a specific video?
- The video might be private or protected
- The platform might have blocked the download
- Check if the URL is correct and complete

### Dark mode not saving?
- Make sure Chrome has storage permissions
- Try reinstalling the extension

## 📄 License

This project is provided as-is for educational purposes. Please use responsibly and respect content creators' rights.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues before creating new ones

---

**Made with ❤️ for easy video downloading**

*Remember: Only download content you have permission to use.*
