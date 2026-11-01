# 文章分享卡片

文章分享图按以下优先级选择，`cover` 仍用于站内文章列表：

| 优先级 | 文章字段 | 分享行为 |
| --- | --- | --- |
| 1 | `og:image` | 非空时直接使用指定图片，不加工；支持 HTTP(S)、协议相对 URL 和站点根路径，建议 PNG / JPEG、1200×630 |
| 2 | `cover` | Takumi 将有效封面放入带标题、摘要和站点信息的 1200×630 WebP 卡片 |
| 3 | 无封面或封面不可用 | 自动生成中文标题卡片，不再用头像充当文章分享封面 |

```yaml title="文章分享图配置"
cover: /images/article-cover.webp
og:image: /images/custom-social-card.png
```

`og:image` 可省略或留空；不需要修改已有文章。

## 输出

| 项 | 说明 |
| --- | --- |
| 生成位置 | `/og/<元数据哈希>.webp` |
| 引用 | 静态 HTML 的 `og:image`、`twitter:image` 和 BlogPosting `image` 指向同一绝对地址 |
| 尺寸 / 类型 | 自动卡片附带尺寸和 MIME 类型 |
| Twitter | 文章使用 `summary_large_image` |
| 回退格式 | 随后追加 PNG 格式的第二张 `og:image` 供平台选择 |
| WebP 质量 | 86 |
| 数据来源 | 摘要、站点名称、作者、域名、分类、站点强调色和按站点时区显示的日期来自已有数据，无需新增站点配置 |

平台是否使用回退图取决于各自实现，AVIF 不作为默认格式。

## 渲染

图片由 `@takumi-rs/core` 在构建期本地渲染，使用主题自带的 LXGW WenKai 字体，不向浏览器增加渲染器 JS，也不调用远程制图服务。

| 项 | 规则 |
| --- | --- |
| 本地封面 | 从最终 `publicDir` 读取 |
| 远程封面 | 从构建机请求原 URL，单次最长 8 秒、最多 8 MiB，字节缓存 24 小时 |
| 不可读 / 无法解码 | 警告并回退标题卡片 |
| 显式 `og:image` | 由社交平台自行抓取，不在构建时转码；请确保公开可访问且内容为图片 |
| 缓存 | WebP / PNG 缓存保存在 Astro 缓存目录的 `stalux-social-cards/` 下，仍会将图片写入本次静态输出 |

社交平台有自己的预览缓存，页面部署成功不代表已有分享卡片立即刷新。

## 相关文档

- [配置说明](./CONFIGURATION.md)
- [部署](./DEPLOYMENT.md)
- [字体](./FONTS.md)
