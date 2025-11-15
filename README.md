# 座位安排系统

这是一个用于创建和管理教室座位安排的静态网页应用程序。系统包含两个主要组件：座位安排程序和规则编辑器。

## 功能特点

### 座位安排程序 (seating-main.html)
- 随机生成座位安排
- 支持导入规则文件
- 座位平移和固定功能
- 学生历史位置记录
- 截图导出功能

### 规则编辑器 (rules-editor.html)
- 管理学生名单
- 设置行限制
- 设置相邻限制
- 设置前后桌限制
- 导出规则文件

## 如何在本地运行

1. 克隆或下载本仓库
2. 直接在浏览器中打开 `seating-main.html` 或 `rules-editor.html` 文件
3. 无需额外的服务器配置，这是一个纯前端应用

## 如何部署到 GitHub Pages

### 方法一：使用 GitHub 网站界面部署

1. **创建 GitHub 仓库**：
   - 登录你的 GitHub 账户
   - 点击右上角的 "+" 图标，选择 "New repository"
   - 填写仓库名称（例如 "seating-arrangement"）
   - 选择公开或私有仓库
   - 点击 "Create repository"

2. **上传文件**：
   - 在仓库页面，点击 "Add file" → "Upload files"
   - 拖拽所有项目文件（HTML、CSS、JavaScript 文件和 .gitignore）到上传区域
   - 填写提交信息，然后点击 "Commit changes"

3. **启用 GitHub Pages**：
   - 在仓库页面，点击 "Settings"
   - 在左侧导航栏中选择 "Pages"
   - 在 "Source" 部分，从下拉菜单中选择 "main" 或 "master" 分支
   - 在 "Folder" 下拉菜单中选择 "/ (root)"
   - 点击 "Save"
   - 几分钟后，GitHub 将显示你的网站 URL

### 方法二：使用 Git 命令行部署

1. **初始化 Git 仓库**（如果尚未初始化）：

```bash
git init
git add .
git commit -m "Initial commit"
```

2. **连接到 GitHub 仓库**：

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPOSITORY_NAME.git
```

3. **推送到 GitHub**：

```bash
git push -u origin main
```

4. **启用 GitHub Pages**：
   - 按照方法一中的步骤 3 启用 GitHub Pages

## 技术栈

- HTML5
- CSS (使用 Tailwind CSS)
- JavaScript
- Font Awesome 图标库

## 使用说明

1. 首先使用规则编辑器（rules-editor.html）创建学生名单和限制规则
2. 导出规则文件
3. 在座位安排程序（seating-main.html）中导入规则文件
4. 使用刷新按钮生成随机座位安排

## 注意事项

- 这是一个纯静态应用，所有数据都存储在浏览器的本地存储中
- 规则编辑器需要密码才能访问（默认密码：241305117）
- 确保所有文件都在同一目录下，以保证正确加载外部资源