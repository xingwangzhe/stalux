---
title: hexo-graph:新增分类树状图
abbrlink: 42695
date: 2025-01-02 18:56:17
updated: 2025-07-04 18:44:32
categories:
    - 开发
tags:
    - 学习
    - 记录
    - hexo
    - 数据结构
    - 算法
---

应该算是技术债：（

<!--more-->

## 起因

## issuse:分类跳转错误

[[bug]Category图表，如果点击的对象并不是最高级Category，而是次级Category，跳转链接的路径拼接就有问题。 · Issue #7 · codepzj/hexo-graph](https://github.com/codepzj/hexo-graph/issues/7)

问题代码出现在这一行

```javascript
categoriesChart.on("click", function (params) {
    window.location.href = "/categories/" + params.name;
});
```

很显然，当时我考虑的链接拼接有点草率了，忘记分类具有嵌套结构了。
这就会导致默认每个分类都是顶级分类，但实际上却不存在对应链接，这会导致404.于是我着手准备fix bugs

## 过程

## 验证分类嵌套结构

我好奇究竟具体是什么样的嵌套，于是用`console.log()`试了一下
![2025-01-02-140650](https://i.ibb.co/8KJr64m/2025-01-02-140650.webp)

> 虽然链接表现出来的是嵌套结构，但是实际上的对象是数组，欸我去，关键点在于`_id`和`parent`两个属性，显然`parent`对应的值是父级分类`_id`属性，脑海里想到哈希，但是，我想到一个问题
> a与a->b与b这三个分类中，最中间的嵌套和最后一个的分类会出现明显混淆，在柱状图显示的话，根本不能确定是跳转到`/categories/a/b/`还是`categories/b/`，尽管两者表现名称是一样的。

## 放弃原有，但保留结构，开辟新图

很明显，这种嵌套结构，非常适合树状结构。但实际上的一篇文章的分类是数组结构(我认为是平铺展开)，看来得动手改一下了

### 建个对象

```javascript
const categoryTree = {
    name: hexo.config.title || "Categories",
    children: [],
    count: 0,
    path: "",
};
```

> 根节点肯定是博客名，或者分类(应该没人不起博客名字吧：)

### 遍历文章的时候，遍历分类

```javascript
if (post.categories.length > 0) {
    let current = categoryTree;
    let path = "";
    post.categories.data.forEach((category, index) => {
        path = path ? `${path}/${category.name}` : `${category.name}`;
        let found = false;
        if (!current.children) {
            current.children = [];
        }
        // 找到现有的分类
        for (let child of current.children) {
            if (child.name === category.name) {
                child.count += 1;
                current = child;
                found = true;
                break;
            }
        }
        // 创建新的分类
        if (!found) {
            let newNode = {
                name: category.name,
                children: [],
                count: 1,
                path: path,
            };
            current.children.push(newNode);
            current = newNode;
        }
    });
}
```

### 添加

先主函数添加一下要返回的html

```javascript
`
    ....
    ${generateCategoriesTreeChart(categoryTree, darkMode, colorPalette)}
    `;
```

接着就是Echarts树状图的具体实现，可以在Echarts官网找到示例，照抄，然后具体写一下功能样式就行：）

```javascript
function generateCategoriesTreeChart(categoryTree, darkMode, colors) {
    const data = JSON.stringify([categoryTree]); //只有一个根节点，就是博客标题
    return `
        <script>
            const treeChart = echarts.init(document.getElementById('categoriesTreeChart'), '${darkMode}');
            treeChart.setOption({
                title: {
                    text: '操作提示：单击展开分类，双击进入具体分类页面',
                    textStyle: {
                        fontSize: 12,
                        color: '#999',
                        fontWeight: 'normal'
                    },
                    bottom: 0,
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    triggerOn: 'mousemove'
                },
                series: [{
                    type: 'tree',
                    data: ${data},
                    initialTreeDepth: -1,    // 默认展开所有节点
                    top: '5%',           // 调整上边距
                    bottom: '5%',       // 调整下边距，为提示文字留出更多空间
                    left: '0%',          // 调整左边距
                    right: '0%',        // 调整右边距
                    symbolSize: 15,      // 增大节点大小
                    layout: 'orthogonal',// 使用正交布局
                    orient: 'TB',        // 从左到右布局
                    itemStyle: {
                        color: '${colors.categoryColors[0]}',
                        borderColor: '${colors.categoryColors[1]}'
                    },
                    label: {
                        position: 'bottom',
                        verticalAlign: 'middle',
                        align: 'center',
                        fontSize: 14,    // 增大字体
                        distance: 28,    // 标签与节点的距离
                        formatter: function(params) {
                            return params.data.name + (params.data.count ? ' (' + params.data.count + ')' : '');
                        }
                    },
                    leaves: {
                        label: {
                            position: 'top',
                            verticalAlign: 'middle',
                            align: 'center'
                        }
                    },
                    emphasis: {
                        focus: 'descendant'
                    },
                    expandAndCollapse: true,
                    animationDuration: 550,
                    animationDurationUpdate: 750,
                    lineStyle: {
                        width: 1.5,      // 增加线条宽度
                        curveness: 0.5
                    },
                    nodeAlign: 'justify',// 节点对齐方式
                    levelStep: 200       // 增加层级间距
                }]
            });
            let lastClickTime = 0;
            let timer = null;
            treeChart.on('click', function (params) {
                const currentTime = new Date().getTime();
                const timeDiff = currentTime - lastClickTime;
                
                // 清除之前的定时器
                if (timer) {
                    clearTimeout(timer);
                }
                // 如果两次点击间隔小于300ms，认为是双击
                if (timeDiff < 300) {
                    // 双击事件 - 跳转链接
                    if (params.data.path) {
                        window.location.href = '/categories/' + params.data.path;
                    }
                } else {
                    // 单击事件 - 设置延时以区分双击
                    timer = setTimeout(() => {
                        // 获取当前节点的展开状态
                        const expandedNodes = treeChart.getOption().series[0].data[0];
                        // 使用路径查找节点
                        const currentNode = findNodeByPath(expandedNodes, params.data.path || '');
                        if (currentNode) {
                            // 切换展开/收起状态
                            currentNode.collapsed = !currentNode.collapsed;
                            // 更新图表
                            treeChart.setOption({
                                series: [{
                                    data: [expandedNodes]
                                }]
                            });
                        }
                    }, 300);
                }
                
                lastClickTime = currentTime;
            });
            // 使用路径查找节点的新函数
            function findNodeByPath(tree, targetPath) {
                if (!targetPath) return null;
                
                // 如果是根节点
                if (tree.path === targetPath) {
                    return tree;
                }
                // 递归查找子节点
                if (tree.children) {
                    for (let child of tree.children) {
                        const found = findNodeByPath(child, targetPath);
                        if (found) return found;
                    }
                }
                return null;
            }
        </script>
    `;
}
```
