---
title: Vue:计算属性
abbrlink: ffe80f36
date: 2024-09-29 18:19:17+00:00
updated: "2024-09-29 18:19:19"
categories:
  - 前端
tags:
  - Vue3
  - 前端
  - 记录
---

_默认只读_

<!--more-->

## 我们为什么需要计算属性

```html
全名：<span>{{firstName + '-' + lastName}}</span><br />
```

vue官方不建议我们在模板这么写，这看起来过于 **复杂**

## 示例代码

```html
<template>
  <div class="person">
    姓：<input type="text" v-model="firstName" /> <br />
    名：<input type="text" v-model="lastName" /> <br />
    全名：<span>{{fullName}}</span><br />
    <button @click="changeName">修改姓名</button>
    <!-- 全名 <span>{{firstName}}-{{lastName}}</span> <br> -->
  </div>
</template>

<script setup lang="ts" name="Personsss">
  import { computed, ref } from "vue";
  let firstName = ref("章");
  let lastName = ref("礼");
  let fullName = computed(
    () => firstName.value.slice(0, 1).toUpperCase() + firstName.value.slice(1) + lastName.value,
  );
</script>
```

首先我们需要导入`computed`
然后使用这个计算属性定义`fullName`
通过这个方法，使得模板变得简易，可读性变高

## 计算属性默认只可读

事实上如果我在里面定义一个函数

```js
function changeName() {
  fullName.value = "李四";
}
```

这个`changeName`函数会报错
`无法为“value”赋值，因为它是只读属性。`
这是计算属性的只读特性

## 如何修改？

如果想要修改计算属性的值，我们需要`get`和`set`方法

例如
来自于[vue官方文档](https://cn.vuejs.org/guide/essentials/computed.html)

```html
<script setup>
  import { ref, computed } from "vue";

  const firstName = ref("John");
  const lastName = ref("Doe");

  const fullName = computed({
    // getter
    get() {
      return firstName.value + " " + lastName.value;
    },
    // setter
    set(newValue) {
      // 注意：我们这里使用的是解构赋值语法
      [firstName.value, lastName.value] = newValue.split(" ");
    },
  });
</script>
```

你发现了吗，这种修改本质上还是修改了`firstName`和`lastName`,那我们不禁想到，为什么我们不直接修改这两个的值，来实现通过计算属性更新`fullName`的值呢？

### 官方推荐

正如官方文档所言
**_避免直接修改计算属性值​_**
从计算属性返回的值是派生状态。可以把它看作是一个“临时快照”，每当源状态发生变化时，就会创建一个新的快照。更改快照是没有意义的，因此计算属性的返回值应该被视为只读的，并且永远不应该被更改——应该更新它所依赖的源状态以触发新的计算。

所以，这种只读属性是必然的，我们完全可以通过修改那两个值实现计算属性的值的更新！
