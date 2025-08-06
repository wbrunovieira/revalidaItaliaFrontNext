// src/services/video-progress-heartbeat.ts

import { VideoProgress } from '@/types/panda-player';

interface ProgressUpdate {
  lessonId: string;
  courseId?: string;
  moduleId?: string;
  progress: VideoProgress;
  timestamp: number;
  attempts: number;
  // Additional context for new API
  lessonTitle?: string;
  courseTitle?: string;
  courseSlug?: string;
  moduleTitle?: string;
  moduleSlug?: string;
  lessonImageUrl?: string;
}

interface HeartbeatConfig {
  flushInterval?: number;
  maxRetryAttempts?: number;
  batchSize?: number;
  apiEndpoint?: string;
}

const LOG_PREFIX = '[HeartbeatService]';

export class VideoProgressHeartbeat {
  private static instance: VideoProgressHeartbeat;
  private updateQueue = new Map<string, ProgressUpdate>();
  private flushInterval: NodeJS.Timeout | null = null;
  private isOnline =
    typeof navigator !== 'undefined'
      ? navigator.onLine
      : true;
  private isFlushing = false;

  // Configuration
  private readonly FLUSH_INTERVAL: number;
  private readonly MAX_RETRY_ATTEMPTS: number;
  private readonly BATCH_SIZE: number;
  private readonly API_ENDPOINT: string;
  private readonly NEW_API_ENDPOINT =
    '/api/v1/users/me/lesson-progress';
  private readonly CACHE_KEY = 'revalida_heartbeat_queue';

  constructor(config?: HeartbeatConfig) {
    this.FLUSH_INTERVAL = config?.flushInterval || 30000; // 30 seconds
    this.MAX_RETRY_ATTEMPTS = config?.maxRetryAttempts || 3;
    this.BATCH_SIZE = config?.batchSize || 10;
    this.API_ENDPOINT =
      config?.apiEndpoint ||
      '/api/v1/learning-progress/batch';

    console.log(
      `${LOG_PREFIX} 🚀 Initializing with config:`,
      {
        flushInterval: this.FLUSH_INTERVAL,
        maxRetryAttempts: this.MAX_RETRY_ATTEMPTS,
        batchSize: this.BATCH_SIZE,
        apiEndpoint: this.API_ENDPOINT,
      }
    );

    this.setupEventListeners();
    this.loadQueueFromCache();
    this.startHeartbeat();
  }

  // Singleton pattern
  static getInstance(
    config?: HeartbeatConfig
  ): VideoProgressHeartbeat {
    if (!VideoProgressHeartbeat.instance) {
      VideoProgressHeartbeat.instance =
        new VideoProgressHeartbeat(config);
    }
    return VideoProgressHeartbeat.instance;
  }

  // Setup network status listeners
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log(
        `${LOG_PREFIX} 🌐 Network online - triggering flush`
      );
      this.isOnline = true;
      this.flush(); // Flush immediately when coming online
    });

    window.addEventListener('offline', () => {
      console.log(
        `${LOG_PREFIX} 📵 Network offline - pausing heartbeat`
      );
      this.isOnline = false;
    });

    // Save queue before page unload
    window.addEventListener('beforeunload', () => {
      console.log(
        `${LOG_PREFIX} 🔄 Page unloading - saving queue to cache`
      );
      this.saveQueueToCache();
    });
  }

  // Load queue from localStorage
  private loadQueueFromCache(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const updates = JSON.parse(
          cached
        ) as ProgressUpdate[];
        updates.forEach(update => {
          this.updateQueue.set(update.lessonId, update);
        });

        console.log(
          `${LOG_PREFIX} 📥 Loaded ${updates.length} updates from cache:`,
          updates.map(u => ({
            lessonId: u.lessonId,
            percentage:
              u.progress.percentage.toFixed(2) + '%',
            attempts: u.attempts,
          }))
        );
      } else {
        console.log(
          `${LOG_PREFIX} 📭 No cached updates found`
        );
      }
    } catch (error) {
      console.error(
        `${LOG_PREFIX} ❌ Error loading cache:`,
        error
      );
    }
  }

  // Save queue to localStorage
  private saveQueueToCache(): void {
    try {
      const updates = Array.from(this.updateQueue.values());
      if (updates.length > 0) {
        localStorage.setItem(
          this.CACHE_KEY,
          JSON.stringify(updates)
        );
        console.log(
          `${LOG_PREFIX} 💾 Saved ${updates.length} updates to cache`
        );
      } else {
        localStorage.removeItem(this.CACHE_KEY);
        console.log(
          `${LOG_PREFIX} 🧹 Cleared cache (queue empty)`
        );
      }
    } catch (error) {
      console.error(
        `${LOG_PREFIX} ❌ Error saving to cache:`,
        error
      );
    }
  }

  // Start heartbeat timer
  private startHeartbeat(): void {
    console.log(
      `${LOG_PREFIX} ❤️ Starting heartbeat with ${this.FLUSH_INTERVAL}ms interval`
    );

    this.flushInterval = setInterval(() => {
      console.log(
        `${LOG_PREFIX} ⏰ Heartbeat tick - queue size: ${this.updateQueue.size}`
      );
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  // Stop heartbeat
  public stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
      console.log(`${LOG_PREFIX} 🛑 Heartbeat stopped`);
    }
  }

  // Add or update progress in queue
  public enqueue(
    lessonId: string,
    progress: VideoProgress,
    courseId?: string,
    moduleId?: string
  ): void {
    const existing = this.updateQueue.get(lessonId);

    // Only enqueue if progress changed significantly (> 1%)
    if (
      existing &&
      Math.abs(
        existing.progress.percentage - progress.percentage
      ) < 1
    ) {
      console.log(
        `${LOG_PREFIX} ⏭️ Skipping update (change < 1%):`,
        {
          lessonId,
          oldPercentage:
            existing.progress.percentage.toFixed(2) + '%',
          newPercentage:
            progress.percentage.toFixed(2) + '%',
        }
      );
      return;
    }

    const update: ProgressUpdate = {
      lessonId,
      courseId,
      moduleId,
      progress,
      timestamp: Date.now(),
      attempts: existing?.attempts || 0,
    };

    this.updateQueue.set(lessonId, update);

    console.log(`${LOG_PREFIX} 📝 Enqueued update:`, {
      lessonId,
      courseId,
      moduleId,
      currentTime: progress.currentTime,
      percentage: progress.percentage.toFixed(2) + '%',
      duration: progress.duration,
      queueSize: this.updateQueue.size,
    });

    // Save to cache after each update
    this.saveQueueToCache();

    // Trigger immediate flush if queue is getting large
    if (this.updateQueue.size >= this.BATCH_SIZE) {
      console.log(
        `${LOG_PREFIX} 📦 Queue size reached batch limit - triggering flush`
      );
      this.flush();
    }
  }

  // Enqueue update with full context for new API
  public enqueueWithContext(
    lessonId: string,
    progress: VideoProgress,
    context: {
      courseId?: string;
      moduleId?: string;
      lessonTitle?: string;
      courseTitle?: string;
      courseSlug?: string;
      moduleTitle?: string;
      moduleSlug?: string;
      lessonImageUrl?: string;
    }
  ): void {
    if (!lessonId || !progress) {
      console.warn(
        `${LOG_PREFIX} ⚠️ Invalid update - missing required fields`
      );
      return;
    }

    const existing = this.updateQueue.get(lessonId);

    // Only enqueue if progress changed significantly (> 1%)
    if (
      existing &&
      Math.abs(
        existing.progress.percentage - progress.percentage
      ) < 1
    ) {
      console.log(
        `${LOG_PREFIX} ⏭️ Skipping update (change < 1%):`,
        {
          lessonId,
          oldPercentage:
            existing.progress.percentage.toFixed(2) + '%',
          newPercentage:
            progress.percentage.toFixed(2) + '%',
        }
      );
      return;
    }

    const update: ProgressUpdate = {
      lessonId,
      ...context,
      progress,
      timestamp: Date.now(),
      attempts: existing?.attempts || 0,
    };

    this.updateQueue.set(lessonId, update);

    console.log(
      `${LOG_PREFIX} 📝 Enqueued update with context:`,
      {
        lessonId,
        lessonTitle: context.lessonTitle,
        courseTitle: context.courseTitle,
        percentage: progress.percentage.toFixed(2) + '%',
        queueSize: this.updateQueue.size,
      }
    );

    // Save to cache after each update
    this.saveQueueToCache();

    // Trigger immediate flush if queue is getting large
    if (this.updateQueue.size >= this.BATCH_SIZE) {
      console.log(
        `${LOG_PREFIX} 📦 Queue size reached batch limit - triggering flush`
      );
      this.flush();
    }
  }

  // Flush all pending updates to backend
  public async flush(): Promise<void> {
    if (!this.isOnline) {
      console.log(
        `${LOG_PREFIX} 📵 Skip flush - offline (${this.updateQueue.size} updates pending)`
      );
      return;
    }

    if (this.isFlushing) {
      console.log(
        `${LOG_PREFIX} ⏳ Skip flush - already in progress`
      );
      return;
    }

    if (this.updateQueue.size === 0) {
      console.log(
        `${LOG_PREFIX} 📭 Skip flush - queue empty`
      );
      return;
    }

    this.isFlushing = true;
    const updates = Array.from(this.updateQueue.values());

    console.log(
      `${LOG_PREFIX} 🚀 Starting flush of ${updates.length} updates:`,
      updates.map(u => ({
        lessonId: u.lessonId,
        percentage: u.progress.percentage.toFixed(2) + '%',
        attempts: u.attempts,
      }))
    );

    try {
      await this.sendToBackend(updates);

      // Clear successfully sent updates
      updates.forEach(update => {
        this.updateQueue.delete(update.lessonId);
      });

      console.log(
        `${LOG_PREFIX} ✅ Flush successful - cleared ${updates.length} updates`
      );
      this.saveQueueToCache();
    } catch (error) {
      console.error(
        `${LOG_PREFIX} ❌ Flush failed:`,
        error
      );
      this.handleFlushError(updates);
    } finally {
      this.isFlushing = false;
    }
  }

  // Send updates to backend
  private async sendToBackend(
    updates: ProgressUpdate[]
  ): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3333';

    // Process updates one by one for the new API
    // (in the future, this could be optimized to batch updates)
    for (const update of updates) {
      // Check if we have full context for new API
      if (
        update.lessonTitle &&
        update.courseTitle &&
        update.courseSlug &&
        update.moduleSlug
      ) {
        // Use new API with full context - exact field order as DTO
        const payload: any = {
          lessonId: update.lessonId,
          lessonTitle: update.lessonTitle,
          courseId: update.courseId || '',
          courseTitle: update.courseTitle,
          courseSlug: update.courseSlug,
          moduleId: update.moduleId || '',
          moduleTitle: update.moduleTitle || '',
          moduleSlug: update.moduleSlug,
          lessonImageUrl: update.lessonImageUrl || '/uploads/images/lessons/default.png',
          videoProgress: {
            currentTime: Math.round(update.progress.currentTime),
            duration: Math.round(update.progress.duration),
            percentage: Math.round(update.progress.percentage * 100) / 100, // Round to 2 decimal places
          },
        };

        console.log(
          `${LOG_PREFIX} 📤 Sending to new API:`,
          {
            endpoint: this.NEW_API_ENDPOINT,
            lessonTitle: payload.lessonTitle,
            percentage:
              payload.videoProgress.percentage.toFixed(2) +
              '%',
          }
        );
        
        // Debug: log complete payload
        console.log(
          `${LOG_PREFIX} 📦 Full payload:`,
          JSON.stringify(payload, null, 2)
        );
        
        // Double check what we're actually sending
        const bodyToSend = JSON.stringify(payload);
        console.log(
          `${LOG_PREFIX} 🔍 Exact body being sent:`,
          bodyToSend
        );

        const response = await fetch(
          `${apiUrl}${this.NEW_API_ENDPOINT}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: bodyToSend,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `${LOG_PREFIX} ❌ Backend validation error:`,
            {
              status: response.status,
              response: errorText,
              sentPayload: payload,
              payloadKeys: Object.keys(payload),
              hasLessonImageUrl: 'lessonImageUrl' in payload
            }
          );
          throw new Error(
            `API error: ${response.status} - ${errorText}`
          );
        }

        const result = await response.json();
        console.log(
          `${LOG_PREFIX} 📥 Backend response:`,
          result
        );
      } else {
        // Fallback to old API format if we don't have full context
        console.log(
          `${LOG_PREFIX} ⚠️ Missing context for new API, skipping:`,
          {
            lessonId: update.lessonId,
            hasTitle: !!update.lessonTitle,
            hasCourseTitle: !!update.courseTitle,
          }
        );
      }
    }
  }

  // Handle flush errors with retry logic
  private handleFlushError(
    updates: ProgressUpdate[]
  ): void {
    updates.forEach(update => {
      update.attempts += 1;

      if (update.attempts >= this.MAX_RETRY_ATTEMPTS) {
        console.log(
          `${LOG_PREFIX} 🚫 Max attempts reached, removing update:`,
          {
            lessonId: update.lessonId,
            attempts: update.attempts,
          }
        );
        this.updateQueue.delete(update.lessonId);
      } else {
        console.log(
          `${LOG_PREFIX} 🔄 Incrementing retry attempt:`,
          {
            lessonId: update.lessonId,
            attempts: update.attempts,
          }
        );
        this.updateQueue.set(update.lessonId, update);
      }
    });

    this.saveQueueToCache();
  }

  // Get auth token from various sources
  private getAuthToken(): string | null {
    // Try cookies first
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c =>
        c.trim().startsWith('token=')
      );
      if (tokenCookie) {
        return tokenCookie.split('=')[1];
      }
    }

    // Try localStorage
    const localToken = localStorage.getItem('token');
    if (localToken) {
      return localToken;
    }

    // Try sessionStorage
    const sessionToken = sessionStorage.getItem('token');
    if (sessionToken) {
      return sessionToken;
    }

    console.warn(`${LOG_PREFIX} ⚠️ No auth token found`);
    return null;
  }

  // Get current queue status
  public getStatus(silent: boolean = false): {
    queueSize: number;
    isOnline: boolean;
    isFlushing: boolean;
    oldestUpdate: number | null;
  } {
    const updates = Array.from(this.updateQueue.values());
    const oldestUpdate =
      updates.length > 0
        ? Math.min(...updates.map(u => u.timestamp))
        : null;

    const status = {
      queueSize: this.updateQueue.size,
      isOnline: this.isOnline,
      isFlushing: this.isFlushing,
      oldestUpdate,
    };

    // Only log if not silent mode
    if (!silent) {
      console.log(`${LOG_PREFIX} 📊 Status:`, {
        ...status,
        oldestUpdateAge: oldestUpdate
          ? `${Math.round(
              (Date.now() - oldestUpdate) / 1000
            )}s ago`
          : 'N/A',
      });
    }

    return status;
  }

  // Force clear queue (for testing/debugging)
  public clearQueue(): void {
    const size = this.updateQueue.size;
    this.updateQueue.clear();
    this.saveQueueToCache();
    console.log(
      `${LOG_PREFIX} 🧹 Queue cleared (removed ${size} updates)`
    );
  }
}

// Export singleton instance getter
export const getHeartbeatService = (
  config?: HeartbeatConfig
) => VideoProgressHeartbeat.getInstance(config);
