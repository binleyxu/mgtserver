const fs = require('fs');
const { spawn } = require('child_process');

const cfg = JSON.parse(fs.readFileSync('/home/mgtadmin/.vscode-server/data/User/mcp.json', 'utf8'));
const server = cfg.servers && cfg.servers.mcpserver;
if (!server) {
  console.error('NO_MCP_SERVER_CONFIG');
  process.exit(10);
}

const proc = spawn(server.command, server.args || [], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, ...(server.env || {}) },
});

const CRLF = '\r\n';
let buffer = Buffer.alloc(0);
let initialized = false;
let gotTools = false;

function send(msg) {
  const body = Buffer.from(JSON.stringify(msg), 'utf8');
  const header = Buffer.from(`Content-Length: ${body.length}${CRLF}${CRLF}`, 'utf8');
  proc.stdin.write(Buffer.concat([header, body]));
}

function parseFrames() {
  while (true) {
    const sep = buffer.indexOf(`${CRLF}${CRLF}`);
    if (sep < 0) return;

    const header = buffer.slice(0, sep).toString('utf8');
    const m = header.match(/Content-Length:\s*(\d+)/i);
    if (!m) return;

    const len = Number(m[1]);
    const start = sep + 4;
    if (buffer.length < start + len) return;

    const raw = buffer.slice(start, start + len).toString('utf8');
    buffer = buffer.slice(start + len);

    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      continue;
    }

    if (msg.id === 1 && msg.result) {
      initialized = true;
      console.log('INIT_OK');
      send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
      send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      continue;
    }

    if (msg.id === 2 && msg.result) {
      gotTools = true;
      const tools = Array.isArray(msg.result.tools) ? msg.result.tools : [];
      console.log(`TOOLS_COUNT=${tools.length}`);
      console.log(`TOOLS=${tools.map((t) => t.name).join(',')}`);
      proc.kill('SIGTERM');
      continue;
    }
  }
}

proc.stdout.on('data', (d) => {
  buffer = Buffer.concat([buffer, d]);
  parseFrames();
});

proc.stderr.on('data', (d) => {
  const s = d.toString('utf8').trim();
  if (s) console.error(`STDERR=${s}`);
});

proc.on('exit', () => {
  if (!initialized) {
    console.error('INIT_FAILED');
    process.exit(2);
  }
  if (!gotTools) {
    console.error('TOOLS_LIST_FAILED');
    process.exit(3);
  }
  process.exit(0);
});

send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'mcp-ping', version: '1.0.0' },
  },
});

setTimeout(() => {
  if (!gotTools) {
    console.error('TIMEOUT_WAITING_TOOLS');
    proc.kill('SIGKILL');
    process.exit(4);
  }
}, 12000);
