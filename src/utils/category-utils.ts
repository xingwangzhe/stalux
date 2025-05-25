/**
 * 分类工具函数集合
 * 
 * 概念区分：
 * - 分类(Categories): 用于内容的主题组织，具有明确的分类目录结构
 * - 标签(Tags): 用于内容的关键词标记，扁平化的标签云形式
 * 
 * 本博客中的分类采用扁平化展示模式，但在语义上仍属于分类系统
 */

// 定义分类节点的接口 - 扁平化分类结构
export interface CategoryNode {
  name: string;
  path: string;
  count: number; // 属于该分类的文章数量
  posts: Array<{ slug: string; title: string }>; // 存储该分类直接关联的文章
}

// 定义分类列表类型 - 扁平化结构，便于展示
export type CategoryList = CategoryNode[];

// 提取并组织所有分类，构建扁平化分类结构
export function extractFlatCategories(posts: any[]): CategoryList {
  const categoryMap = new Map<string, CategoryNode>();

  // 处理每篇文章的分类
  posts.forEach(post => {
    if (post.data.categories && Array.isArray(post.data.categories)) {
      post.data.categories.forEach((categoryName: string) => {
        if (typeof categoryName === 'string' && categoryName.trim()) {
          const trimmedName = categoryName.trim();
          
          if (!categoryMap.has(trimmedName)) {
            categoryMap.set(trimmedName, {
              name: trimmedName,
              path: trimmedName,
              count: 0,
              posts: []
            });
          }
          
          const category = categoryMap.get(trimmedName)!;
          category.count++;
          category.posts.push({
            slug: post.slug,
            title: post.data.title || post.slug
          });
        }
      });
    }
  });

  // 转换为数组并按文章数量排序
  return Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);
}

// 排序函数，将分类按文章数量降序排列
export function sortCategoriesByCount(categories: CategoryList): CategoryList {
  return categories.sort((a, b) => b.count - a.count);
}
