// 管理 API 预留接口
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 预留管理接口 - 当前 MVP 版本返回占位信息
  return NextResponse.json({
    success: false,
    error: 'Admin features not available in MVP version',
    message: 'This endpoint is reserved for future admin functionality',
    features: {
      userManagement: 'coming_soon',
      apiKeyManagement: 'coming_soon',
      systemStats: 'coming_soon',
      searchAnalytics: 'coming_soon'
    },
    timestamp: new Date().toISOString()
  }, { status: 501 }); // 501 Not Implemented
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Admin features not available in MVP version',
    timestamp: new Date().toISOString()
  }, { status: 501 });
}