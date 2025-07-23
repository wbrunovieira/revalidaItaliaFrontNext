// Test utility for heartbeat service - Development only

import { getHeartbeatService } from '@/services/video-progress-heartbeat';
import { VideoProgress } from '@/types/panda-player';

export function runHeartbeatTest() {
  console.log('🧪 [HeartbeatTest] Starting heartbeat service test...');
  
  const heartbeat = getHeartbeatService();
  
  // Simulate progress updates
  const lessonId = 'test-lesson-123';
  const courseId = 'test-course-456';
  const moduleId = 'test-module-789';
  
  let currentTime = 0;
  const duration = 600; // 10 minutes video
  
  // Test 1: Add some updates
  console.log('🧪 [HeartbeatTest] Test 1: Adding progress updates...');
  
  for (let i = 0; i < 5; i++) {
    currentTime += 30; // 30 seconds progress
    const progress: VideoProgress = {
      currentTime,
      duration,
      percentage: (currentTime / duration) * 100
    };
    
    heartbeat.enqueue(lessonId, progress, courseId, moduleId);
  }
  
  // Test 2: Check status
  console.log('🧪 [HeartbeatTest] Test 2: Checking status...');
  const status1 = heartbeat.getStatus();
  console.log('Status after enqueue:', status1);
  
  // Test 3: Simulate offline
  console.log('🧪 [HeartbeatTest] Test 3: Simulating offline...');
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false
  });
  window.dispatchEvent(new Event('offline'));
  
  // Add more updates while offline
  currentTime += 60;
  heartbeat.enqueue(lessonId, {
    currentTime,
    duration,
    percentage: (currentTime / duration) * 100
  }, courseId, moduleId);
  
  // Test 4: Back online
  setTimeout(() => {
    console.log('🧪 [HeartbeatTest] Test 4: Going back online...');
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    window.dispatchEvent(new Event('online'));
  }, 5000);
  
  // Test 5: Manual flush
  setTimeout(() => {
    console.log('🧪 [HeartbeatTest] Test 5: Manual flush...');
    heartbeat.flush();
  }, 7000);
  
  // Test 6: Clear queue
  setTimeout(() => {
    console.log('🧪 [HeartbeatTest] Test 6: Clearing queue...');
    heartbeat.clearQueue();
    const finalStatus = heartbeat.getStatus();
    console.log('Final status:', finalStatus);
    console.log('🧪 [HeartbeatTest] Test completed!');
  }, 10000);
}

// Export for console usage in development
if (typeof window !== 'undefined') {
  (window as any).testHeartbeat = runHeartbeatTest;
  console.log('💡 Run window.testHeartbeat() in console to test the heartbeat service');
}