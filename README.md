# 智慧卫生间状态页

一个基于 Vue 3 + Vite 的智慧卫生间实时状态页面。页面会调用原有卫生间接口，展示楼层坑位状态、男女厕所切换、推荐楼层、刷新频率配置和自动刷新进度。

## 环境要求

- Node.js 22 或更高版本
- pnpm 10.33.0

建议使用项目声明的 pnpm 版本：

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

## 安装依赖

```bash
pnpm install
```

## 本地开发

```bash
pnpm run dev
```

默认开发服务监听所有网卡：

```text
http://localhost:5173/
http://你的本机IP:5173/
```

如果 `5173` 被占用，Vite 会自动切换到下一个可用端口。

## 接口配置

本地开发时，页面默认通过 Vite 代理访问原接口：

```text
/api-proxy -> https://sapp.gewuzhixin.com
```

生产构建时，页面默认直接访问：

```text
https://sapp.gewuzhixin.com
```

也可以通过环境变量覆盖接口地址：

```bash
VITE_API_BASE=https://sapp.gewuzhixin.com pnpm run build
```

当前默认 `partnerId` 为：

```text
283443972062314497
```

页面也支持通过 URL 参数覆盖：

```text
?partnerId=你的partnerId
?pid=你的partnerId
```

## 构建

```bash
pnpm run build
```

构建产物输出到：

```text
dist/
```

## 本地预览构建产物

```bash
pnpm run preview
```

默认预览地址：

```text
http://localhost:4173/
```

## GitHub Pages 自动部署

项目已内置 GitHub Actions 工作流：

```text
.github/workflows/deploy-pages.yml
```

部署流程：

1. 推送代码到 GitHub 的 `main` 或 `master` 分支。
2. 在仓库 `Settings -> Pages` 中将 Source 设置为 `GitHub Actions`。
3. GitHub Actions 会自动执行：

```bash
pnpm install --frozen-lockfile
pnpm run build
```

4. 构建完成后自动发布 `dist/` 到 GitHub Pages。

Vite 会根据 GitHub 仓库名自动设置 Pages 访问路径：

- 仓库名是普通项目，例如 `toilet-status`：自动使用 `/toilet-status/`
- 仓库名是用户站点，例如 `username.github.io`：自动使用 `/`

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm install` | 安装依赖 |
| `pnpm run dev` | 启动本地开发服务 |
| `pnpm run build` | 生产构建 |
| `pnpm run preview` | 本地预览构建产物 |

## 功能说明

- 实时获取楼宇与楼层数据
- 展示男女厕所坑位状态
- 自动推荐空闲坑位最多的楼层
- 支持配置刷新频率：`3 / 5 / 10 / 30 / 60` 秒
- 刷新按钮带进度环，进度走满后自动刷新
- 支持手动立即刷新
- GitHub Pages 自动构建部署

## 常见问题

### GitHub Pages 页面能打开，但数据加载失败

请先确认接口服务允许来自 GitHub Pages 域名的跨域请求。生产环境会直接请求：

```text
https://sapp.gewuzhixin.com
```

如果接口不允许跨域，需要在接口服务端开启 CORS，或额外提供可公开访问的代理服务。

### 本地可以访问，局域网设备访问不了

确认本机和访问设备在同一局域网，并使用 Vite 输出的 Network 地址，例如：

```text
http://192.168.x.x:5173/
```

如果仍无法访问，检查系统防火墙是否阻止了该端口。

### 如何切换不同楼宇

在访问地址后追加 `partnerId`：

```text
http://localhost:5173/?partnerId=新的partnerId
```
