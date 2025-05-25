// 定义分类节点的接口 - 平铺标签模式
export interface CategoryNode {
  name: string;
  path: string;
  count: number; // 属于该分类的文章数量
  posts: Array<{ slug: string; title: string }>; // 存储该分类直接关联的文章
}

// 定义分类列表类型 - 平铺结构，不再有嵌套
export type CategoryList = CategoryNode[];

// 提取并组织所有分类，构建平铺标签结构
export function extractNestedCategories(posts: any[]): CategoryList {
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
