import * as Network from "expo-network";
import TcpSocket from "react-native-tcp-socket";
import type Server from "react-native-tcp-socket/lib/types/Server";
import type Socket from "react-native-tcp-socket/lib/types/Socket";
import type { PcTransferSession } from "@/src/state/vault-state";

const PORT_CANDIDATES = [47821, 47822, 47823, 47824] as const;

export type PcShareServerSession = {
  readonly url: string;
  readonly port: number;
  readonly stop: () => Promise<void>;
};

type ParsedRequest = {
  readonly method: string;
  readonly path: string;
  readonly body: string;
};

export async function startPcShareServer(session: PcTransferSession): Promise<PcShareServerSession> {
  const ipAddress = await Network.getIpAddressAsync();

  if (!ipAddress || ipAddress === "0.0.0.0") {
    throw new Error("Could not detect the phone IP address.");
  }

  let lastError: Error | undefined;

  for (const port of PORT_CANDIDATES) {
    try {
      const server = await listenOnPort(port, session);
      return {
        port,
        stop: () => closeServer(server),
        url: `http://${ipAddress}:${port}`
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Could not start local server.");
    }
  }

  throw lastError ?? new Error("No local sharing port is available.");
}

function listenOnPort(port: number, session: PcTransferSession) {
  return new Promise<Server>((resolve, reject) => {
    const server = TcpSocket.createServer((socket) => handleConnection(socket, session));
    let settled = false;

    server.once("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
        return;
      }
    });

    server.listen({ host: "0.0.0.0", port, reuseAddress: true }, () => {
      settled = true;
      resolve(server);
    });
  });
}

function closeServer(server: Server) {
  return new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
}

function handleConnection(socket: Socket, session: PcTransferSession) {
  let requestBuffer = "";
  socket.setEncoding("utf8");
  socket.setTimeout(12000, () => socket.destroy());

  socket.on("data", (chunk) => {
    requestBuffer += String(chunk);
    const request = parseRequest(requestBuffer);

    if (!request) {
      return;
    }

    const response = routeRequest(request, session);
    socket.end(response);
  });

  socket.on("error", () => socket.destroy());
}

function parseRequest(rawRequest: string): ParsedRequest | undefined {
  const headerEnd = rawRequest.indexOf("\r\n\r\n");

  if (headerEnd === -1) {
    return undefined;
  }

  const header = rawRequest.slice(0, headerEnd);
  const [requestLine, ...headerLines] = header.split("\r\n");
  const [method = "GET", rawPath = "/"] = requestLine.split(" ");
  const contentLengthLine = headerLines.find((line) => line.toLowerCase().startsWith("content-length:"));
  const contentLength = contentLengthLine ? Number(contentLengthLine.split(":")[1]?.trim() ?? 0) : 0;
  const body = rawRequest.slice(headerEnd + 4);

  if (body.length < contentLength) {
    return undefined;
  }

  return {
    body: body.slice(0, contentLength),
    method,
    path: rawPath.split("?")[0] ?? "/"
  };
}

function routeRequest(request: ParsedRequest, session: PcTransferSession) {
  if (request.method === "GET" && request.path === "/") {
    return htmlResponse(renderReceiverPage(session));
  }

  if (request.method === "GET" && request.path === "/health") {
    return jsonResponse(200, { ok: true });
  }

  if (request.method === "POST" && request.path === "/claim") {
    return claimResponse(request, session);
  }

  return textResponse(404, "Not found");
}

function claimResponse(request: ParsedRequest, session: PcTransferSession) {
  try {
    const payload = JSON.parse(request.body) as { code?: string };
    const code = payload.code?.replace(/\s+/g, "") ?? "";

    if (Date.parse(session.expiresAt) < Date.now()) {
      return jsonResponse(410, { error: "This session expired. Start a new share from the phone." });
    }

    if (code !== session.code) {
      return jsonResponse(403, { error: "Pairing code is incorrect." });
    }

    return jsonResponse(200, {
      expiresAt: session.expiresAt,
      itemCount: session.itemCount,
      packageText: session.packageText
    });
  } catch {
    return jsonResponse(400, { error: "Invalid request." });
  }
}

function htmlResponse(body: string) {
  return buildResponse(200, "text/html; charset=utf-8", body);
}

function jsonResponse(status: number, body: unknown) {
  return buildResponse(status, "application/json; charset=utf-8", JSON.stringify(body));
}

function textResponse(status: number, body: string) {
  return buildResponse(status, "text/plain; charset=utf-8", body);
}

function buildResponse(status: number, contentType: string, body: string) {
  const reason = status === 200 ? "OK" : status === 400 ? "Bad Request" : status === 403 ? "Forbidden" : status === 404 ? "Not Found" : "Gone";
  return [
    `HTTP/1.1 ${status} ${reason}`,
    `Content-Type: ${contentType}`,
    `Content-Length: ${utf8ByteLength(body)}`,
    "Cache-Control: no-store",
    "Access-Control-Allow-Origin: *",
    "Connection: close",
    "",
    body
  ].join("\r\n");
}

function utf8ByteLength(value: string) {
  return unescape(encodeURIComponent(value)).length;
}

function renderReceiverPage(session: PcTransferSession) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vaultify PC Share</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #020604; color: #f6fff8; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; display: grid; place-items: center; padding: 24px; }
    main { width: min(620px, 100%); border: 1px solid rgba(57,255,90,.28); border-radius: 22px; background: rgba(5,18,15,.94); box-shadow: 0 24px 80px rgba(57,255,90,.12); padding: 26px; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
    .logo { width: 48px; height: 48px; border: 1px solid rgba(57,255,90,.65); border-radius: 14px; display: grid; place-items: center; color: #39ff5a; font-weight: 900; }
    h1 { font-size: 26px; margin: 0; }
    p { color: #93a39a; line-height: 1.55; }
    .code { color: #39ff5a; font-size: 34px; font-weight: 900; letter-spacing: 0; margin: 16px 0; }
    input { width: 100%; min-height: 54px; border: 1px solid rgba(57,255,90,.28); border-radius: 14px; background: rgba(1,9,5,.94); color: #39ff5a; font-size: 24px; font-weight: 900; text-align: center; outline: none; }
    button { width: 100%; min-height: 54px; border: 0; border-radius: 14px; background: #39ff5a; color: #021006; font-size: 16px; font-weight: 900; margin-top: 14px; cursor: pointer; }
    button.secondary { background: transparent; color: #f6fff8; border: 1px solid rgba(57,255,90,.28); }
    .status { min-height: 24px; margin-top: 14px; color: #ffd166; font-weight: 800; }
    .success { color: #9effa7; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <main>
    <div class="brand"><div class="logo">V</div><div><h1>Vaultify PC Share</h1><p>${session.itemCount} encrypted item(s), expires ${new Date(session.expiresAt).toLocaleTimeString()}.</p></div></div>
    <p>Enter the pairing code shown on your phone. The encrypted vault file will download automatically. Your master password is still required to unlock it.</p>
    <input id="code" inputmode="numeric" maxlength="7" placeholder="000 000" autocomplete="one-time-code" />
    <button id="claim">Receive encrypted vault</button>
    <button id="download" class="secondary hidden">Download again</button>
    <div id="status" class="status"></div>
  </main>
  <script>
    const statusNode = document.getElementById('status');
    const codeNode = document.getElementById('code');
    const downloadNode = document.getElementById('download');
    let lastPackage = '';
    function setStatus(message, success) {
      statusNode.textContent = message;
      statusNode.className = success ? 'status success' : 'status';
    }
    function downloadVault(packageText) {
      const blob = new Blob([packageText], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'vaultify-secure-vault.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1500);
    }
    async function claimVault() {
      setStatus('Checking pairing code...', false);
      const response = await fetch('/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeNode.value })
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.error || 'Transfer failed.', false);
        return;
      }
      lastPackage = payload.packageText;
      downloadVault(lastPackage);
      downloadNode.classList.remove('hidden');
      setStatus('Encrypted vault received. Import it in Vaultify Web and unlock with your master password.', true);
    }
    document.getElementById('claim').addEventListener('click', () => void claimVault());
    downloadNode.addEventListener('click', () => lastPackage && downloadVault(lastPackage));
  </script>
</body>
</html>`;
}
