---
title: Moonbit License Checker 开发使用
abbrlink: moonbit-license-checker
date: 2026-1-31 11:52:09
tags:
  - moonbit
  - license-checker
categories:
  - moonbit
---

随着Monnbit社区不断发展壮大，管理和合规项目中的许可证信息变得尤为重要。为此，我用Copilot开发了一个名为 `license_checker` 的工具，旨在帮助开发者自动检测和生成项目中所有包的许可证报告。

```bash
moon version
moon 0.1.20260119 (be99339 2026-01-19)

Feature flags enabled: rupes_recta
-> You're currently using the experimental build graph generator "Rupes Recta". If you encounter a problem, please verify whether it also reproduces with the legacy build (by setting NEW_MOON=0).
```

## xingwangzhe/license_checker

### 项目简介

具体的文档可以在下面看到

[🥮 mooncakes.io:license_checker](https://mooncakes.io/docs/xingwangzhe/license_checker)

本工具基于 MoonBit（moon）构建，扫描本项目及本地 `.mooncakes` 缓存中的包，读取各包的 `moon.mod.json` 或 `moon.pkg.json` 中的 `license` 字段，汇总成可机器消费的报告（JSON）或可读的文本报告（TXT）。

主要用途：

- 扫描仓库依赖并生成许可证汇总，用于合规检查或审计。
- 支持从本地 `.mooncakes` 缓存读取已下载包的信息，优先使用本地缓存以避免联网依赖。

主要功能：

- `scanner.mbt`：遍历并解析 `moon.mod.json` / `moon.pkg.json`，提取 license 字段。
- `formatter.mbt`：将扫描结果格式化为 JSON 或 TXT 并写入目标文件。
- `main.mbt`：命令行入口，解析参数并调用扫描/格式化逻辑。

### 使用

```bash title="生成本地二进制"
moon build --target native
```

最后的结果是`exe`文件，应该是链接到C了,我在Linux上可以直接运行

```bash title="运行license_checker"
./target/native/release/build/cmd/license-checker/license-checker.exe --format json --output licenses.json
```

对于项目本身,生成了json

```json title="licenses.json"
{
  "packages": [
    {
      "root": "moonbitlang/x",
      "rel": "",
      "artifact": ".mooncakes/moonbitlang/x",
      "moonmod": ".mooncakes/moonbitlang/x/moon.mod.json",
      "license": "Apache-2.0"
    }
  ],
  "summary": {
    "total": 1,
    "unknown_license": 0
  }
}
```

考虑到目前Moonbit生态还比较小，依赖层级还没那么错综复杂,这个工具仅仅是简单地读取了每个包的 `license` 字段，并没有做更复杂的许可证解析和合规性检查。

### 一些建议

我觉得moonbit生态可以考虑在`moon.mod.json`或`moon.pkg.json`中增加一些字段，比如说`bin` 字段,用来指定可执行文件,可以仿照`npm install -g`的方式安装全局cli工具,也就是自动把二进制文件链接到系统路径。 这样,我这个可执行文件就可以直接发布到mooncakes.io上,用户安装后就可以直接使用`license-checker`命令了,而不需要去构建二进制文件手动改环境变量和文件位置。
