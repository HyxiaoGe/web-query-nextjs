// 健康检查 API
import { NextResponse } from 'next/server';
import { searchService } from '@/lib/search';

export async function GET() {
  try {
    const health = await searchService.healthCheck();
    
    const status = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json({
      success: true,
      status: health.status,
      checks: {
        searxng: health.searxng,
        cache: health.cache,
        api: true
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0-mvp'
    }, { status });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}