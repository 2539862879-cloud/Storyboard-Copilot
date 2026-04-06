# GitHub Actions 工作流说明

本项目包含两个GitHub Actions工作流，用于自动构建和发布Storyboard Copilot应用。

## 工作流

### 1. Build (构建工作流)

**文件**: `.github/workflows/build.yml`

**触发条件**:
- 推送代码到 `main` 或 `develop` 分支
- 创建针对 `main` 分支的 Pull Request
- 手动触发（在GitHub Actions页面）

**功能**:
- 检查TypeScript类型
- 构建前端代码
- 运行测试（如果配置了的话）
- 构建macOS应用（通用二进制文件）
- 上传构建产物（保留7天）

**获取构建产物**:
1. 访问项目的 "Actions" 标签页
2. 选择一个 "Build" 工作流运行
3. 在页面底部找到 "Artifacts" 部分
4. 下载 `macos-dev-build` 文件

### 2. Release (发布工作流)

**文件**: `.github/workflows/release.yml`

**触发条件**:
- 推送版本标签（如 `v1.0.0`）到仓库
- 推送代码到 `main` 分支
- 创建针对 `main` 分支的 Pull Request
- 手动触发

**功能**:
- 为多个平台构建应用：
  - macOS (通用二进制文件)
  - Linux (deb 和 AppImage)
  - Windows (msi 和 exe)
- 当推送版本标签时，自动创建GitHub Release
- 上传所有平台的安装包到Release

**创建发布版本**:
```bash
# 创建并推送版本标签
git tag -a v0.1.14 -m "Release version 0.1.14"
git push origin v0.1.14
```

## 本地开发

如果你想在本地构建应用：

### 前置要求

1. **Node.js 20+**
2. **Rust** (通过rustup安装)
3. **macOS**: 需要完整的Xcode（不是仅命令行工具）
4. **Linux**: 需要安装GTK和webkit2gtk开发库
5. **Windows**: 需要Visual Studio C++ Build Tools

### 构建步骤

```bash
# 安装依赖
npm install

# 开发模式运行
npm run tauri dev

# 构建应用
npm run tauri build
```

## 密钥配置（可选）

如果你想签名应用，需要在GitHub仓库设置中添加以下Secrets：

- `TAURI_PRIVATE_KEY`: Tauri私钥
- `TAURI_KEY_PASSWORD`: 私钥密码

生成密钥的方法：
```bash
npm run tauri signer generate
```

## 故障排除

### macOS构建失败

如果遇到 "unknown option '-lSystem'" 错误，说明需要安装完整的Xcode：

```bash
# 从App Store安装Xcode后运行
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### Linux构建失败

确保安装了所需的依赖：
```bash
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev \
  libappindicator3-dev librsvg2-dev patchelf
```

## 注意事项

1. 构建过程可能需要15-30分钟，请耐心等待
2. macOS的通用二进制文件同时支持Intel和Apple Silicon芯片
3. 每次推送到main分支都会触发构建，会产生GitHub Actions使用量
4. 开发构建的产物只保留7天，发布版本的产物会永久保留
