// 管理员专用限流状态监控 API 接口
// 需要管理员权限访问，不对外公开
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';

// 简单的管理员权限验证（生产环境应使用更安全的方式）
function isAdmin(request: NextRequest): boolean {
  // 可以通过环境变量设置管理员密钥
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;
  
  const authHeader = request.headers.get('Authorization');
  return authHeader === `Bearer ${adminKey}`;
}

export async function GET(request: NextRequest) {
  // 验证管理员权限
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized access' },
      { status: 401 }
    );
  }

  try {
    // 获取限流状态（仅限管理员）
    const status = await rateLimiter.getStatus();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      rateLimiter: {
        currentConcurrentRequests: status.concurrentRequests,
        maxConcurrentRequests: status.config.global.maxConcurrentRequests,
        limits: {
          global: {
            requestsPerMinute: status.config.global.maxRequestsPerMinute,
            concurrentRequests: status.config.global.maxConcurrentRequests
          },
          perIP: {
            requestsPerMinute: status.config.perIP.maxRequestsPerMinute,
            requestsPerHour: status.config.perIP.maxRequestsPerHour
          },
          perQuery: {
            requestsPerMinute: status.config.perQuery.maxRequestsPerMinute
          }
        },
        utilization: {
          concurrent: Math.round((status.concurrentRequests / status.config.global.maxConcurrentRequests) * 100),
          status: status.concurrentRequests >= status.config.global.maxConcurrentRequests * 0.8 
            ? 'high' : status.concurrentRequests >= status.config.global.maxConcurrentRequests * 0.5 
            ? 'medium' : 'low'
        }
      }
    });

  } catch (error) {
    console.error('Admin rate limit status API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get rate limit status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}