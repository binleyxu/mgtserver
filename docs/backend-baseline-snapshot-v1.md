# 后端基线快照 v1

更新时间：2026-07-11
适用范围：api-server（192.168.0.206）

## 1. 系统底层
- 主机名：apiserver
- 运行用户：apiadmin
- 服务单元：apiserver.service
- 服务状态：active + enabled（已验收）
- 对外端口：8000/TCP
- 健康检查：GET / 返回 200

## 2. SSH 基线
- 后端别名：apiserver
- 管理端别名：mgtserver
- 数据库端别名：dbserver
- 三端目标映射：
  - mgtserver -> 192.168.0.99
  - apiserver -> 192.168.0.206
  - dbserver -> 192.168.0.12

## 3. Python 运行基线
- 解释器：/home/apiadmin/.venv/bin/python
- 启动方式：python -m uvicorn
- 应用入口：apiserver.main:app
- App 目录：/home/apiadmin

## 4. 程序代码基线
- 主命名空间：apiserver
- 已完成命名收敛：api_server -> apiserver
- 活动代码扫描口径（排除 .venv 与备份目录）下，无以下残留：
  - api_server
  - api-server
  - etm_api_server

## 5. 配置文件基线
- systemd：/etc/systemd/system/apiserver.service
- 运行环境：/home/apiadmin/.env
- 运维基线文档：/home/apiadmin/OPS_BASELINE.md

## 6. 验收命令（巡检模板）
在后端主机执行：

systemctl is-active apiserver.service
systemctl is-enabled apiserver.service
systemctl show -p ExecStart apiserver.service
ss -ltnp | grep ':8000 '
curl -sS -m 8 http://127.0.0.1:8000/

预期结果：
- is-active 返回 active
- is-enabled 返回 enabled
- ExecStart 包含 apiserver.main:app
- 8000 端口存在 LISTEN
- curl 返回 200 对应的业务响应体

## 7. 已知运行特征
- 服务重启后存在启动预热窗口。
- 在日志出现 Application startup complete 之前，可能出现短时 Connection refused。
- 该行为在本轮迁移验收中已复现并确认。

## 8. 变更后建议
- 新变更前，先做一次当前服务单元和 .env 备份。
- 命名新增规则：后续新增标识统一使用 apiserver、mgtserver、dbserver。
