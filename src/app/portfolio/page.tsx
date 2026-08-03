import { redirect } from 'next/navigation';

// 旧版单页纵向展示已改为多页面结构，首页承担总览/入口。
// 保留路径兼容：老链接 /portfolio 一律跳转到首页 /。
export default function PortfolioPage() {
  redirect('/');
}
