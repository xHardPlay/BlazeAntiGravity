# AgencySMM (Antigravity for Blaze) - Project Documentation

## 1. Project Overview
**AgencySMM** is a Chrome Extension designed to streamline social media content workflows. It allows users to extract (scrape) calendar events, social media posts, images, and videos from supported websites (primarily **Blaze.ai**).

**Key Features:**
*   **Content Extraction**: Scrapes post data including text, timestamps, platforms (FB, LinkedIn, IG, etc.), and media URLs.
*   **Media Downloader**: Downloads high-resolution images and videos directly from the browser. Supports direct MP4s and embedded players (YouTube, Vimeo, Cloudinary).
*   **CSV Export**: Exports extracted data into structured CSV files for reporting or external use.
*   **Live Scanning**: (Experimental) Capabilities for real-time video detection.

## 2. Technical Architecture
The project is built on **Manifest V3** using modern **Vanilla JavaScript (ES6+)**. It avoids complex build steps (like Webpack) in favor of native ES Modules, making it lightweight and easy to modify ("vibe coding" friendly).

### High-Level Components
1.  **Popup (UI)**: The primary interface. It communicates with the active tab to trigger scraping and displays results.
2.  **Background Service**: Handles persistent tasks like file downloads and cross-origin messaging.
3.  **Content Analysis**: Scripts injected dynamically into the active tab to read the DOM.

### Data Flow
1.  **User Trigger**: User clicks "Get Blaze Images" in the popup.
2.  **Controller Action**: `PopupController` injects `DataExtractor` into the active tab.
3.  **Extraction**: `DataExtractor` traverses the DOM using `collectors.js` helpers to find event cards and media.
4.  **Display**: Extracted data is returned to the popup and rendered via `PopupRenderer`.
5.  **Action**: User can download media (sends message to `background.js`) or export CSV (handled by `csvExporter.js`).

## 3. Directory Structure
```
/
├── manifest.json         # Extension configuration (Permissions, Entry points)
├── background.js         # Service Worker (Downloads, Messaging)
├── popup.html            # Main UI entry point
├── js/
│   ├── popup.js             # Popup entry file (bootstraps controller)
│   ├── popupController.js   # Core logic: manages UI state and coordinates actions
│   ├── popupRenderer.js     # UI rendering logic (HTML generation, Styles)
│   ├── dataExtractor.js     # Main scraping class (High-level extraction logic)
│   ├── collectors.js        # DOM helper functions (Low-level scraping helpers)
│   ├── csvExporter.js       # JSON to CSV conversion and download
│   ├── video_capture_module.js # Specialized logic for finding video players
│   ├── theme.js             # UI theming constants
│   └── constants.js         # Config, Selectors, and Timeouts
```

## 4. Key Modules Detail

### `background.js`
*   **Role**: Service Worker.
*   **Key Functions**:
    *   `chrome.downloads.download`: Handles physical file downloads to bypass CORS or naming limitations in content scripts.
    *   `generateDownloadFilename`: Logic to name files intelligently based on URL/Content type.

### `js/popupController.js`
*   **Role**: The "Brain" of the popup.
*   **Key Functions**:
    *   `handleCapture()`: Injects scraping scripts.
    *   `handleDownloadMedia()`: Batches download requests to background.
    *   `getContentScriptFunction()`: Returns the function body to be executed in the page context. *Note: meaningful logic is often inline here or imports `DataExtractor`.*

### `js/dataExtractor.js`
*   **Role**: The "Scraper".
*   **Logic**:
    *   Targeted selectors for "CalendarEventCard" components.
    *   Extracts metadata: Platforms (classes like `Icon_facebook...`), Timestamps, Descriptions.
    *   It expands truncated text (clicks "See more") before scraping.

### `js/video_capture_module.js`
*   **Role**: Video Detective.
*   **Logic**:
    *   Scans for `<video>` tags, `<iframe>` embeds, and specific cloud provider URLs (Cloudinary).
    *   Differentiates between direct text/blob URLs and platform embeds (YouTube/Vimeo).

## 5. Setup & Development
1.  **Install**:
    *   Go to `chrome://extensions/`.
    *   Enable **Developer Mode**.
    *   Click **Load unpacked**.
    *   Select this project folder.
2.  **Modify**:
    *   Edit files in your IDE.
    *   **Click the refresh icon** on the extension card in `chrome://extensions/` to apply changes (HTML/CSS changes might reflect immediately, but JS logic usually requires a reload).
3.  **Debugging**:
    *   **Popup**: Right-click the extension icon -> "Inspect Popup" to see the DevTools for the popup.
    *   **Content Script**: Open DevTools (F12) on the web page itself to see logs from injected scripts.
    *   **Background**: Click "service worker" link in `chrome://extensions` to debug background.js.

## 6. Future Improvements (Vibe Coding Wishlist)
*   **AI Integration**: Use LLMs to parse unstructured post text or auto-generate captions.
*   **Cross-Browser**: Port to Firefox/Edge (mostly compatible, check `browser` vs `chrome` namespace).
*   **Framework**: meaningful "vibe" upgrade could involve moving to React/Vue for the popup if complexity grows, though Vanilla JS is fastest for this size.
