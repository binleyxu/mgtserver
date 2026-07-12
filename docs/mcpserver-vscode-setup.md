# mcpserver VS Code 接入说明

更新时间：2026-07-12

目标：在 Windows 11 本机 VS Code 和 SSH 远程主机 VS Code 中，都能连接独立节点上的 mcpserver，并在 Copilot Agent 里执行 sync_three_tiers 完成三端连通验证；同时将 mgtserver、apiserver、dbserver、mcpserver 组成 4 端 SSH 免密矩阵。

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
- 192.168.0.210 为 mcpserver（插座端）。

## 5. 3 端远程主机里的 VS Code 应该怎么配

如果你是在 mgtserver、apiserver、dbserver 这些 SSH 远程会话里打开 VS Code，Copilot Agent 运行位置是在远程主机本身，不是在 Windows 本机。

因此这 3 台主机里的 VS Code 设置不应该用本地 `bash` 直启，而应该继续通过 `ssh mcpserver` 去连接独立节点上的 MCP 服务：

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

只有在你直接 SSH 进入 mcpserver 本机并在那台机器上打开 VS Code 时，才使用上面第 2 节的 `bash -lc` 本地直启版本。

## 6. mcpserver 必须收录 3 端主机公钥

当前状态：该步骤已经完成，4 端之间已经可以互相免密登录。

如果后续新增主机，仍然需要把新主机公钥追加到 mcpserver 上 `mcpadmin` 账户的 `~/.ssh/authorized_keys`。

在 mcpserver 上以 `mcpadmin` 执行：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys <<'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIA3nZmYC6jJiQHhQJAsRrYOH7N0cXdNJLlksTDcoIu0M mgtadmin@192.168.0.99
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJEwDlVErFykyxfQVEo9rqId2Jd8PflVkRSweXUdslPk apiadmin@192.168.0.206
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIF6THZdJ3pixFbDA56QZMx8Wa7Y8O2Niu+FFgOgGqNR+ dbadmin@192.168.0.12
EOF
chmod 600 ~/.ssh/authorized_keys
```

然后分别在 mgtserver、apiserver、dbserver 上验证：

```bash
ssh -o BatchMode=yes mcpserver 'hostname && whoami'
```

预期结果：

- 返回主机名为 mcpserver。
- 返回用户为 mcpadmin。

## 7. 4 端 SSH 免密矩阵（新增）

### 7.1 当前现状（实测）

当前实测：

- 4 个别名均可达。
- 4 端之间 SSH 免密矩阵已打通。
- mgtserver、apiserver、dbserver 都可以通过 `ssh mcpserver` 到达 `mcpadmin@192.168.0.210`。
- mcpserver 上 `source ~/.nvm/nvm.sh && node /home/mcpadmin/unified-mcp-server/dist/index.js` 已验证可正常启动，`nvm` 生效后的 Node 版本为 `v20.20.2`。

### 7.2 一键初始化脚本

已新增脚本：[scripts/setup-ssh-matrix-4node.sh](../scripts/setup-ssh-matrix-4node.sh)。

作用：

1. 校验 4 个别名是否可达。
2. 为每台机器补齐 `~/.ssh/id_ed25519`（若不存在）。
3. 在每台机器写入统一别名配置（含 mcpserver）。
4. 把 4 台机器公钥互相写入，形成全互信。
5. 执行 12 条链路验证（A->B，A!=B）。

执行命令：

```bash
chmod +x scripts/setup-ssh-matrix-4node.sh
./scripts/setup-ssh-matrix-4node.sh
```

注意：脚本是幂等的，可重复执行。

### 7.3 如果首跳到 mcpserver 还没打通

这一步保留为故障恢复预案。若后续某台主机重装、换 key 或新增主机，先完成首跳授权，再重跑脚本。

在当前控制端（通常 mgtserver）执行：

```bash
ssh-copy-id mcpserver
```

如果你的环境禁用 `ssh-copy-id`，就在 mcpserver 上手动追加当前控制端公钥：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '这里替换为控制端 ~/.ssh/id_ed25519.pub 的完整内容' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 7.4 验收脚本

已新增脚本：[scripts/healthcheck-4node-ssh-matrix.sh](../scripts/healthcheck-4node-ssh-matrix.sh)。

执行命令：

```bash
chmod +x scripts/healthcheck-4node-ssh-matrix.sh
./scripts/healthcheck-4node-ssh-matrix.sh
```

通过标准：

- 4 个别名可达。
- 12 条方向链路全部 `[OK]`。

## 8. 当前检查结果

当前实测结果：

- 4 端 SSH：全部通过。
- mcpserver 入口文件存在：`/home/mcpadmin/unified-mcp-server/dist/index.js`。
- mcpserver 上 `~/.nvm/nvm.sh` 存在。
- 通过 `source ~/.nvm/nvm.sh` 启动后，Node 实际版本为 `v20.20.2`。
- 已验证 `mgtserver -> ssh mcpserver -> bash -lc -> node dist/index.js` 这一条真实 MCP 启动路径不会立即报错。
- 3 端业务健康检查：仅 `frontend service active` 未通过，其余通过。

结论：MCP 打通的阻塞项已经解除。后续只需在各自的 VS Code 会话中装入对应 JSON 配置，然后在 Copilot Agent 中调用一次 `sync_three_tiers` 做最终业务侧验收。

## 9. 日常一键巡检（4端 SSH + 3端业务）

已新增脚本：[scripts/healthcheck-daily-4node.sh](../scripts/healthcheck-daily-4node.sh)。

执行命令：

```bash
chmod +x scripts/healthcheck-daily-4node.sh
./scripts/healthcheck-daily-4node.sh
```

巡检顺序：

1. 先执行 4 端 SSH 矩阵检查（4 个别名 + 12 条链路）。
2. 再执行 3 端业务健康检查（沿用 `healthcheck-3node.sh`）。
3. 最后输出统一汇总：`daily healthcheck summary: ok=... fail=...`。

当前实测：

- 4 端 SSH：全部通过。
- 3 端业务：仅 `frontend service active` 未通过，其余通过。