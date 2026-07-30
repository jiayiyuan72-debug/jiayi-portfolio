# Jiayi 个人网站部署指南

## 前提条件

1. 一个 **GitHub** 账号
2. 一个 **Vercel** 账号（免费，用 GitHub 登录）
3. 一个 **Supabase** 账号（免费，用 GitHub 登录）

---

## 第一步：注册 Supabase

1. 打开 [supabase.com](https://supabase.com)，点击 **Start your project**
2. 用 GitHub 账号登录
3. 创建一个新项目：
   - **Name**: `jiayi-portfolio`（或你喜欢的名字）
   - **Database Password**: 设置一个强密码，记下来
   - **Region**: 选择离你最近的区域（如 Singapore 或 Tokyo）
   - **Pricing Plan**: Free
4. 等待数据库创建完成（约 1-2 分钟）

## 第二步：配置数据库

### 2.1 执行 Schema 迁移

1. 在 Supabase Dashboard 中，点击左侧 **SQL Editor**
2. 点击 **New Query**
3. 复制 `supabase/migrations/00001_initial_schema.sql` 的全部内容
4. 粘贴到编辑器中，点击 **Run**
5. 等待执行完成

### 2.2 导入种子数据

1. 在 SQL Editor 中，再创建一个 **New Query**
2. 复制 `supabase/seed.sql` 的全部内容
3. 粘贴运行

### 2.3 配置 Storage

1. 在左侧点击 **Storage**
2. 点击 **New Bucket**
3. 填写：
   - **Name**: `portfolio-media`
   - **Public bucket**: ✅ 开启
4. 点击 **Create bucket**

### 2.4 获取 API 密钥

1. 在左侧点击 **Project Settings** > **API**
2. 复制以下三个值：
   - **Project URL**（格式如 `https://xxxxx.supabase.co`）
   - **anon public key**（以 `eyJ` 开头）
   - **service_role key**（以 `eyJ` 开头，⚠️ 保密！）

---

## 第三步：配置本地环境

1. 在终端中进入项目目录：
```bash
cd /Users/yibaochidebao/Desktop/个人项目/个人网站/jiayi-portfolio
```

2. 复制环境变量模板：
```bash
cp .env.local.example .env.local
```

3. 编辑 `.env.local`，填入刚才从 Supabase 复制的三个值

4. 生成管理员密码：
```bash
npx tsx scripts/hash-password.ts
```
   - 输入你想要的密码（例如 `jiayi123`）
   - 把输出的哈希值复制到 `.env.local` 的 `ADMIN_PASSWORD_HASH`

5. 生成 Session 密钥：
```bash
# 在终端中执行，把输出的字符串复制到 SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

6. `.env.local` 文件最终应该像这样：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
ADMIN_PASSWORD_HASH=$2b$10$xxxxx
SESSION_SECRET=aabbccddeeff...（至少32字）
```

---

## 第四步：本地测试

```bash
npm run dev
```

打开浏览器访问：
- **入口页**: http://localhost:3000
- **后台登录**: http://localhost:3000/admin/login
- **前台页面**: http://localhost:3000/portfolio

---

## 第五步：部署到 Vercel

### 5.1 推送到 GitHub

首先在 GitHub 上创建一个仓库，然后：
```bash
# 初始化 Git（如果还没做）
cd /Users/yibaochidebao/Desktop/个人项目/个人网站/jiayi-portfolio
git init
git add .
git commit -m "🎉 初始化 Jiayi 个人网站"

# 关联远程仓库
git remote add origin https://github.com/你的用户名/jiayi-portfolio.git
git push -u origin main
```

### 5.2 在 Vercel 部署

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录
2. 点击 **Add New** > **Project**
3. 导入刚才的 `jiayi-portfolio` 仓库
4. 在 **Environment Variables** 中添加以下环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD_HASH`
   - `SESSION_SECRET`
5. 点击 **Deploy**
6. 等待部署完成（约 2-3 分钟）

### 5.3 部署完成

Vercel 会给你一个域名（如 `jiayi-portfolio.vercel.app`），现在任何人都可以访问了！

---

## 使用说明

### 管理员登录
1. 访问 `https://你的域名/admin/login`
2. 输入你在步骤 3 设置的密码
3. 进入后台管理

### 管理板块
- 在后台左侧点击 **板块管理**
- 拖拽排序、新增板块、隐藏/显示、删除
- 点击 **设计** 进入板块设计面板，可配置字段、布局和样式

### 管理内容
- 在后台点击 **内容管理**
- 按板块筛选内容
- 点击 **编辑** 进入编辑页面，根据板块配置显示不同表单

### 查看留言
- 在后台点击 **访客留言**
- 查看、标记已读/未读、删除留言

### 站点设置
- 在后台点击 **站点设置**
- 修改入口页标题、按钮文案、颜色等

---

## 故障排除

### 数据库连接失败
- 检查 `.env.local` 中的 Supabase URL 和 Key 是否正确
- 确认 Supabase 项目状态正常（不是暂停状态）

### 登录密码错误
- 重新运行 `npx tsx scripts/hash-password.ts` 生成哈希
- 确认哈希值正确复制到环境变量

### 图片上传失败
- 确认 Supabase Storage 的 `portfolio-media` bucket 已创建
- 确认文件大小不超过 2MB
- 确认文件类型在允许列表中

### 部署后页面空白
- 检查 Vercel 部署日志是否有错误
- 确认 Vercel 环境变量已全部设置
