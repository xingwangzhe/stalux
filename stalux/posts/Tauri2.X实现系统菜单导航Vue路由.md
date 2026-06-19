---
title: Tauri2.x实现系统菜单导航Vue路由
abbrlink: 1c1f2d49
date: "2025-09-21 16:37:14"
updated: "2025-09-21 16:52:39"
desc: 本文介绍如何在 Tauri 2 应用中使用系统菜单控制 Vue 路由切换。过程涉及在 Rust 后端设置菜单，并通过事件发射处理前端的路由变更。
categories:
    - Tauri
tags:
    - Tauri
    - Vue
    - Router
---

本文介绍如何在 Tauri 2 应用中使用系统菜单控制 Vue 路由切换。过程涉及在 Rust 后端设置菜单，并通过事件发射处理前端的路由变更。

## 方法

在应用启动时，在 `src-tauri/src/lib.rs` 中使用 Tauri's `MenuBuilder` 配置菜单。添加菜单项如“Editor”、“About”和“Settings”，每个项有唯一 ID 如“nav-home”用于识别。

设置监听器处理菜单事件。当用户点击菜单项时，`on_menu_event` 被触发，根据菜单 ID 发射名为“change_router”的自定义事件，并附带相应路由路径作为数据。

```rs title="src-tauri/src/lib.rs"
mod commands;

use tauri::menu::MenuBuilder;
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .setup(|app| {
            let menu = MenuBuilder::new(app)
                .text("nav-home", "Editor")
                .text("nav-about", "About")
                .text("nav-settings", "Settings")
                .build()?;
            app.set_menu(menu.clone())?;
            app.on_menu_event(move |app_handle: &tauri::AppHandle, event| {
                println!("menu event: {:?}", event.id());
                match event.id().0.as_str() {
                    "nav-home" => {
                        println!("nav-home");
                        app_handle.emit("change_router", "/").unwrap()
                    }
                    "nav-about" => {
                        println!("nav-about");
                        app_handle.emit("change_router", "/about").unwrap()
                    }
                    "nav-settings" => {
                        println!("nav-settings");
                        app_handle.emit("change_router", "/settings").unwrap()
                    }
                    _ => {
                        println!("nothing")
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

菜单是原生系统组件，因此在后端处理而非前端。事件发射实现了前后端的解耦，使前端专注于视图更新。

### 前端监听与响应

在前端 `src/main.ts` 中，使用 Vue Router 设置路由，包括首页、关于页和设置页。

关键是监听后端发来的“change_router”事件。收到事件后，调用 `router.push({ path: event.payload })` 切换路由。使用对象格式传递路径，以符合 Vue Router 的类型要求，避免 TypeScript 类型错误。

```ts title="src/main.ts"
import { createApp } from "vue";
import App from "./App.vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { listen } from "@tauri-apps/api/event";
import Home from "./pages/Home.vue";
import About from "./pages/About.vue";
import Settings from "./pages/Settings.vue";

const routes = [
    { path: "/", component: Home },
    { path: "/about", component: About },
    { path: "/settings", component: Settings },
];

const router = createRouter({
    history: createMemoryHistory(),
    routes,
});

listen<String>("change_router", (event) => {
    console.log(event.payload);
    router.push({ path: event.payload });
});

createApp(App).use(router).mount("#app");
```

前端代码保持简洁，通过事件与后端通信，而不直接操作菜单。这种设计提高了模块化和可维护性。

### 效果

![切换路由](https://i.ibb.co/KcBCNXmJ/2025-09-21-16-47-17.webp)

> 在我Ubuntu 24.04LTS上的效果

### 完整过程

应用启动时，后端创建菜单并分配到窗口。当用户点击菜单项如“Editor”时，后端监听器检测事件并发射“change_router”事件，附带路径“/”。前端收到事件后，使用路由器更新视图为 Home 组件。过程高效，提供原生应用体验。

Tauri 2 与 Vue Router 的集成允许后端管理菜单，前端处理路由，通过事件实现通信。

### 题外话

TaurI前后端通信真好玩😋
