# 问题复盘手册（开发/联调）

## 目标

- 把“偶发问题”变成“可复用经验”，避免同类问题重复踩坑。
- 固化排查顺序、验证命令、修复动作和验收标准。
- 让新成员可按手册独立复现并定位问题。

## 使用规则

- 每个已定位的线上/联调问题，至少新增 1 条复盘记录。
- 记录必须包含：现象、根因、修复、验证、回归防护。
- 所有路径、命令、接口请写可执行版本，避免口语化描述。

## 复盘模板（复制后填写）

### 1. 基本信息

- 问题标题：
- 发生日期：
- 影响范围：
- 严重级别：
- 关联模块：

### 2. 现象

- 用户可见现象：
- 技术症状：
- 首次发现方式（人工/监控/测试）：

### 3. 复现步骤

1. 
2. 
3. 

### 4. 根因分析

- 直接根因：
- 深层根因：
- 为什么之前没发现：

### 5. 修复动作

- 前端修复：
- 后端修复：
- 配置/网关修复：
- 文档修复：

### 6. 验证与验收

- 验证命令：
- 预期结果：
- 实际结果：

### 7. 回归防护

- 代码防护：
- 测试防护：
- 运维防护：

### 8. 待办

- [ ]
- [ ]

---

## 已完成案例：管理员头像上传返回 base64 导致显示异常

### 1. 基本信息

- 问题标题：头像上传成功但前端长期显示默认头像
- 发生日期：2026-07-13
- 影响范围：管理端管理员列表头像展示
- 严重级别：中
- 关联模块：admin/avatar、网关静态路由

### 2. 现象

- 上传头像后接口提示成功，但页面仍显示默认头像。
- 接口返回 `avatar_small_url` / `avatar_large_url` 为 `data:image/jpeg;base64,...`。
- 管理端域名下访问 `/static/avatar/...` 返回 HTML（SPA 回退），不是图片。

### 3. 复现步骤

1. 调用 `POST /admin/{id}/avatar` 上传图片。
2. 观察返回体中的头像 URL 字段。
3. 在管理端域名访问该 URL，检查响应头 `Content-Type`。

### 4. 根因分析

- 直接根因：后端头像服务将图片编码成 base64 data URI 返回，而非落盘文件 URL。
- 深层根因：管理端网关未将 `/static/avatar/*` 转发到后端静态资源，导致即使返回相对路径也会被 SPA 回退。
- 为什么之前没发现：联调仅看“接口 200”而未校验 URL 可访问性与内容类型。

### 5. 修复动作

- 前端修复：
  - 上传响应增加保护，不接受 `data:image/...` 作为持久化头像 URL。
  - 占位头像统一为普通文件 `public/static/avatar/avatar-fallback.jpg`。
- 后端修复：
  - `modules/admin/avatar/service.py` 改为落盘 JPG 到 `static/avatar/{admin_id}/avatar_32.jpg` 与 `avatar_128.jpg`。
  - 返回值改为 `/static/avatar/{admin_id}/avatar_32.jpg`、`/static/avatar/{admin_id}/avatar_128.jpg`。
  - `main.py` 挂载 `app.mount('/static', StaticFiles(directory='static'), name='static')`。
- 文档修复：
  - 资产规范与头像联调文档新增“隐藏问题”章节。

### 6. 验证与验收

- 验证命令：
  - 上传接口：`curl -X POST http://192.168.0.206:8080/admin/254/avatar ...`
  - 直连静态：`curl -I http://192.168.0.206:8080/static/avatar/254/avatar_32.jpg`
  - 管理端域名：`curl -I http://192.168.0.99:3000/static/avatar/254/avatar_32.jpg`
- 预期结果：
  - 上传返回 `/static/avatar/...`。
  - 直连静态返回 `200 image/jpeg`。
  - 管理端域名也应返回 `200 image/jpeg`（依赖网关转发）。
- 实际结果：
  - 后端侧已满足；管理端域名仍需网关补齐转发规则。

### 7. 回归防护

- 代码防护：前端拒绝 `data:image/...` 头像 URL。
- 测试防护：新增接口返回值断言（必须是 `/static/avatar/...`）。
- 运维防护：部署检查项加入 `/static/avatar/*` 代理可用性检测。

### 8. 待办

- [ ] 网关补齐 `/static/avatar/* -> 192.168.0.206:8080/static/avatar/*`。
- [ ] 增加自动化健康检查：随机头像 URL HEAD 返回 `image/jpeg`。

---

## 专项检查清单：Session 与 30 分钟时限

> 适用场景：登录态异常、自动登出时机不对、会话弹窗行为异常、跨标签页状态不一致。

### 1. 配置基线

- 默认会话时限应为 `1800` 秒（30 分钟）。
- 默认预警时长应为 `300` 秒（5 分钟）。
- 环境变量：`VITE_SESSION_TIMEOUT_SECONDS`、`VITE_SESSION_WARNING_SECONDS`。
- 代码检查点：`src/config.ts`。

### 2. 会话元信息计算口径

- 过期时间优先级必须一致：
  1. `expires_at`
  2. `expires_in`
  3. JWT `exp`
  4. 前端兜底（当前时间 + 1800 秒）
- 预警时长来源：接口返回 `warning_before_seconds`，否则回退默认值。
- 代码检查点：`src/auth/authentication/services/sessionService.ts`。

### 3. 预警与续期行为

- 进入预警窗口（默认最后 5 分钟）后：
  - 自动触发 `POST /api/auth/refresh`。
  - 显示“会话即将过期”弹窗并展示倒计时。
- 弹窗约束：禁止点击遮罩关闭，禁止 ESC 关闭。
- “继续会话”：手动重试续期。
- “立即退出”：立即清理会话并回到 `/login`。
- 代码检查点：`src/auth/authentication/components/SessionTimeoutManager.tsx`。

### 4. 超时与失败处理

- 续期接口返回 `401`：必须清理 token 并跳转 `/login`。
- 会话剩余时间小于等于 0：必须退出登录。
- 401 并发风暴需要节流重定向，避免重复跳转。
- 代码检查点：`handleUnauthorizedResponse`（`sessionService.ts`）。

### 5. 本地存储与跨标签联动

- 关键存储键：
  - `admin_token`
  - `admin_session_expires_at`
  - `admin_session_warning_before_seconds`
  - `admin_session_server_offset_seconds`
  - `admin_session_started_at`
  - `admin_session_last_activity_at`
  - `admin_session_activity_events`
- 任一标签页登出后，其他标签页应通过 `storage` 事件同步退出。

### 6. 快速验收命令

- 前端构建：`npm run -s build`
- 单测（会话相关）：
  - `npm run -s test -- src/auth/authentication/components/SessionTimeoutManager.test.tsx`
  - `npm run -s test -- src/auth/authentication/services/sessionService.test.ts`

### 7. 最小验收项

1. 登录后存在有效 `admin_token` 与 `admin_session_expires_at`。
2. 进入最后 5 分钟时出现预警弹窗。
3. 点击“继续会话”后会话被刷新，倒计时回升。
4. 续期返回 `401` 时立即退出并回到 `/login`。
5. 多标签页中任一页退出，其他标签页同步退出。
