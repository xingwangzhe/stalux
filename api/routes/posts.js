import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter'; // 修正导入方式

const router = express.Router();

// 计算 md 文件存放目录，假设位于项目 src/content/posts 下
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postsDir = path.join(__dirname, '..', '..', 'src', 'content', 'posts');

// GET /api/posts - 列出所有 md 文件
router.get('/', (req, res) => {
    fs.readdir(postsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: '无法读取 posts 文件夹' });
        }
        const mdFiles = files.filter(file => file.endsWith('.md'));
        if(mdFiles.length === 0){
            return res.json({posts:[]});
        }
        
        const postsData = [];
        let count = 0;

        mdFiles.forEach(file => {
            const filePath = path.join(postsDir, file);
            fs.readFile(filePath, 'utf8', (err, content) => {
                count++;
                if (!err) {
                    try {
                        const parsed = matter(content);
                        postsData.push({
                            filename: file,
                            frontmatter: parsed.data,
                            excerpt: parsed.content.substring(0, 200) // 摘要预览，取前 200 个字符
                        });
                    } catch (parseErr) {
                        // 如果解析出错，仍然添加文件，但不包含 front matter
                        postsData.push({
                            filename: file,
                            frontmatter: {},
                            excerpt: content.substring(0, 200)
                        });
                    }
                }
                
                // 所有文件处理完成后返回结果
                if (count === mdFiles.length) {
                    res.json({ posts: postsData });
                }
            });
        });
    });
});

// GET /api/posts/:filename - 获取单个 md 文件内容
router.get('/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(postsDir, filename);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: '文件未找到' });
        }
        
        try {
            const parsed = matter(data);
            res.json({
                filename,
                frontmatter: parsed.data,
                content: parsed.content
            });
        } catch (parseErr) {
            res.json({
                filename,
                frontmatter: {},
                content: data
            });
        }
    });
});

// POST /api/posts - 创建新的 md 文件
router.post('/', (req, res) => {
    const { filename, content, frontmatter } = req.body;
    if (!filename) {
        return res.status(400).json({ error: '缺少 filename 参数' });
    }
    
    let fileContent = '';
    
    // 如果有 frontmatter，添加到文件内容中
    if (frontmatter && Object.keys(frontmatter).length > 0) {
        fileContent = matter.stringify(content || '', frontmatter);
    } else {
        fileContent = content || '';
    }
    
    const filePath = path.join(postsDir, filename);
    fs.writeFile(filePath, fileContent, 'utf8', err => {
        if (err) {
            return res.status(500).json({ error: '无法创建文件', details: err.message });
        }
        res.json({ message: '文件创建成功' });
    });
});

// PUT /api/posts/:filename - 更新已有 md 文件内容
router.put('/:filename', (req, res) => {
    const { filename } = req.params;
    const { content, frontmatter } = req.body;
    
    let fileContent = '';
    
    // 如果有 frontmatter，添加到文件内容中
    if (frontmatter && Object.keys(frontmatter).length > 0) {
        fileContent = matter.stringify(content || '', frontmatter);
    } else {
        fileContent = content || '';
    }
    
    const filePath = path.join(postsDir, filename);
    fs.access(filePath, fs.constants.F_OK, err => {
        if (err) {
            return res.status(404).json({ error: '文件不存在' });
        }
        fs.writeFile(filePath, fileContent, 'utf8', err => {
            if (err) {
                return res.status(500).json({ error: '无法更新文件', details: err.message });
            }
            res.json({ message: '文件更新成功' });
        });
    });
});

// DELETE /api/posts/:filename - 删除 md 文件
router.delete('/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(postsDir, filename);
    fs.unlink(filePath, err => {
        if (err) {
            return res.status(404).json({ error: '文件不存在或无法删除' });
        }
        res.json({ message: '文件删除成功' });
    });
});

export default router;