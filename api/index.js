import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3001;

// 根路径
const rootDir = path.join(__dirname, '../');
const contentDir = path.join(rootDir, 'src/content');
const publicImagesDir = path.join(rootDir, 'public/images');

// 确保上传目录存在
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 可以根据需要动态确定目录
    const targetDir = req.query.dir 
      ? path.join(publicImagesDir, req.query.dir) 
      : publicImagesDir;
    
    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extname = path.extname(file.originalname);
    cb(null, file.originalname + '-' + uniqueSuffix + extname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制10MB
  },
  fileFilter: function (req, file, cb) {
    // 允许上传的文件类型
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件! (jpeg, jpg, png, gif, svg, webp)'));
    }
  }
});

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 设置静态文件目录
app.use('/api/static', express.static(path.join(rootDir, 'public')));

// 获取文件列表
app.get('/api/files', (req, res) => {
  const directory = req.query.dir || 'posts';
  const fullPath = path.join(contentDir, directory);
  
  try {
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: '目录不存在' });
    }
    
    const files = fs.readdirSync(fullPath);
    const fileDetails = files.map(file => {
      const filePath = path.join(fullPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: path.relative(rootDir, filePath),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    });
    
    res.json(fileDetails);
  } catch (error) {
    console.error('获取文件列表错误:', error);
    res.status(500).json({ error: '获取文件列表失败', details: error.message });
  }
});

// 获取文件内容
app.get('/api/files/content', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ error: '缺少文件路径参数' });
  }
  
  const fullPath = path.join(rootDir, filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({ content });
  } catch (error) {
    console.error('读取文件错误:', error);
    res.status(500).json({ error: '读取文件失败', details: error.message });
  }
});

// 创建或更新文件
app.post('/api/files', (req, res) => {
  const { path: filePath, content, isDirectory } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ error: '缺少文件路径参数' });
  }
  
  const fullPath = path.join(rootDir, filePath);
  
  try {
    if (isDirectory) {
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      res.json({ message: '目录创建成功' });
    } else {
      // 确保目录存在
      const dirPath = path.dirname(fullPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content || '');
      res.json({ message: '文件保存成功' });
    }
  } catch (error) {
    console.error('保存文件错误:', error);
    res.status(500).json({ error: '保存文件失败', details: error.message });
  }
});

// 删除文件或目录
app.delete('/api/files', (req, res) => {
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).json({ error: '缺少文件路径参数' });
  }
  
  const fullPath = path.join(rootDir, filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: '文件或目录不存在' });
    }
    
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      fs.rmdirSync(fullPath, { recursive: true });
      res.json({ message: '目录删除成功' });
    } else {
      fs.unlinkSync(fullPath);
      res.json({ message: '文件删除成功' });
    }
  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({ error: '删除文件失败', details: error.message });
  }
});

// 上传文件（用于图片等二进制文件）
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有文件被上传' });
    }
    
    // 返回文件的相对路径
    const relativePath = path.relative(rootDir, req.file.path).replace(/\\/g, '/');
    const fileUrl = `/api/static/${relativePath.replace('public/', '')}`;
    
    res.json({ 
      success: true, 
      message: '文件上传成功',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        path: relativePath,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ error: '文件上传失败', details: error.message });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CMS API 服务运行正常', 
    environment: 'development',
    note: '此API仅用于开发环境，不会包含在构建的静态网站中'
  });
});

// 显示开发模式警告
console.log('\x1b[33m%s\x1b[0m', '⚠️  警告: CMS API 仅用于本地开发环境');
console.log('\x1b[33m%s\x1b[0m', '⚠️  构建后的静态网站不会包含CMS或API功能');

app.listen(PORT, () => {
  console.log(`🚀 CMS API 服务已启动: http://localhost:${PORT}`);
});