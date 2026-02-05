---
title: 中秋-来试试Moonbit吧
abbrlink: 32faf407
date: "2025-10-06T16:11:55.899+08:00"
updated: "2025-10-06T16:34:58.470+08:00"
categories:
  - 编程
tags:
  - Moonbit
  - files_tree
  - mooncake
  - 编程
---

大家中秋🎑快乐啊

## 什么是Moonbit

[Moonbit](https://www.moonbitlang.cn/)是国产的一门编程语言，它很年轻，预计26年左右发布**1.0版本**

特点：

- 支持函数式和面向对象等多种编程范式，兼具动态灵活与安全高效
- 实用的类型系统，面向数据的语言设计，让任何背景的开发者迅速上手
- 支持WebAssembly、JavaScript等多后端，应用场景广阔

## 简单做个包，并试试

**Moonbit**的名字来源于**月兔**，同理，它的包也叫 **[MoonCake](https://mooncakes.io/)** ,也就是月饼，虽然我不怎么爱吃月饼，但是我还是愿意做个Mooncake包的

[xingwangzhe/files_tree](https://mooncakes.io/docs/xingwangzhe/files_tree)

这个包依赖官方的[moonbitlang/x](https://mooncakes.io/docs/moonbitlang/x),因为官方的`fs`方法尚在beta，还未纳入到[moonbitlang/core](https://github.com/moonbitlang/core)官方核心包，未来我可能还得再改一下

### 原理逻辑

该包采用递归遍历算法构建目录结构的文件树表示。核心数据结构为 `FileNode` 枚举类型，定义为 `File(String)` 用于表示文件节点，`Directory(String, Array[FileNode])` 用于表示目录节点及其子节点数组。

`build_tree(path)` 函数首先通过 `@fs.is_dir()` 判断路径类型。若为文件，则直接构造 `File` 节点；若为目录，则调用 `@fs.read_dir()` 获取目录内容，并对每个子项递归调用 `build_tree`，构建完整的树结构。路径处理模块支持跨平台兼容，自动检测并适配路径分隔符（Unix 系统使用 `/`，Windows 系统使用 `\`）。

打印功能通过 ASCII 字符生成树形图，使用符号如 `├──`、`└──` 和 `│` 表示层次关系。`print_tree()` 函数直接输出到控制台，`tree_to_string()` 函数返回字符串表示。底层实现依赖 `@fs` 模块提供的文件系统接口，包括 `is_dir()`、`read_dir()` 等操作。

#### 注意事项

路径解析基于程序运行时的当前工作目录（CWD），而非源代码文件位置。这是因为底层文件系统操作通过操作系统内核进行路径解析，遵循 POSIX 标准，相对路径以进程 CWD 为基准。

### 测试结果

:::tip
由于我的astro尚未支持moonbit的代码块，我暂时用rs高亮来展示
:::

```rust title="main.mbt"
fn tesst()->Unit raise {
    let tree_node = @files_tree.build_tree("./target");
    @files_tree.print_tree(tree_node);
}

fn main {
  println(@lib.fib(10));
  try {
    tesst();
  } catch { e =>
    println("Error: \{e}");
  }
}
```

```bash
target/
├── .moon-lock
├── packages.json
├── wasm-gc/
│   └── release/
│       ├── check/
│       │   ├── cmd/
│       │   │   └── main/
│       │   │       └── main.mi
│       │   ├── check.output
│       │   ├── testmm.blackbox_test.mi
│       │   ├── .moon-lock
│       │   ├── check.moon_db
│       │   ├── moon.db
│       │   ├── testmm.mi
│       │   └── .mooncakes/
│       │       ├── moonbitlang/
│       │       │   └── x/
│       │       │       ├── sys/
│       │       │       │   ├── internal/
│       │       │       │   │   └── ffi/
│       │       │       │   │       └── ffi.mi
│       │       │       │   └── sys.mi
│       │       │       ├── num/
│       │       │       │   └── num.mi
│       │       │       ├── encoding/
│       │       │       │   ├── encoding.mi
│       │       │       │   └── internal/
│       │       │       │       └── benchmark/
│       │       │       │           ├── decoding_streaming/
│       │       │       │           │   └── decoding_streaming.mi
│       │       │       │           ├── benchmark.mi
│       │       │       │           └── decoding_batch/
│       │       │       │               └── decoding_batch.mi
│       │       │       ├── fs/
│       │       │       │   └── fs.mi
│       │       │       ├── stack/
│       │       │       │   └── stack.mi
│       │       │       ├── crypto/
│       │       │       │   └── crypto.mi
│       │       │       ├── time/
│       │       │       │   └── time.mi
│       │       │       ├── internal/
│       │       │       │   └── ffi/
│       │       │       │       └── ffi.mi
│       │       │       ├── benchmark/
│       │       │       │   ├── internal/
│       │       │       │   │   └── benchmark_ffi/
│       │       │       │   │       └── benchmark_ffi.mi
│       │       │       │   └── benchmark.mi
│       │       │       ├── uuid/
│       │       │       │   └── uuid.mi
│       │       │       ├── json5/
│       │       │       │   └── json5.mi
│       │       │       └── rational/
│       │       │           └── rational.mi
│       │       └── xingwangzhe/
│       │           └── files_tree/
│       │               └── files_tree.mi
│       └── build/
│           ├── cmd/
│           │   └── main/
│           │       ├── main.core
│           │       ├── main.mi
│           │       └── main.wasm
│           ├── testmm.core
│           ├── .moon-lock
│           ├── moon.db
│           ├── build.output
│           ├── testmm.mi
│           ├── build.moon_db
│           └── .mooncakes/
│               ├── moonbitlang/
│               │   └── x/
│               │       ├── fs/
│               │       │   ├── fs.mi
│               │       │   └── fs.core
│               │       └── internal/
│               │           └── ffi/
│               │               ├── ffi.core
│               │               └── ffi.mi
│               └── xingwangzhe/
│                   └── files_tree/
│                       ├── files_tree.core
│                       └── files_tree.mi
└── doc/
    ├── index.html
    └── xingwangzhe/
        └── testmm/
            ├── cmd/
            │   └── main/
            │       ├── members.md
            │       ├── resource.json
            │       ├── main.mbt.html
            │       └── package_data.json
            ├── members.md
            ├── resource.json
            ├── module_index.json
            ├── testmm.mbt.html
            ├── _sidebar.md
            ├── README.md
            └── package_data.json

```

嘻嘻😁，还挺好玩的
