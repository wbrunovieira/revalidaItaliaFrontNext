// src/services/panda-player-service.ts

import {
  PandaPlayerOptions,
  PandaPlayerInstance,
  PlayerStrategy,
  PandaPlayerEvent,
  PandaEventType,
} from '@/types/panda-player';
import {
  detectBrowserFeatures,
  getBrowserInfo,
} from '@/utils/browser-detection';

export class PandaPlayerService {
  private static instance: PandaPlayerService;
  private strategies: PlayerStrategy[] = [];
  private currentStrategy: PlayerStrategy | null = null;
  private scriptLoaded = false;
  private scriptLoading = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {
    this.initializeStrategies();
  }

  static getInstance(): PandaPlayerService {
    if (!PandaPlayerService.instance) {
      PandaPlayerService.instance =
        new PandaPlayerService();
    }
    return PandaPlayerService.instance;
  }

  private initializeStrategies() {
    // Only run feature detection on client side
    if (typeof window === 'undefined') {
      this.strategies.push({
        priority: 3,
        name: 'iframe-basic',
        check: () => true,
        features: ['playback'],
      });
      return;
    }

    const features = detectBrowserFeatures();
    const browserInfo = getBrowserInfo();

    // Strategy 1: API v2 (Full features)
    this.strategies.push({
      priority: 1,
      name: 'api-v2',
      check: () =>
        features.hasPromises &&
        features.hasPostMessage &&
        !browserInfo.isIE &&
        typeof window !== 'undefined',
      features: [
        'saveProgress',
        'analytics',
        'smartAutoplay',
        'startTime',
        'customControls',
        'speedControl',
        'qualitySelection',
      ],
    });

    // Strategy 2: Enhanced iframe (Most features)
    this.strategies.push({
      priority: 2,
      name: 'iframe-enhanced',
      check: () =>
        features.hasPostMessage && !browserInfo.isIE,
      features: [
        'basicProgress',
        'autoplay',
        'startTime',
        'speedControl',
      ],
    });

    // Strategy 3: Basic iframe (Minimal features)
    this.strategies.push({
      priority: 3,
      name: 'iframe-basic',
      check: () => true, // Always available
      features: ['playback'],
    });

    // Sort by priority
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  async loadPandaScript(): Promise<void> {
    if (this.scriptLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.scriptLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        'https://player.tv.pandavideo.com.br/api.v2.js';
      script.async = true;

      script.onload = () => {
        console.log('Panda script loaded successfully');
        this.scriptLoaded = true;
        this.scriptLoading = false;
        resolve();
      };

      script.onerror = () => {
        this.scriptLoading = false;
        reject(
          new Error('Failed to load Panda Player script')
        );
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  async createPlayer(
    elementId: string,
    options: PandaPlayerOptions
  ): Promise<PandaPlayerInstance | null> {
    // Determine best strategy
    for (const strategy of this.strategies) {
      if (strategy.check()) {
        this.currentStrategy = strategy;
        break;
      }
    }

    if (!this.currentStrategy) {
      console.error('No player strategy available');
      return null;
    }

    console.log(
      `Using player strategy: ${this.currentStrategy.name}`
    );

    switch (this.currentStrategy.name) {
      case 'api-v2':
        return this.createAPIv2Player(elementId, options);
      case 'iframe-enhanced':
        return this.createEnhancedIframePlayer(
          elementId,
          options
        );
      case 'iframe-basic':
        return this.createBasicIframePlayer(
          elementId,
          options
        );
      default:
        return null;
    }
  }

  private async createAPIv2Player(
    elementId: string,
    options: PandaPlayerOptions
  ): Promise<PandaPlayerInstance | null> {
    try {
      await this.loadPandaScript();

      // Wait for PandaPlayer to be available
      let attempts = 0;
      while (!window.PandaPlayer && attempts < 20) {
        await new Promise(resolve =>
          setTimeout(resolve, 100)
        );
        attempts++;
      }

      if (!window.PandaPlayer) {
        console.warn(
          'PandaPlayer not available, falling back'
        );
        return this.createEnhancedIframePlayer(
          elementId,
          options
        );
      }

      // Initialize callback queue if needed
      window.pandascripttag = window.pandascripttag || [];

      return new Promise(resolve => {
        window.pandascripttag!.push(() => {
          try {
            console.log(
              'Creating PandaPlayer with options:',
              options
            );

            // Create player container div if not exists
            const container =
              document.getElementById(elementId);
            if (!container) {
              console.error(
                'Container not found:',
                elementId
              );
              throw new Error('Container not found');
            }

            // Don't clear container or create extra div
            // Panda Player v2 will create its own elements inside the container
            console.log(
              'Creating player in container:',
              elementId
            );
            console.log('Container dimensions:', {
              width: container.offsetWidth,
              height: container.offsetHeight,
              display:
                window.getComputedStyle(container).display,
            });

            // Panda API v2 requires video_external_id and library_id
            const pandaOptions: {
              video_external_id?: string;
              defaultStyle: boolean;
              library_id?: string;
              pullzone?: string;
              autoplay?: boolean;
              muted?: boolean;
              startTime?: number;
              saveProgress?: boolean;
              smartAutoplay?: boolean;
              controls?: string;
              color?: string;
              controlsColor?: string;
              playerConfigs?: PandaPlayerOptions['playerConfigs'];
            } = {
              video_external_id: options.video_id,
              defaultStyle: options.defaultStyle !== false, // Default to true
            };

            // Add library_id if provided (required by API v2)
            if (options.library_id) {
              pandaOptions.library_id = options.library_id;
            }

            // Try adding pullzone to see if it helps
            const pullzone =
              process.env.NEXT_PUBLIC_PANDA_VIDEO_PULLZONE;
            if (pullzone) {
              pandaOptions.pullzone = pullzone;
              console.log(
                'Adding pullzone to pandaOptions:',
                pullzone
              );
            }

            // Add player configurations if provided
            if (options.playerConfigs) {
              // Map our config to Panda's expected format
              if (
                options.playerConfigs.autoplay !== undefined
              ) {
                pandaOptions.autoplay =
                  options.playerConfigs.autoplay;
              }
              if (
                options.playerConfigs.muted !== undefined
              ) {
                pandaOptions.muted =
                  options.playerConfigs.muted;
              }
              if (
                options.playerConfigs.startTime !==
                undefined
              ) {
                pandaOptions.startTime =
                  options.playerConfigs.startTime;
              }
              if (
                options.playerConfigs.saveProgress !==
                undefined
              ) {
                pandaOptions.saveProgress =
                  options.playerConfigs.saveProgress;
              }
              if (
                options.playerConfigs.smartAutoplay !==
                undefined
              ) {
                pandaOptions.smartAutoplay =
                  options.playerConfigs.smartAutoplay;
              }
              if (
                options.playerConfigs.controls !== undefined
              ) {
                pandaOptions.controls =
                  options.playerConfigs.controls;
              }
              if (
                options.playerConfigs.color !== undefined
              ) {
                pandaOptions.color =
                  options.playerConfigs.color;
              }
              if (
                options.playerConfigs.controlsColor !==
                undefined
              ) {
                pandaOptions.controlsColor =
                  options.playerConfigs.controlsColor;
              }
            }

            console.log('Panda options:', pandaOptions);
            console.log(
              'Library ID being passed:',
              options.library_id
            );

            let player: PandaPlayerInstance;
            let isReady = false;

            try {
              // Pass the container ID directly, not the playerDiv ID
              player = new window.PandaPlayer!(
                elementId,
                pandaOptions
              );
              console.log(
                'PandaPlayer instance created with video:',
                options.video_id,
                'library:',
                options.library_id
              );

              // Check available methods for debugging
              if (process.env.NODE_ENV === 'development') {
                console.log(
                  'Player methods:',
                  Object.getOwnPropertyNames(
                    Object.getPrototypeOf(player)
                  )
                );
              }

              // Set up event listeners IMMEDIATELY after creation
              if (
                player.onEvent &&
                typeof player.onEvent === 'function'
              ) {
                console.log('Setting up onEvent listener');
                player.onEvent(
                  (event: PandaPlayerEvent) => {
                    console.log(
                      'Panda Player Event:',
                      event
                    );

                    // Handle ready event
                    if (
                      event.message === 'panda_ready'
                    ) {
                      console.log(
                        'Player is ready via event!'
                      );
                      isReady = true;
                      if (options.onReady) {
                        options.onReady();
                      }
                    }

                    // Handle error event
                    if (
                      event.message === 'panda_error'
                    ) {
                      console.error('Player error:', event);
                      if (options.onError) {
                        options.onError(event);
                      }
                    }

                    // Log all events for debugging
                    if (event.message) {
                      console.log(
                        `Player event: ${event.message}`,
                        event
                      );
                    }
                  }
                );
              } else {
                console.warn(
                  'Player.onEvent is not available'
                );
              }

              // Note: onReady and onError are not methods on PandaPlayerInstance
              // They are handled through the onEvent callback above

              // Don't call _onCreate - it's causing errors and the player works without it

              // Give player time to initialize and check if it's ready
              const checkPlayerReady = () => {
                if (!isReady) {
                  console.log(
                    'Checking if player is ready...'
                  );

                  // Try to check if player is functional
                  try {
                    // Check if the player has created its iframe
                    const container =
                      document.getElementById(elementId);
                    const iframe =
                      container?.querySelector('iframe');
                    if (iframe) {
                      console.log(
                        'Player iframe found:',
                        iframe.src
                      );

                      // WORKAROUND: Panda API v2 creates iframe with library_id in URL instead of pullzone
                      // The API doesn't provide a parameter to specify the player domain correctly,
                      // so we need to fix the URL after the iframe is created
                      const currentSrc = iframe.src;
                      const pullzone =
                        process.env
                          .NEXT_PUBLIC_PANDA_VIDEO_PULLZONE;
                      const libraryId =
                        process.env
                          .NEXT_PUBLIC_PANDA_VIDEO_LIBRARY_ID;

                      if (
                        currentSrc.includes(
                          `player-${libraryId}`
                        ) &&
                        pullzone
                      ) {
                        const correctSrc =
                          currentSrc.replace(
                            `player-${libraryId}`,
                            `player-${pullzone}`
                          );
                        console.log(
                          'Fixing iframe URL from:',
                          currentSrc
                        );
                        console.log('To:', correctSrc);
                        iframe.src = correctSrc;
                      }

                      console.log('Iframe dimensions:', {
                        width: iframe.offsetWidth,
                        height: iframe.offsetHeight,
                        style: iframe.getAttribute('style'),
                      });

                      // Ensure iframe has proper dimensions
                      if (!iframe.style.width) {
                        iframe.style.width = '100%';
                      }
                      if (!iframe.style.height) {
                        iframe.style.height = '100%';
                      }

                      // Wait for iframe to load before triggering ready
                      if (!iframe.dataset.loadChecked) {
                        iframe.dataset.loadChecked = 'true';

                        iframe.addEventListener(
                          'load',
                          () => {
                            console.log(
                              'Iframe loaded successfully'
                            );
                            if (
                              !isReady &&
                              options.onReady
                            ) {
                              isReady = true;
                              options.onReady();
                            }
                          }
                        );

                        // Also trigger ready if iframe is already loaded
                        if (iframe.contentWindow) {
                          console.log(
                            'Iframe already loaded, triggering ready'
                          );
                          if (!isReady && options.onReady) {
                            isReady = true;
                            options.onReady();
                          }
                        }
                      }

                      // Check iframe content (might be blocked by CORS)
                      try {
                        const iframeDoc =
                          iframe.contentDocument ||
                          iframe.contentWindow?.document;
                        console.log(
                          'Iframe has content:',
                          !!iframeDoc
                        );
                      } catch {
                        console.log(
                          'Cannot access iframe content (CORS) - this is normal for cross-origin iframes'
                        );
                      }
                    } else {
                      console.warn(
                        'No iframe found in player container, retrying...'
                      );
                      setTimeout(checkPlayerReady, 500);
                    }
                  } catch (checkError) {
                    console.error(
                      'Player functionality check failed:',
                      checkError
                    );
                  }
                }
              };

              setTimeout(checkPlayerReady, 1000);

              // Wrap destroy method to handle errors
              const originalDestroy = player.destroy;
              player.destroy = () => {
                try {
                  if (
                    originalDestroy &&
                    typeof originalDestroy === 'function'
                  ) {
                    originalDestroy.call(player);
                  }
                } catch (error) {
                  console.warn(
                    'Error destroying PandaPlayer:',
                    error
                  );
                }
              };

              resolve(player);
            } catch (initError) {
              console.error(
                'Failed to initialize PandaPlayer:',
                initError
              );
              throw initError;
            }
          } catch (error) {
            console.error(
              'Error creating PandaPlayer:',
              error
            );
            resolve(
              this.createEnhancedIframePlayer(
                elementId,
                options
              )
            );
          }
        });
      });
    } catch (error) {
      console.error(
        'Failed to load API v2, falling back:',
        error
      );
      return this.createEnhancedIframePlayer(
        elementId,
        options
      );
    }
  }

  private async createEnhancedIframePlayer(
    elementId: string,
    options: PandaPlayerOptions
  ): Promise<PandaPlayerInstance> {
    const container = document.getElementById(elementId);
    if (!container)
      throw new Error(`Element ${elementId} not found`);

    const pullzone =
      process.env.NEXT_PUBLIC_PANDA_VIDEO_PULLZONE;
    const videoId = options.video_id || '';

    console.log(
      'Enhanced iframe - pullzone:',
      pullzone,
      'videoId:',
      videoId
    );

    // Build URL with parameters
    const params = new URLSearchParams();
    params.set('controls', '1'); // Force controls to show
    if (options.playerConfigs?.autoplay)
      params.set('autoplay', '1');
    if (options.playerConfigs?.muted)
      params.set('muted', '1');
    if (options.playerConfigs?.startTime)
      params.set(
        't',
        options.playerConfigs.startTime.toString()
      );

    // Use pullzone instead of library_id in the URL
    const embedUrl = `https://player-${pullzone}.tv.pandavideo.com.br/embed/?v=${videoId}&${params.toString()}`;
    console.log('Enhanced iframe URL:', embedUrl);

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.setAttribute('frameborder', '0');

    // Make container relative positioned for absolute iframe
    container.style.position = 'relative';
    container.innerHTML = '';
    container.appendChild(iframe);

    // Create enhanced player instance with postMessage communication
    return this.createEnhancedPlayerInstance(
      iframe,
      options
    );
  }

  private createEnhancedPlayerInstance(
    iframe: HTMLIFrameElement,
    options: PandaPlayerOptions
  ): PandaPlayerInstance {
    let eventCallbacks: ((
      event: PandaPlayerEvent
    ) => void)[] = [];
    let isPlaying = false;
    let currentTime = 0;
    let duration = 0;

    // Listen for postMessage events
    const messageHandler = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;

      try {
        const data =
          typeof event.data === 'string'
            ? JSON.parse(event.data)
            : event.data;

        if (data.event) {
          const pandaEvent: PandaPlayerEvent = {
            message: data.event as PandaEventType,
            currentTime: data.currentTime || currentTime,
            duration: data.duration || duration,
            video: options.video_id,
          };

          // Update state
          if (data.event === 'play') isPlaying = true;
          if (data.event === 'pause') isPlaying = false;
          if (typeof data.currentTime === 'number')
            currentTime = data.currentTime;
          if (typeof data.duration === 'number')
            duration = data.duration;

          // Notify callbacks
          eventCallbacks.forEach(cb => cb(pandaEvent));
        }
      } catch (error) {
        console.debug('PostMessage parsing error:', error);
      }
    };

    window.addEventListener('message', messageHandler);

    // Send commands to iframe
    const sendCommand = (
      command: string,
      data?: Record<string, unknown>
    ) => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ command, ...data }),
          '*'
        );
      }
    };

    return {
      play: () => sendCommand('play'),
      pause: () => sendCommand('pause'),
      togglePlay: () =>
        sendCommand(isPlaying ? 'pause' : 'play'),
      getCurrentTime: () => currentTime,
      getDuration: () => duration,
      setCurrentTime: (time: number) =>
        sendCommand('seek', { time }),
      setVolume: (volume: number) =>
        sendCommand('setVolume', { volume }),
      getVolume: () => 1, // Default
      isPaused: () => !isPlaying,
      isMuted: () => false, // Default
      isFullscreen: () =>
        document.fullscreenElement === iframe,
      toggleFullscreen: () => {
        if (document.fullscreenElement === iframe) {
          document.exitFullscreen();
        } else {
          iframe.requestFullscreen();
        }
      },
      setSpeed: (speed: number) =>
        sendCommand('setSpeed', { speed }),
      onEvent: (
        callback: (event: PandaPlayerEvent) => void
      ) => {
        eventCallbacks.push(callback);
      },
      destroy: () => {
        try {
          window.removeEventListener(
            'message',
            messageHandler
          );
          eventCallbacks = [];
          if (iframe && iframe.parentNode) {
            iframe.remove();
          }
        } catch (error) {
          console.warn(
            'Error destroying enhanced iframe player:',
            error
          );
        }
      },
    };
  }

  private async createBasicIframePlayer(
    elementId: string,
    options: PandaPlayerOptions
  ): Promise<PandaPlayerInstance> {
    const container = document.getElementById(elementId);
    if (!container)
      throw new Error(`Element ${elementId} not found`);

    const pullzone =
      process.env.NEXT_PUBLIC_PANDA_VIDEO_PULLZONE;
    const videoId = options.video_id || '';

    console.log(
      'Basic iframe - pullzone:',
      pullzone,
      'videoId:',
      videoId
    );

    // Use pullzone instead of library_id in the URL
    const embedUrl = `https://player-${pullzone}.tv.pandavideo.com.br/embed/?v=${videoId}&controls=1`;
    console.log('Basic iframe URL:', embedUrl);

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.setAttribute('frameborder', '0');

    // Make container relative positioned for absolute iframe
    container.style.position = 'relative';
    container.innerHTML = '';
    container.appendChild(iframe);

    // Return basic player instance with minimal functionality
    return {
      play: () => {},
      pause: () => {},
      togglePlay: () => {},
      getCurrentTime: () => 0,
      getDuration: () => 0,
      setCurrentTime: () => {},
      setVolume: () => {},
      getVolume: () => 1,
      isPaused: () => true,
      isMuted: () => false,
      isFullscreen: () => false,
      toggleFullscreen: () => {},
      setSpeed: () => {},
      onEvent: () => {},
      destroy: () => {
        try {
          if (iframe && iframe.parentNode) {
            iframe.remove();
          }
        } catch (error) {
          console.warn(
            'Error destroying basic iframe player:',
            error
          );
        }
      },
    };
  }

  getCurrentStrategy(): PlayerStrategy | null {
    return this.currentStrategy;
  }

  isFeatureSupported(feature: string): boolean {
    return (
      this.currentStrategy?.features.includes(feature) ||
      false
    );
  }
}
