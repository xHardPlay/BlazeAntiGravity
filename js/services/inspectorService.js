/**
 * Inspector Service - Manages hover inspector functionality
 */
export class InspectorService {
    constructor(controller) {
        this.controller = controller;
    }

    /**
     * Sets up runtime message listeners
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'hoverInfo') {
                this.controller.renderer.updateHoverInfo(message.data);
            } else if (message.action === 'captureInfo') {
                this.controller.eventHandlers.handleCaptureInfo(message.data);
            }
        });
    }

    /**
     * Handles toggling the hover inspector
     */
    async handleToggleInspector() {
        try {
            await this.controller.updateActiveTab();
            this.controller.isHoverInspectorActive = !this.controller.isHoverInspectorActive;

            // Update UI state
            this.controller.renderer.updateInspectorButtonState(this.controller.isHoverInspectorActive);

            if (this.controller.isHoverInspectorActive) {
                // Inject script if needed (it handles its own singleton state)
                await chrome.scripting.executeScript({
                    target: { tabId: this.controller.tabId },
                    files: ['js/utils/hoverInspector.js']
                });
            }

            // Send toggle message to content script
            await chrome.tabs.sendMessage(this.controller.tabId, {
                action: 'toggleInspector',
                state: this.controller.isHoverInspectorActive
            });

            if (this.controller.isHoverInspectorActive) {
                this.controller.renderer.showMessage('Hover Inspector Active - Move mouse over elements', 'info');
            } else {
                this.controller.renderer.showMessage('Hover Inspector Disabled', 'info');
            }

        } catch (error) {
            console.error('Failed to toggle inspector:', error);
            this.controller.renderer.showMessage('Failed to toggle inspector: ' + error.message, 'error');
            // Revert state on error
            this.controller.isHoverInspectorActive = !this.controller.isHoverInspectorActive;
            this.controller.renderer.updateInspectorButtonState(this.controller.isHoverInspectorActive);
        }
    }
}
