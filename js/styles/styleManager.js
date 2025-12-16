/**
 * Style Manager - Handles CSS injection and management for popup components
 */
export class StyleManager {
  constructor() {
    this.injectedStyles = new Set();
  }

  /**
   * Injects CSS if not already present
   */
  injectStyle(styleId, cssContent) {
    if (this.injectedStyles.has(styleId)) return;

    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      this.injectedStyles.add(styleId);
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = cssContent;
    document.head.appendChild(style);

    this.injectedStyles.add(styleId);
  }

  /**
   * Adds loading spinner styles
   */
  addLoadingStyles() {
    this.injectStyle('loading-styles', `
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
    `);
  }

  /**
   * Adds service unavailable styles
   */
  addUnavailableStyles() {
    this.injectStyle('unavailable-styles', `
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
    `);
  }

  /**
   * Adds custom CSS styles for professional UI
   */
  addCustomStyles() {
    this.injectStyle('extension-popup-styles', `
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

      /* Top Button Bar Styles */
      .top-button-bar {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .top-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        min-width: 80px;
        justify-content: center;
      }

      .top-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
      }

      .top-button.debug-btn {
        background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
        font-size: 12px;
        padding: 8px 12px;
        min-width: 70px;
      }

      .top-button.debug-btn:hover {
        background: linear-gradient(135deg, #5a6268 0%, #383d41 100%);
      }

      .button-icon {
        margin-right: 6px;
        font-size: 14px;
        display: flex;
        align-items: center;
      }

      .button-text {
        white-space: nowrap;
      }
    `);
  }

  /**
   * Adds custom CSS for results view
   */
  addResultsStyles() {
    this.injectStyle('extension-results-styles', `
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
        justify-content: space-between;
        cursor: pointer;
        padding: 8px 12px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .events-count:hover {
        background: rgba(255,255,255,0.08);
      }

      .events-count.collapsed .collapse-icon {
        transform: rotate(-90deg);
      }

      .events-count-icon {
        margin-right: 8px;
        display: flex;
        align-items: center;
      }

      .events-count-text {
        flex: 1;
      }

      .collapse-icon {
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
      }

      .events-cards.collapsed {
        display: none !important;
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

      .event-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 6px;
      }

      .event-card-platforms {
        font-size: 10px;
        color: #aaa;
        background: rgba(255,255,255,0.1);
        padding: 2px 6px;
        border-radius: 10px;
        white-space: nowrap;
      }

      .event-card-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 11px;
      }

      .event-card-timestamp {
        color: #4ecdc4;
        font-weight: 500;
      }

      .event-card-indicators {
        display: flex;
        gap: 4px;
      }

      .indicator {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: 500;
        white-space: nowrap;
      }

      .indicator.video {
        background: rgba(255,193,7,0.2);
        color: #ffc107;
      }

      .indicator.link {
        background: rgba(0,123,255,0.2);
        color: #007bff;
      }

      .event-card-duration {
        font-size: 10px;
        color: #4ecdc4;
        margin-top: 4px;
        font-weight: 500;
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
        min-width: 0;
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
    `);
  }
}
