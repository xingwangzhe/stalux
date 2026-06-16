/** Sätteri HAST plugin — wraps <img> with PhotoSwipe <a data-pswp> containers. */
import { defineHastPlugin } from "satteri";
export const photoswipePlugin = defineHastPlugin({
  name: "photoswipe",
  element: {
    filter: ["img"],
    visit(node, ctx) {
      const p = node.properties || {};
      const src = (p.src as string) || "";
      if (!src) return;
      const lp: Record<string,string> = { href: src, "data-pswp": "true" };
      if (p.width || p["data-width"]) lp["data-pswp-width"] = String(p.width || p["data-width"]);
      if (p.height || p["data-height"]) lp["data-pswp-height"] = String(p.height || p["data-height"]);
      if (p.alt) lp["aria-label"] = String(p.alt);
      ctx.wrapNode(node, { type: "element", tagName: "a", properties: lp, children: [] } as any);
    },
  },
});
