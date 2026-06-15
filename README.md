# 水电站闸门运行三维监控系统

基于 Three.js 的水电站闸门三维可视化监控系统，提供直观的三维场景展示和实时数据监控能力。

## 原始需求

> 请用 Three.js 实现水电站闸门运行三维监控，场景展示坝体、闸门、启闭机、闸墩、水位尺、泄洪通道、检修平台、传感器和下游警戒线。值班人员要能从三维空间判断上游水位、闸门开度、启闭机负载、机房告警和泄流影响，用户可切换常规运行、检修、泄洪和应急模式，点选闸门查看开度曲线、联锁状态、操作人和最近指令。水面、机械结构和告警标签要分层清楚，水流动画有节制，连续监控一段时间后仍能顺畅拖拽场景。

## 功能特性

- **三维场景**：坝体、闸门、启闭机、闸墩、水位尺、泄洪通道、检修平台、传感器、下游警戒线
- **实时监控**：上游水位、下游水位、闸门开度、启闭机负载、水流量
- **四种运行模式**：常规运行、检修模式、泄洪模式、应急模式
- **闸门详情**：点选闸门查看开度曲线、联锁状态、操作人、最近指令、传感器数据
- **告警系统**：实时告警展示，支持预警和告警两级
- **流畅交互**：OrbitControls 轨道控制，支持旋转、平移、缩放

## 技术栈

- **前端框架**：React 18 + TypeScript
- **3D 引擎**：Three.js
- **状态管理**：Zustand
- **图表库**：Chart.js + react-chartjs-2
- **UI 样式**：Tailwind CSS
- **图标库**：Lucide React
- **构建工具**：Vite

## 启动方式

### 前置要求

- Node.js >= 18
- npm 或 pnpm

### 启动步骤

#### 1. 安装依赖

```bash
npm install
```

#### 2. 启动开发服务

```bash
npm run dev
```

访问地址：http://localhost:5173

#### 3. 生产构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

#### 4. 类型检查

```bash
npm run check
```

## Docker 一键启动

### 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0

### 启动步骤

#### 1. 构建并启动服务

```bash
docker compose up --build
```

如需后台运行：

```bash
docker compose up --build -d
```

#### 2. 访问服务

访问地址：http://localhost:8080

#### 3. 停止服务

```bash
docker compose down
```

## 操作说明

- **左键拖拽**：旋转视角
- **右键拖拽**：平移视角
- **滚轮**：缩放场景
- **点击闸门**：查看闸门详细信息

## 目录结构

```
.
├── src/
│   ├── components/       # UI 组件
│   │   ├── AlarmPanel.tsx         # 告警面板
│   │   ├── ControlPanel.tsx       # 控制面板
│   │   ├── GateDetailPanel.tsx    # 闸门详情面板
│   │   ├── SceneCanvas.tsx        # 3D场景容器
│   │   └── StatusBar.tsx          # 顶部状态栏
│   ├── pages/            # 页面
│   │   └── Home.tsx
│   ├── scene/            # 3D场景
│   │   └── DamScene.ts            # 水坝场景类
│   ├── store/            # 状态管理
│   │   └── useDamStore.ts         # 水坝数据store
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── nginx.conf
└── README.md
```

## 注意事项

- 系统数据为模拟数据，用于演示三维监控效果
- 水流动画和水面波动已做性能优化，确保长时间运行流畅
- 建议使用 Chrome、Edge 或 Firefox 等现代浏览器获得最佳体验
