// Theme management
export let isDarkMode = false; // State for mode

export function getColors() {
  const textColor = isDarkMode ? '#fff' : '#000';
  const bgColor = isDarkMode ? '#222' : '#fff';
  const btnBg = isDarkMode ? '#444' : '#f0f0f0';
  const btnColor = isDarkMode ? '#fff' : '#000';
  const linkColor = isDarkMode ? '#8ab4f8' : 'blue';
  return { textColor, bgColor, btnBg, btnColor, linkColor };
}

export function setOverlayStyles(overlay) {
  const { textColor, bgColor } = getColors();
  overlay.style.color = textColor;
  overlay.style.background = bgColor;
}
