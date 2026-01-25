---
name: bun-package-management
description: 当使用node相关命令时,务必使用bun来代替
allowed-tools: Bash(bun:*) Read
---

# 规范

`package.json`是npm包的重要数据字段文件,其中的`dependencies`和`devDependencies`是重要的依赖字段,禁止直接修改这两个字段,因为直接修改会导致依赖关系**损坏**,且变得**难以修复**

## 当要求安装新的**npm**包时,使用bun命令

```Bash
bun i xxx
```

## 当要求卸载时,使用bun命令

```Bash
bun remove xxx
```
