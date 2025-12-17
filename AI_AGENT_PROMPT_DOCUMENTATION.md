# AgencySMM (Blaze AntiGravity) - Comprehensive Technical Documentation for AI Agents

## Project Overview

**AgencySMM** is a sophisticated Chrome extension designed for professional social media content extraction and management. The extension targets **Blaze.ai** platform to scrape calendar events, social media posts, images, videos, and metadata with high precision and efficiency.

### Core Purpose
- Extract structured data from social media calendar events
- Download high-resolution media content (images/videos)
- Export data to CSV for reporting and analysis
- Provide real-time content monitoring capabilities
- Support bulk operations and automated workflows

## Technical Architecture

### Manifest V3 Chrome Extension
- **Side Panel Interface**: Modern UI replacing traditional popup
- **Service Worker**: Background processing for downloads and messaging
- **Content Scripts**: Dynamic injection for DOM scraping
- **Permissions**: `activeTab`, `downloads`, `scripting`, `storage`, `tabs`, `sidePanel`

### Modular Architecture
```
/
├── manifest.json              # Extension configuration
├── background.js              # Service worker (downloads/messaging)
├── popup.html                # Side panel entry point
├── js/
│   ├── popup.js              # Entry point initialization
│   ├── controllers/
│   │   └── popupController.js # Main orchestration
│   ├── services/             # Business logic modules
│   │   ├── videoService.js   # Video operations
│   │   ├── liveScanService.js # Real-time scanning
│   │   ├── inspectorService.js # Element inspection
│   │   └── autoPilotService.js # Bulk operations
│   ├── handlers/             # Event handling
│   │   ├── eventHandlers.js  # User interactions
│   │   └── eventBinder.js    # DOM event binding
│   ├── renderers/
│   │   └── popupRenderer.js  # UI rendering
│   ├── styles/               # Theming and styling
│   │   ├── styleManager.js   # CSS management
│   │   ├── theme.js          # Color schemes
│   │   └── templates.js      # HTML templates
│   └── utils/                # Utilities
│       ├── dataExtractor.js  # Core scraping logic
│       ├── collectors.js     # DOM collection helpers
│       ├── csvExporter.js    # Data export
│       └── hoverInspector.js # Element inspection
└── constants.js              # Configuration and selectors
```

## Key Features & Functionality

### 1. Content Extraction Engine
**Primary Function**: Extract structured data from Blaze.ai calendar events

#### Data Structures Extracted:
```javascript
{
  events: [{
    label: "Reel", // Event type
    platforms: ["Instagram", "Facebook"], // Target platforms
    timestamp: "2:30 PM", // Publication time
    description: "Post content text...", // Full description
    imageSrc: "https://...", // High-res image URL
    videoSrc: "VIDEO_DETECTED", // Video presence indicator
    hasVideo: true, // Boolean video flag
    videoDuration: "00:30", // Video length
    isNew: false, // New content badge
    badgeText: "", // Special badges
    canOpenPreview: true, // Preview capability
    brandColor: "#hex", // Brand color CSS variable
    imageWidth: 1080, // Image dimensions
    imageHeight: 1080,
    aspectRatio: "1:1",
    cardIndex: 1, // Position in feed
    cardClasses: "css-classes", // DOM classes
    eventUrl: "https://blaze.ai/..." // Direct link
  }],
  headings: [...], // Page headings
  paragraphs: [...], // Text content
  links: [...], // External links
  images: [...], // All images with context
  videos: [...], // Video elements
  tables: [...], // Tabular data
  lists: [...] // Structured lists
}
```

#### Selectors & Targets:
```javascript
SELECTORS = {
  MORE_BUTTONS: '.TruncatedText_moreButton__1d231',
  CALENDAR_EVENTS: '.CalendarEventCard_eventContainer__335fa',
  SOCIAL_PLATFORMS: {
    FACEBOOK: 'Icon_facebook__d7da4',
    LINKEDIN: 'Icon_linkedIn__d7da4',
    INSTAGRAM: 'Icon_instagram__d7da4',
    YOUTUBE: 'Icon_youtube__d7da4',
    X: 'Icon_xplatform__d7da4'
  },
  VIDEO_PLAYER: '.VideoPlayer_videoContainer__cfc97 video'
}
```

### 2. Media Download System
**Background Service Worker** handles file downloads with intelligent naming:

#### Download Logic:
- **Images**: Saved to `RelaxingPhotos/` folder
- **Videos**: Saved to `Videos/` folder
- **Naming**: Extract filename from URL or generate sequential names
- **Formats**: Support for JPG, PNG, MP4, WebM, etc.
- **Conflict Resolution**: Overwrite existing files

#### Message Protocol:
```javascript
// Image batch download
{
  action: 'downloadImages',
  urls: ['https://...', 'https://...']
}

// Single video download
{
  action: 'downloadVideo',
  url: 'https://...',
  filename: 'custom-name.mp4'
}
```

### 3. CSV Export Engine
**Structured Data Export** for external processing:

#### CSV Structure:
- **Columns**: Platform, Timestamp, Description, Image URL, Video URL, etc.
- **Encoding**: UTF-8 with proper escaping
- **Headers**: Descriptive column names
- **Multiple Exports**: Single event or bulk export

### 4. Live Scanning System
**Real-time Content Monitoring**:

#### Features:
- **Interval Scanning**: Configurable polling intervals
- **Content Comparison**: Detect new/changed content
- **Smart Updates**: Only update when content changes
- **Performance Optimized**: Efficient DOM queries

#### Configuration:
```javascript
{
  scanInterval: 30000, // 30 seconds
  enabled: false,
  lastScanTime: Date.now()
}
```

### 5. Video Processing Module
**Advanced Video Detection & Download**:

#### Video Types Supported:
- **Direct MP4/WebM**: Native video elements
- **Platform Embeds**: YouTube, Vimeo, Cloudinary
- **Stream Detection**: Various video player implementations

#### Video Metadata:
```javascript
{
  src: 'https://...',
  type: 'youtube|vimeo|direct',
  thumbnail: 'https://...',
  duration: '00:30',
  filename: 'extracted-name.mp4'
}
```

### 6. Hover Inspector
**Element Analysis Tool**:

#### Captured Data:
- **Tag Name**: HTML element type
- **CSS Selector**: Unique selector path
- **XPath**: XML document path
- **Text Content**: Element text
- **Bounding Rect**: Position/dimensions

### 7. Auto Pilot System
**Bulk Processing Automation**:

#### Operations:
- **Sequential Processing**: Process events one by one
- **Delay Management**: Respectful timing between operations
- **Progress Tracking**: Visual feedback
- **Error Handling**: Continue on individual failures

## UI/UX Design System

### Theme Management
**Dynamic Theming** with professional gradients:

```javascript
const THEMES = {
  dark: {
    primary: '#1a1a1a',
    secondary: '#2d2d2d',
    accent: '#007bff',
    text: '#ffffff'
  },
  light: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    accent: '#007bff',
    text: '#212529'
  }
}
```

### Component Templates
**Modular HTML Templates** for consistent UI:

- **Event Cards**: Structured display of extracted content
- **Action Buttons**: Consistent styling for all interactions
- **Loading States**: Professional spinners and progress indicators
- **Notifications**: Toast-style messages with animations

### Responsive Design
**Side Panel Optimization**:
- **Width**: Adaptive to content
- **Height**: Full viewport utilization
- **Overflow**: Smooth scrolling
- **Typography**: Inter font family for modern look

## Development Patterns & Best Practices

### Code Organization
1. **Single Responsibility**: Each service/module has one purpose
2. **Dependency Injection**: Services injected into controller
3. **Event-Driven**: Loose coupling through callbacks
4. **Async/Await**: Modern JavaScript patterns
5. **Error Handling**: Comprehensive try/catch blocks

### Performance Optimizations
1. **DOM Query Caching**: Reuse element references
2. **Debounced Operations**: Prevent excessive API calls
3. **Memory Management**: Clean up event listeners
4. **Lazy Loading**: Load features on demand

### Security Considerations
1. **Content Script Isolation**: No direct DOM access from popup
2. **Permission Management**: Minimal required permissions
3. **URL Validation**: Sanitize all external links
4. **Data Sanitization**: Clean extracted content

## API Integration Points

### Service Status Check
```javascript
const response = await fetch('https://zona-virtual-cloud-backend.carlos-mdtz9.workers.dev/api/micro/daris');
const status = await response.json();
// { status: true/false, version: "1.0", data: { message: "..." } }
```

### Extension Messaging
**Bidirectional Communication**:
- **Popup ↔ Background**: Download requests
- **Popup ↔ Content Script**: Data extraction
- **Content Script ↔ Background**: Cross-origin requests

## Testing & Quality Assurance

### Manual Testing Checklist
- [ ] Content extraction accuracy
- [ ] Media download functionality
- [ ] CSV export formatting
- [ ] Live scanning reliability
- [ ] Video processing
- [ ] Error handling
- [ ] UI responsiveness

### Debug Features
- **Debug Dump**: Export internal state for analysis
- **Console Logging**: Comprehensive debug information
- **Inspector Tools**: Element analysis capabilities

## Deployment & Distribution

### Build Process
1. **Code Organization**: Modular ES6+ structure
2. **No Bundling**: Direct browser execution
3. **Asset Management**: Static file serving

### Chrome Web Store
- **Manifest V3**: Modern extension standard
- **Permissions**: Justified and minimal
- **Content Rating**: Professional use only

## Future Enhancement Roadmap

### Planned Features
1. **AI Integration**: Content analysis and caption generation
2. **Cross-Browser**: Firefox/Safari support
3. **Advanced Filtering**: Content type and platform filters
4. **Batch Processing**: Queue management system
5. **Cloud Sync**: Cross-device content synchronization

### Architecture Improvements
1. **Framework Migration**: React/Vue integration
2. **State Management**: Centralized data flow
3. **Plugin System**: Extensible module architecture
4. **Performance Monitoring**: Usage analytics

## Troubleshooting Guide

### Common Issues
1. **Content Not Extracting**: Check Blaze.ai DOM changes
2. **Downloads Failing**: Verify permissions and network
3. **UI Not Loading**: Check service status endpoint
4. **Videos Not Detected**: Update video player selectors

### Debug Steps
1. **Console Logs**: Check for JavaScript errors
2. **Network Tab**: Monitor API calls and downloads
3. **Application Tab**: Inspect extension storage
4. **Elements Tab**: Verify DOM selectors

## Conclusion

This documentation provides AI agents with comprehensive technical specifications to recreate or enhance the AgencySMM extension. The modular architecture, detailed feature descriptions, and code patterns enable accurate reconstruction with modern development practices.

**Key Takeaways for Recreation**:
- Focus on modular service architecture
- Implement robust content extraction with flexible selectors
- Build comprehensive media download system
- Create intuitive side panel interface
- Include extensive error handling and logging
- Follow modern Chrome extension patterns (Manifest V3)
