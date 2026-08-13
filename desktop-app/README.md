# 超级地球桌面 GUI

本目录用于构建和测试独立 Windows 桌面程序。最终产物是：

```text
desktop-app/dist/SuperEarthArsenal.exe
```

双击 EXE 会打开一个没有地址栏和标签页的独立 WebView2 GUI 窗口。它不会启动系统浏览器；程序退出时会关闭仅监听 `127.0.0.1:41735` 的内置资源服务。主工作区固定在桌面视口内，军备库的债券导航和装备列表使用内部滚动；战略配备会显示三阵营社区参考分，随机部署同时指派敌对阵营。用户配置保存在 `%LOCALAPPDATA%/SuperEarthArsenal`。

## 构建

工作区提供的 Python 可直接用于构建：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1 -PythonExe "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
```

首次构建会在 `desktop-app/.venv` 中安装 `pywebview==6.2.1` 和 `PyInstaller==6.21.0`，之后可用：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1 -SkipInstall -PythonExe "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
```

构建脚本只会清理和重建 `desktop-app/bundle`、`desktop-app/build`、`desktop-app/dist`，不会删除或覆盖项目根目录的任何装备/敌人图片。构建时会把 `desktop-app/icon.ico`（深色底 + 黄色六边形环与菱形，多尺寸）嵌入为 EXE 图标；打包清单已包含任务（`assets/missions/`）与新增敌人（`assets/enemies/`）资源。

## 运行前提

- Windows 10/11 x64。
- Microsoft Edge WebView2 Runtime。当前开发机已安装；目标机器缺少时需要先安装官方 WebView2 Runtime。
- EXE 是单文件，但首次启动会解压约 145MB 的内嵌资源到临时目录。

## 测试

构建前后都可以检查资源清单：

```powershell
& ".\.venv\Scripts\python.exe" test_bundle.py bundle\web
```

项目数据校验仍在根目录执行：

```powershell
node ..\scripts\validate-data.mjs
```
