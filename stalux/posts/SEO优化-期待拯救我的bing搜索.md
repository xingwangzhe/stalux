---
title: SEO优化:期待拯救我的bing搜索
abbrlink: 8811
date: "2025-01-10 18:43:13"
updated: "2025-07-04 18:44:32"
desc: "经过进一步审查，您的网站似乎 https://xingwangzhe.fun/ 上次爬网时不符合 Bing 设定的标准。"
categories:
    - 胡思乱想
tags:
    - 文学
    - 记录
    - 前端
cover: https://i.ibb.co/Myzz4y0/2025-01-10-184443.png
---

啊，好麻烦
![2025-01-10-184443](https://i.ibb.co/Myzz4y0/2025-01-10-184443.png)

<!--more-->

## 模板式回复

:::info
感谢您的耐心等待

经过进一步审查，您的网站似乎 https://xingwangzhe.fun/ 上次爬网时不符合 Bing 设定的标准。

必应不断确定要编制索引的内容的优先级，这将提高用户满意度。请查看我们的 Bing 网站站长指南，以更好地了解最有价值内容的标准。

:::

:::error
😭😭😭，微软你怎么这么坏啊
:::

我仔细看了，一下，页面错误确实很多，这都是 **lighthouse** 没检查出来的
![2025-01-10-184936](https://i.ibb.co/4WJxS7G/2025-01-10-184936.png)

## 开始大改造我的主题

### 多个`<h1>`问题

因为我的主题默认左边栏有个 **h1**标题，再加上md文件本身标题也是 **h1**，我写内容总是又莫名其妙加上 **h1** 。那么解决方法就是保持开头写h2的习惯。通过正则匹配在vscode中把h1元素都替换成h2，这样这个问题解决了

### 多标题问题

这个是我早期学html时，在md里面又嵌入了完整的h5范式，现在通过
`<meta name="robots" content="noindex">`来防止索引该页面

### 描述太短/多页面重复问题

就硬编,去除空的，加入

```

<% if (page.content) { %>
  <% let rawContent = page.content; %>
  <% let pureContent = rawContent.replace(/<[^>]*>/g, '')
                                 .replace(/</g, '')
                                 .replace(/\s+/g, '')
                                 .replace(/\n+/g, '')
                                 .replace(/:::/g, ''); %>
  <% let description = pureContent.substr(0, 155); %>
  <meta name="description" content="<%= description %>">
<% } else { %>
  <% if (page.title) { %>
    <meta name="description" content="<%= page.title + ' || ' + config.title + ' || ' + config.description %>">
  <% } else { %>
    <meta name="description" content="<%= lastSegment + ' || ' + config.title + ' || ' + config.description %>">
  <% } %>
<% } %>

```

### 标题太短/多页面重复问题

当然还是老办法，就硬叠

```

<%
  if (is_home()) {
    %><%= config.title %><%
  } else {
    var currentPath = page.path;
    var segments = currentPath.split('/').filter(Boolean);
    var lastSegment = segments.length ? segments[segments.length - 1].replace('.html', '') : '';
    if (lastSegment === 'index') {
      lastSegment = segments.length > 1 ? segments[segments.length - 2] : '';
    }
    if (page.title) {
      %><%= page.title + ' || ' + config.title %><%
    } else {
      %><%= lastSegment + ' || ' + config.title %><%
    }//就喜欢||凑字
  }
%>

```

### alt属性

老生长谈了，还是遍历一遍，胡乱加个1234就行

### 优化结果

![2025-01-10-203626](https://i.ibb.co/PTr9m66/2025-01-10-203626.png)

差不多，再修修补补应该就好了

希望bing能够重新显示我的界面
