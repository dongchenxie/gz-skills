// gz-skills 静态图床（公众号推文配图 + 任意已生成产物）
// 服务根目录：/home/ubuntu/gz-skills/output/
// 公网 URL：   http://ec2-54-196-199-146.compute-1.amazonaws.com/<相对路径>
//
// 通过 systemd unit 持久化运行，监听 :80。
// 由 systemd 的 AmbientCapabilities=CAP_NET_BIND_SERVICE 授权绑定特权端口，
// 进程本身仍跑在 ubuntu 用户下，不需要 sudo / root。

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { extname } from "node:path";

const ROOT = "/home/ubuntu/gz-skills/output";
const PORT = Number(process.env.PORT ?? 80);

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

function safeJoin(root, urlPath) {
  // 解码 + 防 ../ traversal
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const resolved = path.resolve(root, "." + decoded);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function send(res, code, headers, body) {
  res.writeHead(code, {
    "Cache-Control": "public, max-age=86400",
    "Access-Control-Allow-Origin": "*",
    ...headers,
  });
  if (body !== undefined) res.end(body);
  else res.end();
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, { "Content-Type": "text/plain" }, "Method Not Allowed");
  }

  const filePath = safeJoin(ROOT, req.url ?? "/");
  if (!filePath) return send(res, 400, { "Content-Type": "text/plain" }, "Bad path");

  fs.stat(filePath, (err, stat) => {
    if (err) {
      return send(res, 404, { "Content-Type": "text/plain" }, "Not Found");
    }
    if (stat.isDirectory()) {
      // 目录无尾斜杠时强制 301 到 `/`，否则索引内的相对链接（如 article.html）
      // 会被浏览器解析到上一层（/article.html），点开就 404。
      const rawPath = (req.url ?? "/").split("?")[0];
      if (!rawPath.endsWith("/")) {
        const qs = (req.url ?? "").includes("?") ? "?" + req.url.split("?").slice(1).join("?") : "";
        return send(res, 301, { Location: rawPath + "/" + qs, "Content-Type": "text/plain" }, "");
      }
      // 目录请求 → 列出文件（简易索引；只对 _test 类调试目录有用）
      fs.readdir(filePath, (e2, items) => {
        if (e2) return send(res, 500, { "Content-Type": "text/plain" }, "Read error");
        const list = items.sort().map((it) => `<li><a href="${encodeURIComponent(it)}">${it}</a></li>`).join("");
        const html = `<!doctype html><meta charset=utf-8><title>${req.url}</title><h1>${req.url}</h1><ul>${list}</ul>`;
        return send(res, 200, { "Content-Type": "text/html; charset=utf-8" }, html);
      });
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const type = MIME[ext] ?? "application/octet-stream";
    const headers = {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Last-Modified": stat.mtime.toUTCString(),
    };
    if (req.method === "HEAD") return send(res, 200, headers);

    res.writeHead(200, {
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
      ...headers,
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[gz-static-serve] listening on :${PORT} serving ${ROOT}`);
});
