---
title: "Stalux主题评论系统配置"
date: 2023-09-04
updated: 2023-09-22
description: "了解如何在Stalux主题中配置各种评论系统，增强博客互动性"
excerpt: "本文详细介绍Waline、Giscus等评论系统的配置方法，以及自定义评论功能的最佳实践"
tags: ["评论系统", "Waline", "Giscus", "互动功能"]
categories: ["文档", "功能配置"]
---


# Stalux主题评论系统配置

Stalux主题内置了对多种评论系统的支持，本文档将详细介绍如何配置评论功能。

## Waline评论系统

[Waline](https://waline.js.org/)是一个简洁、安全的评论系统，支持多种部署方式和丰富的功能。

### 基础配置

```typescript
export const config_site: Partial<SiteConfig> = {
  comment: {
    waline: {
      serverURL: 'https://your-waline-server.vercel.app',  // Waline服务器地址(必填)
      lang: 'zh-CN',                                       // 语言设置
      dark: 'auto',                                        // 暗黑模式
      emoji: ['https://unpkg.com/@waline/emojis@1.1.0/weibo'],  // 表情包设置
      meta: ['nick', 'mail', 'link'],                      // 评论者元数据
      requiredFields: ['nick', 'mail'],                    // 必填字段
      login: 'enable',                                     // 登录模式
      wordLimit: 200,                                      // 字数限制
      pageSize: 10,                                        // 每页评论数
      imageUploader: false,                                // 图片上传
      highlighter: false,                                  // 代码高亮
      texRenderer: false,                                  // Tex渲染
    }
  }
}
```

### Waline高级配置

Waline支持更多高级配置选项：

```typescript
export const config_site: Partial<SiteConfig> = {
  comment: {
    waline: {
      // 基础配置
      serverURL: 'https://your-waline-server.vercel.app',
      
      // 评论反应功能
      reaction: true,  // 或提供多个表情符号: [表情1, 表情2]
      
      // 页面访问统计
      pageview: true,
      
      // 评论数统计
      comment: true,
      
      // 自定义表情
      emoji: [
        '//unpkg.com/@waline/emojis@1.1.0/weibo',
        '//unpkg.com/@waline/emojis@1.1.0/bilibili',
        // 添加更多表情包
      ],
      
      // 自定义语言
      locale: {
        placeholder: '欢迎评论...',
        sofa: '沙发还空着呢~',
        submit: '提交评论',
        // 更多自定义文本...
      },
      
      // 自定义样式
      cssUrl: '/custom-waline.css',
      
      // 评论审核
      commentSorting: 'latest',  // 评论排序方式：latest, oldest, hottest
      
      // 登录设置
      login: 'enable',  // enable, disable, force
      
      // 搜索功能
      search: false,
    }
  }
}
```

### Waline服务端部署

要使用Waline评论系统，你需要先部署Waline服务端。以下是常见的部署方式：

1. **Vercel部署**（推荐）：
   - 访问[Waline官方模板](https://github.com/walinejs/waline/tree/main/assets/vercel)
   - 点击"Deploy"按钮，按照指示完成部署
   - 部署完成后，将生成的域名填入`serverURL`配置中

2. **Docker部署**：
   ```bash
   docker run -d \
     -e LEAN_ID=your-lean-id \
     -e LEAN_KEY=your-lean-key \
     -e LEAN_MASTER=your-lean-master-key \
     -p 8360:8360 \
     lizheming/waline
   ```

3. **独立服务器部署**：
   ```bash
   npm install @waline/vercel --save
   ```
   
   创建启动文件（app.js）：
   ```js
   const Waline = require('@waline/vercel');
   
   Waline({
     async postSave(comment) {
       // 评论保存的后续操作
     },
   }).listen(8360, () => {
     console.log('Waline server is running on port 8360');
   });
   ```

更多部署方式和配置选项，请参考[Waline官方文档](https://waline.js.org/)。

## 其他评论系统集成

除了默认支持的Waline评论系统外，Stalux主题也可以集成其他评论系统。

### Giscus评论系统

[Giscus](https://giscus.app/)是一个基于GitHub Discussions的评论系统。

首先在配置文件中添加Giscus配置：

```typescript
export const config_site: Partial<SiteConfig> = {
  comment: {
    giscus: {
      repo: 'username/repo-name',
      repoId: 'your-repo-id',
      category: 'Announcements',
      categoryId: 'your-category-id',
      mapping: 'pathname',
      reactionsEnabled: '1',
      emitMetadata: '0',
      inputPosition: 'bottom',
      lang: 'zh-CN',
      theme: 'light',
      darkTheme: 'dark',
    }
  }
}
```

### Gitalk评论系统

[Gitalk](https://github.com/gitalk/gitalk)是一个基于GitHub Issues的评论系统。

```typescript
export const config_site: Partial<SiteConfig> = {
  comment: {
    gitalk: {
      clientID: 'your-client-id',
      clientSecret: 'your-client-secret',
      repo: 'your-repo-name',
      owner: 'your-github-username',
      admin: ['your-github-username'],
      distractionFreeMode: false
    }
  }
}
```

## 禁用特定页面的评论

如果你想在特定页面禁用评论，可以在页面的前置元数据中添加以下字段：

```markdown
---
title: 无评论页面
disableComments: true
---

这个页面不会显示评论区。
```

## 评论系统的最佳实践

1. **考虑隐私问题**：选择评论系统时，考虑用户隐私保护
2. **添加评论政策**：在网站中明确说明评论规则和数据处理方式
3. **定期审核**：定期检查和管理评论内容
4. **提供反馈渠道**：为用户提供评论系统问题反馈的渠道
5. **性能考虑**：评论系统可能影响页面加载速度，考虑延迟加载策略
