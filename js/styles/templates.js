/**
 * HTML Templates for Popup Renderer Components
 */

// Common UI components
export const POPUP_WRAPPER = (content) => `
  <div class="extension-popup">
    ${content}
  </div>
`;

export const POPUP_HEADER = (logoText, subtitle) => `
  <div class="popup-header">
    <div class="logo-section">
      <div class="logo-text">${logoText}</div>
    </div>
    <div class="subtitle">${subtitle}</div>
  </div>
`;

export const POPUP_FOOTER = (version) => `
  <div class="popup-footer">
    <div class="version">${version}</div>
  </div>
`;

export const MAIN_CONTENT = (content) => `
  <div class="main-content">
    ${content}
  </div>
`;

// Main screen with centered scan button
export const MAIN_SCREEN = `
  <div class="scan-container">
    <button id="scan-btn" class="scan-button">
      <span class="button-icon">🔍</span>
      <span class="button-text">SCAN</span>
      <div class="pixel-effect"></div>
    </button>
  </div>
`;

// Loading states
export const LOADING_SECTION = (spinner, text) => `
  <div class="loading-section">
    ${spinner}
    <div class="loading-text">${text}</div>
  </div>
`;

export const LOADING_SPINNER = `
  <div class="loading-spinner"></div>
`;

// Error states
export const ERROR_STATE = (message, retryButton) => `
  <div>Error extracting data: ${message}</div>
  <div style="text-align: center;">
    ${retryButton}
  </div>
`;

export const RETRY_BUTTON = (btnBg, btnColor) => `
  <button id="retry-btn" style="padding: 5px 10px; background-color: ${btnBg}; color: ${btnColor}; border: 1px solid #ccc; border-radius: 5px; cursor: pointer;">
    Retry Capture
  </button>
`;

// Service unavailable
export const UNAVAILABLE_SECTION = `
  <div class="unavailable-section">
    <div class="unavailable-icon">⚠️</div>
    <div class="unavailable-title">El Servicio no esta disponible momentaneamente</div>
    <div class="unavailable-message">comunicate con CarlosEzequielCenturion@gmail.com</div>
  </div>
`;

// Data grid templates
export const RESULTS_CONTENT = (header, inspector, capturedItems, content) => `
  <div class="results-content">
    ${header}
    ${inspector}
    ${capturedItems}
    ${content}
  </div>
`;

export const RESULTS_HEADER = (title, actions) => `
  <div class="results-header">
    ${title}
    <div class="empty-state-actions">
      ${actions}
    </div>
  </div>
`;

export const RESULTS_TITLE = `
  <div class="results-title">
    <span class="results-icon">📊</span>
    <span class="results-text">Extraction Results</span>
  </div>
`;

export const HEADER_BUTTONS = `
  <div class="top-button-bar">
    <button id="capture-btn" class="top-button">
      <span class="button-icon">🔄</span>
      <span class="button-text">Rescan</span>
    </button>
    <button id="autopilot-btn" class="top-button">
      <span class="button-icon">✈️</span>
      <span class="button-text">Auto Pilot</span>
    </button>
    <button id="inspector-btn" class="top-button">
      <span class="button-icon">🔍</span>
      <span class="button-text">Inspector</span>
    </button>
    <button id="debug-dump-btn" class="top-button debug-btn">
      <span class="button-icon">🐞</span>
      <span class="button-text">Debug</span>
    </button>
    <button id="scan-videos-btn" class="top-button">
      <span class="button-icon">🎬</span>
      <span class="button-text">Scan Videos</span>
    </button>
  </div>
`;

export const LIVE_SCAN_TOGGLE = `
  <div class="live-scan-toggle">
    <label class="toggle-label">
      <input type="checkbox" id="live-scan-checkbox">
      <span class="toggle-slider"></span>
      <span class="toggle-text">Live Scan</span>
    </label>
  </div>
`;

export const INSPECTOR_RESULTS = `
  <div id="inspector-results" style="display: none; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px; font-family: monospace; font-size: 12px;">
    <div style="font-weight: bold; margin-bottom: 5px; color: #3498db;">HOVER INSPECTOR ACTIVE</div>
    <div style="margin-bottom: 5px;"><strong style="color: #ccc;">Tag:</strong> <span id="insp-tag" style="color: #fff;">-</span></div>
    <div style="margin-bottom: 5px;"><strong style="color: #ccc;">Selector:</strong> <div id="insp-selector" style="color: #e67e22; word-break: break-all; margin-top: 2px;">-</div></div>
    <div style="margin-bottom: 5px;"><strong style="color: #ccc;">XPath:</strong> <div id="insp-xpath" style="color: #2ecc71; word-break: break-all; margin-top: 2px;">-</div></div>
  </div>
`;

export const CAPTURED_ITEMS_CONTAINER = `
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

export const NO_RESULTS = `
  <div class="no-results">
    <div class="no-results-icon">🔍</div>
    <div class="no-results-text">No extractable events found on this page for this demo</div>
    <div class="no-results-subtext">Try the full version</div>
  </div>
`;

// Events templates
export const EVENTS_GRID = (count, cards) => `
  <div class="events-grid">
    <div class="events-count collapsible-header" onclick="toggleEventsList()">
      <span class="events-count-icon">📅</span>
      <span class="events-count-text">Found ${count} events</span>
      <span class="collapse-icon">⬇️</span>
    </div>
    <div class="events-cards" id="events-cards-container">
      ${cards}
    </div>
  </div>
`;

export const EVENT_CARD = (index, imageHtml, label, platforms, desc, duration, timestamp, hasVideo, eventUrl) => `
  <div class="event-card" data-index="${index}">
    ${imageHtml}
    <div class="event-card-content">
      <div class="event-card-header">
        <div class="event-card-label">${label}</div>
        ${platforms ? `<div class="event-card-platforms">${platforms}</div>` : ''}
      </div>
      <div class="event-card-meta">
        ${timestamp ? `<div class="event-card-timestamp">📅 ${timestamp}</div>` : ''}
        <div class="event-card-indicators">
          ${hasVideo ? '<span class="indicator video">🎥 Video</span>' : ''}
          ${eventUrl ? '<span class="indicator link">🔗 Has Link</span>' : ''}
          ${duration ? `<span class="indicator duration">⏱️ ${duration}</span>` : ''}
        </div>
      </div>
      <div class="event-card-desc">${desc}</div>
    </div>
  </div>
`;

export const EVENT_IMAGE = (src, alt = "Event") => `
  <img src="${src}" alt="${alt}" class="event-card-image">
`;

export const EVENT_NO_IMAGE = (typeIcon) => `
  <div class="event-no-image">${typeIcon}</div>
`;

export const ACTION_BUTTONS = (buttons) => `
  <div class="action-buttons">${buttons}</div>
`;

export const ACTION_BUTTON = (id, classes, icon, text, style = '') => `
  <button id="${id}" class="action-button ${classes}" ${style ? `style="${style}"` : ''}>
    <span class="action-icon">${icon}</span>
    ${text}
  </button>
`;

// Detail view templates
export const EVENT_DETAIL_BACK_BUTTON = (btnBg, btnColor) => `
  <div style="position: absolute; top: 10px; left: 10px;">
    <button id="back-btn" style="padding: 4px 8px; background-color: ${btnBg}; color: ${btnColor}; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">
      ← Back
    </button>
  </div>
`;

export const EVENT_DETAIL_CONTENT = (mediaDiv, label, platforms, timestamp, description, actions) => `
  <div style="padding-top: 40px; text-align: center;">
    <div id="media-loading">${mediaDiv}</div>
    <div style="margin-top: 10px; font-weight: bold;">${label}</div>
    ${platforms ? `<div style="margin-top: 5px; font-size: 14px; color: #666;">Platforms: ${platforms}</div>` : ''}
    ${timestamp ? `<div style="margin-top: 5px; font-size: 14px; color: #666;">Time: ${timestamp}</div>` : ''}
    <div style="margin-top: 10px; font-size: 14px; text-align: left; line-height: 1.4;">
      ${description}
    </div>
    ${actions}
  </div>
`;

export const EVENT_DETAIL_ACTIONS = (testBtn, extractBtn, downloadBtn) => `
  <div style="position: absolute; bottom: 15px; left: 15px; right: 15px;">
    ${testBtn}
    ${extractBtn}
    ${downloadBtn}
  </div>
`;

export const DETAIL_BUTTON = (id, text, bgColor = '#17a2b8', style = '') => `
  <button id="${id}" style="padding: 6px 10px; background-color: ${bgColor}; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 6px; ${style}">
    ${text}
  </button>
`;

export const DOWNLOAD_CSV_BUTTON = (btnBg, btnColor) => `
  <button id="download-csv-btn" style="padding: 6px 10px; background-color: ${btnBg}; color: ${btnColor}; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
    Download CSV
  </button>
`;

// Media templates
export const VIDEO_ELEMENT = (src) => `
  <video src="${src}" controls style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"></video>
  <button id="download-single-btn" style="margin-top: 10px; padding: 8px 12px; background-color: #007bff; color: #fff; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; font-weight: bold;">
    Download Video
  </button>
`;

export const IMAGE_ELEMENT = (src) => `
  <img src="${src}" alt="Full Event Image" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); object-fit: contain;">
  <button id="download-single-btn" style="margin-top: 10px; padding: 8px 12px; background-color: #007bff; color: #fff; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; font-weight: bold;">
    Download Image
  </button>
`;

// Captured items templates
export const CAPTURED_ITEM = (tagName, index, selector, text) => `
  <div style="background: rgba(255,255,255,0.05); border-radius: 4px; padding: 6px; margin-bottom: 6px; font-size: 11px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span style="font-weight: bold; color: #3498db;">${tagName}</span>
      <span style="opacity: 0.5;">#${index + 1}</span>
    </div>
    <div style="color: #ccc; word-break: break-all; margin-bottom: 2px;">${selector}</div>
    ${text ? `<div style="color: #aaa; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">"${text}"</div>` : ''}
  </div>
`;

// Notification template
export const NOTIFICATION = (message, type) => {
  const colors = {
    success: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    error: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
    info: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
  };

  return `
    <span class="notification-message">${message}</span>
    <span class="notification-close" onclick="this.parentElement.remove()">×</span>
  `;
};
