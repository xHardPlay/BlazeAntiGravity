# BlazeAntiGravity Extension - JavaScript Module Index

This document provides a quick overview of all JavaScript modules in the BlazeAntiGravity Chrome extension, organized by functionality.

## Project Overview

BlazeAntiGravity is a Chrome extension for content extraction and analysis on Blaze.ai social media platform. It provides popup-based tools for capturing, analyzing, and downloading media content from calendar events.

## Architecture

The codebase is organized into logical modules:

- **Controllers**: Main application logic orchestration
- **Renderers**: UI rendering and DOM manipulation
- **Services**: Business logic and external integrations
- **Handlers**: Event management and user interactions
- **Utils**: Utility functions and data processing
- **Styles**: Theming and styling management

## File Index

### Root Level Files

#### `constants.js`
Shared constants and configuration values used throughout the application.
- `EXTENSION_NAME`: Extension branding
- `SELECTORS`: CSS selectors for DOM elements
- `TIMEOUTS`: Timing constants for operations
- `LIMITS`: Size limits for data processing
- `PLATFORMS`: Supported social media platforms

#### `main.js`
Content script entry point that runs on web pages.
- Creates overlay UI for content inspection
- Updates overlay content every second
- Imports: `overlay.js`, `render.js`

#### `popup.js`
Popup script entry point for the extension popup.
- Initializes popup UI when opened
- Imports: `popupController.js`

### Controllers

#### `controllers/popupController.js`
Main controller for popup functionality.
- Orchestrates all popup operations
- Manages service initialization and coordination
- Handles tab communication and API calls
- Imports: Multiple services, renderers, handlers, utils

### Renderers

#### `renderers/overlay.js`
Creates and styles the overlay UI for content inspection.
- Generates DOM elements for the inspection overlay
- Applies base styling and positioning

#### `renderers/popupRenderer.js`
Handles rendering of the extension popup interface.
- Manages different popup states (loading, results, details)
- Renders event grids and detail views
- Handles notification messages
- Imports: `theme.js`, `constants.js`, `styleManager.js`, `eventBinder.js`, `templates.js`

#### `renderers/render.js`
Content script rendering logic for page overlays.
- Updates overlay content with extracted data
- Collects page elements (headings, links, images, etc.)
- Imports: `theme.js`, `collectors.js`

### Services

#### `services/autoPilotService.js`
Automated content extraction service.
- Performs bulk extraction of event details
- Navigates through event cards automatically
- Updates event data with extracted content

#### `services/inspectorService.js`
Element inspection and capture service.
- Manages hover inspector functionality
- Tracks mouse movements and element selection
- Captures element information for analysis

#### `services/liveScanService.js`
Real-time page scanning service.
- Monitors page changes dynamically
- Updates captured data as page content changes

#### `services/videoService.js`
Video-related operations and downloads.
- Scans pages for video content
- Handles video extraction and downloading
- Manages video player interactions
- Imports: `video_capture_module.js`

#### `services/video_capture_module.js`
Video capture utility module.
- Provides video URL extraction functions
- Handles different video embed types

### Handlers

#### `handlers/eventBinder.js`
Event binding utility for DOM elements.
- Manages event listeners for popup elements
- Provides callback management for UI interactions

#### `handlers/eventHandlers.js`
User interaction event handlers.
- Processes user actions (capture, download, navigation)
- Manages CSV export and media downloads
- Handles debug operations
- Imports: `csvExporter.js`

### Utils

#### `utils/collectors.js`
DOM element collection utilities.
- Extracts various content types from web pages
- Provides filtering and validation functions

#### `utils/csvExporter.js`
CSV export functionality.
- Converts event data to CSV format
- Handles file downloads

#### `utils/dataExtractor.js`
Main data extraction engine.
- Processes calendar events and metadata
- Extracts images, videos, and text content
- Applies limits and filtering
- Imports: `collectors.js`, `constants.js`

#### `utils/hoverInspector.js`
Hover inspection module (injected into pages).
- Tracks mouse movements over elements
- Generates CSS selectors and XPath expressions
- Sends element information to popup

### Styles

#### `styles/styleManager.js`
Dynamic CSS management.
- Adds and manages stylesheets
- Handles loading and unavailable states

#### `styles/templates.js`
HTML template functions.
- Provides template strings for UI components
- Generates consistent HTML structures

#### `styles/theme.js`
Theme and color management.
- Defines color schemes and themes
- Provides theme switching functionality

## Key Dependencies

- **Chrome Extension APIs**: `chrome.tabs`, `chrome.scripting`, `chrome.runtime`, `chrome.downloads`
- **ES6 Modules**: Modern JavaScript module system
- **DOM Manipulation**: Direct DOM access and manipulation

## Entry Points

1. **Content Script**: `main.js` - Runs on web pages
2. **Popup Script**: `popup.js` - Runs in extension popup

## Data Flow

1. User opens popup → `popupController.js` initializes
2. Capture button → `eventHandlers.js` processes request
3. Content extraction → `dataExtractor.js` processes page
4. UI updates → `popupRenderer.js` displays results
5. Services handle specialized operations (video, inspection, etc.)

This structure provides clean separation of concerns and makes the codebase maintainable and extensible.
