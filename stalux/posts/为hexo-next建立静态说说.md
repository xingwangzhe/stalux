---
title: 为hexo-next建立静态说说
abbrlink: f513b372
date: 2024-09-20 17:22:58
updated: 2024-09-20 17:23:00
categories:
    - hexo
tags:
    - 记录
    - 教程
    - hexo
---

曾经考虑使用Artitalk,但由于网络原因以及github无法备案等原因，暂时放弃，转而使用静态方法写说说
![123](https://i.ibb.co/1tsjzQCK/123.png)

<!--more-->

## 改改改

## 新建essay.swig

在 `hexo/themes/next/layout/` 下创建 essay.swig 并写入以下内容

```css

    {##################}
    {### ESSAY BLOCK ###}
    {##################}

<style>
#bber * {
  box-sizing: border-box;
}
ul#waterfall {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    list-style: none;
    margin: 0;
    padding: 0;
}
li.item {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-end;
    align-items: flex-start;
    border: 1px solid #e3e8f7;
    padding: 20px;
    margin: 10px;
    flex-basis: 100%;
    border-radius: 12px;
}
.bber-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
}
div#bber-tips {
    display: flex;
    justify-content: center;
}
#bber p {
  margin: 0px;
  padding: 0px;
}
.item hr {
  border: 1px dashed #4259ef23;
  height: 0px;
  margin: 8px 0px;
  display: flex;
  width: 100%;
}
.bber-container-img {
    display: flex;
    gap: 3px;
    margin-bottom: 3px;
}
a.fancybox {
    flex: 1;
}
.bber-info, .bber-info-time, .bber-content-link {
    display: inline-block;
}
.bber-content-link {
    margin-left: 15px;
}
.bber-bottom {
    width: 100%;
}
.bber-info-time, .bber-content-link {
    background-color: rgba(153,153,153,0.169);
    border-radius: 20px;
    padding: 0 8px;
    font-size: .9rem;
    color: var(--text-color);
}
</style>

<div id="bber">
  <section class="timeline page-1">
    <ul id="waterfall" class="list">
      {% for i in site.data.essay %}
        {% for item in i.essay_list %}
            <li class="item">
              <div class="bber-content">
                <p class="datacont">{{ item.content }}</p>
                {% if item.image %}
                  <div class="bber-container-img">
                    {% for indey in item.image %}
                      <img src="{{ indey }}" style="margin-bottom: 0px;" alt="miaoshu"/>
                    {% endfor %}
                  </div>
                {% endif %}
              </div>
              <hr>
              <div class="bber-bottom">
                <div class="bber-info">
                  <div class="bber-info-time">
                    <i class="far fa-clock"></i>
                    <time class="datatime" datetime="{{ item.date }}">{{ date(item.date, "YYYY/M/D") }}</time>
                  </div>
                  {% if item.link %}
                    <a href="{{ item.link }}" class="bber-content-link" target="_blank" title="跳转到短文指引的链接">
                      <i class="fas fa-link"></i>
                      链接
                    </a>
                  {% endif %}
                </div>
              </div>
            </li>
        {% endfor %}
      {% endfor %}
    </ul>
  </section>
</div>

    {######################}
    {### END ESSAY BLOCK ###}
    {######################}

```

## 修改page.swig

然后打开 `hexo/themes/next/layout/`page.swig在 {% block title %}{% endblock %} 内的 (%- else %) 前添加

```css
{%- elif page.type === 'essay' and not page.title %}
    {{- __('title.essay') + page_title_suffix }}
```

然后在下面的 block content 里的 PAGE BODY 内的 (% else %) 前，插入

```css
{% elif page.type === 'essay' %}
  {%- include 'essay.njk' -%}
```

> 注意对齐格式

## 创建essay.yml

然后在 `hexo/source/_data/` 下创建 essay.yml，写入以下内容

```yml
- class_name: 说说
  essay_list:
      - content: #（必须）内容
        date: #（必须）日期 格式：年-月-日（月与日必须是 2 位数，如2024年3月9号为 2024-03-09）
        link: #（可选）链接，可以在下方插入一条链接
        image: #（可选），插入图片，可插入多张，写法如下，注意缩进
            -  #图片路径
            -  #图片路径
            -  #图片路径
      - content:
        date:
      - content:
        date:
```

## 创建页面

运行

```
hexo new page essay
```

其会创建 `hexo/source/essay/index.md`文件
设置标题日期，type 要设置为 "essay"

```md
---
title: 说来亦无妨
type: "essay"
date: 2024-09-19 17:22:12
---
```

> 注意，如果你想在说说页面添加自己的样式，请修改essay.yml文件，修改index.md文件不会产生效果

## 在侧边栏添加说说

打开`hexo\themes\next\_config.yml`在menu处添加

```
说说: /essay/ || fas fa-pen
```

这样侧边栏会显示说说

## 后续更新

在 hexo/source/\_data/essay.yml 更新内容就可以了，需要注意的是，内容的先后顺序与渲染出来的结果是一致的，即越写在上面的，在渲染结果中也就越排在上方

```
- content: 因为在最上面，所以网页中在最上方
  date: 2024-03-09
- content: 因为排在下方，所以网页中排在后面
  date: 2024-03-09

```

## 参考

[Next 主题添加说说](https://blog.fufu.ink/2024/04/nextaddessay.html)
