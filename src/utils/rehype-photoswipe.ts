import { visit } from 'unist-util-visit';

// rehype 插件：为 Markdown 渲染的 <img> 包裹 PhotoSwipe 所需的 <a> 容器
export default function rehypePhotoswipe() {
    return (tree: any) => {
        visit(tree, (node: any, index?: number | null, parent?: any | null) => {
            if (!node || node.type !== 'element' || node.tagName !== 'img' || !parent) return;

            const imgProps = node.properties || {};
            const src = imgProps.src || '';
            const alt = imgProps.alt || '';
            const width = imgProps.width || imgProps['data-width'];
            const height = imgProps.height || imgProps['data-height'];

            if (!src) return;

            // 若父节点已是链接，则仅补充属性
            if (parent.type === 'element' && parent.tagName === 'a') {
                parent.properties = parent.properties || {};
                if (!parent.properties.href) parent.properties.href = src;
                parent.properties['data-pswp'] = parent.properties['data-pswp'] || 'true';
                if (width) parent.properties['data-pswp-width'] = String(width);
                if (height) parent.properties['data-pswp-height'] = String(height);
                if (alt && !parent.properties['aria-label']) parent.properties['aria-label'] = alt;
                return;
            }

            // 创建包裹节点
            const linkNode = {
                type: 'element',
                tagName: 'a',
                properties: Object.assign(
                    { href: src, 'data-pswp': 'true' },
                    width ? { 'data-pswp-width': String(width) } : {},
                    height ? { 'data-pswp-height': String(height) } : {},
                    alt ? { 'aria-label': alt } : {}
                ),
                children: [node],
            };

            if (Array.isArray(parent.children) && typeof index === 'number') {
                parent.children.splice(index, 1, linkNode);
            }
        });
    };
}
