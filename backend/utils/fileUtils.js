import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../temp');
const MAX_AGE_MS = 3600000; // 1 hour in milliseconds

/**
 * Clean up old temporary files
 * Removes files older than MAX_AGE_MS
 */
export function cleanupOldFiles() {
  try {
    if (!fs.existsSync(TEMP_DIR)) {
      console.log('Temp directory does not exist, skipping cleanup');
      return;
    }

    const now = Date.now();
    const files = fs.readdirSync(TEMP_DIR);
    
    let removedCount = 0;
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      
      try {
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          const age = now - stats.mtimeMs;
          
          if (age > MAX_AGE_MS) {
            fs.unlinkSync(filePath);
            removedCount++;
            totalSize += stats.size;
            console.log(`Removed old file: ${file} (${formatBytes(stats.size)})`);
          }
        }
      } catch (err) {
        console.error(`Error processing file ${file}:`, err.message);
      }
    }

    if (removedCount > 0) {
      console.log(`Cleanup complete: removed ${removedCount} files (${formatBytes(totalSize)})`);
    } else {
      console.log('No old files to clean up');
    }

  } catch (error) {
    console.error('Error during file cleanup:', error.message);
  }
}

/**
 * Get temporary directory statistics
 * @returns {object} Stats about temp directory
 */
export function getTempDirStats() {
  try {
    if (!fs.existsSync(TEMP_DIR)) {
      return {
        exists: false,
        fileCount: 0,
        totalSize: 0,
        totalSizeFormatted: '0 B'
      };
    }

    const files = fs.readdirSync(TEMP_DIR);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      } catch (err) {
        // Ignore errors
      }
    }

    return {
      exists: true,
      fileCount: files.length,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize)
    };

  } catch (error) {
    console.error('Error getting temp dir stats:', error.message);
    return {
      exists: false,
      fileCount: 0,
      totalSize: 0,
      totalSizeFormatted: '0 B',
      error: error.message
    };
  }
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Ensure temp directory exists
 */
export function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log('Created temp directory:', TEMP_DIR);
  }
}

// Export constants
export { TEMP_DIR, MAX_AGE_MS };
