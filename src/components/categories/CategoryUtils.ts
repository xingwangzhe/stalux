/**
 * 分类工具函数
 * 用于处理分类树结构、层级和路径
 */

// 分类树节点接口
export interface CategoryNode {
  name: string;
  path: string;
  isRoot: boolean;
  children: CategoryNode[];
  level: number;
}

// 分类树处理结果接口
export interface CategoryTreesResult {
  trees: CategoryNode[];
  allCategories: CategoryNode[];
  deepNestedCategories: CategoryNode[];
}

/**
 * 提取分类树结构，最多支持9层嵌套，但只在UI中显示前3层
 * @param categories 分类数据
 * @returns 处理后的分类树结构、所有分类和深层嵌套分类
 */
export function extractCategoryTrees(categories: any): CategoryTreesResult {
  // 用于存储分类路径与其对应完整对象的映射
  const categoryMap = new Map<string, CategoryNode>();
  // 记录根分类，作为不同分类树的起点
  const rootCategories: CategoryNode[] = [];
  // 收集超过3层的深层分类
  const deepNestedCategories: CategoryNode[] = [];
  
  function buildCategoryPath(node: any, parentPath = '', level = 0): { path: string; category: CategoryNode } | null {
    if (!node) return null;
    
    // 处理不同类型的分类节点
    if (typeof node === 'string') {
      const path = parentPath ? `${parentPath}/${node}` : node;
      const category: CategoryNode = { 
        name: node, 
        path, 
        isRoot: level === 0, 
        children: [],
        level: level
      };
      
      categoryMap.set(path, category);
      
      // 根分类（第0层）
      if (level === 0) {
        rootCategories.push(category);
      }
      // 超过3层的嵌套分类，收集到平铺列表
      else if (level >= 3) {
        deepNestedCategories.push(category);
      }
      
      return { path, category };
    }
    
    if (node && typeof node === 'object' && node.name) {
      const name = node.name;
      const path = parentPath ? `${parentPath}/${name}` : name;
      const category: CategoryNode = {
        name,
        path,
        isRoot: level === 0,
        children: [],
        level: level
      };
      
      categoryMap.set(path, category);
      
      if (level === 0) {
        rootCategories.push(category);
      } 
      else if (level >= 3) {
        deepNestedCategories.push(category);
      }
      
      // 处理子分类
      if (node.subcategories && Array.isArray(node.subcategories)) {
        node.subcategories.forEach((subcat: any) => {
          const result = buildCategoryPath(subcat, path, level + 1);
          if (result && result.category) {
            // 只在前3层嵌套中添加子分类关系
            if (level < 2) {
              category.children.push(result.category);
            }
          }
        });
      }
      
      return { path, category };
    }
    
    if (node && typeof node === 'object') {
      const keys = Object.keys(node);
      if (keys.length > 0) {
        const name = keys[0];
        const path = parentPath ? `${parentPath}/${name}` : name;
        const category: CategoryNode = {
          name,
          path,
          isRoot: level === 0,
          children: [],
          level: level
        };
        
        categoryMap.set(path, category);
        
        if (level === 0) {
          rootCategories.push(category);
        }
        else if (level >= 3) {
          deepNestedCategories.push(category);
        }
        
        // 处理子分类
        const subCategories = node[name];
        if (Array.isArray(subCategories)) {
          subCategories.forEach((subcat: any) => {
            const result = buildCategoryPath(subcat, path, level + 1);
            if (result && result.category) {
              // 只在前3层嵌套中添加子分类关系
              if (level < 2) {
                category.children.push(result.category);
              }
            }
          });
        }
        
        return { path, category };
      }
    }
    
    return null;
  }
  
  // 构建分类树
  if (Array.isArray(categories)) {
    categories.forEach(cat => buildCategoryPath(cat));
  } else if (categories) {
    buildCategoryPath(categories);
  }
  
  // 根据某些条件对分类树进行排序
  rootCategories.sort((a, b) => {
    // 优先按子分类数量排序
    if (a.children.length !== b.children.length) {
      return b.children.length - a.children.length;
    }
    // 然后按名称字母顺序排序
    return a.name.localeCompare(b.name);
  });
  
  // 对深层嵌套分类按层级和名称排序
  deepNestedCategories.sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level; // 按层级升序排序
    }
    return a.name.localeCompare(b.name); // 同层级按名称排序
  });
  
  return {
    trees: rootCategories,
    allCategories: Array.from(categoryMap.values()),
    deepNestedCategories: deepNestedCategories
  };
}