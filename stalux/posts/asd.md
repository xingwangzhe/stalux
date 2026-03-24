---
title: LeetCode:2. 两数相加
abbrlink: f899f771
date: "2024-09-22 21:08:27"
updated: "2024-10-15 21:08:44"
categories:
    - 算法题
tags:
    - LeetCode
    - 算法题
    - java
    - 记录
    - 教程
---

_两数相加_

<!--more-->

## 前置声明

> ## <div style="text-align: center;"> LeetCode所有题目版权均归 LeetCode 和 力扣中国 所有</div><div style="text-align: center;"> 本文仅提题解与思路，详情请访问官网查看 </div>
>
> ---
>
> <center>
>
> [![LeetCode Logo](https://leetcode.cn/favicon.ico)][2]
>
> </center>
> <center>
>
> [两数相加][2]
>
> </center>
>
> [2]: https://leetcode.cn/problems/add-two-numbers/

## O(n)复杂度

按题意来，两个链遍历，取个位，进十位就行了。

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode p = new ListNode(0);
        ListNode cur = p;
        int pp = 0;
        while (l1 != null || l2 != null || pp != 0) {
            int s1 = l1 != null ? l1.val : 0;
            int s2 = l2 != null ? l2.val : 0;
            int add = s1 + s2 + pp;
            pp = add >= 10 ? 1 : 0;
            add = add >= 10 ? add - 10 : add;
            cur.next = new ListNode(add);
            cur = cur.next;
            if (l1 != null) {
                l1 = l1.next;
            }
            if (l2 != null) {
                l2 = l2.next;
            }
        }
        return p.next;
    }
}
```
