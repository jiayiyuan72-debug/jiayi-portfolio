# Jiayi Portfolio 香港服务器部署说明

这个项目是 `Next.js + Supabase`，不是纯静态站。为了让国内访问更稳定，建议部署到香港或新加坡服务器，而不是只使用 `vercel.app` 默认域名。

## 一、服务器建议

推荐选择：

- 腾讯云轻量应用服务器：香港
- 阿里云轻量应用服务器：香港
- 其他香港/新加坡 Linux VPS

最低配置建议：

- 1 核 CPU
- 1GB 内存
- Ubuntu 22.04 或 24.04
- 开放端口：`80`、`443`、`22`

## 二、部署前准备

你需要准备这些环境变量，值来自 Supabase 和管理员密码配置：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
```

如果还没有管理员密码哈希，在本地运行：

```bash
npx tsx scripts/hash-password.ts
```

生成 `SESSION_SECRET`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 三、服务器安装 Docker

登录服务器后执行：

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

退出 SSH 再重新登录，让 Docker 用户组生效。

安装 Docker Compose：

```bash
sudo apt install -y docker-compose-plugin
```

## 四、上传代码

在服务器上拉取仓库：

```bash
git clone https://github.com/jiayiyuan72-debug/jiayi-portfolio.git
cd jiayi-portfolio
```

如果服务器访问 GitHub 不稳定，可以在本地打包上传：

```bash
tar --exclude=node_modules --exclude=.next -czf jiayi-portfolio.tar.gz jiayi-portfolio
scp jiayi-portfolio.tar.gz root@你的服务器IP:/opt/
```

服务器解压：

```bash
cd /opt
tar -xzf jiayi-portfolio.tar.gz
cd jiayi-portfolio
```

## 五、写入生产环境变量

在项目根目录创建 `.env.production`：

```bash
nano .env.production
```

填入：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
ADMIN_PASSWORD_HASH=你的管理员密码哈希
SESSION_SECRET=至少32字符随机字符串
```

## 六、启动应用

```bash
docker compose -f docker-compose.hk.yml up -d --build
```

检查运行状态：

```bash
docker ps
docker logs -f jiayi-portfolio
```

服务器本机测试：

```bash
curl http://127.0.0.1:3000
```

此时可以通过：

```text
http://服务器IP:3000
```

临时访问。

## 七、配置 Nginx

把 `nginx.jiayi-portfolio.conf` 复制到 Nginx：

```bash
sudo cp nginx.jiayi-portfolio.conf /etc/nginx/sites-available/jiayi-portfolio
sudo ln -s /etc/nginx/sites-available/jiayi-portfolio /etc/nginx/sites-enabled/jiayi-portfolio
```

如果暂时没有域名，把配置里的：

```nginx
server_name your-domain.com www.your-domain.com;
```

改成：

```nginx
server_name _;
```

检查并重启：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

此时可以通过：

```text
http://服务器IP
```

访问。

## 八、配置 HTTPS

如果有域名并已解析到服务器 IP，安装证书：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

证书会自动续期。

## 九、部署后验证

逐项检查：

- 首页能打开
- `/portfolio` 能打开
- `/admin/login` 能打开
- 管理员能登录
- 后台能新增/编辑/删除内容
- 图片上传能成功
- 访客留言能提交
- 手机流量能访问

## 十、重要提醒

这个项目当前仍使用 Supabase 作为数据库和文件存储。即使迁移出 Vercel，也需要保证 Supabase 项目正常运行。如果国内访问 Supabase 也不稳定，下一步再考虑把数据库和文件存储迁移到国内/香港 PostgreSQL 与对象存储。
