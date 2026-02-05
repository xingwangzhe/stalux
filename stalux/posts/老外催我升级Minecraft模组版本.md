---
title: 老外催我升级Minecraft模组版本
abbrlink: c4479124
date: "2025-07-04T18:44:32.356+08:00"
updated: "2025-07-04T18:44:32.356+08:00"
categories:
  - 游戏
tags:
  - 胡思乱想
  - 技术
---

## 没想到有老外用我的模组

距离上一次提及我的模组已经是很久以前的事情了，[Webmapview 一个我的世界内置网页地图浏览 Fabric 模组](/posts/4628/)

[webmapview](https://github.com/xingwangzhe/webmapview)

我本以为不会有多少人用的，没想到有老外在 GitHub 上催我升级模组版本。
![催更](https://i.ibb.co/LzyK1kkk/2025-06-27-12-35-14.webp)

> [Update to newer versions? #1](https://github.com/xingwangzhe/webmapview/issues/1)

哈哈，我当时想五一之后再更的，没想到现在都六月底了。我还没行动，又有老外来催问，那我也没必要再拖了，开始行动！

### 报错好难处理

![Idea报错](https://i.ibb.co/s9PRfqkJ/2025-06-27-12-25-59.webp)

直接 git clone 下来，我需要改各种依赖，比如说 JDK、Gradle，改了发现还是报错，遂作罢，打算重新创建项目。

### 重新构建项目

添加一些重要信息，MCEF 依赖：

```diff lang="json" title="fabric.mod.json"
  "depends": {
    "fabricloader": ">=${loader_version}",
    "fabric": "*",
    "minecraft": "${minecraft_version}",
+    "mcef": "2.1.6-1.21.4"
  },
+  "custom": {
+    "modmenu": {
+      "links": {
+        "modmenu.kofi": "https://ko-fi.com/xingwangzhe/gallery",
+        "modmenu.afadian": "https://afdian.com/a/xingwangzhe"
+      },
+      "option.modmenu.show_libraries": ["mcef"]
+    }
+  }
```

```diff lang="txt" title="build.gradle"
dependencies {
    // To change the versions see the gradle.properties file
    minecraft "com.mojang:minecraft:${project.minecraft_version}"
    mappings "net.fabricmc:yarn:${project.yarn_mappings}:v2"
    modImplementation "net.fabricmc:fabric-loader:${project.loader_version}"
    modImplementation "net.fabricmc.fabric-api:fabric-api:${project.fabric_version}"
+   modCompileOnly 'com.cinemamod:mcef:2.1.6-1.21.4'
+   modRuntimeOnly 'com.cinemamod:mcef-fabric:2.1.6-1.21.4'
}
```

### 运行时

由于我的模组依赖上游的 MCEF，所以我在 Idea 打开时需要先下载 MCEF：
![MCEF下载](https://i.ibb.co/FLkhtW4V/2025-06-27-13-13-14.webp)

然后发现不对，上游的 MCEF 版本还在 1.21.4，但是它仓库的 1.21.5 版本却显示用 1.21.4 的依赖，看来被迷惑了，所以我改回了 1.21.4。

[UPDATE 1.21.5/6 #121](https://github.com/CinemaMod/mcef/issues/121)
![迷惑啊](https://i.ibb.co/gbLXmWdV/2025-06-27-19-23-55.webp)

### 1.21 改 API 了！

在升级到 1.21.4 的过程中，我发现了几个重要的 API 变化，这些变化主要集中在渲染系统和客户端事件系统上。

#### 渲染系统的重大更改

最显著的变化是在 `BasicBrowser.java` 中的渲染方法。在 1.21.\* 中，Minecraft 的渲染系统进行了重构：

```diff lang="java" title="BasicBrowser.java"
@Override
public void render(DrawContext guiGraphics, int i, int j, float f) {
    super.render(guiGraphics, i, j, f);

    // 确保浏览器已初始化
    if (browser == null || browser.getRenderer() == null) {
        guiGraphics.drawCenteredTextWithShadow(textRenderer, "浏览器未初始化",
                                             width / 2, height / 2, 0xFF0000);
        return;
    }

    // 获取纹理ID
    int textureId = browser.getRenderer().getTextureID();
    if (textureId <= 0) {
        // 显示加载提示和调试信息
        guiGraphics.fill(BROWSER_DRAW_OFFSET, BROWSER_DRAW_OFFSET,
                       width - BROWSER_DRAW_OFFSET, height - BROWSER_DRAW_OFFSET,
                       0xFF333333);
        guiGraphics.drawCenteredTextWithShadow(textRenderer, "正在加载浏览器...",
                                             width / 2, height / 2 - 10, 0xFFFFFF);
        return;
    }

    // 使用原始MCEF示例的渲染方式
    RenderSystem.setShaderTexture(0, textureId);
    RenderSystem.setShaderColor(1.0f, 1.0f, 1.0f, 1.0f);

    Tessellator tessellator = Tessellator.getInstance();
-   BufferBuilder buffer = tessellator.getBuffer();
+   BufferBuilder buffer = tessellator.begin(VertexFormat.DrawMode.QUADS, VertexFormats.POSITION_TEXTURE_COLOR);

    var matrix = guiGraphics.getMatrices().peek().getPositionMatrix();

    float x1 = BROWSER_DRAW_OFFSET;
    float y1 = BROWSER_DRAW_OFFSET;
    float x2 = width - BROWSER_DRAW_OFFSET;
    float y2 = height - BROWSER_DRAW_OFFSET;

    // 使用原始MCEF示例的纹理坐标和颜色
    buffer.vertex(matrix, x1, y2, 0).texture(0.0f, 1.0f).color(255, 255, 255, 255);
    buffer.vertex(matrix, x2, y2, 0).texture(1.0f, 1.0f).color(255, 255, 255, 255);
    buffer.vertex(matrix, x2, y1, 0).texture(1.0f, 0.0f).color(255, 255, 255, 255);
    buffer.vertex(matrix, x1, y1, 0).texture(0.0f, 0.0f).color(255, 255, 255, 255);

-   tessellator.draw();
+   BufferRenderer.drawWithGlobalProgram(buffer.end());
}
```

这个变化主要是因为 Minecraft 1.21.4 重构了渲染系统，`Tessellator` 的使用方式发生了变化：

1. **BufferBuilder 初始化**：现在需要使用 `tessellator.begin()` 方法直接指定渲染模式和顶点格式
2. **渲染结束**：使用 `BufferRenderer.drawWithGlobalProgram(buffer.end())` 替代了原来的 `tessellator.draw()`

#### 鼠标滚轮事件 API 变化

鼠标滚轮事件的参数也发生了变化：

```diff lang="java" title="BasicBrowser.java"
@Override
- public boolean mouseScrolled(double mouseX, double mouseY, double delta) {
+ public boolean mouseScrolled(double mouseX, double mouseY, double horizontalAmount, double verticalAmount) {
    if (browser != null && browser.getRenderer() != null) {
        try {
-           browser.sendMouseWheel(mouseX(mouseX), mouseY(mouseY), delta, 0);
+           browser.sendMouseWheel(mouseX(mouseX), mouseY(mouseY), verticalAmount, 0);
        } catch (Exception e) {
            // 忽略浏览器交互错误，避免崩溃
        }
    }
-   return super.mouseScrolled(mouseX, mouseY, delta);
+   return super.mouseScrolled(mouseX, mouseY, horizontalAmount, verticalAmount);
}
```

### 总结

会写Java不代表会写Java工程项目，就像会写c/c++不代表会写Cmakefile一样。我还是得练...

升级到 Minecraft 1.21.4 主要面临的挑战是：

1. **渲染系统重构** - 需要适配新的 BufferBuilder API（这是最难的，我查资料，问 AI 问了好久才找到）
2. **事件系统调整** - 客户端事件和鼠标事件的 API 变化
3. **依赖管理** - 确保所有依赖都支持新版本（这个是第二难的）
4. **错误处理** - 加强异常处理以提高稳定性

现在模组已经成功升级到 1.21.4，老外们应该满意了吧！😄
