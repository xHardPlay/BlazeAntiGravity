// Overlay creation and styling
export function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'relaxing-hello-overlay';

  // Style the overlay
  overlay.style.position = 'fixed';
  overlay.style.top = '20px';
  overlay.style.right = '20px';
  overlay.style.width = '350px';
  overlay.style.maxHeight = '70vh';
  overlay.style.padding = '10px';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.fontSize = '18px';
  overlay.style.fontWeight = 'bold';
  overlay.style.borderRadius = '10px';
  overlay.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
  overlay.style.zIndex = '9999';
  overlay.style.pointerEvents = 'auto';
  overlay.style.overflowY = 'auto';

  return overlay;
}
