import { visit } from 'unist-util-visit';

export default function rehypePhotoswipe() {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index: number, parent: any) => {
      if (!node || node.tagName !== 'img' || !parent) return;

      // 如果父节点已经是 a，则跳过
      if (parent.tagName === 'a') return;

      const props = node.properties || {};
      const src = props.src || props.srcset || '';
      const alt = props.alt || '';
      const width = props.width || props['data-width'] || 1200;
      const height = props.height || props['data-height'] || 800;

      const linkNode = {
        type: 'element',
        tagName: 'a',
        properties: {
          href: src,
          'data-pswp-width': String(width),
          'data-pswp-height': String(height),
          'data-pswp': 'true',
          'aria-label': alt || '查看图片',
        },
        children: [node],
      };

      parent.children[index] = linkNode;
    });
  };
}
