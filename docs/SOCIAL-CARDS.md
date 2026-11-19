# 社交分享图片

页面默认使用 `stalux/config/author.yml` 中的 `avatar` 作为 Open Graph 和 Twitter 分享图片。默认 Twitter 卡片类型是 `summary`。

需要给单篇文章指定其他图片时，在 frontmatter 中填写 `og:image`。可以使用站点根路径或 HTTP(S) 图片 URL，图片须能被分享平台公开访问。

```yaml title="文章分享图片"
cover: /images/article-cover.webp
og:image: /images/custom-social-card.png
```

`cover` 用于文章列表和文章的结构化数据。构建直接写入分享图片 URL，社交平台会自行抓取图片并缓存预览。
