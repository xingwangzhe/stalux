/**
 * Stalux Dev Toolbar 应用
 *
 * 在 Astro 开发工具栏中添加 Stalux 主题的便捷操作。
 * 使用 Astro Dev Toolbar App API（astro@4.0.0+）。
 */

export default {
    id: "stalux",
    name: "Stalux",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',

    init(canvas: HTMLElement) {
        const container = document.createElement("div");
        container.innerHTML = `
      <style>
        .stalux-toolbar { padding: 16px; font-family: system-ui, sans-serif; }
        .stalux-toolbar h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
        .stalux-toolbar p { margin: 4px 0; font-size: 12px; color: #888; }
        .stalux-toolbar a { color: #60a5fa; text-decoration: none; }
        .stalux-toolbar a:hover { text-decoration: underline; }
        .stalux-toolbar .version { font-size: 11px; color: #666; }
      </style>
      <div class="stalux-toolbar">
        <h3>✨ Stalux Theme</h3>
        <p class="version">v2.0.0</p>
        <p><a href="https://stalux.needhelp.icu" target="_blank">📖 Documentation</a></p>
        <p><a href="https://github.com/xingwangzhe/stalux" target="_blank">🐙 GitHub</a></p>
      </div>
    `;
        canvas.appendChild(container);
    },
};
