var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/fastest-levenshtein@1.0.16/node_modules/fastest-levenshtein/mod.js
var require_mod = __commonJS({
  "node_modules/.pnpm/fastest-levenshtein@1.0.16/node_modules/fastest-levenshtein/mod.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.distance = exports.closest = void 0;
    var peq = new Uint32Array(65536);
    var myers_32 = function(a, b) {
      var n = a.length;
      var m = b.length;
      var lst = 1 << n - 1;
      var pv = -1;
      var mv = 0;
      var sc = n;
      var i = n;
      while (i--) {
        peq[a.charCodeAt(i)] |= 1 << i;
      }
      for (i = 0; i < m; i++) {
        var eq = peq[b.charCodeAt(i)];
        var xv = eq | mv;
        eq |= (eq & pv) + pv ^ pv;
        mv |= ~(eq | pv);
        pv &= eq;
        if (mv & lst) {
          sc++;
        }
        if (pv & lst) {
          sc--;
        }
        mv = mv << 1 | 1;
        pv = pv << 1 | ~(xv | mv);
        mv &= xv;
      }
      i = n;
      while (i--) {
        peq[a.charCodeAt(i)] = 0;
      }
      return sc;
    };
    var myers_x = function(b, a) {
      var n = a.length;
      var m = b.length;
      var mhc = [];
      var phc = [];
      var hsize = Math.ceil(n / 32);
      var vsize = Math.ceil(m / 32);
      for (var i = 0; i < hsize; i++) {
        phc[i] = -1;
        mhc[i] = 0;
      }
      var j = 0;
      for (; j < vsize - 1; j++) {
        var mv_1 = 0;
        var pv_1 = -1;
        var start_1 = j * 32;
        var vlen_1 = Math.min(32, m) + start_1;
        for (var k = start_1; k < vlen_1; k++) {
          peq[b.charCodeAt(k)] |= 1 << k;
        }
        for (var i = 0; i < n; i++) {
          var eq = peq[a.charCodeAt(i)];
          var pb = phc[i / 32 | 0] >>> i & 1;
          var mb = mhc[i / 32 | 0] >>> i & 1;
          var xv = eq | mv_1;
          var xh = ((eq | mb) & pv_1) + pv_1 ^ pv_1 | eq | mb;
          var ph = mv_1 | ~(xh | pv_1);
          var mh = pv_1 & xh;
          if (ph >>> 31 ^ pb) {
            phc[i / 32 | 0] ^= 1 << i;
          }
          if (mh >>> 31 ^ mb) {
            mhc[i / 32 | 0] ^= 1 << i;
          }
          ph = ph << 1 | pb;
          mh = mh << 1 | mb;
          pv_1 = mh | ~(xv | ph);
          mv_1 = ph & xv;
        }
        for (var k = start_1; k < vlen_1; k++) {
          peq[b.charCodeAt(k)] = 0;
        }
      }
      var mv = 0;
      var pv = -1;
      var start = j * 32;
      var vlen = Math.min(32, m - start) + start;
      for (var k = start; k < vlen; k++) {
        peq[b.charCodeAt(k)] |= 1 << k;
      }
      var score = m;
      for (var i = 0; i < n; i++) {
        var eq = peq[a.charCodeAt(i)];
        var pb = phc[i / 32 | 0] >>> i & 1;
        var mb = mhc[i / 32 | 0] >>> i & 1;
        var xv = eq | mv;
        var xh = ((eq | mb) & pv) + pv ^ pv | eq | mb;
        var ph = mv | ~(xh | pv);
        var mh = pv & xh;
        score += ph >>> m - 1 & 1;
        score -= mh >>> m - 1 & 1;
        if (ph >>> 31 ^ pb) {
          phc[i / 32 | 0] ^= 1 << i;
        }
        if (mh >>> 31 ^ mb) {
          mhc[i / 32 | 0] ^= 1 << i;
        }
        ph = ph << 1 | pb;
        mh = mh << 1 | mb;
        pv = mh | ~(xv | ph);
        mv = ph & xv;
      }
      for (var k = start; k < vlen; k++) {
        peq[b.charCodeAt(k)] = 0;
      }
      return score;
    };
    var distance2 = function(a, b) {
      if (a.length < b.length) {
        var tmp = b;
        b = a;
        a = tmp;
      }
      if (b.length === 0) {
        return a.length;
      }
      if (a.length <= 32) {
        return myers_32(a, b);
      }
      return myers_x(a, b);
    };
    exports.distance = distance2;
    var closest = function(str, arr) {
      var min_distance = Infinity;
      var min_index = 0;
      for (var i = 0; i < arr.length; i++) {
        var dist = distance2(str, arr[i]);
        if (dist < min_distance) {
          min_distance = dist;
          min_index = i;
        }
      }
      return arr[min_index];
    };
    exports.closest = closest;
  }
});

// .claude/_skills/using-mtcute/tools/get-method.ts
import { readFile } from "node:fs/promises";
import { join as join2 } from "node:path";

// .claude/_skills/using-mtcute/tools/_utils.ts
var import_fastest_levenshtein = __toESM(require_mod(), 1);
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
var PLATFORM_PACKAGES = ["@mtcute/node", "@mtcute/bun", "@mtcute/deno", "@mtcute/web", "@mtcute/core"];
var rootRequire = createRequire(join(process.cwd(), "__stub.js"));
function findPackageRoot(req, startDir) {
  let dir = startDir;
  for (let i = 0; i < 5; i++) {
    try {
      req.resolve(`${dir}/package.json`);
      return dir;
    } catch {
      dir = dirname(dir);
    }
  }
  return startDir;
}
function withDistFallback(pkgDir2) {
  if (existsSync(join(pkgDir2, "highlevel"))) return pkgDir2;
  const dist = join(pkgDir2, "dist");
  if (existsSync(join(dist, "highlevel"))) return dist;
  return pkgDir2;
}
function tryResolveMtcuteFrom(fromDir) {
  const req = createRequire(join(fromDir, "__stub.js"));
  for (const pkg of PLATFORM_PACKAGES) {
    try {
      req.resolve(pkg);
      const pkgJsonPath = join(fromDir, "node_modules", pkg.replace("/", "/".replace("/", "/")), "package.json");
      let version = "unknown";
      try {
        const entry = req.resolve(pkg);
        const pkgDir2 = findPackageRoot(req, dirname(entry));
        const pkgJson = JSON.parse(readFileSync(join(pkgDir2, "package.json"), "utf8"));
        version = pkgJson.version ?? "unknown";
      } catch {
        try {
          version = JSON.parse(readFileSync(pkgJsonPath, "utf8")).version ?? "unknown";
        } catch {
        }
      }
      return { version, workspaceDir: fromDir };
    } catch {
    }
  }
  return null;
}
function expandWorkspaceGlobs(rootDir, patterns) {
  const dirs = [];
  for (const pattern of patterns) {
    if (pattern.startsWith("!")) continue;
    const clean = pattern.replace(/\/\*\*?$/, "");
    const fullDir = resolve(rootDir, clean);
    if (!existsSync(fullDir)) continue;
    if (pattern.endsWith("/**") || pattern.endsWith("/*")) {
      try {
        for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
          if (!entry.isDirectory() && !entry.isSymbolicLink() || entry.name.startsWith(".")) continue;
          const sub = join(fullDir, entry.name);
          if (existsSync(join(sub, "package.json"))) {
            dirs.push(sub);
          }
        }
      } catch {
      }
    } else if (existsSync(join(fullDir, "package.json"))) {
      dirs.push(fullDir);
    }
  }
  return dirs;
}
function getWorkspacePackageDirs() {
  const cwd = process.cwd();
  const pnpmWsPath = join(cwd, "pnpm-workspace.yaml");
  if (existsSync(pnpmWsPath)) {
    const content2 = readFileSync(pnpmWsPath, "utf8");
    const match = content2.match(/packages:\s*\n((?:\s+-\s+.+\n?)+)/);
    if (match) {
      const patterns = match[1].split("\n").map((l) => l.replace(/^\s*-\s*/, "").replace(/["']/g, "").trim()).filter(Boolean);
      return expandWorkspaceGlobs(cwd, patterns);
    }
  }
  const pkgJsonPath = join(cwd, "package.json");
  if (existsSync(pkgJsonPath)) {
    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
      const workspaces = Array.isArray(pkgJson.workspaces) ? pkgJson.workspaces : pkgJson.workspaces?.packages;
      if (Array.isArray(workspaces) && workspaces.length > 0) {
        return expandWorkspaceGlobs(cwd, workspaces);
      }
    } catch {
    }
  }
  return [];
}
function resolveFromWorkspaces(directResolve) {
  const direct = directResolve(rootRequire);
  if (direct !== null) return direct;
  const wsDirs = getWorkspacePackageDirs();
  if (wsDirs.length === 0) {
    throw new Error("Could not find any @mtcute/* package. Is mtcute installed?");
  }
  const found = [];
  for (const dir of wsDirs) {
    const res = tryResolveMtcuteFrom(dir);
    if (res) found.push(res);
  }
  if (found.length === 0) {
    throw new Error("Could not find any @mtcute/* package in workspace packages. Is mtcute installed?");
  }
  const versions = /* @__PURE__ */ new Map();
  for (const { version, workspaceDir } of found) {
    const list = versions.get(version) ?? [];
    list.push(workspaceDir);
    versions.set(version, list);
  }
  if (versions.size > 1) {
    let msg = "Multiple versions of @mtcute/* found in workspace packages:\n";
    for (const [version, dirs] of versions) {
      for (const dir of dirs) {
        msg += `  ${dir}: v${version}
`;
      }
    }
    msg += "\nPlease cd into the specific package directory before running this tool.";
    throw new Error(msg);
  }
  const wsReq = createRequire(join(found[0].workspaceDir, "__stub.js"));
  const result = directResolve(wsReq);
  if (result !== null) return result;
  throw new Error("Could not find @mtcute/* package. Is mtcute installed?");
}
function resolveMtcuteCoreDir() {
  return resolveFromWorkspaces((req) => {
    for (const pkg of PLATFORM_PACKAGES) {
      try {
        const entry = req.resolve(`${pkg}`);
        const pkgDir2 = findPackageRoot(req, dirname(entry));
        if (pkg === "@mtcute/core") return withDistFallback(pkgDir2);
        const coreReq = createRequire(join(pkgDir2, "__stub.js"));
        const coreEntry = coreReq.resolve("@mtcute/core");
        const coreDir = findPackageRoot(coreReq, dirname(coreEntry));
        return withDistFallback(coreDir);
      } catch {
      }
    }
    return null;
  });
}
function fuzzyMatch(query2, items, getName) {
  const queryLower = query2.toLowerCase();
  const exact = items.filter((item) => getName(item).toLowerCase() === queryLower);
  if (exact.length > 0) return { exact, fuzzy: [] };
  const fuzzy = items.map((item) => {
    const name = getName(item);
    return { item, name, dist: (0, import_fastest_levenshtein.distance)(queryLower, name.toLowerCase()) };
  }).sort((a, b) => a.dist - b.dist);
  return { exact: [], fuzzy };
}
function autoCorrectOrFail(query2, fuzzy, partialMatches) {
  if (partialMatches.length > 0) {
    console.error(`No exact match for "${query2}". Similar:`);
    for (const name of partialMatches.slice(0, 20)) {
      console.error(`  ${name}`);
    }
  } else if (fuzzy.length > 0 && fuzzy[0].dist <= 5) {
    console.error(`No match for "${query2}". Did you mean:`);
    for (const s of fuzzy.filter((s2) => s2.dist <= 5).slice(0, 10)) {
      console.error(`  ${s.name}`);
    }
  } else {
    console.error(`Nothing found matching "${query2}"`);
  }
  process.exit(1);
}
function tryAutoCorrect(query2, fuzzy) {
  if (fuzzy.length === 0 || fuzzy[0].dist > 2) return null;
  const bestDist = fuzzy[0].dist;
  const atBest = fuzzy.filter((s) => s.dist === bestDist);
  if (atBest.length === 1) {
    console.error(`(assuming "${atBest[0].name}" for "${query2}")`);
    console.error();
    return atBest[0].item;
  }
  return null;
}
function parseArgs() {
  const args = process.argv.slice(2);
  const flags2 = /* @__PURE__ */ new Set();
  let positional;
  for (const arg of args) {
    if (arg.startsWith("--")) {
      flags2.add(arg);
    } else if (!positional) {
      positional = arg;
    }
  }
  return { flags: flags2, positional };
}

// .claude/_skills/using-mtcute/tools/get-method.ts
function dedent(text) {
  const lines = text.split("\n");
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const indent = line.search(/\S/);
    if (indent >= 0 && indent < minIndent) minIndent = indent;
  }
  if (!Number.isFinite(minIndent) || minIndent === 0) return text;
  return lines.map((line) => line.slice(minIndent)).join("\n");
}
function extractDescription(jsdoc) {
  const match = jsdoc.match(/\*\s+(?:\*\s*)?(.+)/);
  return match ? match[1].replace(/\*\/$/, "").trim() : "";
}
function parseClientDts(content2) {
  const methods2 = [];
  const ifaceStart = content2.indexOf("export interface TelegramClient extends ITelegramClient {");
  if (ifaceStart === -1) return methods2;
  const body = content2.slice(ifaceStart);
  const methodRe = /(?<jsdoc>[ \t]*\/\*\*(?:(?!\*\/)[\s\S])*?\*\/\s*)?(?<signature>[ \t]*(?<name>\w+)(?:<[^>]+>)?\([\s\S]*?\): [^;]+;)/g;
  let match;
  while ((match = methodRe.exec(body)) !== null) {
    const { jsdoc, signature, name } = match.groups;
    const preceding = body.slice(0, match.index);
    const lastNewline = preceding.lastIndexOf("\n");
    const lineStart = preceding.slice(lastNewline + 1);
    if (lineStart === "}") break;
    if (name.startsWith("_")) continue;
    const raw = `${jsdoc ?? ""}${signature}`;
    const full = dedent(raw).trim();
    const jsdocDedented = dedent((jsdoc ?? "").trim());
    const desc = extractDescription(jsdocDedented);
    methods2.push({
      name,
      jsdoc: jsdocDedented,
      signature: dedent(signature).trim(),
      full,
      description: desc
    });
  }
  return methods2;
}
var { flags, positional: query } = parseArgs();
var showAll = flags.has("--list");
var searchMode = flags.has("--search");
if (!query && !showAll) {
  console.error(`Usage: node ${process.argv[1]} [--list | --search] <method-name>`);
  console.error();
  console.error("Looks up high-level TelegramClient method signatures from the installed package.");
  console.error("Use --list to show all available methods, --search to search in descriptions.");
  process.exit(1);
}
var pkgDir = resolveMtcuteCoreDir();
var clientDtsPath = join2(pkgDir, "highlevel", "client.d.ts");
var content = await readFile(clientDtsPath, "utf8");
var methods = parseClientDts(content);
if (methods.length === 0) {
  console.error(`Could not parse any methods from ${clientDtsPath}`);
  process.exit(1);
}
if (showAll) {
  console.log(`${methods.length} methods available:`);
  console.log();
  for (const m of methods) {
    console.log(`  ${m.name}: ${m.description}`);
  }
  process.exit(0);
}
var matches;
if (searchMode) {
  const queryLower = query.toLowerCase();
  matches = methods.filter(
    (m) => m.name.toLowerCase().includes(queryLower) || m.description.toLowerCase().includes(queryLower)
  );
  if (matches.length === 0) {
    console.error(`No methods matching "${query}"`);
    process.exit(1);
  }
  if (matches.length > 1) {
    console.log(`${matches.length} methods matching "${query}":`);
    console.log();
    for (const m of matches) {
      console.log(`  ${m.name}: ${m.description}`);
    }
    process.exit(0);
  }
} else {
  const { exact, fuzzy } = fuzzyMatch(query, methods, (m) => m.name);
  matches = exact;
  if (matches.length === 0) {
    const corrected = tryAutoCorrect(query, fuzzy);
    if (corrected) {
      matches = [corrected];
    }
  }
  if (matches.length === 0) {
    const queryLower = query.toLowerCase();
    const nameMatches = methods.filter((m) => m.name.toLowerCase().includes(queryLower));
    const descMatches = nameMatches.length === 0 ? methods.filter((m) => m.description.toLowerCase().includes(queryLower)) : [];
    const partial = nameMatches.length > 0 ? nameMatches : descMatches;
    if (partial.length === 1) {
      console.error(`(assuming "${partial[0].name}" for "${query}")`);
      console.error();
      matches = partial;
    } else if (partial.length > 0) {
      autoCorrectOrFail(query, fuzzy, partial.map((m) => `${m.name} \u2014 ${m.description}`));
    } else {
      autoCorrectOrFail(query, fuzzy, []);
    }
  }
}
for (const method of matches) {
  console.log(`--- ${method.name} (${clientDtsPath}) ---`);
  console.log();
  console.log(method.full);
  console.log();
}
