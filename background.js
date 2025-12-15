/**
 * Chrome Extension Background Script
 * Handles extension lifecycle events and messaging
 */

/**
 * Opens a persistent popup window when the extension icon is clicked
 * Passes the current active tab ID to the popup for content scripting
 */
/**
 * Opens the Side Panel when the extension icon is clicked
 */
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

chrome.action.onClicked.addListener((tab) => {
  // Optional: You can do specific logic here if needed, 
  // but setPanelBehavior handles opening usually.
});

/**
 * Handles messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'downloadImages') {
      const urls = message.urls;

      if (!Array.isArray(urls) || urls.length === 0) {
        sendResponse({ success: false, error: 'No URLs provided' });
        return;
      }

      // Process each URL for download
      urls.forEach((url, index) => {
        const filename = generateDownloadFilename(url, index);
        chrome.downloads.download({
          url: url,
          filename: filename,
          conflictAction: 'overwrite' // Overwrite if file already exists
        }).catch(error => {
          console.error(`Failed to download ${url}:`, error);
        });
      });

      sendResponse({ success: true });
    } else if (message.action === 'downloadVideo') {
      const { url, filename } = message;

      if (!url) {
        sendResponse({ success: false, error: 'No URL provided' });
        return;
      }

      // Generate filename if not provided
      const finalFilename = filename || generateDownloadFilename(url, Date.now());

      chrome.downloads.download({
        url: url,
        filename: finalFilename,
        conflictAction: 'overwrite'
      }).catch(error => {
        console.error(`Failed to download video ${url}:`, error);
      });

      sendResponse({ success: true });
    } else {
      console.warn('Unknown message action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
});

/**
 * Generates a filename for downloaded files
 * @param {string} url - The URL to extract filename from
 * @param {number} index - Index for sequential naming
 * @returns {string} Generated filename
 */
function generateDownloadFilename(url, index) {
  // Extract file extension from URL
  let ext = 'jpg'; // Default for images
  let folder = 'RelaxingPhotos';

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDotIndex = pathname.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      ext = pathname.substring(lastDotIndex + 1).toLowerCase();
      // Sanitize extension and determine folder
      if (/^[a-z0-9]+$/i.test(ext)) {
        // Check if it's a video extension
        const videoExts = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'];
        if (videoExts.includes(ext)) {
          folder = 'Videos';
          if (!['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext)) {
            ext = 'mp4'; // Default video format
          }
        } else if (!['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
          ext = 'jpg'; // Default image format
        }
      } else {
        ext = 'jpg';
      }
    }

    const fileType = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'].includes(ext) ? 'video' : 'image';

    // Try to extract original filename
    const filename = pathname.split('/').pop().split('?')[0];
    if (filename && filename.includes('.') && filename.length < 100) {
      return `${folder}/${filename}`;
    }

    // Fallback to generic naming
    const prefix = fileType === 'video' ? 'video' : 'image';
    const finalIndex = typeof index === 'number' && index >= 0 ? index + 1 : Date.now();
    return `${folder}/${prefix}_${finalIndex}.${ext}`;

  } catch (error) {
    console.warn('Error parsing URL for filename:', error);
    // Ultimate fallback
    return `Downloads/file_${Date.now()}.jpg`;
  }
}
