---
title: 页脚配置参考
tags:
    - 配置
    - 页脚
categories:
    - 主题配置
date: 2025-5-10T15:00:00+8:00
---

## 页脚配置

在`src>_config.ts`启用之后，可以对页脚进行自定义配置。页脚是网站的重要组成部分，包含版权信息、备案信息、徽章和其他标识性内容。

### 基本配置

```ts
export const siteConfig: SiteConfig = {    
    ...
    footer: {
        // 站点构建时间，用于计算运行时长
        buildtime: '2024-06-20T10:00:00+8:00',

        // 版权信息
        copyright: {
            enabled: true,
            startYear: 2024,
            customText: ''
        },

        // 主题信息
        theme: {
            showPoweredBy: true,
            showThemeInfo: true
        },

        // 备案信息
        beian: {
            icp: {
                enabled: true,
                number: '辽ICP备2024042064号-1'
            },
            security: {
                enabled: false,
                text: '辽公网安备 XXXXXXXXXXXX号',
                number: 'XXXXXXXXXXXX'
            }
        },

        // 徽章配置
        badges: [
            {
                label: 'Built with',
                message: '❤',
                color: 'red',
                style: 'for-the-badge',
                alt: 'Built with Love',
                href: 'https://github.com/yourusername'
            },
            // 更多徽章...
        ]
    }
    ...
}
```

### 站点运行时间配置

站点运行时间是从站点构建时间开始计算的，这个时间会显示在页脚中，告诉访客你的网站已经运行了多久。

- **`buildtime`**: 站点构建时间，推荐使用ISO 8601标准格式(`YYYY-MM-DDTHH:MM:SS+x:00`)，默认为东八区时间。例如：`'2024-06-20T10:00:00+8:00'`。

### 版权信息配置

版权信息通常显示在页脚底部，表明网站内容的版权归属。

- **`copyright.enabled`**: 是否启用版权信息显示，`true`表示显示，`false`表示隐藏。
- **`copyright.startYear`**: 版权起始年份，如设置为2024，当前年份为2025，则显示为"© 2024-2025"。
- **`copyright.customText`**: 自定义版权文本，如果设置了此项，将使用自定义文本替代默认格式。如果为空字符串，则使用默认格式。

### 主题信息配置

主题信息用于显示网站使用的技术和主题。

- **`theme.showPoweredBy`**: 是否显示"Powered by Astro"，设为`true`表示显示。
- **`theme.showThemeInfo`**: 是否显示"Theme is Stalux"，设为`true`表示显示。

### 备案信息配置

对于中国大陆的网站，通常需要显示ICP备案信息和公安备案信息。

- **ICP备案**
  - **`beian.icp.enabled`**: 是否启用ICP备案信息显示，`true`表示显示。
  - **`beian.icp.number`**: ICP备案号，例如：`"辽ICP备2024042064号-1"`。

- **公安备案**
  - **`beian.security.enabled`**: 是否启用公安备案信息显示，`true`表示显示。
  - **`beian.security.text`**: 公安备案号文字，例如：`"辽公网安备 XXXXXXXXXXXX号"`。
  - **`beian.security.number`**: 公安备案号数字部分，用于生成指向公安备案系统的链接。

### 徽章配置

徽章（Badges）是页脚中常见的小图标，用于展示网站的技术栈、服务提供商、友情链接等信息。Stalux主题使用了[shields.io](https://shields.io/)服务来生成美观的徽章。

每个徽章配置包含以下属性：

- **`label`**: 徽章左侧的标签文本。
- **`message`**: 徽章右侧的信息文本，可以为空字符串。
- **`color`** (可选): 徽章的颜色，可以使用预定义的颜色名称如`"red"`、`"blue"`、`"green"`等。
- **`style`** (可选): 徽章的样式，可选值有：
  - `"plastic"`: 塑料风格
  - `"flat"`: 扁平风格
  - `"flat-square"`: 扁平方形风格
  - `"for-the-badge"`: 大型徽章风格
  - `"social"`: 社交风格
- **`labelColor`** (可选): 徽章左侧标签的颜色。
- **`logo`** (可选): 徽章上显示的小图标。
- **`logoWidth`** (可选): 图标宽度。
- **`alt`** (可选): 徽章的替代文本，用于无法显示图片时或辅助技术。
- **`href`** (可选): 点击徽章后跳转的链接。

### 实际应用示例

以下是一个完整的页脚配置示例：

```ts
export const siteConfig: SiteConfig = {
  footer: {
    // 站点构建时间，用于计算运行时长
    buildtime: '2024-05-01T00:00:00+8:00',

    // 版权信息
    copyright: {
      enabled: true,
      startYear: 2024,
      customText: '' // 使用默认格式
    },

    // 主题信息
    theme: {
      showPoweredBy: true, // 显示"Powered by Astro"
      showThemeInfo: true  // 显示"Theme is Stalux"
    },

    // 备案信息
    beian: {
      // ICP备案
      icp: {
        enabled: true,
        number: '辽ICP备2024042064号-1'
      },
      // 公安备案
      security: {
        enabled: true,
        text: '辽公网安备 12345678901234号',
        number: '12345678901234'
      }
    },

    // 徽章配置
    badges: [
      {
        label: 'Built with',
        message: '❤',
        color: 'red',
        style: 'for-the-badge',
        alt: 'Built with Love',
        href: 'https://github.com/yourusername'
      },
      {
        label: 'Powered by',
        message: 'Astro',
        color: 'orange',
        style: 'flat-square',
        alt: 'Powered by Astro',
        href: 'https://astro.build/'
      },
      {
        label: 'license',
        message: 'MIT',
        color: 'blue',
        alt: 'License: MIT',
        href: 'https://github.com/yourusername/yourrepo'
      },
      {
        label: '开往🚆',
        message: '友链接力',
        color: 'green',
        alt: '开往-友链接力',
        href: 'https://www.travellings.cn/go.html'
      }
    ]
  }
}
```

## 页脚的重要性

页脚虽然位于网页底部，但它承担着重要的功能和信息：

1. **法律合规**：通过显示版权信息和备案信息，确保网站符合法律要求。
2. **信息传递**：展示网站的运行时间、技术栈等信息，增加网站的可信度。
3. **导航辅助**：通过徽章提供额外的导航选项，如友情链接、技术社区等。
4. **品牌建设**：统一而精心设计的页脚有助于建立网站的品牌形象。

一个精心配置的页脚能够为你的博客增色不少，同时也是网站完整性和专业度的体现。~~别小看页脚这小地方，它可是网站的门面担当之一~~

