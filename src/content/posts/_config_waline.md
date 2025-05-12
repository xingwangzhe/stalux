---
title: 评论系统配置参考
tags:
    - 配置
    - 评论
    - Waline
categories:
    - 主题配置
date: 2025-5-10T14:00:00+8:00
updated: 2025-5-10T14:00:00+8:00
abbrlink: f4442947
---

## 评论系统配置

在`src>_config.ts`启用之后，可以进行评论系统的自定义配置。Stalux主题集成了[Waline](https://waline.js.org/)作为评论系统，这是一个简洁、安全的评论系统，无需登录即可评论。

### 基本配置

```ts title="_config.ts"
export const siteConfig: SiteConfig = {    
    ...
    comment: {
        waline: {
            serverURL: 'https://your-waline-server.example.com', // 你的Waline服务器地址
            lang: 'zh-CN',
            emoji: ['https://unpkg.com/@waline/emojis@1.1.0/weibo'],
            requiredFields: ['nick', 'mail'],
            // 其他自定义配置...
        }
    }
    ...
}
```

> 评论系统需要先部署Waline服务端，这里配置的只是客户端部分。

### 必需配置项

- **`serverURL`**: 你的Waline服务端地址，这是**唯一必填项**。你需要自行部署Waline服务端，可以使用Vercel、Railway等平台，然后在此处填写其URL。
  
### 常用配置项

Waline提供了丰富的配置选项，以下是一些常用的配置项,~~但我没配置props,所以看看就好~~：

- **`lang`** (`string`): 评论界面的语言，默认为`'zh-CN'`（简体中文），也可以设为`'en-US'`（英语）等。
  
- **`emoji`** (`Array<string | object>`): 表情包配置，可以是CDN地址数组，如`['https://unpkg.com/@waline/emojis@1.1.0/weibo']`。

- **`requiredFields`** (`Array<'nick' | 'mail' | 'link'>`): 评论必填项，可选值：`nick`（昵称）、`mail`（邮箱）、`link`（网站）。设为空数组`[]`则无必填项。
  
- **`reaction`** (`boolean | Array<string>`): 是否开启文章反应按钮（点赞等功能），设为`true`启用，`false`禁用。
  默认值: `true`

- **`meta`** (`Array<'nick' | 'mail' | 'link'>`): 评论者可填信息，默认为`['nick', 'mail', 'link']`，分别对应昵称、邮箱、网站。

- **`wordLimit`** (`number | [number, number]`): 评论字数限制，可以是单个数字（最大字数）或数组`[min, max]`表示最小和最大字数。
  默认值: `200` (最大200字)
  
- **`pageSize`** (`number`): 每页显示的评论数量，用于评论分页。
  默认值: `10`

## 评论系统的好处

评论系统是博客与读者互动的重要工具，**Waline**作为一个轻量级评论系统，具有以下优势：

1. **无需登录**：降低读者留言门槛
2. **可匿名评论**：但你也可以通过`requiredFields`设置来要求必填信息
3. **表情支持**：丰富的表情包系统让评论更加生动
4. **反应功能**：读者可以通过点赞等方式快速表达态度
5. **保护隐私**：相比第三方社交账号登录，更注重用户隐私


## 评论管理

部署Waline服务后，你还可以通过管理后台审核评论、回复评论、设置垃圾评论过滤等。管理后台地址通常是`你的serverURL/ui/login`。

记住，一个活跃的评论区能够为博客带来更多的价值和互动，合理配置评论系统是提升博客体验的重要一环。~~当然，前提是你的文章足够有趣才会有人评论~~

