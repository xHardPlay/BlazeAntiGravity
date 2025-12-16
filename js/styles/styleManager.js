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
    const colors = {
      accent: '#00d4aa',
      textPrimary: '#ffffff',
      textSecondary: '#b0b0b0'
    };

    this.injectStyle('loading-styles', `
      .loading-section {
        text-align: center;
        padding: 40px 20px;
        animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #333333;
        border-top: 3px solid ${colors.accent};
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px auto;
        box-shadow: 0 0 0 1px ${colors.accent}20;
      }

      .loading-text {
        font-size: 16px;
        color: ${colors.textPrimary};
        font-weight: 500;
        opacity: 0.9;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `);
  }

  /**
   * Adds service unavailable styles
   */
  addUnavailableStyles() {
    const colors = {
      textPrimary: '#ffffff',
      textSecondary: '#b0b0b0',
      textMuted: '#808080',
      surface: '#1a1a1a',
      border: '#333333'
    };

    this.injectStyle('unavailable-styles', `
      .unavailable-section {
        text-align: center;
        padding: 40px 20px;
        background: ${colors.surface};
        border-radius: 8px;
        border: 1px solid ${colors.border};
        animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .unavailable-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: ${colors.textMuted};
        opacity: 0.8;
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.1));
      }

      .unavailable-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 12px;
        color: ${colors.textPrimary};
      }

      .unavailable-message {
        font-size: 14px;
        color: ${colors.textSecondary};
        line-height: 1.4;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `);
  }

  /**
   * Adds custom CSS styles for dark tech minimalist UI
   */
  addCustomStyles() {
    this.injectStyle('extension-popup-styles', `
      .extension-popup {
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        background: #0a0a0a;
        min-height: 600px;
        color: #ffffff;
        padding: 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
        position: relative;
      }

      .extension-popup * {
        transition: all 0.25s ease;
      }

      .popup-header {
        background: #1a1a1a;
        padding: 24px;
        text-align: center;
        border-bottom: 1px solid #333333;
      }

      .popup-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #00d4aa, #00a8ff);
        opacity: 0.6;
      }

      .logo-section {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
      }

      .logo-icon {
        font-size: 24px;
        margin-right: 12px;
        color: #00d4aa;
      }

      .logo-text {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: -0.5px;
      }

      .subtitle {
        font-size: 13px;
        color: #b0b0b0;
        font-weight: 400;
      }

      .main-content {
        padding: 24px;
      }

      .welcome-section {
        text-align: center;
        margin-bottom: 32px;
      }

      .welcome-section h2 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
      }

      .welcome-section p {
        margin: 0;
        font-size: 14px;
        color: #b0b0b0;
        line-height: 1.5;
      }

      .capture-area {
        background: #1a1a1a;
        border: 1px solid #333333;
        border-radius: 8px;
        padding: 24px;
        text-align: center;
      }

      .capture-area:hover {
        border-color: #404040;
      }

      .capture-instructions {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
      }

      .instruction-icon {
        font-size: 20px;
        margin-right: 12px;
        color: #00d4aa;
      }

      .instruction-text {
        font-size: 14px;
        color: #b0b0b0;
        max-width: 200px;
      }

      .capture-button {
        background: #00d4aa;
        border: none;
        border-radius: 6px;
        padding: 14px 28px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        font-size: 14px;
        font-weight: 600;
        color: #0a0a0a;
        transition: all 0.25s ease;
        text-decoration: none;
      }

      .capture-button:hover {
        background: #00a8ff;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
      }

      .button-icon {
        margin-right: 8px;
        font-size: 16px;
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
        color: #b0b0b0;
      }

      .toggle-label input[type="checkbox"] {
        display: none;
      }

      .toggle-slider {
        position: relative;
        width: 40px;
        height: 20px;
        background: #2a2a2a;
        border-radius: 10px;
        margin: 0 10px;
        transition: all 0.25s ease;
        border: 1px solid #333333;
      }

      .toggle-slider::before {
        content: '';
        position: absolute;
        top: 1px;
        left: 1px;
        width: 16px;
        height: 16px;
        background: #808080;
        border-radius: 50%;
        transition: all 0.25s ease;
      }

      .toggle-label input[type="checkbox"]:checked + .toggle-slider {
        background: rgba(0, 212, 170, 0.2);
        border-color: #00d4aa;
      }

      .toggle-label input[type="checkbox"]:checked + .toggle-slider::before {
        background: #00d4aa;
        transform: translateX(20px);
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
        color: #b0b0b0;
        transition: color 0.25s ease;
      }

      .feature-item:hover {
        color: #00d4aa;
      }

      .feature-icon {
        font-size: 18px;
        margin-bottom: 6px;
        transition: transform 0.25s ease;
      }

      .feature-item:hover .feature-icon {
        transform: scale(1.1);
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
        background: #1a1a1a;
        padding: 12px 24px;
        text-align: center;
        border-top: 1px solid #333333;
      }

      .version {
        font-size: 11px;
        color: #808080;
        font-weight: 400;
      }

      .video-scan-area {
        margin-top: 16px;
        text-align: center;
      }

      .video-scan-button {
        background: #2a2a2a;
        border: 1px solid #333333;
        border-radius: 6px;
        padding: 12px 24px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        font-size: 14px;
        font-weight: 500;
        color: #ffffff;
        transition: all 0.25s ease;
        text-decoration: none;
      }

      .video-scan-button:hover {
        background: #00d4aa;
        color: #0a0a0a;
        border-color: #00d4aa;
        transform: translateY(-1px);
      }

      .video-icon {
        margin-right: 8px;
        font-size: 14px;
      }

      .video-description {
        margin-top: 8px;
        font-size: 12px;
        color: #808080;
      }

      /* Top Button Bar Styles */
      .top-button-bar {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .top-button {
        background: #2a2a2a;
        border: 1px solid #333333;
        border-radius: 6px;
        padding: 10px 16px;
        cursor: pointer;
        color: #ffffff;
        display: flex;
        align-items: center;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.25s ease;
        min-width: 80px;
        justify-content: center;
      }

      .top-button:hover {
        border-color: #00d4aa;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 212, 170, 0.2);
      }

      .top-button.debug-btn {
        background: #1a1a1a;
        font-size: 12px;
        padding: 8px 12px;
        min-width: 70px;
        opacity: 0.8;
      }

      .top-button.debug-btn:hover {
        opacity: 1;
      }

      .button-icon {
        margin-right: 6px;
        font-size: 13px;
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
    const colors = {
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceSecondary: '#2a2a2a',
      accent: '#00d4aa',
      accentSecondary: '#00a8ff',
      textPrimary: '#ffffff',
      textSecondary: '#b0b0b0',
      textMuted: '#808080',
      border: '#333333',
      borderLight: '#404040',
      success: '#00d4aa',
      warning: '#ffb347',
      error: '#ff6b6b'
    };

    const animations = {
      fast: '0.15s',
      normal: '0.25s',
      slow: '0.4s',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    };

    this.injectStyle('extension-results-styles', `
      .results-content {
        padding: 24px;
        color: ${colors.textPrimary};
      }

      .results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .header-buttons {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .back-to-main-button {
        background: ${colors.surfaceSecondary};
        border: 1px solid ${colors.border};
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        color: ${colors.textPrimary};
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 500;
        transition: all ${animations.normal} ${animations.easing};
      }

      .back-to-main-button:hover {
        background: ${colors.accent};
        border-color: ${colors.accent};
        color: ${colors.background};
        transform: translateY(-1px);
      }

      .autopilot-button {
        background: ${colors.surfaceSecondary};
        border: 1px solid ${colors.border};
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        color: ${colors.textPrimary};
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 500;
        transition: all ${animations.normal} ${animations.easing};
      }

      .autopilot-button:hover {
        background: ${colors.accent};
        border-color: ${colors.accent};
        color: ${colors.background};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px ${colors.accent}30;
      }

      .inspector-button {
        background: ${colors.surfaceSecondary};
        border: 1px solid ${colors.border};
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        color: ${colors.textPrimary};
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 500;
        transition: all ${animations.normal} ${animations.easing};
      }

      .inspector-button:hover {
        background: ${colors.accentSecondary};
        border-color: ${colors.accentSecondary};
        color: ${colors.background};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px ${colors.accentSecondary}30;
      }

      .autopilot-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        background: ${colors.surface};
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
        color: ${colors.textPrimary};
      }

      .results-icon {
        margin-right: 8px;
        color: ${colors.accent};
      }

      .refresh-button {
        background: ${colors.surfaceSecondary};
        border: 1px solid ${colors.border};
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        color: ${colors.textPrimary};
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 500;
        transition: all ${animations.normal} ${animations.easing};
      }

      .refresh-button:hover {
        background: ${colors.accent};
        border-color: ${colors.accent};
        color: ${colors.background};
        transform: translateY(-1px);
      }

      .refresh-icon {
        margin-right: 4px;
        font-size: 14px;
      }

      .no-results {
        text-align: center;
        padding: 40px 20px;
        background: ${colors.surface};
        border-radius: 8px;
        border: 1px solid ${colors.border};
        animation: fadeInUp 0.6s ${animations.easing};
      }

      .no-results-icon {
        font-size: 32px;
        margin-bottom: 12px;
        color: ${colors.textMuted};
        opacity: 0.6;
      }

      .no-results-text {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 8px;
        color: ${colors.textPrimary};
      }

      .no-results-subtext {
        font-size: 12px;
        color: ${colors.textMuted};
      }

      .events-grid {
        background: ${colors.surface};
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        border: 1px solid ${colors.border};
        transition: all ${animations.normal} ${animations.easing};
      }

      .events-grid:hover {
        border-color: ${colors.borderLight};
      }

      .events-count {
        font-weight: 600;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        padding: 8px 12px;
        background: ${colors.surfaceSecondary};
        border-radius: 6px;
        transition: all ${animations.normal} ${animations.easing};
        border: 1px solid ${colors.border};
      }

      .events-count:hover {
        background: ${colors.surface};
        border-color: ${colors.accent};
      }

      .events-count.collapsed .collapse-icon {
        transform: rotate(-90deg);
      }

      .events-count-icon {
        margin-right: 8px;
        display: flex;
        align-items: center;
        color: ${colors.accent};
      }

      .events-count-text {
        flex: 1;
        color: ${colors.textPrimary};
      }

      .collapse-icon {
        transition: transform ${animations.normal} ${animations.easing};
        display: flex;
        align-items: center;
        color: ${colors.textSecondary};
      }

      .events-cards.collapsed {
        display: none !important;
      }

      .events-cards {
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: slideIn 0.4s ${animations.easing};
      }

      .event-card {
        background: ${colors.surfaceSecondary};
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all ${animations.normal} ${animations.easing};
        border: 1px solid ${colors.border};
        display: flex;
        flex-direction: row;
        gap: 12px;
        align-items: flex-start;
        position: relative;
        overflow: hidden;
      }

      .event-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${colors.accent};
        opacity: 0;
        transition: opacity ${animations.fast} ${animations.easing};
      }

      .event-card:hover::before {
        opacity: 0.05;
      }

      .event-card:hover {
        border-color: ${colors.accent};
        transform: translateY(-2px);
        box-shadow: 0 8px 24px ${colors.accent}20;
      }

      .event-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 6px;
      }

      .event-card-platforms {
        font-size: 10px;
        color: ${colors.textMuted};
        background: ${colors.surface};
        padding: 2px 6px;
        border-radius: 10px;
        white-space: nowrap;
        border: 1px solid ${colors.border};
      }

      .event-card-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 11px;
      }

      .event-card-timestamp {
        color: ${colors.accent};
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
        background: ${colors.warning}20;
        color: ${colors.warning};
        border: 1px solid ${colors.warning}40;
      }

      .indicator.link {
        background: ${colors.accentSecondary}20;
        color: ${colors.accentSecondary};
        border: 1px solid ${colors.accentSecondary}40;
      }

      .event-card-duration {
        font-size: 10px;
        color: ${colors.success};
        margin-top: 4px;
        font-weight: 500;
      }

      .event-card-image {
        width: 100px;
        height: 80px;
        object-fit: cover;
        border-radius: 6px;
        flex-shrink: 0;
        transition: transform ${animations.normal} ${animations.easing};
      }

      .event-card:hover .event-card-image {
        transform: scale(1.02);
      }

      .event-card-content {
        flex: 1;
        min-width: 0;
      }

      .event-card-label {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
        color: ${colors.textPrimary};
        line-height: 1.3;
      }

      .event-card-desc {
        font-size: 12px;
        color: ${colors.textSecondary};
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
        background: ${colors.surface};
        border-radius: 6px;
        font-size: 20px;
        color: ${colors.textMuted};
        opacity: 0.6;
        flex-shrink: 0;
        border: 1px solid ${colors.border};
        transition: all ${animations.normal} ${animations.easing};
      }

      .event-card:hover .event-no-image {
        background: ${colors.surfaceSecondary};
        opacity: 0.8;
      }

      .action-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .action-button {
        background: ${colors.surfaceSecondary};
        border: 1px solid ${colors.border};
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        color: ${colors.textPrimary};
        font-size: 11px;
        font-weight: 500;
        display: flex;
        align-items: center;
        transition: all ${animations.normal} ${animations.easing};
        position: relative;
        overflow: hidden;
      }

      .action-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left ${animations.slow} ${animations.easing};
      }

      .action-button:hover::before {
        left: 100%;
      }

      .action-button:hover {
        background: ${colors.accent};
        border-color: ${colors.accent};
        color: ${colors.background};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px ${colors.accent}30;
      }

      .action-button.secondary {
        border-color: ${colors.accentSecondary};
      }

      .action-button.secondary:hover {
        background: ${colors.accentSecondary};
        border-color: ${colors.accentSecondary};
        box-shadow: 0 4px 12px ${colors.accentSecondary}30;
      }

      .action-button.accent {
        border-color: ${colors.warning};
      }

      .action-button.accent:hover {
        background: ${colors.warning};
        border-color: ${colors.warning};
        color: ${colors.background};
        box-shadow: 0 4px 12px ${colors.warning}30;
      }

      .action-button.danger {
        border-color: ${colors.error};
      }

      .action-button.danger:hover {
        background: ${colors.error};
        border-color: ${colors.error};
        color: ${colors.background};
        box-shadow: 0 4px 12px ${colors.error}30;
      }

      .action-icon {
        margin-right: 4px;
        font-size: 12px;
      }

      .action-button.primary-download {
        background: ${colors.accent};
        border-color: ${colors.accent};
        color: ${colors.background};
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px ${colors.accent}30;
      }

      .action-button.primary-download:hover {
        background: ${colors.accentSecondary};
        border-color: ${colors.accentSecondary};
        box-shadow: 0 6px 16px ${colors.accentSecondary}40;
        transform: translateY(-2px);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-16px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `);
  }
}
