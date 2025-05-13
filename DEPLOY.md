# Stalux 主题部署指南

本文档提供了将 Stalux 博客主题部署到不同平台的详细步骤。

## 🌐 部署选项

Stalux 生成的是纯静态网站，可以部署到任何支持静态网站托管的服务上。

### Vercel 部署（推荐）

1. **创建 Vercel 账号**
   - 访问 [Vercel](https://vercel.com) 并注册账号

2. **导入您的 GitHub 仓库**
   - 点击 "Import Project"
   - 选择 "Import Git Repository"
   - 授权 Vercel 访问您的 GitHub 账号
   - 选择您的 Stalux 博客仓库

3. **配置部署设置**
   - 框架预设：选择 "Astro"
   - 构建命令：`npm run build`（默认）
   - 输出目录：`dist`（默认）
   - 环境变量：按需添加

4. **部署**
   - 点击 "Deploy"
   - 等待部署完成
   - Vercel 会自动为您分配一个域名，也可以添加自定义域名

### Netlify 部署

1. **创建 Netlify 账号**
   - 访问 [Netlify](https://www.netlify.com) 并注册账号

2. **导入您的 GitHub 仓库**
   - 点击 "New site from Git"
   - 选择 GitHub 作为您的提供商
   - 选择您的 Stalux 博客仓库

3. **配置部署设置**
   - 构建命令：`npm run build`
   - 发布目录：`dist`
   - 环境变量：按需添加

4. **部署**
   - 点击 "Deploy site"
   - 等待部署完成
   - Netlify 会自动为您分配一个域名，也可以添加自定义域名

### GitHub Pages 部署

1. **添加 GitHub Actions 工作流文件**
   
   在您的项目根目录创建 `.github/workflows/deploy.yml` 文件：

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]
     workflow_dispatch:

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: 18

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Upload Pages artifact
           uses: actions/upload-pages-artifact@v1
           with:
             path: dist

     deploy:
       needs: build
       permissions:
         pages: write
         id-token: write
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v1
   ```

2. **启用 GitHub Pages**
   - 在您的仓库设置中，转到 "Pages" 部分
   - 来源：选择 "GitHub Actions"
   - 保存更改

3. **修改 astro.config.mjs**
   
   在 `astro.config.mjs` 中添加 base 路径（如果您的仓库名称不是您的用户名）：

   ```javascript
   export default defineConfig({
     site: 'https://<YOUR_USERNAME>.github.io',
     base: '/<YOUR_REPO_NAME>', // 如果部署到用户页面，可以省略这一行
     // 其他配置...
   });
   ```

4. **部署**
   - 推送更改到 main 分支
   - GitHub Actions 会自动构建和部署您的网站

## 💡 部署注意事项

1. **环境变量**：
   - 如果您的站点使用环境变量，确保在部署平台上正确配置

2. **自定义域名**：
   - 所有提到的平台都支持自定义域名
   - 将需要在您的域名注册商处更新 DNS 设置

3. **构建优化**：
   - 构建前可以运行 `npm run check-timestamps` 确保时间戳正确
   - 确保所有资源路径正确，特别是当使用 base 路径时

4. **持续部署**：
   - 所有提到的平台都支持持续部署
   - 每次推送到主分支时，您的站点将自动重新构建和部署

## 📝 Waline 评论系统部署

如果要使用 Waline 评论系统：

1. **部署 Waline 服务**：
   - 参考 [Waline 官方文档](https://waline.js.org/guide/get-started.html) 部署服务端
   - 推荐使用 Vercel 部署 Waline 服务

2. **配置您的 Stalux 主题**：
   - 在 `_config.ts` 中更新 Waline 配置：
     ```typescript
     comment: {
       waline: {
         serverURL: 'https://your-waline-server.vercel.app',
         // 其他选项...
       }
     }
     ```

---

如果您在部署过程中遇到任何问题，请查阅相应平台的文档或在 [GitHub Issues](https://github.com/xingwangzhe/stalux/issues) 上寻求帮助。
