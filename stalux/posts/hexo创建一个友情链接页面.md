---
title: hexo创建一个友情链接页面
abbrlink: 62fedd1e
date: 2024-09-14 19:16:27
updated: 2024-09-14 19:16:29
categories:
    - hexo
tags:
    - 教程
    - 记录
    - hexo
---

尽管hexo自带links功能，但是这样看起来单一无趣，那么为了改善友链，我们可以自定义一个页面

<!--more-->

## 创建新页面

找到你的本地博客位置，输入
`hexo new page 友情链接`
你的本地博客目录就会出现`blog\source\友情与链接\index.md`
打开文件
发现空空如也

```md
---
title: 友情与链接
date: 2024-09-12 20:35:40
---
```

## 添加代码

如下一大长串

```md
---
title: 友情与链接
date: 2024-09-12 20:35:40
---

## **友情链接**

<div class="post-body">
   <div id="links">
      <style>
         .links-content{
         margin-top:1rem;
         }
         .link-navigation::after {
         content: " ";
         display: block;
         clear: both;
         }
         .card {
         width: 45%;
         font-size: 1rem;
         padding: 10px 20px;
         border-radius: 4px;
         transition-duration: 0.15s;
         margin-bottom: 1rem;
         display:flex;
         }
         .card:nth-child(odd) {
         float: left;
         }
         .card:nth-child(even) {
         float: right;
         }
         .card:hover {
         transform: scale(1.1);
         box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.12), 0 0 6px 0 rgba(0, 0, 0, 0.04);
         }
         .card a {
         border:none;
         }
         .card .ava {
         width: 3rem!important;
         height: 3rem!important;
         margin:0!important;
         margin-right: 1em!important;
         border-radius:4px;
         }
         .card .card-header {
         font-style: italic;
         overflow: hidden;
         width: 100%;
         }
         .card .card-header a {
         font-style: normal;
         color: #2bbc8a;
         font-weight: bold;
         text-decoration: none;
         }
         .card .card-header a:hover {
         color: #d480aa;
         text-decoration: none;
         }
         .card .card-header .info {
         font-style:normal;
         color:#a3a3a3;
         font-size:14px;
         min-width: 0;
         overflow: hidden;
         white-space: nowrap;
         }
      </style>
      <div class="links-content">
         <div class="link-navigation">
            <div class="card">
                  <img class="ava" src="https://xingwangzhe.fun/avatar.webp" alt="1" />
               <div class="card-header">
                  <div>
                     <a href="https://xingwangzhe.github.io">xingwangzhe</a>
                  </div>
                  <div class="info">记录学习生活的琐事，或者技术文章:)</div>
               </div>
            </div>
            <div class="card">
                  <img class="ava" src="https://xingwangzhe.fun/avatar.webp" alt="1" />
               <div class="card-header">
                  <div>
                     <a href="https://xingwangzhe.github.io">xingwangzhe</a>
                  </div>
                  <div class="info">记录学习生活的琐事，或者技术文章:)</div>
               </div>
            </div>
         </div>
      </div>
   </div>
</div>
</section>
</body>
```

## 关键代码

```md
           <div class="card">
               <img class="ava" src="https://xingwangzhe.github.io/images/avatar.jpg" alt="123" />
               <--双引号里是网站图标，你可以通过F12在<head></head>之间找到-->
               <div class="card-header">
                  <div>
                     <a href="https://xingwangzhe.github.io">xingwangzhe</a>
                     <--双引号里面是网站链接，后面的文本是标题-->
                  </div>
                  <div class="info">记录学习生活的琐事，或者技术文章:)</div>
                  <--这段文本是网站描述-->
               </div>
            </div>
```

你可以通过多次重复使用这些代码来实现添加友链的效果

## 效果如下

## **友情链接**

<div class="post-body">
   <div id="links">
      <style>
         .links-content{
         margin-top:1rem;
         }
         .link-navigation::after {
         content: " ";
         display: block;
         clear: both;
         }
         .card {
         width: 45%;
         font-size: 1rem;
         padding: 10px 20px;
         border-radius: 4px;
         transition-duration: 0.15s;
         margin-bottom: 1rem;
         display:flex;
         }
         .card:nth-child(odd) {
         float: left;
         }
         .card:nth-child(even) {
         float: right;
         }
         .card:hover {
         transform: scale(1.1);
         box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.12), 0 0 6px 0 rgba(0, 0, 0, 0.04);
         }
         .card a {
         border:none;
         }
         .card .ava {
         width: 3rem!important;
         height: 3rem!important;
         margin:0!important;
         margin-right: 1em!important;
         border-radius:4px;
         }
         .card .card-header {
         font-style: italic;
         overflow: hidden;
         width: 100%;
         }
         .card .card-header a {
         font-style: normal;
         color: #2bbc8a;
         font-weight: bold;
         text-decoration: none;
         }
         .card .card-header a:hover {
         color: #d480aa;
         text-decoration: none;
         }
         .card .card-header .info {
         font-style:normal;
         color:#a3a3a3;
         font-size:14px;
         min-width: 0;
         overflow: hidden;
         white-space: nowrap;
         }
      </style>
      <div class="links-content">
         <div class="link-navigation">
            <div class="card">
               <img class="ava" src="https://xingwangzhe.fun/avatar.webp" alt="1" />
               <div class="card-header">
                  <div>
                     <a href="https://xingwangzhe.github.io">xingwangzhe</a>
                  </div>
                  <div class="info">记录学习生活的琐事，或者技术文章:)</div>
               </div>
            </div>
            <div class="card">
               <img class="ava" src="https://xingwangzhe.fun/avatar.webp" alt="1" />
               <div class="card-header">
                  <div>
                     <a href="https://xingwangzhe.github.io">xingwangzhe</a>
                  </div>
                  <div class="info">记录学习生活的琐事，或者技术文章:)</div>
               </div>
            </div>
         </div>
      </div>
   </div>
</div>
</section>
</body>

## 别忘了这是markdown.md

你可以自定义后续的内容：）

## 参考推荐

[Hexo个人博客自定义友链页面](https://enfangzhong.github.io/2019/12/08/Hexo%E4%B8%AA%E4%BA%BA%E5%8D%9A%E5%AE%A2%E8%87%AA%E5%AE%9A%E4%B9%89%E5%8F%8B%E9%93%BE%E9%A1%B5%E9%9D%A2/)
[hexo NexT 添加友链页面](https://wangjiezhe.com/posts/2021-03-30-add-link-page/?highlight=%E5%8F%8B)
