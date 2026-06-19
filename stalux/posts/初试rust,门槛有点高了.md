---
title: 初试rust,门槛有点高
abbrlink: 2f7208c4
date: "2025-05-11 13:44:12"
updated: "2025-05-11 15:59:12"
desc: "- Rust语言圣经(Rust Course)"
categories:
    - 编程
tags:
    - 胡思乱想
    - 学习
---

**推荐资料**

- [Rust 程序设计语言(官网)](https://www.rust-lang.org/zh-CN/)
- [Rust语言圣经(Rust Course)](https://course.rs/about-book.html)

## rust是什么

官网介绍道:一门赋予每个人,构建可靠且高效软件能力的语言。

| **高性能**                                                                                                          | **可靠性**                                                                    | **生产力**                                                                                                |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Rust 速度快且内存利用率高。没有运行时和垃圾回收，能胜任高性能要求的服务，可在嵌入式设备上运行，易于与其他语言集成。 | Rust 的类型系统和所有权模型保证内存安全和线程安全，在编译期就能消除各类错误。 | Rust 有优秀的文档、友好的编译器和清晰的错误提示，集成了包管理器、构建工具、编辑器支持和自动格式化等工具。 |

由于我是初学者,还什么都不会,有些概念不太熟悉,用ai写了一些例子来更好地理解

### hello world

```c title="hello_world.c"
#include <stdio.h>
int main(){
    printf("hello, world");
}
```

```rs title="hellow_world.rs"
fn main() {
    println!("Hello, world!");
}
```

### 有趣的概念

比如说,rust默认变量是**不变的**,除非声明为可变量,这倒是为编译器省大量内存了,类型也非常精细,比如说i32,i64等等,还有所有权与引用与借用等等

举个栗子

```rs title="hello_world.rs"
fn main() {

    let mut s = String::from("hello");

    s.push_str(", world!"); // push_str() 在字符串后追加字面值
    // s+=", world!" //这个语法糖也可以
    println!("{}", s); // 将打印 `hello, world!`
}
```

`let`定义符,`mut`标识可变量,`String`为动态字符串类型

> `rs let s = "world"` 是字符串字面量(`&str`)类型,不能变动值(即使你加了`mut`标识)

### Rust 还支持中文字符串

Rust 默认使用 UTF-8 编码，所以可以完美支持各种语言的文字，包括中文：

```rs title="chinese_unicode.rs"
fn main() {
    // 中文字符主要集中在这些 Unicode 区块中
    let chinese_ranges = [
        (0x4E00u32, 0x9FFF), // 中日韩统一表意文字（基本汉字区）
        (0x3400, 0x4DBF),    // 中日韩统一表意文字扩展 A
        (0x20000, 0x2A6DF),  // 中日韩统一表意文字扩展 B
        (0x2A700, 0x2B73F),  // 中日韩统一表意文字扩展 C
        (0x2B740, 0x2B81F),  // 中日韩统一表意文字扩展 D
        (0xF900, 0xFAFF),    // 中日韩兼容表意文字
        (0x2F800, 0x2FA1F),  // 中日韩兼容表意文字补充
    ];

    // 遍历每个 Unicode 区块
    for (start, end) in chinese_ranges.iter() {
        // 遍历当前区块中的所有码点
        for code_point in *start..=*end {
            // 尝试将码点转换为字符
            if let Some(c) = std::char::from_u32(code_point) {
                // 输出字符
                print!("{}", c);
            }
        }
    }
}
```

> 你应该知道这段代码是什么意思,如果可以的话,建议你亲自试一试: )

### 所有权(Ownership)

这是 Rust 最与众不同的特性，也是理解 Rust 的关键。所有权规则：

1. Rust 中的每个值都有一个被称为其**所有者**的变量
2. 值在任一时刻有且只有一个所有者
3. 当所有者（变量）离开作用域，这个值将被丢弃（内存自动释放）

```rs title="ownership.rs"
fn main() {
    {
        let s = String::from("hello"); // s 进入作用域
        // 使用 s
    }                                  // 此作用域结束，s 不再有效，内存自动释放

    // 这里使用 s 会导致编译错误
}
```

#### 移动（Move）和克隆（Clone）

当我们把一个变量赋值给另一个变量时，Rust 会"移动"所有权：

```rs title="move.rs"
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 的所有权被移动到 s2

    // println!("{}", s1); // 错误！s1 已经无效
    println!("{}", s2); // 正常
}
```

如果想保留原变量，需要进行克隆：

```rs title="clone.rs"
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone(); // 深拷贝数据

    println!("s1 = {}, s2 = {}", s1, s2); // 两个都有效
}
```

#### 函数参数的所有权传递

当你将值传递给函数时，其所有权也会被移动或借用：
某些类型（如 String）会转移所有权。这意味着在函数内部管理该资源（内存），函数结束后资源会被释放。
某些类型（如 i32）实现了 Copy trait。这表示当它们被传递给函数时，会创建一个值的拷贝，原始变量仍然有效。

```rs title="ownership_function.rs"
fn main() {
    let s = String::from("hello");

    takes_ownership(s); // s 的值移动到函数里
    // 这里 s 已经无效

    let x = 5;
    makes_copy(x); // i32 是 Copy 的，所以 x 依然可用
    println!("{}", x); // 正常
}

fn takes_ownership(some_string: String) {
    println!("{}", some_string);
} // 函数结束，some_string 被释放

fn makes_copy(some_integer: i32) {
    println!("{}", some_integer);
} // 函数结束，没有特殊操作
```

### 引用与借用（References & Borrowing）

为了使用值但不获取所有权，Rust 使用"引用"机制：

```rs title="reference.rs"
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1); // 传递 s1 的引用

    println!("{} 的长度是 {}", s1, len); // s1 仍然有效
}

fn calculate_length(s: &String) -> usize { // s 是对 String 的引用
    s.len()
} // 这里 s 离开作用域，但它并不拥有引用值的所有权，所以没有发生释放
```

#### 可变引用

```rs title="mutable_reference.rs"
fn main() {
    let mut s = String::from("hello");

    change(&mut s); // 传递可变引用

    println!("{}", s);
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

引用的限制：

- 在特定作用域中，对于某一块数据，要么只能有一个可变引用，要么只能有多个不可变引用
- 引用必须始终有效（避免悬垂引用）

### 切片类型（Slice Type）

切片是对集合中部分连续元素的引用：

```rs title="slice.rs"
fn main() {
    let s = String::from("hello world");

    let hello = &s[0..5]; // 或者简写为 &s[..5]
    let world = &s[6..11]; // 或者简写为 &s[6..]

    println!("{} {}", hello, world);

    // 获取整个字符串的切片
    let whole = &s[..]; // 等同于 &s[0..s.len()]
}
```

### 结构体（Struct）

自定义数据类型，将多个相关联的值组合在一起：

```rs title="struct.rs"
// 定义结构体
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}

fn main() {
    // 创建实例
    let mut user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };

    // 修改字段（需要整个实例是可变的）
    user1.email = String::from("anotheremail@example.com");

    // 使用已有的实例创建新实例
    let user2 = User {
        email: String::from("another@example.com"),
        ..user1 // 其余字段使用 user1 的值
    };
}
```

#### 元组结构体

没有具名字段的结构体：第一次了解时愣了一下,看了代码之后就很好理解了

```rs title="tuple_struct.rs"
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);

    // 访问字段
    println!("黑色的红色值：{}", black.0);
}
```

### 枚举（Enum）和模式匹配

```rs title="enum.rs"
enum IpAddrKind {
    V4,
    V6,
}

fn main() {
    let four = IpAddrKind::V4;
    let six = IpAddrKind::V6;

    route(four);
    route(six);
}

fn route(ip_kind: IpAddrKind) {
    // 处理不同类型的 IP 地址
}
```

枚举可以包含数据：

```rs title="enum_data.rs"
enum IpAddr {
    V4(String),
    V6(String),
}

// 或者更复杂的
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let home = IpAddr::V4(String::from("127.0.0.1"));
    let loopback = IpAddr::V6(String::from("::1"));

    let msg = Message::Write(String::from("hello"));
}
```

#### 模式匹配

使用 `match` 控制流结构可以优雅地处理枚举：

```rs title="match.rs"
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

fn main() {
    let coin = Coin::Penny;
    println!("一分币的值是 {} 美分", value_in_cents(coin));
}
```

### Option 枚举

Rust 没有空值（null），而是使用 Option 枚举处理值存在和不存在的情况：

```rs title="option.rs"
fn main() {
    let some_number = Some(5);
    let some_string = Some("一个字符串");
    let absent_number: Option<i32> = None; // 必须指定类型

    // 使用 match 处理 Option
    match some_number {
        Some(i) => println!("数字是: {}", i),
        None => println!("没有数字"),
    }

    // 使用 if let 简化
    if let Some(i) = some_number {
        println!("数字是: {}", i);
    }
}
```

Rust 也被用于游戏开发，比如使用 Bevy 引擎：

```rs title="bevy_example.rs"
// 需要添加依赖: bevy = "0.8"
use bevy::prelude::*;

fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_startup_system(setup)
        .add_system(hello_world)
        .run();
}

fn hello_world() {
    println!("你好，世界！");
}

fn setup(mut commands: Commands) {
    commands.spawn_bundle(Camera2dBundle::default());
    commands.spawn_bundle(SpriteBundle {
        sprite: Sprite {
            color: Color::rgb(0.25, 0.25, 0.75),
            custom_size: Some(Vec2::new(50.0, 50.0)),
            ..default()
        },
        ..default()
    });
}
```

### 总结

Rust 是一门面向系统级编程的现代语言，凭借其卓越的性能、内存安全和并发安全特性脱颖而出。虽然其学习曲线较陡，但一旦掌握了所有权、生命周期等核心概念，你将能够编写既安全又高效的代码 ~~当然不是我~~

Rust 的严格编译时检查机制是其安全基础，能在代码运行前就发现并阻止许多常见错误。即使我们不能完全掌握 Rust 的所有细节，从 Rust 编程实践中获得的思维模式和经验也会帮助我们在其他语言中构建更高质量的代码

作为一门现代系统编程语言，Rust 正在云服务、嵌入式系统、Web 开发和游戏引擎等众多领域展现出强大的适用性和潜力。~~但对我来说还是只能望其项背~~
