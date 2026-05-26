import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

// Check if yt-dlp is installed
async function checkYtDlp() {
  try {
    const { stdout } = await execAsync('yt-dlp --version');
    console.log('yt-dlp version:', stdout.trim());
    return true;
  } catch (error) {
    console.error('yt-dlp not found. Please install it:');
    console.log('  npm install -g yt-dlp');
    console.log('  or visit: https://github.com/yt-dlp/yt-dlp#installation');
    return false;
  }
}

/**
 * Extract video information using yt-dlp
 * @param {string} url - Video URL
 * @returns {Promise<object|null>} Video information or null
 */
export async function extractVideoInfo(url) {
  try {
    // Check if yt-dlp is available
    const hasYtDlp = await checkYtDlp();
    
    if (!hasYtDlp) {
      throw new Error('yt-dlp is not installed. Please install it to use this feature.');
    }

    // Get video information as JSON
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-warnings "${url}"`,
      { 
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 30000 // 30 second timeout
      }
    );

    const videoInfo = JSON.parse(stdout);
    return videoInfo;

  } catch (error) {
    console.error('Error extracting video info:', error.message);
    
    // Handle common errors
    if (error.message.includes('timeout')) {
      throw new Error('Request timed out. The video may be too large or connection is slow.');
    }
    if (error.message.includes('Private video') || error.message.includes('unavailable')) {
      throw new Error('This video is private or unavailable.');
    }
    if (error.message.includes('Sign in')) {
      throw new Error('This video requires authentication.');
    }
    
    throw new Error(`Failed to extract video info: ${error.message}`);
  }
}

/**
 * Download audio and convert to MP3
 * @param {string} url - Video URL
 * @param {string} quality - Audio quality in kbps (e.g., '128', '256', '320')
 * @returns {Promise<object|null>} Result with filename and metadata or null
 */
export async function downloadAudioAsMp3(url, quality = '128') {
  try {
    const hasYtDlp = await checkYtDlp();
    
    if (!hasYtDlp) {
      throw new Error('yt-dlp is not installed.');
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const outputTemplate = path.join(tempDir, `audio_${timestamp}_%(title)s.%(ext)s`);

    // First, get video info for title
    const videoInfo = await extractVideoInfo(url);
    if (!videoInfo) {
      throw new Error('Could not get video information');
    }

    // Download and convert to MP3 using yt-dlp
    // Note: This requires ffmpeg to be installed for MP3 conversion
    return new Promise((resolve, reject) => {
      const args = [
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', `${quality}K`,
        '--output', outputTemplate,
        '--no-warnings',
        url
      ];

      const ytDlp = spawn('yt-dlp', args);
      let outputPath = '';

      ytDlp.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('yt-dlp:', output);
        
        // Extract output filename from yt-dlp output
        const match = output.match(/Destination: (.+)/);
        if (match) {
          outputPath = match[1].trim();
        }
      });

      ytDlp.stderr.on('data', (data) => {
        console.error('yt-dlp error:', data.toString());
      });

      ytDlp.on('close', (code) => {
        if (code === 0 && outputPath) {
          // Find the actual output file (yt-dlp might have changed extension)
          const dir = path.dirname(outputPath);
          const baseName = path.basename(outputPath, path.extname(outputPath));
          
          // Look for the generated MP3 file
          const files = fs.readdirSync(dir).filter(f => f.startsWith(`audio_${timestamp}`) && f.endsWith('.mp3'));
          
          if (files.length > 0) {
            const filename = files[0];
            const filepath = path.join(dir, filename);
            const stats = fs.statSync(filepath);
            
            resolve({
              filename,
              filepath,
              title: videoInfo.title,
              filesize: stats.size,
              expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
            });
          } else {
            reject(new Error('MP3 file not found after conversion'));
          }
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });

      ytDlp.on('error', (err) => {
        reject(new Error(`Failed to start yt-dlp: ${err.message}`));
      });
    });

  } catch (error) {
    console.error('Audio conversion error:', error.message);
    throw error;
  }
}

/**
 * Download video in specific format
 * @param {string} url - Video URL
 * @param {string} formatId - Format ID from yt-dlp
 * @returns {Promise<object|null>} Result with filepath and metadata or null
 */
export async function downloadVideo(url, formatId = 'best') {
  try {
    const hasYtDlp = await checkYtDlp();
    
    if (!hasYtDlp) {
      throw new Error('yt-dlp is not installed.');
    }

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const outputTemplate = path.join(tempDir, `video_${timestamp}_%(title)s.%(ext)s`);

    const videoInfo = await extractVideoInfo(url);
    if (!videoInfo) {
      throw new Error('Could not get video information');
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-f', formatId,
        '--output', outputTemplate,
        '--no-warnings',
        '--merge-output-format', 'mp4',
        url
      ];

      const ytDlp = spawn('yt-dlp', args);
      let outputPath = '';

      ytDlp.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('yt-dlp:', output);
        
        const match = output.match(/Destination: (.+)/);
        if (match) {
          outputPath = match[1].trim();
        }
      });

      ytDlp.stderr.on('data', (data) => {
        console.error('yt-dlp error:', data.toString());
      });

      ytDlp.on('close', (code) => {
        if (code === 0 && outputPath) {
          const dir = path.dirname(outputPath);
          const files = fs.readdirSync(dir).filter(f => f.startsWith(`video_${timestamp}`) && f.endsWith('.mp4'));
          
          if (files.length > 0) {
            const filename = files[0];
            const filepath = path.join(dir, filename);
            const stats = fs.statSync(filepath);
            
            resolve({
              filename,
              filepath,
              title: videoInfo.title,
              filesize: stats.size,
              expiresAt: new Date(Date.now() + 3600000).toISOString()
            });
          } else {
            reject(new Error('Video file not found after download'));
          }
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });

      ytDlp.on('error', (err) => {
        reject(new Error(`Failed to start yt-dlp: ${err.message}`));
      });
    });

  } catch (error) {
    console.error('Video download error:', error.message);
    throw error;
  }
}

// Initialize check on module load
checkYtDlp().catch(console.error);
