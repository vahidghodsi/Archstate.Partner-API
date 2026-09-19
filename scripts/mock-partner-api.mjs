import http from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const payload = JSON.parse(
  readFileSync(join(__dirname, "mock-payload.json"), "utf8"),
);

const PORT = Number(process.env.PARTNER_API_PORT ?? 8080);
const KEY =
  process.env.PARTNER_API_KEY ??
  "556d5b14d66cfc8b52672ceea0c58e0965c1751bcc6739169638ea2e1e558f60";
const ALLOW_ALL = process.env.PARTNER_ALLOW_ALL_ORIGINS === "1";

function send(res, status, body, extra = {}) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(json),
    ...extra,
  });
  res.end(json);
}

function corsHeaders(origin, { force = false } = {}) {
  if (!origin) return {};
  let host;
  try {
    host = new URL(origin).hostname;
  } catch {
    return {};
  }
  if (!force && !ALLOW_ALL && host !== "localhost") return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };
}

function originAllowed(origin) {
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname;
    return ALLOW_ALL || host === "localhost";
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  const cors = corsHeaders(typeof origin === "string" ? origin : undefined);
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      ...cors,
      "Access-Control-Max-Age": "600",
    });
    res.end();
    return;
  }

  if (req.method !== "GET") {
    send(res, 405, {
      code: "METHOD_NOT_ALLOWED",
      message: "Only GET and OPTIONS are allowed.",
      status: 405,
    }, cors);
    return;
  }

  if (origin && !originAllowed(origin)) {
    send(
      res,
      403,
      {
        code: "PARTNER_ORIGIN_NOT_ALLOWED",
        message: "Origin host is not in allowed_domains.",
        status: 403,
      },
      corsHeaders(origin, { force: true }),
    );
    return;
  }

  const auth = req.headers.authorization ?? "";
  if (auth !== `Bearer ${KEY}`) {
    send(
      res,
      401,
      {
        code: "INVALID_PARTNER_API_KEY",
        message: "Missing or incorrect partner API key.",
        status: 401,
      },
      cors,
    );
    return;
  }

  if (url.pathname === "/api/partner/v1/profile") {
    send(res, 200, { data: payload.profile }, cors);
    return;
  }

  const projectMatch = url.pathname.match(
    /^\/api\/partner\/v1\/project\/([^/]+)$/,
  );
  if (projectMatch) {
    const id = decodeURIComponent(projectMatch[1]);
    const project = payload.projects[id];
    if (!project) {
      send(
        res,
        404,
        {
          code: "PROJECT_NOT_FOUND",
          message: "Unknown id, not on this profile, not public, or deleted.",
          status: 404,
        },
        cors,
      );
      return;
    }
    send(res, 200, { data: project }, cors);
    return;
  }

  send(
    res,
    404,
    {
      code: "PROJECT_NOT_FOUND",
      message: "Unknown path. This mock only serves the two partner GETs.",
      status: 404,
    },
    cors,
  );
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Mock partner API on http://127.0.0.1:${PORT}`);
  console.log(
    ALLOW_ALL
      ? "CORS: allowing any Origin (PARTNER_ALLOW_ALL_ORIGINS=1)"
      : "CORS: hostname localhost only",
  );
});
