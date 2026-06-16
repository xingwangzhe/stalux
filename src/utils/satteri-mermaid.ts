import { defineMdastPlugin } from "satteri";

export interface FeatureFlags {
  hasKatex: boolean;
  hasMermaid: boolean;
  hasImage: boolean;
}

let lastFlags: FeatureFlags | null = null;

export function popFlags(): FeatureFlags {
  const f = lastFlags ?? { hasKatex: false, hasMermaid: false, hasImage: false };
  lastFlags = null;
  return f;
}

let hasKatex = false, hasMermaid = false, hasImage = false;
const flush = () => { lastFlags = { hasKatex, hasMermaid, hasImage }; };
const reset = () => { hasKatex = false; hasMermaid = false; hasImage = false; };

export const featurePlugin = defineMdastPlugin({
  name: "feature-flags",

  yaml() { reset(); flush(); },

  math()       { hasKatex = true; flush(); },
  inlineMath() { hasKatex = true; flush(); },
  image()      { hasImage = true; flush(); },
  imageReference() { hasImage = true; flush(); },

  code(node) {
    if (node.lang === "mermaid") {
      hasMermaid = true;
      flush();
      return { type: "html", value: '<pre class="mermaid">' + node.value + '</pre>' } as any;
    }
    flush();
  },

  heading()    { flush(); },
  paragraph()  { flush(); },
  blockquote() { flush(); },
  list()       { flush(); },
  table()      { flush(); },
  html()       { flush(); },
  thematicBreak() { flush(); },
});
