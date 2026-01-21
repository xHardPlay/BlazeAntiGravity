# CLAUDE.md - BlazeAntiGravity

## Project Overview

**BlazeAntiGravity** (AgencySMM for Blaze) is a Chrome Extension (Manifest V3) that streamlines social media content workflows by extracting calendar events, posts, images, and videos from Blaze.ai.

**Version:** 3.0
**Primary Domain:** `https://*.blaze.ai/*`

## Tech Stack

- **Language:** Vanilla JavaScript (ES6+ Modules)
- **Framework:** None (lightweight, modular vanilla JS)
- **Build Tool:** None - native ES Modules
- **Extension API:** Chrome Extension API (Manifest V3)
- **Storage:** Chrome Storage API
- **External Libraries:** jszip.min.js (file compression)

## Project Structure

```
BlazeAntiGravity/
├── manifest.json              # Extension configuration (MV3)
├── background.js              # Service Worker (downloads, messaging)
├── popup.html                 # Main UI entry point (side panel)
├── js/
│   ├── popup.js               # Entry point (imports PopupController)
│   ├── constants/             # Configuration
│   │   ├── SelectorConstants.js   # DOM selectors for Blaze.ai
│   │   ├── WorkflowConfig.js      # Timing, delays, limits
│   │   └── ErrorMessages.js       # Error messages
│   ├── controllers/
│   │   └── popupController.js     # Main orchestrator
│   ├── handlers/              # Lazy-loaded action handlers
│   │   ├── CaptureHandler.js      # Data capture workflow
│   │   ├── EventClickHandler.js   # Event card interactions
│   │   ├── ExportHandler.js       # Export operations
│   │   ├── VideoScanHandler.js    # Video scanning
│   │   └── eventHandlers.js       # Handler coordinator
│   ├── services/              # Feature services
│   │   ├── autoPilotService.js    # Auto content extraction
│   │   ├── inspectorService.js    # DOM inspection
│   │   ├── liveScanService.js     # Real-time scanning
│   │   └── videoService.js        # Video handling
│   ├── renderers/             # UI components
│   │   └── popupRenderer.js       # Main UI renderer
│   ├── styles/                # Theme system
│   │   ├── theme.js               # Colors, spacing
│   │   └── templates.js           # HTML templates
│   └── utils/                 # Utilities
│       ├── dataExtractor.js       # Main scraping logic
│       ├── PlatformDetector.js    # Social platform detection
│       ├── csvExporter.js         # CSV generation
│       ├── DownloadManager.js     # Download coordination
│       ├── VideoProcessor.js      # Video-event matching
│       └── video_capture_module.js # Video detection
```

## Architecture

### Component Flow
```
User Action → Handler → Service → Utility → DOM/API
     ↓
UI Renderer ← Controller ← Results
```

### Key Patterns
- **Lazy Loading:** Handlers loaded on-demand via dynamic imports
- **Service Pattern:** Specialized services for each feature domain
- **Event-Driven:** Chrome message passing for cross-context communication
- **Selector-Based Scraping:** Centralized DOM selectors in constants

## Key Files to Understand

| File | Purpose |
|------|---------|
| `js/controllers/popupController.js` | Main orchestrator, service initialization |
| `js/utils/dataExtractor.js` | Core scraping logic for Blaze.ai |
| `js/utils/PlatformDetector.js` | Detects Facebook, IG, YouTube, X, LinkedIn |
| `js/services/videoService.js` | Video detection and processing |
| `js/utils/csvExporter.js` | CSV export generation |
| `background.js` | Downloads, message handling |

## Common Tasks

### Adding a New Platform
1. Update `SelectorConstants.js` with platform-specific selectors
2. Add detection logic in `PlatformDetector.js` (CSS class + SVG pattern)
3. Update `csvExporter.js` if new column needed

### Modifying Extraction Logic
1. Check `WorkflowConfig.js` for timing adjustments
2. Main logic in `dataExtractor.js` → `extractEventData()`
3. DOM selectors in `SelectorConstants.js`

### Adding New UI Feature
1. Add template in `js/styles/templates.js`
2. Create handler in `js/handlers/`
3. Register in `eventHandlers.js`
4. Bind callbacks in `popupController.js`

### Debugging
- Use Inspector Service (hover tool) for DOM analysis
- Console logs prefixed with emojis (🔍, ✅, ❌)
- Check `chrome.runtime.lastError` for extension errors

## Development Commands

```bash
# Load unpacked extension
# Chrome → Extensions → Load unpacked → Select this folder

# No build step needed - native ES modules

# Create deployment package
# Zip the folder excluding .git, .claude, *.md
```

## Important Constants

### Timing (WorkflowConfig.js)
- Text expansion delay: 800ms
- Checkbox click delay: 150ms
- Retry timeout: 10s
- Download chunk size: 10 concurrent

### Selectors (SelectorConstants.js)
- Event container: `[class*="CalendarEventCard_eventContainer"]`
- Platform icons: `[class*="Icon_platform"]`
- Video elements: `[class*="VideoPlayer_videoContainer"]`

## Chrome APIs Used

- `chrome.scripting.executeScript()` - Content script injection
- `chrome.downloads.download()` - File downloads
- `chrome.storage.local` - Persistent settings
- `chrome.tabs` - Tab management
- `chrome.runtime.onMessage` - Cross-context messaging
- `chrome.sidePanel` - Side panel UI

## External Dependencies

- **API Endpoint:** `https://zona-virtual-cloud-backend.vercel.app/api/`
- **Media CDN:** Cloudinary (`https://*.cloudinary.com/*`)

---

# Areas for Improvement

## 1. Code Quality & Maintainability

### 1.1 TypeScript Migration (High Priority)
**Current:** Vanilla JavaScript with no type checking
**Problem:** Runtime errors, difficult refactoring, poor IDE support
**Recommendation:** Migrate to TypeScript incrementally
- Start with `.d.ts` declaration files for existing modules
- Convert utilities first (`dataExtractor.js`, `PlatformDetector.js`)
- Add strict type checking for Chrome APIs

### 1.2 Inconsistent Module Patterns
**Current:** Mix of class-based and function-based modules
**Examples:**
- `DataExtractor` - class with instance methods
- `CSVExporter` - static methods only
- `collectors.js` - plain functions

**Recommendation:** Standardize on one pattern (prefer classes for stateful, functions for pure utilities)

### 1.3 Dead Code & Legacy Files
**Current:** Several deprecated/unused files exist
- `js/constants.js` (replaced by `/constants/` folder)
- `js/main.js` and `js/renderers/render.js` (alternate entry points)
- `js/renderers/overlay.js` (unused overlay system)

**Recommendation:** Remove dead code or document their purpose

## 2. Error Handling

### 2.1 Silent Failures
**Current:** Many catch blocks only log to console
```javascript
catch (error) {
  console.error('Error:', error);
}
```

**Recommendation:**
- Implement centralized error handling service
- Show user-friendly error messages
- Add error recovery mechanisms

### 2.2 No Validation Layer
**Current:** Direct DOM access without validation
**Recommendation:** Add input validation utilities
```javascript
// Suggested pattern
const validateSelector = (selector) => {
  const element = document.querySelector(selector);
  if (!element) throw new SelectorNotFoundError(selector);
  return element;
};
```

## 3. Testing

### 3.1 No Test Suite (Critical)
**Current:** Zero automated tests
**Recommendation:**
- Add unit tests with Jest or Vitest
- Test utilities independently (`PlatformDetector`, `CSVExporter`)
- Add integration tests for Chrome API interactions
- Consider Playwright for E2E testing

### 3.2 No Mock Data
**Recommendation:** Create mock Blaze.ai DOM structures for testing without live site

## 4. Performance

### 4.1 No Bundle Optimization
**Current:** Multiple HTTP requests for each module
**Recommendation:**
- Consider Vite or esbuild for bundling
- Tree-shake unused code
- Minify for production

### 4.2 Inefficient DOM Queries
**Current:** Repeated `querySelectorAll` calls in loops
**Recommendation:** Cache DOM queries, use more specific selectors

### 4.3 No Debouncing/Throttling
**Current:** Live scan runs every 1 second unconditionally
**Recommendation:** Add debouncing for user actions, throttle continuous scans

## 5. Security

### 5.1 Eval-like Patterns
**Current:** `chrome.scripting.executeScript` with inline functions
**Recommendation:** Move content scripts to separate files, use `files` instead of `func`

### 5.2 No CSP Headers
**Recommendation:** Add Content Security Policy in manifest.json

### 5.3 API Key Exposure
**Current:** External API endpoint hardcoded
**Recommendation:** Move to environment-based configuration

## 6. Architecture

### 6.1 Tight Coupling
**Current:** `PopupController` directly instantiates all services
**Recommendation:** Implement dependency injection pattern

### 6.2 No State Management
**Current:** State scattered across controller properties
**Recommendation:** Centralized state store (simple pub/sub pattern)

### 6.3 Missing Interfaces
**Recommendation:** Define clear interfaces for:
- Event data structure
- Video metadata structure
- Export configuration

## 7. User Experience

### 7.1 Limited Feedback
**Current:** Basic loading states
**Recommendation:**
- Add progress indicators for multi-step operations
- Show extraction progress (e.g., "Processing 5 of 12 events")
- Add toast notifications for background operations

### 7.2 No Offline Support
**Recommendation:** Queue downloads for offline, sync when connected

### 7.3 No Keyboard Shortcuts
**Recommendation:** Add keyboard navigation for power users

## 8. Documentation

### 8.1 No JSDoc Comments
**Current:** Functions lack parameter/return documentation
**Recommendation:** Add JSDoc to all public methods

### 8.2 No API Documentation
**Recommendation:** Document expected DOM structure from Blaze.ai

### 8.3 No Changelog
**Recommendation:** Add CHANGELOG.md tracking version changes

## 9. DevOps

### 9.1 No CI/CD Pipeline
**Recommendation:**
- GitHub Actions for linting/testing on PR
- Automated version bumping
- Chrome Web Store deployment automation

### 9.2 No Linting
**Current:** No ESLint configuration
**Recommendation:** Add ESLint + Prettier with strict rules

### 9.3 No Version Sync
**Current:** Version in manifest.json manually updated
**Recommendation:** Single source of truth for version

## 10. Specific Code Improvements

### 10.1 PlatformDetector.js
- Add confidence scoring to detection
- Cache detection results per element
- Add fallback detection for new Blaze.ai UI changes

### 10.2 dataExtractor.js
- Split into smaller, focused extractors
- Add retry mechanism for failed extractions
- Implement extraction validation

### 10.3 background.js
- Add download queue with priority
- Implement download resume capability
- Add storage cleanup for old downloads

---

## Priority Order for Improvements

1. **Critical:** Add basic test suite
2. **High:** TypeScript migration (start with types)
3. **High:** Centralized error handling
4. **Medium:** ESLint + Prettier setup
5. **Medium:** Bundle optimization
6. **Medium:** Remove dead code
7. **Low:** CI/CD pipeline
8. **Low:** Keyboard shortcuts
9. **Low:** Offline support
