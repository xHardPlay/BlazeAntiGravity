// Dark Tech Minimalist Theme Management
export const THEME = {
  // Core colors - Dark tech palette
  colors: {
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
    error: '#ff6b6b',
    info: '#00a8ff'
  },

  // Animation settings
  animations: {
    duration: {
      fast: '0.15s',
      normal: '0.25s',
      slow: '0.4s'
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Spacing system
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },

  // Border radius system
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px'
  },

  // Shadow system
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 2px 8px rgba(0, 0, 0, 0.4)',
    lg: '0 4px 16px rgba(0, 0, 0, 0.5)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.6)'
  }
};

export function getThemeColors() {
  return THEME.colors;
}

export function getAnimationSettings() {
  return THEME.animations;
}

export function getSpacing() {
  return THEME.spacing;
}

export function getBorderRadius() {
  return THEME.radius;
}

export function getShadows() {
  return THEME.shadows;
}

// Backward compatibility functions
export function getColors() {
  const colors = getThemeColors();
  return {
    textColor: colors.textPrimary,
    bgColor: colors.background,
    btnBg: colors.surfaceSecondary,
    btnColor: colors.textPrimary,
    linkColor: colors.accent,
    currentTextColor: colors.textPrimary,
    currentBgColor: colors.background
  };
}

export function setOverlayStyles(overlay) {
  const colors = getThemeColors();
  overlay.style.color = colors.textPrimary;
  overlay.style.background = colors.background;
}

// Export isDarkMode for backward compatibility
export const isDarkMode = true;
