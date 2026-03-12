---
title: vscode插件开发心得:RustedWarfareModSupport
abbrlink: 65110
date: 2025-03-09 18:57:06+00:00
updated: "2025-07-04T18:44:32.350+08:00"
categories:
    - 开发
tags:
    - 学习
    - 记录
    - RustedWarfare
---

我并没有重复造轮子,因为根本就没轮子 :(

时隔多年,我还是回到了我最喜欢的RTS游戏:[Steam 上的 Rusted Warfare - RTS](https://store.steampowered.com/app/647960/Rusted_Warfare__RTS/)

这是我的插件地址
[RustedWarfareModSupport - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=xingwangzhe.RustedWarfareModSupport)

<!--more-->

## 开发过程

### 起步,想使用yo code?

这脚手架有点太简陋了,所以我直接git clone 一下微软官方的[lsp-sample](https://github.com/microsoft/vscode-extension-samples/tree/main/lsp-sample)插件来改一改,顺带学习一下lsp

:::tip
什么是lsp?
**LSP** 通常指 ​ **语言服务器协议(Language Server Protocol)** ​，是一种用于在集成开发环境（IDE）和语言服务器之间通信的开放标准。它通过标准化的请求和响应机制，让开发者工具（如 VS Code、Emacs）与语言支持服务（如代码补全、语法检查、重构工具）解耦，从而实现跨平台、跨编辑器的语言功能支持。
:::

果然官方的就是好啊,注释什么的都一应俱全,但为什么不把这个作为yo code的选项之一呢?我还是不太明白
不过,既然有了模板,那就开始改造!

### 代码表,数据从哪来?

倒是能看到许多excal表格,但这不是一个对js/ts友好的数据结构,找了一下,看到了一个插件仓库

[Blackburn507/RWini_Plugin: A plugin improves coding for MODs of a RTS game Rusted Warfare.](https://github.com/Blackburn507/RWini_Plugin)

但是我好奇为什么没在vscode插件市场上看到,看了一下是MIT协议,里面的`/db/`文件夹有三个数据json,看起来不方便,于是我开始拆分

#### 拆分dataVAseKey.json

```js
const fs = require("fs");
const path = require("path");

// 读取 dataBaseKey.json 文件内容
const dataBaseKeyJson = fs.readFileSync("dataBaseKey.json", "utf-8");
const dataBaseKey = JSON.parse(dataBaseKeyJson);

// 定义 CompletionItemKind 常量
const CompletionItemKind = {
    Text: 1,
};

// 定义一个函数来生成 CompletionItem[] 数据
function generateCompletionItems(section, items) {
    return Object.entries(items).map(
        ([label, [type, descriptionSection, detail, documentation]], index) => ({
            label,
            insertText: `${label}:`,
            labelDetails: { description: `[${section}]` },
            kind: CompletionItemKind.Text,
            detail,
            documentation,
            type,
        }),
    );
}

// 遍历 dataBaseKey 中的每个 section
for (const [section, items] of Object.entries(dataBaseKey)) {
    const completionItems = generateCompletionItems(section, items);

    // 生成文件内容
    const importStatement = `import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';`;
    const exportStatement = `export const ${section.toUpperCase()}: CompletionItem[] = [`;
    const itemsContent = completionItems
        .map(
            (item) => `    {
        label: '${item.label || ""}',
        insertText: '${item.insertText || ""}',
        labelDetails: { detail :' ${(item.type || "") + " " + (item.detail || "").replace(/'/g, "\\'")}', description: '[${section}]' },
        kind: CompletionItemKind.Text,
        detail :'${(item.detail || "").replace(/'/g, "\\'")}',
        documentation :'${(item.documentation || "").replace(/'/g, "\\'")}',
        data: '${(item.type || "").replace(/'/g, "\\'")}'
    },`,
        )
        .join("\n");
    const closingBracket = `];`;

    const fileContent = `${importStatement}\n${exportStatement}\n${itemsContent}\n${closingBracket}`;

    // 写入文件
    const filePath = path.join(__dirname, `${section}.ts`);
    fs.writeFileSync(filePath, fileContent, "utf-8");
}

console.log("文件生成完成");
```

#### 拆分dataBaseValue.json

```js
const fs = require("fs");
const path = require("path");

// 读取 dataBaseValue.json 文件内容
const dataBaseValueJson = fs.readFileSync("dataBaseValue.json", "utf-8");
const dataBaseValue = JSON.parse(dataBaseValueJson);

// 定义 CompletionItemKind 常量
const CompletionItemKind = {
    Text: 1,
};

// 定义一个函数来生成 CompletionItem[] 数据
function generateCompletionItems(section, items) {
    return Object.entries(items).map(([label, [type, description, detail]], index) => ({
        label,
        insertText: `${label}`,
        labelDetails: { description: `[${section}]` },
        kind: CompletionItemKind.Text,
        detail,
        documentation: description,
        type,
    }));
}

// 遍历 dataBaseValue 中的每个 section
for (const [section, items] of Object.entries(dataBaseValue)) {
    const completionItems = generateCompletionItems(section, items);

    // 生成文件内容
    const importStatement = `import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';`;
    const exportStatement = `export const ${section.toUpperCase()}: CompletionItem[] = [`;
    const itemsContent = completionItems
        .map(
            (item) => `    {
        label: '${item.label || ""}',
        insertText: '${item.insertText || ""}',
        labelDetails: { detail :' ${(item.type || "") + " " + (item.detail || "").replace(/'/g, "\\'")}', description: '[${section}]' },
        kind: CompletionItemKind.Text,
        detail :'${(item.detail || "").replace(/'/g, "\\'")}',
        documentation :'${(item.documentation || "").replace(/'/g, "\\'")}',
        data: '${(item.type || "").replace(/'/g, "\\'")}'
    },`,
        )
        .join("\n");
    const closingBracket = `];`;

    const fileContent = `${importStatement}\n${exportStatement}\n${itemsContent}\n${closingBracket}`;

    // 写入文件
    const filePath = path.join(__dirname, `${section}.ts`);
    fs.writeFileSync(filePath, fileContent, "utf-8");
}

console.log("文件生成完成");
```

现在获得了这些文件,对于这些文件,应该定义一下良好的数据结构

#### 定义Completionitem[]

定义这个对象数组,方便补全,下面是其中的一个例子

```js
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';
export const ACTION: CompletionItem[] = [
    {
        label: 'text',
        insertText: 'text:',
        labelDetails: { detail :' file-text 文本', description: '[action]' },
        kind: CompletionItemKind.Text,
        detail :'文本',
        documentation :'界面中显示的文字',
        data: 'file-text'
    },
    {
        label: 'textPostFix',
        insertText: 'textPostFix:',
        labelDetails: { detail :' file-text 文本动态更改', description: '[action]' },
        kind: CompletionItemKind.Text,
        detail :'文本动态更改',
        documentation :'显示为后缀的文本,与textAddUnitName一起用于创建文本UI',
        data: 'file-text'
    },
...
    ]
```

合在一起,方便调用

```js
import { CompletionItem } from 'vscode-languageserver';
import { ACTION } from './action';
import { AI } from './ai';
import { ANIMATION } from './animation';
import { ATTACHMENT } from './attachment';
import { ATTACK } from './attack';
import { CANBUILD } from './canBuild';
import { CORE } from './core';
import { EFFECT } from './effect';
import { GRAPHICS } from './graphics';
import { LEG } from './leg';
import { MOVEMENT } from './movement';
import { PLACEMENTRULE } from './placementRule';
import { PROJECTILE } from './projectile';
import { RESOURCE } from './resource';
import { TURRET } from './turret';


export const ALLSECTIONS: Record<string, CompletionItem[]> ={
	ACTION,
	AI,
	ANIMATION,
	ATTACHMENT,
	ATTACK,
	CANBUILD,
	CORE,
	EFFECT,
	GRAPHICS,
	LEG,
	MOVEMENT,
	PLACEMENTRULE,
	PROJECTILE,
	RESOURCE,
	TURRET
};
```

### 关键在于connection.onCompletion函数的调用

```js
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		const document = documents.get(_textDocumentPosition.textDocument.uri);
		if (!document) {return [];}

		// 获取当前行号
		const cursorLine = _textDocumentPosition.position.line;

		// 从当前行向上查找最近的一个节定义
		let currentSectionName = null;
		for (let i = cursorLine; i >= 0; i--) {
			const lineStart = document.positionAt(document.offsetAt({ line: i, character: 0 }));
			const lineEnd = document.positionAt(document.offsetAt({ line: i + 1, character: 0 }) - 1);
			const lineContent = document.getText({ start: lineStart, end: lineEnd }).trim();

			const sectionMatch = lineContent.match(/^\[(.+)\]$/);
			if (sectionMatch) {
				currentSectionName = sectionMatch[1];
				break;
			}
		}
		const cursorCharacter = _textDocumentPosition.position.character;

		// 获取当前行内容
		const lineStart = document.positionAt(document.offsetAt({ line: cursorLine, character: 0 }));
		const lineEnd = document.positionAt(document.offsetAt({ line: cursorLine + 1, character: 0 }) - 1);
		const currentLineContent = document.getText({ start: lineStart, end: lineEnd });

		// 判断光标是否在 [] 内
		const openBracketIndex = currentLineContent.lastIndexOf('[', cursorCharacter);
		const closeBracketIndex = currentLineContent.indexOf(']', cursorCharacter);
		const isInsideBrackets = openBracketIndex !== -1 && (closeBracketIndex === -1 || openBracketIndex > closeBracketIndex);

		if (isInsideBrackets) {
			return SECTIONSNAME;
		}
		// 判断光标是否在 :后
		const colonIndex = currentLineContent.indexOf(':');
		const pointIndex = currentLineContent.indexOf('.');
		if (!currentSectionName) {
			return [];
		}
		else if((colonIndex!==-1)&&(cursorCharacter>colonIndex)){

				if((pointIndex!==-1)&&(cursorCharacter==(pointIndex+1))){
					return ALLVALUES.UNITPROPERTY;
				}

				const key = currentLineContent.substring(0, colonIndex).trim();
				let sectionName=currentSectionName;
				sectionName=sectionName.toUpperCase();
				const sectionConfig = ALLSECTIONS[sectionName];
					let keyConfig = null;
					if (sectionConfig) {
						for (const item of sectionConfig) {
							if (item.label === key) {
								keyConfig = item;
								break;
							}
						}
					}
					if (keyConfig) {
						const data = keyConfig.data;
							if (data.includes('bool')) {
								return ALLVALUES.BOOL;
							} else if (data.includes('logicBoolean')) {
								return [...ALLVALUES.LOGICBBOOLEAN, ...ALLVALUES.BOOL,...ALLVALUES.FUNCTION,...ALLVALUES.UNITREF];
							} else if (key.includes('spawnUnits')){
								return [...ALLVALUES.LOGICBBOOLEAN,...ALLVALUES.BOOL,...ALLVALUES.FUNCTION,...ALLVALUES.UNITREF,...ALLVALUES.SPAWNUNIT];
							} else if (data.includes('projectileRef')){
								return [...ALLVALUES.PROJECTILE];
							} else if (data.includes('event')){
								return [...ALLVALUES.EVENTS];
							}
					}
				return [];;
		}
		 else {
		// 根据节名返回相应的补全项
			switch (currentSectionName) {
				case 'core':
					return ALLSECTIONS.CORE;
				case 'graphics':
					return ALLSECTIONS.GRAPHICS;
				case 'attack':
					return ALLSECTIONS.ATTACK;
				case 'movement':
					return ALLSECTIONS.MOVEMENT;
				case 'ai':
					return ALLSECTIONS.AI;
				default:
					if (currentSectionName.startsWith('canBuild_')) {
						return ALLSECTIONS.CANBUILD;
					} else if (currentSectionName.startsWith('turret_')) {
						return ALLSECTIONS.TURRET;
					} else if (currentSectionName.startsWith('projectile_')){
						return ALLSECTIONS.PROJECTILE;
					} else if (currentSectionName.startsWith('arm_')){
						return ALLSECTIONS.ARM;
					} else if (currentSectionName.startsWith('leg_')){
						return ALLSECTIONS.LEG;
					} else if (currentSectionName.startsWith('attachment_')){
						return ALLSECTIONS.ATTACHMENT;
					} else if (currentSectionName.startsWith('effect_')){
						return ALLSECTIONS.EFFECT;
					} else if (currentSectionName.startsWith('animation_')){
						return ALLSECTIONS.ANIMATION;
					} else if (currentSectionName.startsWith('action_')){
						return ALLSECTIONS.ACTION;
					} else if (currentSectionName.startsWith('hiddenAction_')){
						return ALLSECTIONS.ACTION;
					} else if (currentSectionName.startsWith('placementRule_')){
						return ALLSECTIONS.PLACEMENTRULE;
					} else if (currentSectionName.startsWith('resource_')){
						return ALLSECTIONS.RESOURCE;
					} else if (currentSectionName.startsWith('global_resource_')){
						return ALLSECTIONS.RESOURCE;
					} else if (currentSectionName.startsWith('decal_')){
						return ALLSECTIONS.DECAL;
					} else if (currentSectionName.startsWith('commnet_')){
						return [];
					} else if (currentSectionName.startsWith('template_')){
						return ALLSECTIONS.TEMPLATE;
					}
					return [];
			}
		}
		return [];
	});
```

**太长了不爱看?让我们分开来解析一下!**

### 代码功能概述

这段代码是一个用于处理代码补全的函数，通过监听 `connection` 对象的 `onCompletion` 事件，根据用户在文本编辑器中的光标位置和上下文信息，提供相应的代码补全项。具体来说，它会根据当前所在的节（section）、光标位置是否在方括号内或冒号之后等条件，返回不同的补全项数组。

### 代码详细分析

#### 1. 事件监听与回调函数

javascript

```javascript
connection.onCompletion(
    (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
        // 代码主体
    }
);
```

- `connection.onCompletion` 是一个事件监听器，用于监听代码补全请求事件。
- 回调函数接收一个 `TextDocumentPositionParams` 类型的参数 `_textDocumentPosition`，该参数包含了当前文本文件的位置信息。
- 回调函数返回一个 `CompletionItem` 类型的数组，用于提供代码补全项。

#### 2. 获取当前文档

javascript

```javascript
const document = documents.get(_textDocumentPosition.textDocument.uri);
if (!document) {
    return [];
}
```

- 通过 `documents.get` 方法根据当前文本文件的 URI 获取对应的文档对象。
- 如果文档对象不存在，则返回一个空数组，表示没有补全项。

#### 3. 获取当前行号

javascript

```javascript
const cursorLine = _textDocumentPosition.position.line;
```

- 从 `_textDocumentPosition` 参数中获取当前光标的行号。

#### 4. 查找最近的节定义

javascript

```javascript
let currentSectionName = null;
for (let i = cursorLine; i >= 0; i--) {
    const lineStart = document.positionAt(document.offsetAt({ line: i, character: 0 }));
    const lineEnd = document.positionAt(document.offsetAt({ line: i + 1, character: 0 }) - 1);
    const lineContent = document.getText({ start: lineStart, end: lineEnd }).trim();

    const sectionMatch = lineContent.match(/^\[(.+)\]$/);
    if (sectionMatch) {
        currentSectionName = sectionMatch[1];
        break;
    }
}
```

- 从当前行开始向上遍历，查找最近的一个节定义（以 `[节名]` 形式表示）。
- 使用正则表达式 `/^\[(.+)\]$/` 匹配节定义，如果匹配成功，则将节名存储在 `currentSectionName` 变量中，并跳出循环。

#### 5. 获取当前光标位置和行内容

javascript

```javascript
const cursorCharacter = _textDocumentPosition.position.character;
const lineStart = document.positionAt(document.offsetAt({ line: cursorLine, character: 0 }));
const lineEnd = document.positionAt(document.offsetAt({ line: cursorLine + 1, character: 0 }) - 1);
const currentLineContent = document.getText({ start: lineStart, end: lineEnd });
```

- 获取当前光标的列号 `cursorCharacter`。
- 获取当前行的起始位置和结束位置，并提取当前行的内容 `currentLineContent`。

#### 6. 判断光标是否在方括号内

javascript

```javascript
const openBracketIndex = currentLineContent.lastIndexOf("[", cursorCharacter);
const closeBracketIndex = currentLineContent.indexOf("]", cursorCharacter);
const isInsideBrackets =
    openBracketIndex !== -1 && (closeBracketIndex === -1 || openBracketIndex > closeBracketIndex);

if (isInsideBrackets) {
    return SECTIONSNAME;
}
```

- 使用 `lastIndexOf` 和 `indexOf` 方法分别查找当前行中最后一个左方括号和第一个右方括号的位置。
- 根据左方括号和右方括号的位置判断光标是否在方括号内。
- 如果光标在方括号内，则返回 `SECTIONSNAME` 数组作为补全项。

#### 7. 判断光标是否在冒号之后

javascript

```javascript
const colonIndex = currentLineContent.indexOf(":");
const pointIndex = currentLineContent.indexOf(".");
if (!currentSectionName) {
    return [];
} else if (colonIndex !== -1 && cursorCharacter > colonIndex) {
    if (pointIndex !== -1 && cursorCharacter == pointIndex + 1) {
        return ALLVALUES.UNITPROPERTY;
    }

    const key = currentLineContent.substring(0, colonIndex).trim();
    let sectionName = currentSectionName;
    sectionName = sectionName.toUpperCase();
    const sectionConfig = ALLSECTIONS[sectionName];
    let keyConfig = null;
    if (sectionConfig) {
        for (const item of sectionConfig) {
            if (item.label === key) {
                keyConfig = item;
                break;
            }
        }
    }
    if (keyConfig) {
        const data = keyConfig.data;
        if (data.includes("bool")) {
            return ALLVALUES.BOOL;
        } else if (data.includes("logicBoolean")) {
            return [
                ...ALLVALUES.LOGICBBOOLEAN,
                ...ALLVALUES.BOOL,
                ...ALLVALUES.FUNCTION,
                ...ALLVALUES.UNITREF,
            ];
        } else if (key.includes("spawnUnits")) {
            return [
                ...ALLVALUES.LOGICBBOOLEAN,
                ...ALLVALUES.BOOL,
                ...ALLVALUES.FUNCTION,
                ...ALLVALUES.UNITREF,
                ...ALLVALUES.SPAWNUNIT,
            ];
        } else if (data.includes("projectileRef")) {
            return [...ALLVALUES.PROJECTILE];
        } else if (data.includes("event")) {
            return [...ALLVALUES.EVENTS];
        }
    }
    return [];
}
```

- 查找当前行中冒号和点号的位置。
- 如果没有找到节名，则返回一个空数组。
- 如果光标在冒号之后，进一步判断：
    - 如果光标在点号之后，则返回 `ALLVALUES.UNITPROPERTY` 数组作为补全项。
    - 提取冒号之前的键名，并将节名转换为大写。
    - 根据节名从 `ALLSECTIONS` 对象中获取对应的配置信息。
    - 在配置信息中查找与键名匹配的项。
    - 根据匹配项的 `data` 属性，返回不同的补全项数组。

#### 8. 根据节名返回补全项

javascript

```javascript
else {
    switch (currentSectionName) {
        case 'core':
            return ALLSECTIONS.CORE;
        case 'graphics':
            return ALLSECTIONS.GRAPHICS;
        case 'attack':
            return ALLSECTIONS.ATTACK;
        case 'movement':
            return ALLSECTIONS.MOVEMENT;
        case 'ai':
            return ALLSECTIONS.AI;
        default:
            if (currentSectionName.startsWith('canBuild_')) {
                return ALLSECTIONS.CANBUILD;
            } else if (currentSectionName.startsWith('turret_')) {
                return ALLSECTIONS.TURRET;
            } else if (currentSectionName.startsWith('projectile_')) {
                return ALLSECTIONS.PROJECTILE;
            } else if (currentSectionName.startsWith('arm_')) {
                return ALLSECTIONS.ARM;
            } else if (currentSectionName.startsWith('leg_')) {
                return ALLSECTIONS.LEG;
            } else if (currentSectionName.startsWith('attachment_')) {
                return ALLSECTIONS.ATTACHMENT;
            } else if (currentSectionName.startsWith('effect_')) {
                return ALLSECTIONS.EFFECT;
            } else if (currentSectionName.startsWith('animation_')) {
                return ALLSECTIONS.ANIMATION;
            } else if (currentSectionName.startsWith('action_')) {
                return ALLSECTIONS.ACTION;
            } else if (currentSectionName.startsWith('hiddenAction_')) {
                return ALLSECTIONS.ACTION;
            } else if (currentSectionName.startsWith('placementRule_')) {
                return ALLSECTIONS.PLACEMENTRULE;
            } else if (currentSectionName.startsWith('resource_')) {
                return ALLSECTIONS.RESOURCE;
            } else if (currentSectionName.startsWith('global_resource_')) {
                return ALLSECTIONS.RESOURCE;
            } else if (currentSectionName.startsWith('decal_')) {
                return ALLSECTIONS.DECAL;
            } else if (currentSectionName.startsWith('commnet_')) {
                return [];
            } else if (currentSectionName.startsWith('template_')) {
                return ALLSECTIONS.TEMPLATE;
            }
            return [];
    }
}
```

- 如果光标不在方括号内也不在冒号之后，则根据节名返回不同的补全项数组。
- 使用 `switch` 语句处理一些常见的节名，如 `core`、`graphics` 等。
- 对于以特定前缀开头的节名，也返回相应的补全项数组。
- 如果节名不匹配任何条件，则返回一个空数组。

#### 9. 默认返回值

javascript

```javascript
return [];
```

- 如果以上所有条件都不满足，则返回一个空数组，表示没有补全项。

### 总结

写的我有点神游了,本来想any一把梭的,但是想了想还是规范一下吧.
造轮子果然很难,但写完之后用轮子方便了不少,感慨那些写代码提示的人有多辛苦
这学期要学**编译原理**,**汇编语言**,不知道这对我的插件开发会不会有更好的帮助呢?
