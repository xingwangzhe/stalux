---
title: 页脚配置详解
tags:
    - 配置
    - 页脚
categories:
    - 主题配置
date: 2025-5-10T15:00:00+8:00
updated: 2025-5-10T15:00:00+8:00
abbrlink: dd30cf92
---

## 页脚配置

Stalux 主题的页脚配置提供了丰富的自定义选项，包括版权信息、备案信息、主题标识和徽章展示。以下是基于默认配置的详细说明：

### 默认配置概览

```yaml title="_stalux.yml"
# 页脚配置
footer:
  # 站点构建时间，用于计算运行时长
  buildtime: "2025-05-01T10:00:00"
  
  # 版权信息
  copyright:
    enabled: true
    startYear: 2024
    customText: ""
  
  # 主题信息
  theme:
    showPoweredBy: true
    showThemeInfo: true
  
  # 备案信息
  beian:
    # ICP备案
    icp:
      enabled: false
      number: "辽ICP备XXXXXXXX号"
    # 公安备案
    security:
      enabled: false
      text: "辽公网安备 XXXXXXXXXXXX号"
      number: "XXXXXXXXXXXX"
  
  # 徽章配置
  badges:
    - label: "Built with"
      message: "❤"
      color: "red"
      style: "for-the-badge"
      alt: "Built with Love"
      href: "https://github.com/xingwangzhe"
    # ... 更多徽章
```

## 配置项详解

### 站点运行时间

- **`buildtime`**: 站点构建时间
  - 格式：ISO 8601 标准时间格式
  - 默认值：`"2025-05-01T10:00:00"`
  - 用于计算并显示网站运行时长

### 版权信息

```yaml
copyright:
  enabled: true
  startYear: 2024
  customText: ""
```

- **`enabled`**: 是否显示版权信息
- **`startYear`**: 版权起始年份
- **`customText`**: 自定义版权文本（为空时使用默认格式）

### 主题信息

```yaml
theme:
  showPoweredBy: true
  showThemeInfo: true
```

- **`showPoweredBy`**: 显示 "Powered by Astro"
- **`showThemeInfo`**: 显示 "Theme: Stalux"

### 备案信息

```yaml
beian:
  icp:
    enabled: false
    number: "辽ICP备XXXXXXXX号"
  security:
    enabled: false
    text: "辽公网安备 XXXXXXXXXXXX号"
    number: "XXXXXXXXXXXX"
```

#### ICP 备案
- **`icp.enabled`**: 启用 ICP 备案显示
- **`icp.number`**: ICP 备案号

#### 公安备案
- **`security.enabled`**: 启用公安备案显示
- **`security.text`**: 公安备案完整文字
- **`security.number`**: 公安备案号（用于链接生成）

### 徽章配置

Stalux 默认配置了多个精美的徽章：

```yaml
badges:
  - label: "Built with"
    message: "❤"
    color: "red"
    style: "for-the-badge"
    alt: "Built with Love"
    href: "https://github.com/xingwangzhe"
  - label: "Powered by"
    message: "Astro"
    color: "orange"
    style: "flat-square"
    alt: "Powered by Astro"
    href: "https://astro.build/"
  - label: "Theme"
    message: "Stalux"
    color: "blueviolet"
    alt: "Theme: Stalux"
    href: "https://github.com/xingwangzhe/stalux"
  # ... 更多徽章
```

#### 徽章属性说明

- **`label`**: 徽章左侧标签
- **`message`**: 徽章右侧信息
- **`color`**: 徽章颜色主题
- **`style`**: 徽章样式（plastic/flat/flat-square/for-the-badge/social）
- **`alt`**: 替代文本（用于无障碍访问）
- **`href`**: 点击跳转链接

## 默认徽章列表

Stalux 主题默认包含以下徽章：

1. **Built with Love** - 展示开发者的心血
2. **Powered by Astro** - 技术栈标识
3. **Theme: Stalux** - 主题标识
4. **MIT License** - 开源许可证
5. **友链接力** - 开往项目参与
6. **大佬论坛** - 博客社区
7. **BlogFinder** - 博客发现
8. **空间穿梭** - 随机访问
9. **多吉云 CDN** - CDN 服务
10. **十年之约** - 博客十年纪念
11. **博客宇宙** - 博客聚合

## 配置建议

### 基本设置

1. **更新构建时间**：设置为您的实际部署时间
2. **调整起始年份**：根据网站建立时间设置
3. **选择性启用**：根据需要启用备案信息

### 徽章管理

1. **保持相关性**：只保留与您的网站相关的徽章
2. **自定义颜色**：选择符合网站风格的颜色
3. **添加个人徽章**：根据需要添加自定义徽章

### 法律合规

1. **ICP 备案**：中国大陆网站必须显示 ICP 备案号
2. **公安备案**：某些地区要求显示公安备案信息
3. **版权声明**：确保版权信息准确完整

## 页脚的重要性

页脚作为网站的重要组成部分，具有以下价值：

- **法律合规**：满足法律法规要求
- **品牌建设**：强化网站专业形象
- **信息传递**：展示网站关键信息
- **用户导航**：提供额外的导航入口
- **社区参与**：展示参与的社区和项目

通过精心配置页脚，您可以提升网站的整体专业度和用户体验。

