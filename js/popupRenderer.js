import { getColors, setOverlayStyles } from './theme.js';
import { TIMEOUTS } from './constants.js';

/**
 * Popup UI Renderer - Handles rendering and event binding for the popup
 */
export class PopupRenderer {
  constructor(container, tabId) {
    this.container = container;
    this.tabId = tabId;
    this.currentData = null;
    this.events = [];
    this.onToggleInspector = null;
    this.onClearCaptured = null;
  }

  /**
   * Renders the initial loading state with spinner
   */
  renderInitialLoadingState() {
    // Add custom CSS for the professional UI
    this.addCustomStyles();

    this.container.innerHTML = `
        <div class="extension-popup">
          <div class="popup-header">
            <div class="logo-section">
              <div class="logo-text">AgencySMM</div>
            </div>
            <div class="subtitle">Checking service status...</div>
          </div>

          <div class="main-content">
            <div class="loading-section">
              <div class="loading-spinner"></div>
              <div class="loading-text">Cargando...</div>
            </div>
          </div>

          <div class="popup-footer">
            <div class="version">v1.8</div>
          </div>
        </div>
      </div>
    `;

    this.addLoadingStyles();
  }

  /**
   * Renders service unavailable screen
   */
  renderServiceUnavailable() {
    // Add custom CSS for the professional UI
    this.addCustomStyles();

    this.container.innerHTML = `
        <div class="extension-popup">
          <div class="popup-header">
            <div class="logo-section">
              <div class="logo-text">AgencySMM</div>
            </div>
            <div class="subtitle">Service Status</div>
          </div>

          <div class="main-content">
            <div class="unavailable-section">
              <div class="unavailable-icon">⚠️</div>
              <div class="unavailable-title">El Servicio no esta disponible momentaneamente</div>
              <div class="unavailable-message">comunicate con CarlosEzequielCenturion@gmail.com</div>
            </div>
          </div>

          <div class="popup-footer">
            <div class="version">v1.8</div>
          </div>
        </div>
      </div>
    `;

    this.addUnavailableStyles();
  }

  /**
   * Renders the main application state
   */
  renderLoadingState() {
    this.addCustomStyles();

    this.container.innerHTML = `
        <div class="extension-popup">
          <div class="popup-header">
            <div class="logo-section">
              <div class="logo-text">AgencySMM</div>
            </div>
            <div class="subtitle">Auto-Scanning Active Page...</div>
          </div>

        <div class="main-content">
          <div class="loading-section">
             <div class="loading-spinner"></div>
             <div class="loading-text">Analyzing page content...</div>
          </div>
        </div>

        <div class="popup-footer">
          <div class="version">v2.0 Auto-Pilot</div>
        </div>
      </div>
    `;

    // Ensure loading styles are present
    this.addLoadingStyles();
  }

  /**
   * Binds auto pilot button
   */
  bindAutoPilot(callback) {
    this.bindButton('autopilot-btn', callback);
  }

  /**
   * Adds loading spinner styles
   */
  addLoadingStyles() {
    if (document.getElementById('loading-styles')) return;

    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
      .loading-section {
        text-align: center;
        padding: 40px 20px;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255,255,255,0.1);
        border-top: 4px solid #ffffff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px auto;
      }

      .loading-text {
        font-size: 16px;
        opacity: 0.9;
        font-weight: 500;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Adds service unavailable styles
   */
  addUnavailableStyles() {
    if (document.getElementById('unavailable-styles')) return;

    const style = document.createElement('style');
    style.id = 'unavailable-styles';
    style.textContent = `
      .unavailable-section {
        text-align: center;
        padding: 40px 20px;
      }

      .unavailable-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.8;
      }

      .unavailable-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 12px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }

      .unavailable-message {
        font-size: 14px;
        opacity: 0.8;
        line-height: 1.4;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Adds custom CSS styles for professional UI
   */
  addCustomStyles() {
    if (document.getElementById('extension-popup-styles')) return;

    const style = document.createElement('style');
    style.id = 'extension-popup-styles';
    style.textContent = `
      .extension-popup {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 600px;
        color: #ffffff;
        padding: 0;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        position: relative;
      }

      .popup-header {
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
        padding: 24px;
        text-align: center;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }

      .logo-section {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
      }

      .logo-icon {
        font-size: 28px;
        margin-right: 12px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      }

      .logo-text {
        font-size: 20px;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }

      .subtitle {
        font-size: 14px;
        opacity: 0.8;
        font-weight: 300;
      }

      .main-content {
        padding: 32px;
      }

      .welcome-section {
        text-align: center;
        margin-bottom: 32px;
      }

      .welcome-section h2 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }

      .welcome-section p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }

      .action-section {
        margin-bottom: 32px;
      }

      .capture-area {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        backdrop-filter: blur(8px);
      }

      .capture-instructions {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
      }

      .instruction-icon {
        font-size: 24px;
        margin-right: 12px;
      }

      .instruction-text {
        font-size: 14px;
        opacity: 0.9;
        max-width: 200px;
      }

      .capture-button {
        background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
        border: none;
        border-radius: 10px;
        padding: 16px 32px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        font-size: 16px;
        font-weight: 600;
        color: white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        text-decoration: none;
      }

      .capture-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        background: linear-gradient(135deg, #ff5252 0%, #ffb74d 100%);
      }

      .button-icon {
        margin-right: 8px;
        font-size: 18px;
      }

      .live-scan-toggle {
        margin: 16px 0;
        text-align: center;
      }

      .toggle-label {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: rgba(255,255,255,0.9);
      }

      .toggle-label input[type="checkbox"] {
        display: none;
      }

      .toggle-slider {
        position: relative;
        width: 44px;
        height: 24px;
        background: rgba(255,255,255,0.3);
        border-radius: 12px;
        margin: 0 10px;
        transition: background-color 0.3s ease;
      }

      .toggle-slider::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .toggle-label input[type="checkbox"]:checked + .toggle-slider {
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      }

      .toggle-label input[type="checkbox"]:checked + .toggle-slider::before {
        transform: translateX(20px);
      }

      .toggle-text {
        user-select: none;
      }

      .features-preview {
        display: flex;
        justify-content: space-around;
        margin-top: 24px;
      }

      .feature-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        opacity: 0.8;
      }

      .feature-icon {
        font-size: 20px;
        margin-bottom: 4px;
      }

      .feature-text {
        font-size: 12px;
        font-weight: 500;
      }

      .popup-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(255,255,255,0.05);
        padding: 12px 24px;
        text-align: center;
        border-top: 1px solid rgba(255,255,255,0.1);
      }

      .version {
        font-size: 11px;
        opacity: 0.6;
        font-weight: 300;
      }

      .video-scan-area {
        margin-top: 16px;
        text-align: center;
      }

      .video-scan-button {
        background: linear-gradient(135deg, #ff6b6b 0%, #9c88ff 100%);
        border: none;
        border-radius: 10px;
        padding: 12px 24px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        font-size: 14px;
        font-weight: 600;
        color: white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        text-decoration: none;
      }

      .video-scan-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        background: linear-gradient(135deg, #ff5252 0%, #8c7ae6 100%);
      }

      .video-icon {
        margin-right: 8px;
        font-size: 16px;
      }

      .video-description {
        margin-top: 8px;
        font-size: 12px;
        opacity: 0.8;
      }


    `;

    document.head.appendChild(style);
  }

  /**
   * Renders error state
   */
  renderErrorState(message, onRetry) {
    const { btnBg, btnColor } = getColors();
    this.container.innerHTML = `
      <div>Error extracting data: ${message}</div>
      <div style="text-align: center;">
        <button id="retry-btn" style="padding: 5px 10px; background-color: ${btnBg}; color: ${btnColor}; border: 1px solid #ccc; border-radius: 5px; cursor: pointer;">
          Retry Capture
        </button>
      </div>
    `;

    this.bindButton('retry-btn', onRetry);
  }

  /**
   * Renders the main popup content with extracted data
   */
  renderDataGrid(data) {
    this.currentData = data;
    this.events = data.events;

    const siteName = 'Current Tab';
    const { btnBg, btnColor, linkColor } = getColors();

    this.addCustomStyles();

    let html = `
        <div class="extension-popup">
          <div class="popup-header">
            <div class="logo-section">
              <div class="logo-icon">🎯</div>
              <div class="logo-text">AgencySMM</div>
            </div>
            <div class="subtitle">Professional  Content Extractor Demo Version</div>
          </div>

        <div class="results-content">
          <div class="results-header">
            <div class="results-title">
              <span class="results-icon">📊</span>
              <span class="results-text">Extraction Results</span>
            </div>
            <div class="empty-state-actions">
            <button id="capture-btn" class="refresh-button">
              <span class="refresh-icon">🔄</span>
              <span class="refresh-text">Rescan</span>
            </button>
            <button id="debug-dump-btn" class="action-button secondary" style="margin-top: 10px; background: #6c757d;">
              <span class="action-icon">🐞</span>
              Download Site Debug Info
            </button>
            <button id="autopilot-btn" class="autopilot-button">
                <span class="refresh-icon">✈️</span>
                <span class="refresh-text">Auto Pilot</span>
              </button>
              <button id="inspector-btn" class="inspector-button" style="background: linear-gradient(135deg, #f39c12 0%, #d35400 100%); margin-left: 8px;">
                <span class="refresh-icon">🔍</span>
                <span class="refresh-text">Inspector</span>
              </button>
            </div>
          </div>
          <div id="inspector-results" style="display: none; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px; font-family: monospace; font-size: 12px;">
            <div style="font-weight: bold; margin-bottom: 5px; color: #3498db;">HOVER INSPECTOR ACTIVE</div>
            <div style="margin-bottom: 5px;"><strong style="color: #ccc;">Tag:</strong> <span id="insp-tag" style="color: #fff;">-</span></div>
            <div style="margin-bottom: 5px;"><strong style="color: #ccc;">Selector:</strong> <div id="insp-selector" style="color: #e67e22; word-break: break-all; margin-top: 2px;">-</div></div>
            <div style="margin-bottom: 5px;"><strong style="color: #ccc;">XPath:</strong> <div id="insp-xpath" style="color: #2ecc71; word-break: break-all; margin-top: 2px;">-</div></div>
          </div>

          <div id="captured-items-container" style="display: none; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="font-weight: bold; color: #fff;">Captured Items (<span id="captured-count">0</span>)</div>
              <button id="clear-captured-btn" style="background: rgba(255,255,255,0.1); border: none; padding: 4px 8px; font-size: 11px; color: #ccc; cursor: pointer; border-radius: 4px;">Clear</button>
            </div>
            <div id="captured-list" style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.1); border-radius: 8px; padding: 8px;">
              <div style="text-align: center; color: rgba(255,255,255,0.4); font-size: 11px; padding: 10px;">Click elements to capture them</div>
            </div>
          </div>
    `;

    if (data.events && data.events.length > 0) {
      html += this.renderEventsGrid(data.events);
      html += this.renderEventActions(data.events);
    } else {
      html += `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <div class="no-results-text">No extractable events found on this page for this demo</div>
          <div class="no-results-subtext">Try the full version</div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEventHandlers();

    // Re-apply CSS for new elements
    this.addResultsStyles();
  }

  /**
   * Adds custom CSS for results view
   */
  addResultsStyles() {
    let existingStyle = document.getElementById('extension-results-styles');
    if (existingStyle) return;

    existingStyle = document.createElement('style');
    existingStyle.id = 'extension-results-styles';
    existingStyle.textContent = `
      .results-content {
        padding: 20px;
      }

      .results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .header-buttons {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .back-to-main-button {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        font-size: 12px;
        transition: all 0.3s ease;
      }

      .back-to-main-button:hover {
        background: rgba(255,255,255,0.2);
        transform: scale(1.05);
      }

      .autopilot-button {
        background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,198,255,0.3);
      }

      .inspector-button {
        background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
      }

      .inspector-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
      }

      .autopilot-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,198,255,0.4);
      }

      .autopilot-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }

      .back-icon {
        margin-right: 4px;
        font-size: 14px;
      }

      .results-title {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 600;
      }

      .results-icon {
        margin-right: 8px;
      }

      .refresh-button {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        font-size: 12px;
        transition: all 0.3s ease;
      }

      .refresh-button:hover {
        background: rgba(255,255,255,0.2);
        transform: scale(1.05);
      }

      .refresh-icon {
        margin-right: 4px;
        font-size: 14px;
      }



      .no-results {
        text-align: center;
        padding: 40px 20px;
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.1);
      }

      .no-results-icon {
        font-size: 32px;
        margin-bottom: 12px;
        opacity: 0.6;
      }

      .no-results-text {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .no-results-subtext {
        font-size: 12px;
        opacity: 0.7;
      }

      .events-grid {
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        border: 1px solid rgba(255,255,255,0.1);
      }

      .events-count {
        font-weight: 600;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
      }

      .events-count-icon {
        margin-right: 8px;
      }

      .events-cards {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .event-card {
        background: rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 1px solid rgba(255,255,255,0.1);
        display: flex;
        flex-direction: row;
        gap: 12px;
        align-items: flex-start;
      }

      .event-card:hover {
        background: rgba(255,255,255,0.12);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }

      .event-card-image {
        width: 100px;
        height: 80px;
        object-fit: cover;
        border-radius: 6px;
        flex-shrink: 0;
      }

      .event-card-content {
        flex: 1;
        min-width: 0; /* Enable truncation */
      }

      .event-card-label {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 4px;
        color: #fff;
      }

      .event-card-desc {
        font-size: 12px;
        opacity: 0.8;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .event-no-image {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 80px;
        background: rgba(255,255,255,0.05);
        border-radius: 6px;
        font-size: 20px;
        opacity: 0.6;
        flex-shrink: 0;
      }
.action-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .action-button {
        background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        color: white;
        font-size: 11px;
        font-weight: 500;
        display: flex;
        align-items: center;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }

      .action-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }

      .action-button.secondary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .action-button.accent {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      .action-button.danger {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      }

      .action-icon {
        margin-right: 4px;
        font-size: 12px;
      }
      .action-button.primary-download {
        background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%);
        box-shadow: 0 4px 15px rgba(0,176,155,0.4);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .action-button.primary-download:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,176,155,0.5);
      }
    `;

    document.head.appendChild(existingStyle);
  }

  /**
   * Renders the events grid
   */
  renderEventsGrid(events) {
    return `
      <div class="events-grid">
        <div class="events-count">
          <span class="events-count-icon">📅</span>
          Found ${events.length} events
        </div>
        <div class="events-cards">
          ${events.map((event, index) => this.renderEventCard(event, index)).join('')}
        </div>
      </div>
      `;
  }

  /**
   * Renders a single event card
   */
  renderEventCard(event, index) {
    const descTruncated = event.description || 'No description available';
    const label = event.label || 'Unknown Type';
    const platforms = event.platforms ? `<div style="font-size: 10px; color: #aaa; margin-bottom: 2px;">${event.platforms}</div>` : '';

    // Determine icon based on label/type if possible
    let typeIcon = '📄';
    if (label.includes('Video') || label.includes('Reel')) typeIcon = '🎥';
    if (label.includes('Image') || label.includes('Post')) typeIcon = '🖼️';
    if (label.includes('Story')) typeIcon = '⭕';
    if (label.includes('Email')) typeIcon = '📧';

    const imageHtml = event.imageSrc
      ? `<img src="${event.imageSrc}" alt="Event" class="event-card-image">`
      : `<div class="event-no-image">${typeIcon}</div>`;

    return `
      <div class="event-card" data-index="${index}">
        ${imageHtml}
        <div class="event-card-content">
          <div class="event-card-label">${label}</div>
          ${platforms}
          <div class="event-card-desc">${descTruncated}</div>
          ${event.videoDuration ? `<div style="font-size: 10px; color: #4ecdc4; margin-top: 4px;">⏱️ ${event.videoDuration}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Renders action buttons for events
   */
  renderEventActions(events) {
    const mediaEvents = events.filter(e => e.imageSrc || e.videoSrc);
    const reelEvents = events.filter(e => e.label === 'Reel' && e.eventUrl);
    const videoEvents = events.filter(e => e.hasVideo && e.eventUrl);

    let buttons = [];

    if (events.length > 0) {
      buttons.push(`
      <button id="download-all-csv-btn" class="action-button">
        <span class="action-icon">📊</span>
          Export All CSV
        </button>
      `);
    }

    if (mediaEvents.length > 0) {
      buttons.push(`
      <button id="download-media-btn" class="action-button primary-download" style="width: 100%; justify-content: center; font-size: 14px; margin-bottom: 8px; padding: 12px;">
        <span class="action-icon">📸</span>
        Download All Media (${mediaEvents.length})
      </button>
      `);
    }

    if (reelEvents.length > 0) {
      buttons.push(`
      <button id="open-reels-btn" class="action-button accent">
        <span class="action-icon">🎬</span>
          Open Reels (${reelEvents.length})
        </button>
      `);
    }

    if (videoEvents.length > 0) {
      buttons.push(`
      <button id="extract-all-videos-btn" class="action-button danger">
        <span class="action-icon">🎥</span>
          Extract Full Videos (${videoEvents.length})
        </button>
      `);
    }



    // Add extract details button if there are events that might need detailed extraction
    const needsDetailEvents = events.filter(e => e.eventUrl && (e.hasVideo || !e.imageSrc || e.description?.length < 50));
    if (needsDetailEvents.length > 0) {
      buttons.push(`
      <button id="extract-all-details-btn" class="action-button">
        <span class="action-icon">🔍</span>
          Extract Full Details (${needsDetailEvents.length})
      </button>
      `);
    }

    if (buttons.length === 0) return '';

    return `<div class="action-buttons">${buttons.join('')}</div>`;
  }

  /**
   * Renders detailed view of a single event
   */
  renderEventDetail(eventIndex) {
    const eventData = this.events[eventIndex];
    if (!eventData) return;

    const { btnBg, btnColor } = getColors();

    this.container.innerHTML = `
      <div style="position: absolute; top: 10px; left: 10px;">
        <button id="back-btn" style="padding: 4px 8px; background-color: ${btnBg}; color: ${btnColor}; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">
          ← Back
        </button>
      </div>

      <div style="padding-top: 40px; text-align: center;">
        <div id="media-loading">Loading media...</div>
        <div style="margin-top: 10px; font-weight: bold;">${eventData.label || 'No Label'}</div>
        ${eventData.platforms ? `<div style="margin-top: 5px; font-size: 14px; color: #666;">Platforms: ${eventData.platforms}</div>` : ''}
        ${eventData.timestamp ? `<div style="margin-top: 5px; font-size: 14px; color: #666;">Time: ${eventData.timestamp}</div>` : ''}
        <div style="margin-top: 10px; font-size: 14px; text-align: left; line-height: 1.4;">
          ${eventData.description || 'No description available'}
        </div>
        ${this.renderEventDetailActions(eventData, btnBg, btnColor)}
      </div>
    `;

    this.applyTheme();
    this.bindDetailEventHandlers(eventIndex);

    // Update media display
    this.updateMediaDisplay(eventData);
  }

  /**
   * Renders action buttons for event detail view
   */
  renderEventDetailActions(eventData, btnBg, btnColor) {
    const testOpenBtn = eventData.eventUrl ? `
      <button id="test-open-card-btn" style="padding: 6px 10px; background-color: #17a2b8; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 6px;">
        Test Open Card
      </button>` : '';

    const extractVideoBtn = eventData.hasVideo ? `
      <button id="extract-full-data-btn" style="padding: 6px 10px; background-color: #28a745; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 6px;">
        Extract Video
      </button>` : '';

    return `
      <div style="position: absolute; bottom: 15px; left: 15px; right: 15px;">
        ${testOpenBtn}
        ${extractVideoBtn}
    <button id="download-csv-btn" style="padding: 6px 10px; background-color: ${btnBg}; color: ${btnColor}; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
      Download CSV
    </button>
      </div>
      `;
  }

  /**
   * Updates the media display area
   */
  updateMediaDisplay(eventData) {
    const mediaDiv = this.container.querySelector('#media-loading');
    if (!mediaDiv) return;

    const { btnBg, btnColor } = getColors();

    if (eventData.videoSrc && eventData.videoSrc !== '[VIDEO_CONTENT]') {
      mediaDiv.innerHTML = `
      <video src="${eventData.videoSrc}" controls style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"></video>
        <button id="download-single-btn" style="margin-top: 10px; padding: 8px 12px; background-color: ${btnBg}; color: ${btnColor}; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; font-weight: bold;">
          Download Video
        </button>
    `;
    } else if (eventData.imageSrc) {
      mediaDiv.innerHTML = `
      <img src="${eventData.imageSrc}" alt="Full Event Image" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); object-fit: contain;">
        <button id="download-single-btn" style="margin-top: 10px; padding: 8px 12px; background-color: ${btnBg}; color: ${btnColor}; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; font-weight: bold;">
          Download Image
        </button>
    `;
    } else {
      mediaDiv.innerHTML = '<div>No media available</div>';
    }

    // Bind download button
    const downloadBtn = this.container.querySelector('#download-single-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        // Prioritize video if it is currently displayed (logic matches the if/else above)
        let url = null;
        if (eventData.videoSrc && eventData.videoSrc !== '[VIDEO_CONTENT]') {
          url = eventData.videoSrc;
        } else {
          url = eventData.imageSrc;
        }

        if (url) this.onDownloadSingle(url);
      });
    }
  }

  /**
   * Applies current theme to container
   */
  applyTheme() {
    const { currentTextColor, currentBgColor } = getColors();
    this.container.style.color = currentTextColor;
    this.container.style.background = currentBgColor;
    this.container.style.padding = '15px';
    this.container.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    this.container.style.borderRadius = '10px';
  }

  /**
   * Binds event handlers for the grid view
   */
  bindEventHandlers() {
    // Back to main button
    this.bindButton('back-to-main-btn', () => this.onBackToMain());

    // Capture button
    this.bindButton('capture-btn', () => this.onCapture());

    // Debug Dump button
    this.bindButton('debug-dump-btn', () => this.onDebugDump());

    // Auto Pilot button
    this.bindButton('autopilot-btn', () => this.onAutoPilot());

    // Inspector button
    this.bindButton('inspector-btn', () => this.onToggleInspector());

    // Clear captured button
    this.bindButton('clear-captured-btn', () => this.onClearCaptured());

    // Event cards
    this.bindEventCards();

    // Action buttons
    this.bindButton('download-media-btn', () => this.onDownloadMedia());
    this.bindButton('open-reels-btn', () => this.onOpenReels());
    this.bindButton('download-all-csv-btn', () => this.onDownloadAllCSV());
    this.bindButton('extract-all-videos-btn', () => this.onExtractAllVideos());
    this.bindButton('extract-all-details-btn', () => this.onExtractAllDetails());
  }

  /**
   * Binds event card click handlers
   */
  bindEventCards() {
    const eventCards = this.container.querySelectorAll('.event-card');
    eventCards.forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt(card.dataset.index);
        this.onEventClick(index);
      });
    });
  }

  /**
   * Binds event handlers for detail view
   */
  bindDetailEventHandlers(eventIndex) {
    this.bindButton('back-btn', () => this.onBack());

    // Action buttons
    this.bindButton('test-open-card-btn', () => this.onTestOpenCard(this.events[eventIndex]));
    this.bindButton('extract-full-data-btn', () => this.onExtractVideo(eventIndex));
    this.bindButton('download-csv-btn', () => this.onDownloadSingleCSV(this.events[eventIndex]));
  }

  /**
   * Binds event thumbnail click handlers
   */
  bindEventThumbs() {
    const thumbs = this.container.querySelectorAll('.event-thumb');
    thumbs.forEach(img => {
      img.addEventListener('click', () => {
        const index = parseInt(img.dataset.index);
        this.onEventClick(index);
      });
    });
  }

  /**
   * Helper to bind button click handlers
   */
  bindButton(id, handler) {
    const button = this.container.querySelector(`#${id} `);
    if (button) {
      button.addEventListener('click', handler);
    }
  }

  /**
   * Updates the hover inspector info
   */
  updateHoverInfo(data) {
    const resultsDiv = document.getElementById('inspector-results');
    const tagEl = document.getElementById('insp-tag');
    const selectorEl = document.getElementById('insp-selector');
    const xpathEl = document.getElementById('insp-xpath');

    if (!resultsDiv) return; // Not in results view

    if (data) {
      resultsDiv.style.display = 'block';
      if (tagEl) tagEl.textContent = data.tagName;
      if (selectorEl) selectorEl.textContent = data.selector;
      if (xpathEl) xpathEl.textContent = data.xpath;
    } else {
      resultsDiv.style.display = 'none';
      if (tagEl) tagEl.textContent = '-';
      if (selectorEl) selectorEl.textContent = '-';
      if (xpathEl) xpathEl.textContent = '-';
    }
  }

  /**
```
   * Updates the inspector button state
   */
  updateInspectorButtonState(isActive) {
    const btn = document.getElementById('inspector-btn');
    if (!btn) return;

    if (isActive) {
      btn.innerHTML = '<span class="refresh-icon">⏹️</span><span class="refresh-text">Stop</span>';
      btn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
      const resultsDiv = document.getElementById('inspector-results');
      const listDiv = document.getElementById('captured-items-container');
      if (resultsDiv) resultsDiv.style.display = 'block';
      if (listDiv) listDiv.style.display = 'block';
    } else {
      btn.innerHTML = '<span class="refresh-icon">🔍</span><span class="refresh-text">Inspector</span>';
      btn.style.background = 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)';
      const resultsDiv = document.getElementById('inspector-results');
      if (resultsDiv) resultsDiv.style.display = 'none';
      // Keep captured list visible even if stopped, if it has items? 
      // For now, let's keep it visible if it has items, but check in render method
    }
  }

  /**
   * Renders the list of captured items
   */
  renderCapturedItems(items) {
    const container = document.getElementById('captured-items-container');
    const list = document.getElementById('captured-list');
    const count = document.getElementById('captured-count');

    if (!container || !list || !count) return;

    // Always show container if we are tracking state, or just if inspector is active?
    // Let's show it if inspector is active OR if we have items
    if (items.length > 0) {
      container.style.display = 'block';
    }

    count.textContent = items.length;

    if (items.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); font-size: 11px; padding: 10px;">Click elements to capture them</div>';
    } else {
      list.innerHTML = items.map((item, index) => `
        <div style="background: rgba(255,255,255,0.05); border-radius: 4px; padding: 6px; margin-bottom: 6px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: bold; color: #3498db;">${item.tagName}</span>
            <span style="opacity: 0.5;">#${index + 1}</span>
          </div>
          <div style="color: #ccc; word-break: break-all; margin-bottom: 2px;">${item.selector}</div>
          ${item.text ? `<div style="color: #aaa; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">"${item.text}"</div>` : ''}
        </div>
      `).join('');
    }
  }

  // Event handler callbacks (to be set by controller)
  onCapture() { }
  onToggleMode() { }
  onEventClick(index) { }
  onBack() { }
  onBackToMain() { }
  onDownloadMedia() { }
  onOpenReels() { }
  onDownloadAllCSV() { }
  onExtractAllVideos() { }
  onExtractAllDetails() { }
  onDownloadSingle(url) { }
  onTestOpenCard(eventData) { }
  onExtractVideo(eventIndex) { }
  onDownloadSingleCSV(eventData) { }
  onVideoScan() { }

  /**
   * Shows a temporary notification message in the UI
   * @param {string} message - The message to show
   * @param {string} type - Message type: 'success', 'error', 'info'
   */
  showMessage(message, type = 'info') {
    // Remove any existing notification
    this.removeExistingNotification();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';

    // Set type-specific styling
    if (type === 'success') {
      notification.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
    } else if (type === 'error') {
      notification.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
    } else {
      notification.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
    }

    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <span class="notification-close" onclick="this.parentElement.remove()">×</span>
    `;

    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: '10000',
      maxWidth: '400px',
      cursor: 'default',
      opacity: '0',
      transition: 'opacity 0.3s ease'
    });

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);

    // Auto hide after 4 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }

  /**
   * Removes any existing notification
   */
  removeExistingNotification() {
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }
  }
}
