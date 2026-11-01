# 字体

Stalux 内置正文字体 LXGW WenKai（霞鹜文楷）和可变代码字体 Google Sans Code。字体输入从本地读取，构建不会联网下载字体。

## 按页 CJK 字体子集

构建时由 Rust / N-API 包 `@xingwangzhe/cjk-font-split-native` 按页面可见或可展开的 CJK 正文生成内容寻址 WOFF2 子集；字符集相同的页面复用同一个文件。代码和 MathML 中可见的中文也会纳入子集。

| 项 | 行为 |
| --- | --- |
| 字符来源 | 页面可见或可展开的 CJK 正文、代码与 MathML 文本 |
| 数字预留 | 每个子集无条件保留 `0-9`（`RESERVED_GLYPHS`），即使页面没有可见数字；时钟、计数、日期、脚本注入的数字在运行时生成，不在构建 HTML 中 |
| 额外字符 | 调用方可通过 `writePageFontSubset` 的可选参数 `extraChars` 追加预留字符 |
| CSS | 精确到字符的 `unicode-range` + `font-display: swap` |
| 预加载 | 正文字体子集在 HTML `head` 中使用同源 `preload`，消费方无需手写字体链接 |
| 代码字体 | 仍通过 Astro 官方 local Fonts API 注入 |

## 缓存与性能

| 项 | 说明 |
| --- | --- |
| 缓存键 | 持久 BLAKE3，包含字体内容、face index、规范化字符集和算法版本 |
| 缓存位置 | `node_modules/.astro/`，可跨页面和增量构建复用 |
| 多页面复用 | `FontSubsetter` 复用已准备的字体和哈希状态；冷缓存时最多同时运行四个原生分片任务 |
| 字体处理 | 先解码 / 提取为 SFNT，再复用 HarfBuzz 预处理结构，保留原始轮廓 |
| WOFF2 | Google Brotli，质量 8 |
| 共享解析 | 图片尺寸、加载策略、关联 CSS 文本和字体字符提取共享一次 HTML 解析；在同一棵 parse5 AST 上修改节点，最后按源码位置统一输出一次 |

## 图片尺寸与页面后处理缓存

| 项 | 说明 |
| --- | --- |
| 本地图片尺寸 | 使用 `image-size` 探测，支持 SVG、AVIF 等格式 |
| 读取上限 | 常规文件最多读取 512 KiB；JPEG 尺寸标记位于文件开头或超出该窗口时，兼容兜底可能读取完整文件 |
| 保持原样 | 已有尺寸属性和远程图片 |
| 资产摘要 | 被引用资产使用流式摘要，同 URL 内容变化会使页面缓存失效，不再按图片扩展名限制 |
| 后处理缓存 | `node_modules/.astro/stalux-page-output/`；检查原始 HTML、页面路径、实际依赖的本地 CSS / 图片内容，以及字体和处理代码 |
| 失效重建 | 相关输入变化、字体缓存文件丢失或记录损坏时重新处理 |
| Pagefind | 每次构建后完整生成索引；未变化页面可以直接恢复后处理结果 |

保留 `node_modules/.astro/` 才能跨构建受益；清除该目录会安全重建缓存。

## 字体许可

| 字体 | 许可 | 全文 |
| --- | --- | --- |
| LXGW WenKai | OFL-1.1，含保留名称与网页字体额外许可 | [LXGW-WenKai-OFL.txt](../public/fonts/LXGW-WenKai-OFL.txt) |
| Google Sans Code | OFL-1.1 | [Google-Sans-Code-OFL.txt](../public/fonts/Google-Sans-Code-OFL.txt) |
| Latin Modern Math | GUST Font License / LPPL-1.3c | [LICENSE-GUST.txt](../LICENSES/LICENSE-GUST.txt) |

字体与许可全文会同步到消费项目的 `public/fonts/`，使线上 WOFF2 文件与许可一并可访问。完整许可范围见 [许可](./LICENSING.md)。
