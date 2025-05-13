#!/usr/bin/env node

/**
 * Stalux 主题初始化脚本
 * 在新项目中设置 Stalux 主题所需的基本文件和配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 复制模板文件并重命名
 */
function copyTemplateFile(templatePath, destPath) {
  try {
    // 确保目标目录存在
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // 读取并写入文件
    const content = fs.readFileSync(templatePath, 'utf8');
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`✅ 文件已创建: ${destPath}`);
  } catch (error) {
    console.error(`❌ 无法创建文件 ${destPath}: ${error.message}`);
  }
}

/**
 * 初始化主题
 */
function initTheme() {
  console.log('🌟 开始初始化 Stalux 主题...');
  
  // 当前工作目录（用户项目目录）
  const cwd = process.cwd();
  
  // 主题包根目录
  const themeRoot = path.resolve(__dirname, '..');
  
  // 复制 _config.ts.template 到用户项目中
  const configTemplatePath = path.join(themeRoot, 'src', '_config.ts.template');
  const userConfigPath = path.join(cwd, 'src', '_config.ts');
  
  copyTemplateFile(configTemplatePath, userConfigPath);
  
  // 创建必要的目录结构
  const directories = [
    'src/content/posts',
    'src/content/about',
    'src/images',
    'public/images'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(cwd, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ 目录已创建: ${dirPath}`);
    }
  });
  
  // 提醒用户启用配置
  console.log('\n🎉 Stalux 主题初始化完成!');
  console.log('\n🔧 后续步骤:');
  console.log('1. 打开 src/_config.ts 文件');
  console.log('2. 将 useConfig 值改为 true');
  console.log('3. 根据需要自定义配置项');
  console.log('\n📝 开始创建内容:');
  console.log('- 在 src/content/posts/ 目录添加 .md 或 .mdx 文件');
  console.log('- 在 src/content/about/ 目录添加关于页面');
  console.log('\n🚀 运行开发服务器:');
  console.log('npm run dev');
  console.log('\n📚 查看完整文档:');
  console.log('https://stalux.needhelp.icu\n');
}

// 执行初始化
initTheme();
