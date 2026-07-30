# Jiayi 个人网站

一个可动态配置的个人内容管理系统。后台可自由管理板块、内容、样式，前台根据配置自动渲染。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: Supabase (PostgreSQL)
- **存储**: Supabase Storage (图片、文件)
- **样式**: Tailwind CSS
- **认证**: iron-session + bcrypt
- **部署**: Vercel (免费套餐)

## 快速开始

### 1. 配置环境变量

```bash
cp .env.local.example .env.local
```

填写 Supabase 和认证相关配置（详见 [DEPLOY.md](./DEPLOY.md)）。

### 2. 生成管理员密码

```bash
npx tsx scripts/hash-password.ts
```

输入密码后将输出的哈希值填入 `.env.local` 的 `ADMIN_PASSWORD_HASH`。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
src/
├── app/
│   ├── page.tsx                # 入口选择页
│   ├── portfolio/page.tsx      # 前台内容组合页
│   ├── admin/                  # 后台管理页面
│   │   ├── login/page.tsx
│   │   ├── sections/page.tsx   # 板块管理
│   │   ├── sections/[id]/      # 板块设计
│   │   ├── content/page.tsx    # 内容列表
│   │   ├── content/[id]/       # 内容编辑
│   │   ├── messages/page.tsx   # 访客留言
│   │   └── settings/page.tsx   # 站点设置
│   └── api/                    # API 路由
├── components/
│   ├── visitor/                # 前台组件
│   │   ├── SectionRenderer.tsx # 动态板块渲染器
│   │   └── content-renderers/  # 各布局渲染器
│   └── admin/                  # 后台组件
│       ├── DynamicForm.tsx     # 动态表单生成器
│       └── ...
├── lib/
│   ├── supabase/               # Supabase 客户端
│   ├── session.ts              # 认证会话
│   └── constants.ts            # 常量
├── types/                      # TypeScript 类型定义
└── proxy.ts                    # 路由保护
```

## 功能

### 访客
- 入口选择页（"我是访客"/"我是管理者"）
- 访客问卷（化名 + 留言）
- 板块动态渲染：时间轴、卡片、画廊、文章、游记、日记、混合
- 响应式设计

### 管理员
- 密码登录（session cookie）
- 板块管理：新增/删除/拖拽排序/隐藏
- 板块设计：字段配置、布局选择、样式配置
- 内容管理：按板块动态表单编辑
- 访客留言管理：标记已读/未读、搜索、删除
- 站点设置：入口页文案、颜色

## 部署

详见 [DEPLOY.md](./DEPLOY.md)。
