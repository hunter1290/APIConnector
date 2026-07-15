// Best-effort curl command parser — covers the common case of pasting a "copy as curl"
// command from browser devtools or Postman. Not a full shell/curl parser (doesn't handle
// every flag or full POSIX quoting), but handles the flags that matter for prefilling a
// request: method, URL, headers, body, and basic auth.

export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  basicAuth: { username: string; password: string } | null;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const n = input.length;

  const readQuoted = (quote: string): string => {
    let out = "";
    i++; // skip opening quote
    while (i < n && input[i] !== quote) {
      if (quote === '"' && input[i] === "\\" && i + 1 < n && '"\\$`'.includes(input[i + 1])) {
        out += input[i + 1];
        i += 2;
      } else {
        out += input[i];
        i++;
      }
    }
    i++; // skip closing quote
    return out;
  };

  while (i < n) {
    while (i < n && /\s/.test(input[i])) i++;
    if (i >= n) break;
    let token = "";
    while (i < n && !/\s/.test(input[i])) {
      if (input[i] === '"' || input[i] === "'") {
        token += readQuoted(input[i]);
      } else {
        token += input[i];
        i++;
      }
    }
    tokens.push(token);
  }
  return tokens;
}

/** Returns null if the input doesn't look like a usable curl command (no URL found). */
export function parseCurl(input: string): ParsedCurl | null {
  const normalized = input.trim().replace(/\\\r?\n/g, " ");
  if (!normalized) return null;

  const tokens = tokenize(normalized);
  let i = tokens[0]?.toLowerCase() === "curl" ? 1 : 0;

  let method: string | null = null;
  let url: string | null = null;
  const headers: Record<string, string> = {};
  let body: string | null = null;
  let basicAuth: { username: string; password: string } | null = null;

  for (; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "-X" || t === "--request") {
      method = tokens[++i];
    } else if (t === "-H" || t === "--header") {
      const h = tokens[++i] ?? "";
      const sep = h.indexOf(":");
      if (sep > -1) headers[h.slice(0, sep).trim()] = h.slice(sep + 1).trim();
    } else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary" || t === "--data-ascii") {
      body = tokens[++i] ?? null;
    } else if (t === "--data-urlencode") {
      const v = tokens[++i] ?? "";
      body = body ? `${body}&${v}` : v;
    } else if (t === "-u" || t === "--user") {
      const cred = tokens[++i] ?? "";
      const sep = cred.indexOf(":");
      basicAuth = sep > -1
        ? { username: cred.slice(0, sep), password: cred.slice(sep + 1) }
        : { username: cred, password: "" };
    } else if (t === "--url") {
      url = tokens[++i] ?? null;
    } else if (t === "-A" || t === "--user-agent") {
      headers["User-Agent"] = tokens[++i] ?? "";
    } else if (t === "-b" || t === "--cookie") {
      headers["Cookie"] = tokens[++i] ?? "";
    } else if (!t.startsWith("-") && !url) {
      url = t;
    }
    // Other flags (e.g. -s, -k, -L, -i, -v, --compressed) are silently ignored — they don't
    // affect the request shape we care about.
  }

  if (!url) return null;
  return { method: (method ?? (body ? "POST" : "GET")).toUpperCase(), url, headers, body, basicAuth };
}
