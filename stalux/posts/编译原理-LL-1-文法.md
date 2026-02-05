---
title: 编译原理:LL(1)文法
abbrlink: 23217
date: 2025-03-26 16:19:06+00:00
updated: "2025-07-04T18:44:32.356+08:00"
categories:
  - 学校学习
tags:
  - 学习
  - 记录
  - 编译原理
---

## S\_文法

:::tip

S\_文法(简单的确定性文法)

每个产生式的右部都以终结符开始

同一非终结符的各个候选式的首终结符都不同

S\_文法不含$\varepsilon$产生式

:::

<!--more-->

### 非终结符的后继符号集

可能在某个句型中,紧跟在A后边的终结符a的集合,记为*FOLLOW(A)*
$\\FOLLOW(A) = \{a| S \Rightarrow {}^*\alpha Aa \beta.a \in V_T,\alpha , \beta \in (V_T \cup V_N )^* \}$

:::info
如果A是某个句型的最右符号,则将结束符"$"添加到FOLLOW(A)中
:::

### 产生式的可选集

产生式$A \rarr \beta $ 的可选集是指可以选用该产生式进行推导时对应的输入符号的集合,记为$SELECT(A \rarr \beta)$

> $SELECT(A \rarr a\beta  ) = \{ a \}$
> $SELECT(A \rarr \varepsilon ) = FOLLOW(A)$

## q\_文法

- 每个产生式的右部或为 $\varepsilon$ ,或以终结符开始
- 具有相同左部的产生式有不相交的可选集
  - q\_文法不含右部以非终结符打头的产生式

---

### 串首终结符

串首第一个符号,并且是终结符,简称首终结符
给定一个文法符号 $\alpha $ ,$\alpha $的串首终结符集$FIRST(\alpha)$
被定义为可以从$\alpha $推导出的所有串首终结符构成的集合.如果$\alpha \Rightarrow {}^\* \varepsilon $
那么$varepsilon$也在$FIRST(\alpha)$中

对于 $∀α∈(V_T∪V_N)^+，FIRST(α)= {a | α ⇒* aβ，a ∈ V_T，β∈(V_T∪V_N)^*}$；

如果 $α ⇒* ε，那么 ε∈FIRST(α)$

产生式 A→α 的可选集 SELECT

- 如果 $ε∉FIRST(α)，那么 SELECT(A→α)= FIRST(α)$
- 如果 $ε∈FIRST(α)，那么 SELECT(A→α)= (FIRST(α)-{ε})∪FOLLOW(A)$

## LL(1)文法

文法G是LL(1)的,当且仅当G的任意两个具有相同左部的产生式$A \rarr \alpha|\beta$ 满足下面的条件

- 如果$\alpha 和 \beta 均不能推导出 \varepsilon $,则 $FIRST(\alpha) \cap FIRST(\beta) = \emptyset $
- $ \alpha 和 \beta $至多有一个能推导出 $\varepsilon$
- 如果 $\beta \Rightarrow {}^* \varepsilon $.则$FIRST(\alpha)\cup FOLLOW(A) = \emptyset $
- 如果 $\alpha \Rightarrow {}^* \varepsilon $.则$FIRST(\beta)\cup FOLLOW(A) = \emptyset $

:::tip

同一非终结符的各个产生式的**可选集互不相交**
:::

- 第一个L表示从左向右扫描输入
- 第二个L表示产生最左推导
- 1表示在每一步中只需要向前看一个输入符号来决定语法分析动作
