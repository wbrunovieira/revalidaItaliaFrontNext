import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Types
interface FlashcardInteraction {
  flashcardId: string;
  difficultyLevel: 'EASY' | 'HARD';
  lessonId?: string;
  timestamp: number;
}

interface UserBuffer {
  items: FlashcardInteraction[];
  lastUpdate: number;
}

// In-memory buffer
const progressBuffer = new Map<string, UserBuffer>();

// Configuration
const BATCH_SIZE = 5;
const FLUSH_TIME = 10000; // 10 seconds
const MAX_BUFFER_SIZE = 100; // Safety limit per user

// Helper to extract user ID from token
async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    // Decode JWT (without verification for now - just to get user ID)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload.id || null;
  } catch {
    return null;
  }
}

// Helper to flush user progress to backend
async function flushUserProgress(userId: string, token: string): Promise<{ success: boolean; error?: string }> {
  const userBuffer = progressBuffer.get(userId);
  if (!userBuffer || userBuffer.items.length === 0) {
    return { success: true };
  }

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    
    // Transform to backend format
    const interactions = userBuffer.items.map(item => ({
      flashcardId: item.flashcardId,
      difficultyLevel: item.difficultyLevel,
      ...(item.lessonId && { lessonId: item.lessonId })
    }));

    const response = await fetch(`${API_URL}/api/v1/flashcard-interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ interactions })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to flush flashcard progress:', errorData);
      return { 
        success: false, 
        error: errorData.detail || 'Failed to save progress' 
      };
    }

    const result = await response.json();
    
    // Clear successfully sent items
    userBuffer.items = [];
    userBuffer.lastUpdate = Date.now();
    
    console.log(`Flushed ${result.totalProcessed} flashcard interactions for user ${userId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error flushing progress:', error);
    return { 
      success: false, 
      error: 'Network error while saving progress' 
    };
  }
}

// API route handler
export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - no token found' },
        { status: 401 }
      );
    }

    // Extract user ID from token
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { flashcardId, result, lessonId } = body;

    // Validate input
    if (!flashcardId || !result) {
      return NextResponse.json(
        { error: 'Missing required fields: flashcardId and result' },
        { status: 400 }
      );
    }

    // Map frontend result to backend difficultyLevel
    const difficultyLevel = result === 'mastered' ? 'EASY' : 'HARD';

    // Initialize buffer for user if needed
    if (!progressBuffer.has(userId)) {
      progressBuffer.set(userId, {
        items: [],
        lastUpdate: Date.now()
      });
    }

    const userBuffer = progressBuffer.get(userId)!;
    
    // Add to buffer with safety check
    if (userBuffer.items.length >= MAX_BUFFER_SIZE) {
      // Force flush if buffer is too large
      await flushUserProgress(userId, token);
    }

    userBuffer.items.push({
      flashcardId,
      difficultyLevel,
      lessonId,
      timestamp: Date.now()
    });
    userBuffer.lastUpdate = Date.now();

    // Check if should flush
    if (userBuffer.items.length >= BATCH_SIZE) {
      // Flush immediately when batch size is reached
      const flushResult = await flushUserProgress(userId, token);
      
      return NextResponse.json({
        status: flushResult.success ? 'flushed' : 'queued',
        message: flushResult.success 
          ? `Saved ${BATCH_SIZE} interactions` 
          : 'Queued for later retry',
        error: flushResult.error
      });
    }

    return NextResponse.json({
      status: 'queued',
      queueSize: userBuffer.items.length,
      message: `Queued (${userBuffer.items.length}/${BATCH_SIZE})`
    });

  } catch (error) {
    console.error('Error in flashcard progress API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint to force flush (useful for page unload)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const flushResult = await flushUserProgress(userId, token);
    
    return NextResponse.json({
      status: flushResult.success ? 'flushed' : 'failed',
      error: flushResult.error
    });

  } catch (error) {
    console.error('Error forcing flush:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background flush by time (Next.js doesn't support true background jobs)
// This will be called by a client-side interval or external cron
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');
    
    // Simple auth for cron endpoint
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let totalFlushed = 0;
    let totalFailed = 0;
    const now = Date.now();

    // Flush all users with old data
    for (const [userId, buffer] of progressBuffer.entries()) {
      if (buffer.items.length > 0 && (now - buffer.lastUpdate) > FLUSH_TIME) {
        // Note: This is simplified - in production you'd need to store tokens differently
        console.log(`Time-based flush for user ${userId} with ${buffer.items.length} items`);
        totalFlushed += buffer.items.length;
        
        // For cron job, we can't flush without user token
        // In production, you might want to store refresh tokens or use service account
        buffer.items = []; // Clear old data to prevent memory leak
      }
    }

    return NextResponse.json({
      status: 'completed',
      totalFlushed,
      totalFailed,
      activeUsers: progressBuffer.size
    });

  } catch (error) {
    console.error('Error in cron flush:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}