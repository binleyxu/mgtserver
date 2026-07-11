# mcpserver VS Code 接入说明

更新时间：2026-07-12

目标：在 Windows 11 本机 VS Code 和 SSH 远程主机 VS Code 中，都能连接独立节点上的 mcpserver，并在 Copilot Agent 里执行 sync_three_tiers 完成三端连通验证。

## 1. Windows 11 本机 VS Code

在 Windows 本机的 VS Code 用户设置中新增或合并如下配置。

```json
{
  "mcp": {
    "servers": {
      "mcpserver": {
        "command": "ssh",
        "args": [
          "mcpserver",
          "bash",
          "-lc",
          "source ~/.nvm/nvm.sh && node /home/mcpadmin/unified-mcp-server/dist/index.js"
        ],
        "env": {
          "FRONTEND_HEALTH_URL": "http://192.168.0.99:3000/health",
          "BACKEND_HEALTH_URL": "http://192.168.0.206:8080/health",
          "DB_HEALTH_URL": "http://192.168.0.206:8080/db/health",
          "HTTP_TIMEOUT_MS": "5000"
        }
      }
    }
  }
}
```

## 2. SSH 远程主机 VS Code

在 SSH 远程主机或新节点本机的 VS Code 设置中新增或合并如下配置。

```json
{
  "mcp": {
    "servers": {
      "mcpserver": {
        "command": "bash",
        "args": [
          "-lc",
          "source ~/.nvm/nvm.sh && node /home/mcpadmin/unified-mcp-server/dist/index.js"
        ],
        "env": {
          "FRONTEND_HEALTH_URL": "http://192.168.0.99:3000/health",
          "BACKEND_HEALTH_URL": "http://192.168.0.206:8080/health",
          "DB_HEALTH_URL": "http://192.168.0.206:8080/db/health",
          "HTTP_TIMEOUT_MS": "5000"
        }
      }
    }
  }
}
```

## 3. 验证顺序

1. 保存设置并重载 VS Code。
2. 在 Copilot Agent 里调用一次 sync_three_tiers。
3. 若失败，先执行 [scripts/healthcheck-3node.sh](../scripts/healthcheck-3node.sh) 复核三端连通性。
4. 若三端都通，再考虑加生产版认证头，例如 X-API-Key。

## 4. 约定

- 服务器名统一使用 mcpserver。
- 192.168.0.99 为 mgtserver。
- 192.168.0.206 为 apiserver。
- 192.168.0.12 为 dbserver。