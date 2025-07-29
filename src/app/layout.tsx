import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Web Query - 通用网络搜索服务',
  description: '基于 SearxNG 的通用网络搜索服务，聚合多个搜索引擎结果，提供快速、准确的搜索体验。',
  keywords: '搜索, 网络搜索, SearxNG, 搜索引擎聚合',
  authors: [{ name: 'Web Query Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  openGraph: {
    title: 'Web Query - 通用网络搜索服务',
    description: '聚合多个搜索引擎，提供更全面的搜索结果',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Query - 通用网络搜索服务',
    description: '聚合多个搜索引擎，提供更全面的搜索结果',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-background flex flex-col">
          {/* 预留导航栏位置 */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-primary">
                  <a href="/" className="hover:opacity-80 transition-opacity">
                    Web Query
                  </a>
                </h1>
                
                {/* 预留用户菜单位置 */}
                <nav className="flex items-center gap-4">
                  <a 
                    href="/metrics" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    状态
                  </a>
                  <a 
                    href="/feedback" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    反馈
                  </a>
                  {/* 预留登录/注册按钮 */}
                  {/* <Button variant="outline" size="sm">登录</Button> */}
                </nav>
              </div>
            </div>
          </header>

          {/* 主内容区域 */}
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>

          {/* 页脚 */}
          <footer className="border-t mt-16">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center md:justify-items-start">
                <div className="text-center md:text-left">
                  <h3 className="font-semibold mb-3">关于 Web Query</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    基于 SearxNG 的开源搜索服务，聚合多个搜索引擎结果，
                    保护隐私的同时提供全面的搜索体验。
                  </p>
                </div>
                
                <div className="text-center md:text-left">
                  <h3 className="font-semibold mb-3">功能特性</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 inline-block text-left">
                    <li>• 多搜索引擎聚合</li>
                    <li>• 结果智能缓存</li>
                    <li>• 隐私保护</li>
                    <li>• 开源免费</li>
                  </ul>
                </div>
                
                <div className="text-center md:text-left">
                  <h3 className="font-semibold mb-3">技术支持</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 inline-block text-left">
                    <li>
                      <a href="https://github.com/HyxiaoGe/web-query-nextjs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                        GitHub 项目
                      </a>
                    </li>
                    <li>
                      <a href="/metrics" className="hover:text-foreground">
                        服务状态
                      </a>
                    </li>
                    <li>
                      <a href="/feedback" className="hover:text-foreground">
                        用户反馈
                      </a>
                    </li>
                    {/* 预留文档链接 */}
                    {/* <li><a href="/docs" className="hover:text-foreground">使用文档</a></li> */}
                  </ul>
                </div>
              </div>
              
              <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
                <p>© 2024 Web Query. 基于 Next.js 和 SearxNG 构建.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}