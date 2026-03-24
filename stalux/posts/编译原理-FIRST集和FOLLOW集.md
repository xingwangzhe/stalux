---
title: 编译原理:FIRST集和FOLLOW集
abbrlink: 8237
date: "2025-03-27 09:01:02"
updated: "2025-07-04 18:44:32"
categories:
    - 学校学习
tags:
    - 学习
    - 记录
    - 编译原理
---

## FIRST集

1

FIRST(X): 可以从X推导出的所有**串首终结符**构成的集合

如果$X \Rightarrow {}^* \varepsilon$.那么 $\varepsilon \in FIRST(X) $

例

$$
\begin{align*}
\textcircled{1} &\ E \to TE' & \text{FIRST}(E) &= \lbrace (, \text{id} \rbrace \\
\textcircled{2} &\ E' \to +TE' \mid \varepsilon & \text{FIRST}(E') &= \lbrace +, \varepsilon \rbrace \\
\textcircled{3} &\ T \to FT' & \text{FIRST}(T) &= \lbrace (, \text{id} \rbrace \\
\textcircled{4} &\ T' \to *FT' \mid \varepsilon & \text{FIRST}(T') &= \lbrace *, \varepsilon \rbrace \\
\textcircled{5} &\ F \to (E) \mid \text{id} & \text{FIRST}(F) &= \lbrace (, \text{id} \rbrace
\end{align*}
$$

### 算法

<!--more-->

不断应用下列规则，直到没有新的终结符或 ε 可以被加入到任何 `FIRST` 集合中为止
▶ 如果 `X` 是一个终结符，那么 `FIRST(X) = {X}`
▶ 如果 `X` 是一个非终结符，且 `X→Y₁…Yₖ ∈ P（k≥1）`，那么：

- 如果对于某个 `i`，`a` 在 `FIRST(Yᵢ)` 中，且 `ε` 在所有的 `FIRST(Y₁), …, FIRST(Yᵢ₋₁)` 中（即 `Y₁…Yᵢ₋₁ ⇒* ε`），就把 `a` 加入到 `FIRST(X)` 中。
- 如果对于所有的 `j = 1, 2, …, k`，`ε` 在 `FIRST(Yⱼ)` 中，那么将 `ε` 加入到 `FIRST(X)` 中。
  ▶ 如果 `X→ε ∈ P`，那么将 `ε` 加入到 `FIRST(X)` 中

### 计算$串X_1X_2..X_n$的FIRST集合

向$FIRST(X_1X_2X_3...X_n)加入FIRST(X_1)$中所有的非 $\varepsilon$符号

如果 $\varepsilon$ 在$FIRST(X_1)$中,再加入$FIRST(X_2)$中的所有非 $\varepsilon$符号;

如果 $\varepsilon$ 在$FIRST(X_1)$和$FIRST(X_2)$中,再加入$FIRST(X_3)$中的所有非$\varepsilon$符号,以此类推

## FOLLOW集

FOLLOW(A):可能在某个句型中,紧跟在A后边的非终结符a的集合

例

$$
\begin{array}{lcl}
\textcircled{1} & E \to TE' & \text{FIRST}(E) = \{ (, \text{id} \} \quad \text{FOLLOW}(E) = \{ \#, ) \}\\
\textcircled{2} & E' \to +TE' \mid \varepsilon & \text{FIRST}(E') = \{ +, \varepsilon \} \quad \text{FOLLOW}(E') = \{ \#, ) \}\\
\textcircled{3} & T \to FT' & \text{FIRST}(T) = \{ (, \text{id} \} \quad \text{FOLLOW}(T) = \{ +, \#, ) \}\\
\textcircled{4} & T' \to *FT' \mid \varepsilon & \text{FIRST}(T') = \{ *, \varepsilon \} \quad \text{FOLLOW}(T') = \{ +, \#, ) \}\\
\textcircled{5} & F \to (E) \mid \text{id} & \text{FIRST}(F) = \{ (, \text{id} \} \quad \text{FOLLOW}(F) = \{ *, +, \#, ) \}
\end{array}
$$
