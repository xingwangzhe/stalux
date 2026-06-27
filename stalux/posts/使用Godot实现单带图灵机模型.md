---
title: 使用Godot实现单带图灵机模型
abbrlink: 58216
date: "2024-11-19 16:33:23"
updated: "2025-07-04 18:44:32"
desc: _如你所见，虽然Ui不好看，但是也还凑合_
categories:
    - 开发
tags:
    - 学习
    - 编程
    - 记录
    - 进步
cover: https://i.ibb.co/Tq05mgk/2024-11-19-163538.png
---

_如你所见，虽然Ui不好看，但是也还凑合_

![2024-11-19-163538](https://i.ibb.co/Tq05mgk/2024-11-19-163538.png)

_本文介绍使用我如何使用godot来实现这个模型_

_在线使用地址：_

_[turing-machine by xingwangzhe](https://xingwangzhe.itch.io/turing-machine)_

_项目地址：_

_github:_
_[xingwangzhe/turing_machine: 图灵机模型，使用godot实现：）](https://github.com/xingwangzhe/turing_machine)_

_gitee:_

_[turing_machine: 图灵机模型，使用godot实现：）](https://gitee.com/xingwangzhe/turing_machine)_

<!--more-->

## 为什么使用godot

实现图形化界面，有很多方法，比如说Qt什么的，但对于我个人来说，学习成本有点高了，想到之前我自己照葫芦画瓢跟着b站上视频学godot开发小游戏，效果还不错，于是就选择godot来实现了
虽然有点杀鸡用牛刀的感觉,但能够实现目的就可以 \x7e~不择手段~~：）

## 思路分析

本文中 `text`(String)表示字符串，`pos`(int)表示字符串的索引，`state`(int)表示状态,`retain`(String)表示保留符。

### 示例：单带图灵机

单带图灵机很容易抽像为字符串数组(String),那么状态转移函数就是对字符串数组进行操作.

我们拿出一个来举例
![2024-11-19-170519](https://i.ibb.co/y0g71Dq/2024-11-19-170519.png)

以下是主要的代码

```py
func tur_action_2(pos:int,state:int,retain:String):
	$"../tag".text="                                                                                             "
	for i in range(0, $".".text.length()):
		if i==pos:
			$"../tag".text[i]='V'
		else:
			$"../tag".text[i]='.'
	if (state==0):
		if($".".text[pos]=='a'):
			$".".text[pos]='X'
			state=1
			retain='a'
			pos+=1
		elif ($".".text[pos]=='b'):
			$".".text[pos]='Y'
			state=1
			pos+=1
			retain='b'
		$"../../Panel/VScrollBar/log".text+="\nq0->q1 [retain:"+retain+"]"
	elif(state==1):
		if($".".text[pos]=='a'||$".".text[pos]=='b'):
			pos+=1
			$"../../Panel/VScrollBar/log".text+="\nq1->q1 [retain:"+retain+"]"
		elif ($".".text[pos]=='c'):
			pos+=1
			state=2
			$"../../Panel/VScrollBar/log".text+="\nq1->q2 [retain:"+retain+"]"
	elif(state==2):
		if($".".text[pos]=='X'||$".".text[pos]=='Y'):
			pos+=1
			$"../../Panel/VScrollBar/log".text+="\nq2->q2 [retain:"+retain+"]"
		elif ($".".text[pos]=='a'&&retain=='a'):
			text[pos]='X'
			state=3
			pos-=1
			$"../../Panel/VScrollBar/log".text+="\nq2->q3 [retain:"+retain+"]"
		elif ($".".text[pos]=='b' && retain=='b'):
			text[pos]='Y'
			state=3
			pos-=1
			$"../../Panel/VScrollBar/log".text+="\nq2->q3 [retain:"+retain+"]"
	elif(state==3):
		if(text[pos]=='X'||text[pos]=='Y'):
			pos-=1
			$"../../Panel/VScrollBar/log".text+="\nq3->q3 [retain:"+retain+"]"
		elif(text[pos]=='c'):
			state=4
			pos-=1
			$"../../Panel/VScrollBar/log".text+="\nq3->q4 [retain:"+retain+"]"
	elif(state==4):
		if(text[pos]=='a'||text[pos]=='b'):
			state=5
			pos-=1
			$"../../Panel/VScrollBar/log".text+="\nq4->q5 [retain:"+retain+"]"
		elif(text[pos]=='X'||text[pos]=='Y'):
			state=6
			pos+=1
			$"../../Panel/VScrollBar/log".text+="\nq4->q6 [retain:"+retain+"]"
	elif(state==5):
		if(text[pos]=='a'||text[pos]=='b'):
			pos-=1
			$"../../Panel/VScrollBar/log".text+="\nq5->q5 [retain:"+retain+"]"
		elif(text[pos]=='X'||text[pos]=='Y'):
			state=0
			pos+=1
			$"../../Panel/VScrollBar/log".text+="\nq5->q0 [retain:"+retain+"]"
	elif(state==6):
		if(text[pos]=='X'||text[pos]=='Y'||text[pos]=='c'):
			pos+=1
			$"../../Panel/VScrollBar/log".text+="\nq6->q6 [retain:"+retain+"]"
		elif(text[pos]=='B'):
			state=7
			pos-=1
			$"../../Panel/VScrollBar/log".text+="\nq6->q7 [retain:"+retain+"]"
	elif(state==7):
		if(text[pos]=='X'||text[pos]=='Y'||text[pos]=='c'):
			if(text[pos]=='X'):
				text[pos]='a'
			elif(text[pos]=='Y'):
				text[pos]='b'
			pos-=1
			$"../../Panel/VScrollBar/log".text+="\nq7->q7 [retain:"+retain+"]"
		elif(text[pos]=='B'):
			state=8
			pos+=1
			$"../../Panel/VScrollBar/log".text+="\nq7->q8 [retain:"+retain+"]"
	elif(state==8):
		pos=1
		state=0
		$"../../Panel/VScrollBar/log".text+="\nq8->end [retain:"+retain+"]"
	for i in range(0, $".".text.length()):
		if i==pos:
			$"../tag".text[i]='V'
		else:
			$"../tag".text[i]='.'
	return [pos,state,retain]
```

~~看来web不识别gdscript,给python格式倒是显示了：）~~

状态转移函数采用的分支条件语句来写，先判断每次操作时的状态，再根据读取的字符进行判断，然后做出状态改变或者位移或者字符改变

> $"../../Panel/VScrollBar/log"
> 这个是在godot树状结构中，取对象地址(不是机器内存的地址，而是这个对象在项目结构中的路径)的方法，确保了获取对象的唯一性

### 辅助方法

函数什么时候调用，怎么调用，这都是有方法的，在游戏开发领域，`信号`（`signal`）是一种用于实现模块或功能间通信的机制，它允许一个游戏对象对另一个游戏对象的变化做出反应，而无需相互引用。信号是一种解耦的方法，可以使得代码组织得更好、更易于管理

> 简单理解就是：
> godot在监听事件，我按下按钮触发事件，信号连接到对象上，可以触发对象的方法。

响应式ui
懒得说了，了解前端的应该都知道

## 参考

东北大学计算理论ppt
[Godot 文档 – master 分支 — Godot Engine (4.x) 简体中文文档](https://docs.godotengine.org/zh-cn/4.x/)
