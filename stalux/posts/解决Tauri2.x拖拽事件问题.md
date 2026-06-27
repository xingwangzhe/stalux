---
title: 解决Tauri2.x拖拽事件问题
abbrlink: aed59aad
date: "2025-09-03 07:58:52"
updated: "2025-09-03 12:31:56"
desc: 最近在使用 Tauri2.x 开发桌面应用时，遇到了一个棘手的问题：拖拽事件无法正常工作。经过一番调查和尝试，终于找到了解决方案。在这篇文章中，我将分享我的解决过程，希望能帮助到遇到类似问题的开发者。
categories:
    - 开发
tags:
    - Tauri
    - ts
    - 问题
cover: https://i.ibb.co/VYQpyK44/2025-09-03-11-21-51.png
---

## 前言

最近在使用 Tauri2.x 开发桌面应用时，遇到了一个棘手的问题：拖拽事件无法正常工作。经过一番调查和尝试，终于找到了解决方案。在这篇文章中，我将分享我的解决过程，希望能帮助到遇到类似问题的开发者。

### 问题描述

使用前端监听拖拽事件时，发现事件无法触发。例如

```ts title="示例.ts"
document.addEventListener("DOMContentLoaded", () => {
    const uploadZone = document.getElementById("file-upload-zone");
    const fileList = document.getElementById("file-list");

    uploadZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadZone.classList.add("drag-hover");
    });

    uploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadZone.classList.remove("drag-hover");

        const files = Array.from(e.dataTransfer.files);
        displayFiles(files);
    });

    function displayFiles(files) {
        fileList.innerHTML = files
            .map((file) => `<div class="file-item">${file.name} (${file.size} bytes)</div>`)
            .join("");
    }
});
```

无论如何拖拽，控制台都没有任何输出。

### 解决方案

默认情况下，Tauri 配置

```json title="tauri.conf.json"
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "wngtools",
        "width": 800,
        "height": 600,
        "resizable": true,
        "fullscreen": false,
        "dragDropEnabled": true //这个默认是true
        //Whether the drag and drop is enabled or not on the webview. By default it is enabled.
        //Disabling it is required to use HTML5 drag and drop on the frontend on Windows.
      }
    ],
    ...
  },
  ...
}
```

Tauri 的安全策略阻止了拖拽事件。默认情况下，前端事件被 Tauri 拦截，走它自己的事件

比如说`tauri://drag-drop`,`tauri://drag-leave`,`tauri://drag-enter`等。

那么方案就有两个，一个是声明`"dragDropEnabled": false`，这样前端的拖拽事件就能正常工作了。

但既然Tauri以权限控制与安全为主，我选择了第二个方案，使用 Tauri 提供的拖拽事件。

所以要把原有的拖拽事件改成 Tauri 的事件。

```ts title="filespace.ts"
import { listen } from "@tauri-apps/api/event";
listen("tauri://drag-drop", (e) => {
    console.log("Dropped files:", e);
});
listen("tauri://drag-leave", () => {
    console.log("Drag leave");
});
listen("tauri://drag-enter", () => {
    console.log("Drag enter");
});
```

当我尝试拖拽文件到应用窗口时，控制台成功输出了拖拽的文件信息。
![控制台消息](https://i.ibb.co/VYQpyK44/2025-09-03-11-21-51.png)

当然，根据[官方文档](https://tauri.app/zh-cn/reference/javascript/api/namespaceevent/),**Tauri://** 事件并不能监听到具体的 **DOM** 对象(~~当然，如果你喜欢用相对坐标来判断那我没话说~~)，所以如果你需要监听具体的 DOM 对象的拖拽事件，还是需要把`dragDropEnabled`设置为`false`,并且使用原生的DOM拖拽事件才能行。

## 参考

- [Tauri 官方文档 - 事件](https://tauri.app/zh-cn/reference/javascript/api/namespaceevent/)
- [解决tauri文件拖放无效问题](https://blog.erio.work/posts/解决tauri文件拖放无效问题/)
