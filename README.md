# PDF 演示工具 - Vue 3 版本

基于 Vue 3 + Vite 重构的 PDF 演示工具，支持绘图标注和全屏演示。

## 技术栈

- **Vue 3** - 组合式 API
- **Vite** - 现代化构建工具
- **Pinia** - 状态管理
- **PDF.js** - PDF 渲染引擎

## 项目结构

```
src/
├── components/
│   ├── UploadScreen.vue    # 文件上传界面
│   ├── Sidebar.vue          # 缩略图侧边栏
│   ├── Toolbar.vue          # 工具栏
│   ├── SlideCanvas.vue      # 主画布（PDF + 绘图层）
│   └── FloatingToolbar.vue  # 浮动工具栏
├── stores/
│   └── pdf.js               # PDF 状态管理
├── App.vue                  # 根组件
├── main.js                  # 入口文件
└── style.css                # 全局样式
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 功能特性

- ✅ PDF 文件拖拽上传
- ✅ 缩略图导航
- ✅ 画笔工具（颜色、粗细可调）
- ✅ 橡皮擦工具
- ✅ 激光笔指示
- ✅ 绘图历史撤销
- ✅ 全屏演示模式
- ✅ 键盘快捷键支持

## 快捷键

- `F5` - 全屏演示
- `P` - 画笔工具
- `E` - 橡皮擦工具
- `L` - 激光笔
- `C` - 清空当前页绘图
- `Ctrl+Z` - 撤销
- `← / →` - 上一页 / 下一页
- `Home / End` - 首页 / 末页
- `ESC` - 退出全屏

## 迁移说明

从原生 JS 迁移到 Vue 3 的主要改进：

1. **组件化架构** - 每个功能模块独立为 Vue 组件，代码更清晰
2. **响应式状态** - 使用 Pinia 管理全局状态，自动更新 UI
3. **更好的开发体验** - Vite 提供热更新，开发效率更高
4. **类型安全** - 为后续 TypeScript 迁移做准备
5. **易于维护** - 组件职责单一，便于测试和扩展

原始文件已备份为 `app.js.old` 和 `index.html.old`。
