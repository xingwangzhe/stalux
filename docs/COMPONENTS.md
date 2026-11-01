# 组件覆盖

Stalux 提供 Starlight 风格的组件覆盖系统：在 `astro.config.ts` 里传入组件路径即可替换主题默认组件，不需要 fork 主题。

```ts title="astro.config.ts"
stalux({
    contentDir: "stalux",
    components: {
        Navs: "./src/components/CustomNavs.astro",
        Footer: "./src/components/CustomFooter.astro",
    },
});
```

30+ 个组件可覆盖，完整列表和默认路径见 [`src/internal/override.ts`](../src/internal/override.ts)。

## 使用约定

| 项 | 说明 |
| --- | --- |
| 路径 | 相对于消费项目根目录的 `.astro` 文件 |
| 接口 | 覆盖组件接收主题传入的 props；需要保留原有行为时按默认组件实现 |
| 样式 | 消费项目无需安装或配置 UnoCSS；自定义组件新增的 UnoCSS utilities 需要消费方自行编译 |
| 生产类名 | 主题会在生产构建中压缩私有 class、CSS variables 和 keyframes；扩展组件请使用自己的 class、公开组件接口和稳定的 `data-*` 行为属性 |
| 不要依赖 | 生产私有类名或 `s*` / `--s*` / `k*` 输出名称；这些短名称由主题保留 |

公开样式导入路径保持兼容，消费项目不需要增加配置或安装 UnoCSS。样式维护细节见 [样式维护](./STYLING.md)。

## 徽章

页脚配置徽章在构建期输出为带内容哈希的独立 SVG；折叠分组使用浏览器原生懒加载，避免在每页 HTML 中重复内嵌整组图像。展开和禁用 JavaScript 时仍可正常显示。自定义组件传入且不在 `footer.yml` 中的徽章保留 Data URL 支持。

## 相关文档

- [配置说明](./CONFIGURATION.md)
- [样式维护](./STYLING.md)
- [生命周期与静态接口](./RUNTIME.md)
