/**
 * Video Capture Module
 * Función para extraer y descargar videos de la página actual
 *
 * Uso básico:
 * import VideoCapture from './video_capture_module.js';
 *
 * // Para obtener URLs de videos:
 * const videoUrls = VideoCapture.getVideoUrls();
 *
 * // Para mostrar resultados en un contenedor:
 * VideoCapture.scanAndDisplay(containerElement);
 *
 * // Para descargar un video:
 * VideoCapture.downloadVideo(videoUrl);
 *
 * // Para descargar todos los videos:
 * VideoCapture.downloadAllVideos(videoUrls);
 */

// Evitar redeclaración de la clase si ya existe
if (!window.VideoCapture) {
  class VideoCapture {
    /**
     * Escanea la página actual y retorna todas las URLs de videos encontrados
     * @returns {Array<string>} Array de URLs de videos
     */
    static getVideoUrls() {
        const videoElements = document.querySelectorAll('video');
        const videos = [];

        videoElements.forEach(video => {
            let src = video.src || video.currentSrc;

            // Si no tiene src directo, buscar en elementos source
            if (!src) {
                const sourceElement = video.querySelector('source');
                if (sourceElement) {
                    src = sourceElement.src;
                }
            }

            // Buscar en atributos data-* comunes
            if (!src) {
                src = video.getAttribute('data-src') ||
                      video.getAttribute('data-url') ||
                      video.getAttribute('data-video');
            }

            if (src && src.trim()) {
                videos.push(src.trim());
            }
        });

        // También buscar elementos video de iframes embebidos (YouTube, Vimeo, etc.)
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src;
            if (src && (src.includes('youtube.com') || src.includes('vimeo.com') ||
                       src.includes('dailymotion.com') || src.includes('twitch.tv'))) {
                videos.push(src);
            }
        });

        // Buscar enlaces directos a archivos de video
        const videoLinks = document.querySelectorAll('a[href*=".mp4"], a[href*=".webm"], a[href*=".avi"], a[href*=".mov"], a[href*=".mkv"]');
        videoLinks.forEach(link => {
            videos.push(link.href);
        });

        // Filtrar duplicados
        return [...new Set(videos)];
    }

    /**
     * Escanea videos y los muestra en un contenedor HTML
     * @param {HTMLElement} container - El elemento donde mostrar los resultados
     * @param {Object} options - Opciones de configuración
     */
    static scanAndDisplay(container, options = {}) {
        const {
            maxVideos = 50,
            showDownloadButtons = true,
            showDownloadAllButton = true,
            onVideoFound = null,
            onError = null
        } = options;

        try {
            const videos = this.getVideoUrls().slice(0, maxVideos);

            if (videos.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <p>🔍 No se encontraron videos en esta página</p>
                        <p style="font-size: 14px;">Asegúrate de que los videos están cargados</p>
                    </div>
                `;
                return [];
            }

            let html = `
                <div style="margin-bottom: 20px;">
                    <h3>🎥 Videos Encontrados (${videos.length})</h3>`;

            if (showDownloadAllButton && videos.length > 1) {
                html += `<button id="vc-download-all" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">📥 Descargar Todos</button>`;
            }

            html += `</div>
                <div id="vc-video-list">`;

            videos.forEach((videoUrl, index) => {
                const isEmbedded = videoUrl.includes('youtube.com') || videoUrl.includes('vimeo.com');

                if (isEmbedded) {
                    html += `
                        <div style="margin-bottom: 15px; padding: 15px; background: white; border: 1px solid #ddd; border-radius: 4px;">
                            <p><strong>Video ${index + 1} (Embebido):</strong></p>
                            <p style="word-break: break-all; font-size: 12px; color: #666;">${videoUrl}</p>
                            <a href="${videoUrl}" target="_blank" style="display: inline-block; background: #28a745; color: white; text-decoration: none; padding: 8px 16px; border-radius: 4px;">🔗 Abrir en nueva pestaña</a>
                        </div>`;
                } else {
                    html += `
                        <div style="margin-bottom: 15px; padding: 15px; background: white; border: 1px solid #ddd; border-radius: 4px;">
                            <p><strong>Video ${index + 1}:</strong></p>
                            <video controls muted preload="metadata" style="width: 100%; max-height: 200px; margin-bottom: 10px;">
                                <source src="${videoUrl}" type="video/mp4">
                                Tu navegador no soporta el elemento de video.
                            </video>
                            <p style="word-break: break-all; font-size: 12px; color: #666; margin-bottom: 10px;">${videoUrl}</p>`;

                    if (showDownloadButtons) {
                        html += `<button class="vc-download-btn" data-url="${videoUrl}" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">⬇️ Descargar</button>`;
                    }

                    html += `</div>`;
                }
            });

            html += `</div>`;

            container.innerHTML = html;

            // Agregar event listeners
            if (showDownloadAllButton) {
                const downloadAllBtn = container.querySelector('#vc-download-all');
                if (downloadAllBtn) {
                    downloadAllBtn.addEventListener('click', () => {
                        this.downloadAllVideos(videos);
                    });
                }
            }

            if (showDownloadButtons) {
                const downloadButtons = container.querySelectorAll('.vc-download-btn');
                downloadButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        const url = e.target.getAttribute('data-url');
                        this.downloadVideo(url);
                    });
                });
            }

            // Callback opcional
            if (onVideoFound) {
                onVideoFound(videos);
            }

            return videos;

        } catch (error) {
            console.error('Error en scanAndDisplay:', error);
            const errorHtml = `
                <div style="color: #dc3545; padding: 20px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
                    <p><strong>Error:</strong> ${error.message}</p>
                </div>`;
            container.innerHTML = errorHtml;

            if (onError) {
                onError(error);
            }

            return [];
        }
    }

    /**
     * Descarga un video específico
     * @param {string} url - URL del video a descargar
     * @param {string} filename - Nombre del archivo (opcional)
     */
    static downloadVideo(url, filename = null) {
        try {
            if (!filename) {
                filename = this.getFilenameFromUrl(url);
            }

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            // Agregar temporalmente al DOM y hacer click
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return true;
        } catch (error) {
            console.error('Error al descargar video:', error);
            throw new Error(`No se pudo descargar el video: ${error.message}`);
        }
    }

    /**
     * Descarga múltiples videos con delay entre cada uno
     * @param {Array<string>} urls - Array de URLs de videos
     * @param {number} delay - Delay en ms entre descargas (default: 1000)
     */
    static downloadAllVideos(urls, delay = 1000) {
        if (!urls || urls.length === 0) {
            throw new Error('No hay videos para descargar');
        }

        urls.forEach((url, index) => {
            setTimeout(() => {
                try {
                    this.downloadVideo(url);
                } catch (error) {
                    console.error(`Error descargando video ${index + 1}:`, error);
                }
            }, index * delay);
        });

        return true;
    }

    /**
     * Método auxiliar para obtener nombre de archivo de una URL
     * @param {string} url - URL del archivo
     * @returns {string} Nombre del archivo
     */
    static getFilenameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop().split('?')[0];
            return filename || 'video.mp4';
        } catch (error) {
            return 'video.mp4';
        }
    }

    /**
     * Método simplificado para integración rápida
     * @param {HTMLElement} button - Botón que activa el escaneo
     * @param {HTMLElement} container - Contenedor donde mostrar resultados
     */
    static setupSimpleInterface(button, container) {
        button.addEventListener('click', () => {
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = '🔍 Escaneando...';

            setTimeout(() => {
                this.scanAndDisplay(container);
                button.disabled = false;
                button.textContent = originalText;
            }, 100); // Pequeño delay para mostrar el estado
        });
    }
  }
}

// Para compatibilidad con CommonJS y ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoCapture;
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return VideoCapture; });
} else {
    // Evitar redeclaración si ya existe
    if (!window.VideoCapture) {
        window.VideoCapture = VideoCapture;
    }
}
