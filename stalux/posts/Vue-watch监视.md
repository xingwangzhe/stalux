---
title: Vue:watch监视
abbrlink: b0f770c3
date: 2024-09-30 21:19:04+00:00
updated: '2024-09-30 21:19:06'
categories:
- 前端
tags:
- Vue3
- 前端
- 记录
---

*👁️👁️watching you!👁️👁️*
<!--more-->

#watch监视属性方法

## 情况一
对ref基础类型的监视

这个很容易理解
```ts
<script setup lang="ts">  
import { ref,watch} from 'vue';  
let num2 = ref('0'); // 用于存储二进制字符串  
watch(num2,(newvalue,oldvalue)=>{
    console.log(num2+'和新数据'+newvalue+'和旧数据'+oldvalue);
})
</script>  
```
多次改变`num2`，打印的结果是这样的
```
[object Object]和新数据和旧数据0
Change.vue:19 [object Object]和新数据1111011和旧数据
Change.vue:19 [object Object]和新数据11110000101101001和旧数据1111011
Change.vue:19 [object Object]和新数据1和旧数据11110000101101001
```
这确实不难理解

## 情况二
对ref对象数据的监视
>这不禁让我们思考，对ref对象的监视是对它的什么进行监视呢？它类里面的数据吗？还是说它本身？
让我们测试一下
```ts
let person=ref({
    name:'李四',
    age:30
})
watch(num2,(newvalue,oldvalue)=>{
    console.log(num2+'和新数据'+newvalue+'和旧数据'+oldvalue);
})
function changeAge(){
    person.value.age++;
}
function changeName(){
    person.value.name+='~';
}
function changePerson(){
    person.value={
        name:'王二',
        age:90
    }
}
watch(person,(newvalue,oldvalue)=>{
    console.log(newvalue+'和'+oldvalue);
})

```
实际上，只有第三个方法触发了监视，这意味着
监视ref定义的对象数据，实际监视的是它的地址值，但是如果我们想要监视它内部的值呢？这时候就需要`深度监视`
```ts
watch(person,(newvalue,oldvalue)=>{
    console.log(newvalue+'和'+oldvalue);
},{deep:true})

```
## 情况三
`reactive`定义的对象类型数据，默认是深度监视，
这里懒得示例了：）
>newvalue和oldvalue打印出来是一样的，这是因为地址没有变

## 情况四

监视`ref`和`reactive`定义的对象数据类型中的属性:
若属性不是对象类型，需要写成函数形式
若属性是对象类型，可以直接编，或者写函数，但是建议写函数

