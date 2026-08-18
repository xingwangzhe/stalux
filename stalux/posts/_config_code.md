---
title: Code Display Configuration
tags:
    - Configuration
    - Code Highlighting
    - Code Blocks
categories:
    - Theme Config
date: "2025-05-10 11:30:00"
updated: "2026-08-18 12:00:00"
desc: The Stalux theme uses Expressive Code to provide powerful code display features, including syntax highlighting, editor/terminal frames, and automatic line wrapping. This article explains how to configure and use these features.
abbrlink: 55a885fa
---

# Code Display Configuration

The Stalux theme uses [Expressive Code](https://expressive-code.com/) to provide powerful code display features, including syntax highlighting, editor/terminal frames, and automatic line wrapping. This article explains how to configure and use these features.

## Syntax Highlighting

Expressive Code uses the same Shiki engine as VS Code to provide accurate syntax highlighting for over 100 languages.

### Basic Usage

When using code blocks in Markdown, simply specify the language identifier in the opening code fence to get syntax highlighting:

````text
```js
console.log("This code will be syntax highlighted!");
```
````

```js
console.log("This code will be syntax highlighted!");
```

### Supported Languages

Over 100 languages are supported by default, including JavaScript, TypeScript, HTML, CSS, Astro, Markdown, and more.

## Editor and Terminal Frames

Expressive Code can render frames around code blocks, making them look like code editor or terminal windows.

### Code Editor Frames

To make a code block look like an editor window such as VS Code, you need to provide a file name that can be displayed in an open file tab.

You can set the `title` attribute in the opening code fence to a file name, or add a file name comment in the first few lines of code:

````text

``js title="my-test-file.js"
console.log("Example using the title attribute");
```

```js title="my-test-file.js"
console.log("Example using the title attribute");
```
````

```js title="my-test-file.js"
console.log("Example using the title attribute");
```

```html
<!-- src/content/index.html -->
<div>Example using a file name comment</div>
```

````text
```html
<!-- src/content/index.html -->
<div>Example using a file name comment</div>
```
````

### Terminal Frames

When encountering code blocks with language identifiers typically used for terminal sessions or shell scripts (such as `bash`, `sh`, `powershell`, etc.), Expressive Code performs additional checks to determine the frame type to use:

````text
```bash
echo "This terminal frame has no title"
```

```powershell title="PowerShell Terminal Example"
Write-Output "This one has a title!"
```

````

```bash
echo "This terminal frame has no title"
```

```powershell title="PowerShell Terminal Example"
Write-Output "This one has a title!"
```

### Overriding Frame Types

If you want to override the automatic frame type detection for certain code blocks, you can add the `frame="..."` attribute in the opening code fence.

Supported values are `code`, `terminal`, `none`, and `auto`. The default value is `auto`.

````text
```sh frame="none"
echo "Look, no frame!"
```

```ps frame="code" title="PowerShell Profile.ps1"
# Without the override, this would be a terminal frame
function Watch-Tail { Get-Content -Tail 20 -Wait $args }
New-Alias tail Watch-Tail
```
````

```sh frame="none"
echo "Look, no frame!"
```

```ps frame="code" title="PowerShell Profile.ps1"
# Without the override, this would be a terminal frame
function Watch-Tail { Get-Content -Tail 20 -Wait $args }
New-Alias tail Watch-Tail
```

## Automatic Line Wrapping

When code blocks contain long lines, enabling automatic line wrapping keeps the code within the container bounds and avoids horizontal scrolling.

### Configuring Line Wrapping for Individual Code Blocks

You can enable or disable automatic line wrapping for individual code blocks using the `wrap` boolean attribute in the code block meta information:

````text
```js wrap
// Example with line wrapping enabled
function getLongString() {
  return "This is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large";
}
```

```js wrap=false
// Example with line wrapping disabled
function getLongString() {
  return "This is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large";
}
```
````

```js wrap
// Example with line wrapping enabled
function getLongString() {
    return "This is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large";
}
```

```js wrap=false
// Example with line wrapping disabled
function getLongString() {
    return "This is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large, this is a very long string that likely won't fit in the available space unless the container width is very large";
}
```

### Configuring Wrapped Line Indentation

#### Indent Preservation

By default, the wrapped portion of long lines will align with the indentation level of its line, making wrapped code display in the same column. This increases readability of wrapped code, especially useful for languages where indentation is significant (such as Python).

You can disable the default behavior using the `preserveIndent` boolean attribute in the code block meta information:

```js wrap preserveIndent
// Example using preserveIndent (enabled by default)
function getLongString() {
    return "This is a very long string that likely won't fit in the available space unless the container width is very large";
}
```

````text
```js wrap preserveIndent
// Example using preserveIndent (enabled by default)
function getLongString() {
  return "This is a very long string that likely won't fit in the available space unless the container width is very large";
}
```
````

```js wrap preserveIndent=false
// Example using preserveIndent=false
function getLongString() {
    return "This is a very long string that likely won't fit in the available space unless the container width is very large";
}
```

````text
```js wrap preserveIndent=false
// Example using preserveIndent=false
function getLongString() {
  return "This is a very long string that likely won't fit in the available space unless the container width is very large";
}
```
````

#### Hanging Indent

You can also define the number of columns by which wrapped lines should be indented:

```js wrap hangingIndent=2
// Example using hangingIndent=2
function getLongString() {
    return "This is a very long string that likely won't fit in the available space unless the container width is very large";
}
function heavilyIndentedCode() {
    return "This long line already starts with significant indentation, and due to hangingIndent=2, its wrapped portion will be indented by an additional 2 columns";
}
```

````text
```js wrap hangingIndent=2
// Example using hangingIndent=2
function getLongString() {
  return "This is a very long string that likely won't fit in the available space unless the container width is very large";
}
function heavilyIndentedCode() {
  return "This long line already starts with significant indentation, and due to hangingIndent=2, its wrapped portion will be indented by an additional 2 columns";
}
```
````

## Global Configuration

Expressive Code is **bundled into the Stalux integration** (since v1.24.0) — you don't need to install or import `astro-expressive-code` yourself. Configure its defaults via the `expressiveCode` option of `stalux()`:

```js
import { defineConfig } from "astro/config";
import stalux from "@xingwangzhe/stalux";

export default defineConfig({
    integrations: [
        stalux({
            expressiveCode: {
                // Configure syntax highlighting
                themes: ["dark-plus", "github-light"],
                shiki: {
                    // You can pass other plugin options here
                },

                // Configure frames
                frames: {
                    // Example: hide the "Copy to clipboard" button
                    showCopyToClipboardButton: false,
                },

                // Configure default properties
                defaultProps: {
                    // Enable line wrapping by default
                    wrap: true,
                    // Disable wrapped line indentation for terminal languages
                    overridesByLang: {
                        "bash,ps,sh": { preserveIndent: false },
                    },
                },

                // Override default styles
                styleOverrides: {
                    frames: {
                        shadowColor: "#124",
                    },
                },
            },
        }),
    ],
});
```

Notes:

- **Line numbers are enabled by default** — the Stalux integration bundles `@expressive-code/plugin-line-numbers`; any `plugins` you pass are appended after it.
- Pass `expressiveCode: false` to disable Expressive Code entirely.
- If you need a standalone Expressive Code integration, you can still import `expressiveCode` from `@xingwangzhe/stalux` (or `@xingwangzhe/stalux/expressive-code`).

For more configuration options and advanced features, please refer to the [Expressive Code official documentation](https://expressive-code.com/).
