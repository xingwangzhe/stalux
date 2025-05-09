// 定义分类节点的接口
export interface CategoryNode {
  name: string;
  path: string;
  count: number; // 属于该分类的文章数量
  children: Record<string, CategoryNode>;
  posts: Array<{ slug: string; title: string }>; // 存储该分类直接关联的文章
  sortedChildren?: CategoryNode[];
}

// 定义分类树类型
export type CategoryTree = Record<string, CategoryNode>;

// 提取并组织所有分类，构建三级嵌套结构
export function extractNestedCategories(posts: any[]) {
  const categoryTree: CategoryTree = {};

  // 生成分类的URL路径，保持与Categories.astro组件一致的逻辑
  function generateCategoryPath(categoryName: any, parentPath = '') {
    return parentPath ? `${parentPath}/${categoryName}` : categoryName;
  }

  // 初始化所有分类节点
  function initializeCategories(posts: any[]) {
    // 递归收集所有分类路径并创建节点
    function collectCategoryPaths(categories: any[], parentPath = '', tree: CategoryTree = categoryTree) {
      if (!categories || !Array.isArray(categories)) return;
      
      categories.forEach(category => {
        // 处理字符串格式的分类
        if (typeof category === 'string') {
          const catName = category;
          const currentPath = parentPath ? `${parentPath}/${catName}` : catName;
          
          if (!tree[catName]) {
            tree[catName] = {
              name: catName,
              path: currentPath,
              count: 0,
              children: {},
              posts: []
            };
          }
          return;
        }

        // 处理有name属性的对象格式
        if (category && typeof category === 'object' && category.name) {
          const catName = category.name;
          const currentPath = parentPath ? `${parentPath}/${catName}` : catName;
          
          if (!tree[catName]) {
            tree[catName] = {
              name: catName,
              path: currentPath,
              count: 0,
              children: {},
              posts: []
            };
          }
          
          // 递归处理子分类
          if (category.subcategories && Array.isArray(category.subcategories)) {
            collectCategoryPaths(category.subcategories, currentPath, tree[catName].children);
          }
          return;
        }
        
        // 处理key-array格式 {'category': [subcategories]}
        if (category && typeof category === 'object') {
          const keys = Object.keys(category);
          if (keys.length > 0) {
            const catName = keys[0];
            const currentPath = parentPath ? `${parentPath}/${catName}` : catName;
            
            if (!tree[catName]) {
              tree[catName] = {
                name: catName,
                path: currentPath,
                count: 0,
                children: {},
                posts: []
              };
            }
            
            // 递归处理子分类
            const subCategories = category[catName];
            if (Array.isArray(subCategories)) {
              collectCategoryPaths(subCategories, currentPath, tree[catName].children);
            }
          }
        }
      });
    }

    // 初始化目录树结构
    posts.forEach(post => {
      if (post.data.categories) {
        const categories = Array.isArray(post.data.categories) 
          ? post.data.categories 
          : [post.data.categories];
        collectCategoryPaths(categories);
      }
    });
  }

  // 判断文章是否属于特定分类路径
  function isPostInCategory(post: { data: { categories: any; }; }, targetPath: string) {
    if (!post.data.categories || !Array.isArray(post.data.categories)) return false;
    
    // 构建文章分类的所有路径
    const postCategoryPaths: string[] = [];
    
    function buildPostCategoryPaths(categories: any[], parentPath = '') {
      categories.forEach((category: { [x: string]: any; name?: any; subcategories?: any; }) => {
        if (typeof category === 'string') {
          postCategoryPaths.push(parentPath ? `${parentPath}/${category}` : category);
        } else if (category && typeof category === 'object' && category.name) {
          const catName = category.name;
          const currentPath = parentPath ? `${parentPath}/${catName}` : catName;
          postCategoryPaths.push(currentPath);
          
          if (category.subcategories && Array.isArray(category.subcategories)) {
            buildPostCategoryPaths(category.subcategories, currentPath);
          }
        } else if (category && typeof category === 'object') {
          const keys = Object.keys(category);
          if (keys.length > 0) {
            const catName = keys[0];
            const currentPath = parentPath ? `${parentPath}/${catName}` : catName;
            postCategoryPaths.push(currentPath);
            
            const subCategories = category[catName];
            if (Array.isArray(subCategories)) {
              buildPostCategoryPaths(subCategories, currentPath);
            }
          }
        }
      });
    }
    
    buildPostCategoryPaths(post.data.categories);
    
    // 检查文章分类路径是否包含目标路径
    return postCategoryPaths.some(path => path === targetPath);
  }

  // 计算每个分类的文章数量
  function calculateCategoryCounts() {
    // 递归处理所有分类节点
    function processNode(node: CategoryNode, nodePath: string) {
      // 计算直接属于该分类的文章数量
      const postsInCategory = posts.filter(post => isPostInCategory(post, nodePath));
      node.count = postsInCategory.length;
      
      // 为文章添加元数据
      node.posts = postsInCategory.map(post => ({
        slug: post.slug,
        title: post.data.title || post.slug
      }));
      
      // 递归处理子分类
      Object.entries(node.children).forEach(([childName, childNode]) => {
        processNode(childNode, childNode.path);
      });
    }
    
    // 处理顶级分类
    Object.entries(categoryTree).forEach(([catName, node]) => {
      processNode(node, node.path);
    });
  }
  
  // 初始化分类树结构
  initializeCategories(posts);
  
  // 计算每个分类的文章数量
  calculateCategoryCounts();
  
  return categoryTree;
}

// 排序函数，将分类按文章数量降序排列
export function sortCategoriesByCount(categories: CategoryTree | Record<string, unknown>): CategoryNode[] {
  return Object.entries(categories)
    .sort(([, catA]: [string, any], [, catB]: [string, any]) => catB.count - catA.count)
    .map((value: [string, unknown]) => {
      const category = value[1] as CategoryNode;
      if (Object.keys(category.children).length > 0) {
        category.sortedChildren = sortCategoriesByCount(category.children);
      }
      return category;
    });
}
