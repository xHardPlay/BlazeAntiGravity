import { PopupRenderer } from '../renderers/popupRenderer.js';
import { CSVExporter } from '../utils/csvExporter.js';
import { TIMEOUTS, SELECTORS } from '../constants.js';
import { EventHandlers } from '../handlers/eventHandlers.js';
import { VideoService } from '../services/videoService.js';
import { LiveScanService } from '../services/liveScanService.js';
import { InspectorService } from '../services/inspectorService.js';
import { AutoPilotService } from '../services/autoPilotService.js';

/**
 * Popup Controller - Orchestrates popup interactions and data flow
 * 
 * This is the main controller that coordinates between different services.
 * It has been refactored to delegate specific functionality to specialized services.
 */
export class PopupController {
  constructor() {
    this.container = document.getElementById('popup-container');
    this.tabId = null; // Will be set dynamically
    this.renderer = new PopupRenderer(this.container, this.tabId);
    this.events = [];
    this.capturedVideos = [];
    this.isLiveScanning = false;
    this.isHoverInspectorActive = false;
    this.capturedItems = [];
    this.serviceVersion = null;
    this.serviceMessage = null;

    // Initialize services
    this.eventHandlers = new EventHandlers(this);
    this.videoService = new VideoService(this);
    this.liveScanService = new LiveScanService(this);
    this.inspectorService = new InspectorService(this);
    this.autoPilotService = new AutoPilotService(this);

    this.bindRendererCallbacks();
    this.inspectorService.setupMessageListener();
  }

  /**
   * Updates the current active tab ID
   */
  async updateActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.tabId = tab?.id;
    // Update renderer if it needs it (it generally doesn't, but good practice)
    this.renderer.tabId = this.tabId;
    return this.tabId;
  }

  /**
   * Binds renderer callback functions
   */
  bindRendererCallbacks() {
    this.renderer.onCapture = () => this.eventHandlers.handleCapture();
    this.renderer.onEventClick = (index) => this.eventHandlers.handleEventClick(index);
    this.renderer.onBack = () => this.eventHandlers.handleBack();
    this.renderer.onBackToMain = () => this.eventHandlers.handleBackToMain();
    this.renderer.onDownloadMedia = () => this.eventHandlers.handleDownloadMedia();
    this.renderer.onOpenReels = () => this.eventHandlers.handleOpenReels();
    this.renderer.onDownloadAllCSV = () => this.eventHandlers.handleDownloadAllCSV();
    this.renderer.onDownloadCSVOnly = () => this.eventHandlers.handleDownloadCSVOnly();
    this.renderer.onDownloadAllBlazeCSV = () => this.eventHandlers.handleDownloadAllBlazeCSV();
    this.renderer.onExtractAllVideos = () => this.videoService.handleExtractAllVideos();
    this.renderer.onExtractAllDetails = () => this.autoPilotService.handleExtractAllDetails();
    this.renderer.onScanVideos = () => this.eventHandlers.handleScanVideos();
    this.renderer.onDownloadSingle = (url) => this.eventHandlers.handleDownloadSingle(url);
    this.renderer.onTestOpenCard = (eventData) => this.eventHandlers.handleTestOpenCard(eventData);
    this.renderer.onExtractVideo = (eventIndex) => this.videoService.handleExtractVideo(eventIndex);
    this.renderer.onDownloadSingleCSV = (eventData) => this.eventHandlers.handleDownloadSingleCSV(eventData);
    this.renderer.onVideoScan = () => this.videoService.handleVideoScan();
    this.renderer.onAutoPilot = () => this.autoPilotService.handleAutoPilot();
    this.renderer.onDebugDump = () => this.eventHandlers.handleDebugDump();
    this.renderer.onToggleInspector = () => this.inspectorService.handleToggleInspector();
    this.renderer.onClearCaptured = () => this.eventHandlers.handleClearCaptured();
  }

  /**
   * Initializes the popup
   */
  async init() {
    // First show loading spinner while checking service status
    this.renderer.renderInitialLoadingState();

    try {
      // Check service status
      const isServiceAvailable = await this.checkServiceStatus();

      if (isServiceAvailable) {
        // Service is available, show unavailable screen
        this.renderer.renderServiceUnavailable();
      } else {
        // Service is not available (normal operation), show main screen
        await this.initMainApplication();
      }
    } catch (error) {
      console.error('Error checking service status:', error);
      // On error, default to showing main screen
      await this.initMainApplication();
    }
  }

  /**
   * Checks service status from the API endpoint
   */
  async checkServiceStatus() {
    try {
      const response = await fetch('https://zona-virtual-cloud-backend.carlos-mdtz9.workers.dev/api/micro/daris');
      if (!response.ok) {
        // If response is not ok (e.g., 500), treat as unavailable
        return true;
      }
      const data = await response.json();

      console.log('Service status response:', data);

      if (data.status === true) {
        // Store version and message for display
        this.serviceVersion = data.version;
        this.serviceMessage = data.data?.message || '';
      }

      // Check if status is false (service unavailable) or true (service available)
      return data.status === false;
    } catch (error) {
      console.error('Error checking service status:', error);
      // On error (network failure, etc.), treat as unavailable
      return true;
    }
  }

  /**
   * Initializes the main application after service check
   */
  async initMainApplication() {
    // Update footer with service info if available
    if (this.serviceVersion && this.serviceMessage) {
      this.renderer.footerVersion = `v1.8 | Last version: ${this.serviceVersion} | ${this.serviceMessage}`;
    }

    // Initialize live scanning settings first
    await this.liveScanService.initLiveScanning();

    // Show main screen with scan button instead of auto-capturing
    this.renderer.renderMainScreen();
  }
}

export default PopupController;
