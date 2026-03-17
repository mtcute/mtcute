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

// .claude/_skills/using-mtcute/tools/get-constructor.ts
import { readFile } from "node:fs/promises";

// packages/tl-utils/src/codegen/utils.ts
function snakeToCamel(s) {
  return s.replace(/(?<!^|_)_[a-z0-9]/gi, ($1) => {
    return $1.substring(1).toUpperCase();
  });
}
var camelToPascal = (s) => s[0].toUpperCase() + s.substring(1);
function jsComment(s) {
  return `/**${// awesome hack not to break up {@link} links and <a href
  s.replace(/<br\/?>/g, "\n\n").replace(/\{@link (.*?)\}/g, "{@link\x83$1}").replace(/<a href/g, "<a\x83href").replace(/(?![^\n]{1,60}$)([^\n]{1,60})\s/g, "$1\n").replace(/\n|^/g, "\n * ").replace(/\{@link(.*)\}/g, "{@link $1}").replace(/<ahref/g, "<a href")}
 */`;
}
function indent(size, s) {
  let prefix = "";
  while (size--) prefix += " ";
  return prefix + s.replace(/\n/g, `
${prefix}`);
}

// packages/tl-utils/src/utils.ts
function splitNameToNamespace(name2) {
  const s = name2.split(".");
  if (s.length === 2) return s;
  return [null, name2];
}
function stringifyArgumentType(type, modifiers) {
  if (!modifiers) return type;
  let ret = type;
  if (modifiers.isBareUnion) ret = `%${ret}`;
  if (modifiers.isVector) ret = `Vector<${ret}>`;
  else if (modifiers.isBareVector) ret = `vector<${ret}>`;
  if (modifiers.predicate) ret = `${modifiers.predicate}?${ret}`;
  return ret;
}

// packages/tl-utils/src/stringify.ts
function normalizeType(s) {
  return s.replace(/(?<=^|\?)bytes/, "string").replace(/</g, " ").replace(/>/g, "").replace("int53", "long");
}
function writeTlEntryToString(entry, forIdComputation = false) {
  let str = entry.name;
  if (!forIdComputation && entry.id) {
    str += `#${entry.id.toString(16)}`;
  }
  str += " ";
  if (entry.generics) {
    for (const g of entry.generics) {
      if (forIdComputation) {
        str += `${g.name}:${g.type} `;
      } else {
        str += `{${g.name}:${g.type}} `;
      }
    }
  }
  for (const arg of entry.arguments) {
    if (forIdComputation && arg.typeModifiers?.predicate && arg.type === "true") {
      continue;
    }
    str += `${arg.name}:`;
    const type2 = stringifyArgumentType(arg.type, arg.typeModifiers);
    if (forIdComputation) {
      str += `${normalizeType(type2)} `;
    } else {
      str += `${type2} `;
    }
  }
  const type = entry.typeModifiers ? stringifyArgumentType(entry.type, entry.typeModifiers) : entry.type;
  if (forIdComputation) {
    str += `= ${normalizeType(type)}`;
  } else {
    str += `= ${type};`;
  }
  return str;
}

// packages/tl-utils/src/codegen/types.ts
var PRIMITIVE_TO_TS = {
  int: "number",
  long: "Long",
  int53: "number",
  int128: "Int128",
  int256: "Int256",
  double: "Double",
  string: "string",
  bytes: "Uint8Array",
  Bool: "boolean",
  true: "boolean",
  null: "null",
  any: "any",
  boolFalse: "false",
  boolTrue: "true"
};
function fullTypeName(type, baseNamespace, {
  namespace = true,
  method = false,
  link = false,
  typeModifiers
} = {}) {
  if (typeModifiers) {
    const inner = fullTypeName(type, baseNamespace, {
      namespace,
      method,
      link
    });
    if (typeModifiers.isVector || typeModifiers.isBareVector) {
      if (link) return `${inner} array`;
      return `${inner}[]`;
    }
  }
  if (type in PRIMITIVE_TO_TS) return PRIMITIVE_TO_TS[type];
  const [ns, name2] = splitNameToNamespace(type);
  let res = baseNamespace;
  if (namespace && ns) res += `${ns}.`;
  if (name2[0].match(/[A-Z]/)) {
    res += "Type";
  } else {
    res += "Raw";
  }
  res += camelToPascal(name2);
  if (method) res += "Request";
  if (link) res = `{@link ${res}}`;
  return res;
}
function entryFullTypeName(entry) {
  return fullTypeName(entry.name, "", {
    namespace: false,
    method: entry.kind === "method"
  });
}
function generateTypescriptDefinitionsForTlEntry(entry, params) {
  const { baseNamespace = "tl.", errors, withFlags = false, extends: extendsSchema } = params ?? {};
  let ret = "";
  let comment = "";
  if (entry.comment) {
    comment = entry.comment;
  }
  if (entry.kind === "method" && !entry.generics) {
    if (comment) comment += "\n\n";
    comment += `RPC method returns ${fullTypeName(entry.type, baseNamespace, {
      link: true,
      typeModifiers: entry.typeModifiers
    })}`;
    if (errors) {
      if (errors.userOnly[entry.name]) {
        comment += "\n\nThis method is **not** available for bots";
      } else if (errors.botOnly[entry.name]) {
        comment += "\n\nThis method is **not** available for normal users";
      }
      if (errors.throws[entry.name]) {
        comment += `

This method *may* throw one of these errors: ${errors.throws[entry.name].join(", ")}`;
      }
    }
  }
  if (comment) ret += `${jsComment(comment)}
`;
  let genericsString = "";
  const genericsIndex = {};
  if (entry.generics?.length) {
    genericsString = "<";
    entry.generics.forEach((it, idx) => {
      if (it.type !== "Type") {
        throw new Error("Only Type generics are supported");
      }
      const tsType = `${baseNamespace}TlObject`;
      genericsIndex[it.name] = 1;
      if (idx !== 0) {
        throw new Error("Multiple generics are not supported");
      }
      genericsString += `${it.name} extends ${tsType} = ${tsType}`;
    });
    genericsString += ">";
  }
  ret += `interface ${entryFullTypeName(entry)}${genericsString} {
    _: '${entry.name}';
`;
  entry.arguments.forEach((arg) => {
    if (arg.type === "#") {
      if (withFlags) {
        ret += `    ${arg.name}: number;
`;
      }
      return;
    }
    if (arg.comment) {
      ret += `${indent(4, jsComment(arg.comment))}
`;
    }
    ret += `    ${snakeToCamel(arg.name)}`;
    if (arg.typeModifiers?.predicate) ret += "?";
    let type = arg.type;
    let typeFinal = false;
    if (type[0] === "!") type = type.substring(1);
    if (type in genericsIndex) {
      typeFinal = true;
    }
    let typeNamespace = baseNamespace;
    if (extendsSchema) {
      const { ownSchema, namespace } = extendsSchema;
      const exists = arg.type[0].match(/[A-Z]/) ? arg.type in ownSchema.unions : arg.type in ownSchema.classes;
      if (!exists) {
        typeNamespace = `${namespace}.`;
      }
    }
    if (!typeFinal) {
      type = fullTypeName(arg.type, typeNamespace, {
        typeModifiers: arg.typeModifiers
      });
    }
    ret += `: ${type};
`;
  });
  ret += "}";
  return ret;
}

// packages/tl-utils/src/schema.ts
function parseFullTlSchema(entries) {
  const ret = {
    entries,
    classes: {},
    methods: {},
    unions: {}
  };
  entries.forEach((entry) => {
    const kind = entry.kind === "class" ? "classes" : "methods";
    ret[kind][entry.name] = entry;
    if (kind === "classes") {
      const type = entry.type;
      if (!(type in ret.unions)) {
        ret.unions[type] = {
          name: type,
          classes: []
        };
      }
      ret.unions[type].classes.push(entry);
    }
  });
  return ret;
}

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
function tryResolveMtcuteFrom(fromDir) {
  const req = createRequire(join(fromDir, "__stub.js"));
  for (const pkg of PLATFORM_PACKAGES) {
    try {
      req.resolve(pkg);
      const pkgJsonPath = join(fromDir, "node_modules", pkg.replace("/", "/".replace("/", "/")), "package.json");
      let version = "unknown";
      try {
        const entry = req.resolve(pkg);
        const pkgDir = findPackageRoot(req, dirname(entry));
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
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
    const content = readFileSync(pnpmWsPath, "utf8");
    const match = content.match(/packages:\s*\n((?:\s+-\s+.+\n?)+)/);
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
function resolveMtcuteFile(subpath) {
  return resolveFromWorkspaces((req) => {
    for (const pkg of PLATFORM_PACKAGES) {
      try {
        return req.resolve(`${pkg}/${subpath}`);
      } catch {
      }
    }
    for (const pkg of PLATFORM_PACKAGES) {
      try {
        const entry = req.resolve(`${pkg}`);
        const pkgDir = findPackageRoot(req, dirname(entry));
        const pkgReq = createRequire(join(pkgDir, "__stub.js"));
        for (const targetPkg of PLATFORM_PACKAGES) {
          try {
            return pkgReq.resolve(`${targetPkg}/${subpath}`);
          } catch {
          }
        }
      } catch {
      }
    }
    return null;
  });
}
function fuzzyMatch(query, items, getName) {
  const queryLower = query.toLowerCase();
  const exact = items.filter((item) => getName(item).toLowerCase() === queryLower);
  if (exact.length > 0) return { exact, fuzzy: [] };
  const fuzzy = items.map((item) => {
    const name2 = getName(item);
    return { item, name: name2, dist: (0, import_fastest_levenshtein.distance)(queryLower, name2.toLowerCase()) };
  }).sort((a, b) => a.dist - b.dist);
  return { exact: [], fuzzy };
}
function autoCorrectOrFail(query, fuzzy, partialMatches) {
  if (partialMatches.length > 0) {
    console.error(`No exact match for "${query}". Similar:`);
    for (const name2 of partialMatches.slice(0, 20)) {
      console.error(`  ${name2}`);
    }
  } else if (fuzzy.length > 0 && fuzzy[0].dist <= 5) {
    console.error(`No match for "${query}". Did you mean:`);
    for (const s of fuzzy.filter((s2) => s2.dist <= 5).slice(0, 10)) {
      console.error(`  ${s.name}`);
    }
  } else {
    console.error(`Nothing found matching "${query}"`);
  }
  process.exit(1);
}
function tryAutoCorrect(query, fuzzy) {
  if (fuzzy.length === 0 || fuzzy[0].dist > 2) return null;
  const bestDist = fuzzy[0].dist;
  const atBest = fuzzy.filter((s) => s.dist === bestDist);
  if (atBest.length === 1) {
    console.error(`(assuming "${atBest[0].name}" for "${query}")`);
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

// .claude/_skills/using-mtcute/tools/get-constructor.ts
var { flags, positional: name } = parseArgs();
var withReferences = flags.has("--with-references");
if (!name) {
  console.error("Usage: node get-constructor.js [--with-references] <name>");
  console.error();
  console.error("Accepts TL names (user, messages.sendMessage) or TS type names (RawUser, TypeInputUser, tl.RawUser)");
  process.exit(1);
}
var apiSchema = JSON.parse(await readFile(resolveMtcuteFile("tl/api-schema.json"), "utf8"));
var mtpSchema = JSON.parse(await readFile(resolveMtcuteFile("tl/mtp-schema.json"), "utf8"));
var allEntries = [...apiSchema.e, ...mtpSchema];
var schema = parseFullTlSchema(allEntries);
function normalizeTsName(input) {
  let s = input.replace(/^tl\./, "");
  const dotIdx = s.indexOf(".");
  let ns = "";
  if (dotIdx !== -1) {
    const prefix = s.slice(0, dotIdx);
    const rest = s.slice(dotIdx + 1);
    if (rest.startsWith("Raw") || rest.startsWith("Type")) {
      ns = prefix;
      s = rest;
    }
  }
  if (s.startsWith("Type")) {
    const unionName = s.slice(4);
    return { tlNames: [ns ? `${ns}.${unionName}` : unionName], isUnion: true };
  }
  if (s.startsWith("Raw")) {
    let rest = s.slice(3);
    if (rest.endsWith("Request")) {
      rest = rest.slice(0, -7);
      rest = rest.charAt(0).toLowerCase() + rest.slice(1);
      return { tlNames: [ns ? `${ns}.${rest}` : rest], isUnion: false };
    }
    rest = rest.charAt(0).toLowerCase() + rest.slice(1);
    return { tlNames: [ns ? `${ns}.${rest}` : rest], isUnion: false };
  }
  return { tlNames: [input], isUnion: false };
}
function findMatches(query) {
  const { tlNames, isUnion: isUnion2 } = normalizeTsName(query);
  for (const tlName of tlNames) {
    const nameLower = tlName.toLowerCase();
    if (isUnion2) {
      const union = Object.values(schema.unions).find((u) => u.name.toLowerCase() === nameLower);
      if (union) return { entries: union.classes, isUnion: true };
    }
    const exact = allEntries.filter((e) => e.name.toLowerCase() === nameLower);
    if (exact.length > 0) return { entries: exact, isUnion: false };
  }
  return { entries: [], isUnion: false };
}
var { entries: matches, isUnion } = findMatches(name);
if (matches.length === 0) {
  const allNames = [
    ...allEntries.map((e) => e.name),
    ...Object.values(schema.unions).map((u) => u.name)
  ];
  const { fuzzy } = fuzzyMatch(name, allNames, (n) => n);
  const partial = allEntries.filter((e) => e.name.toLowerCase().includes(name.toLowerCase()));
  const corrected = tryAutoCorrect(name, fuzzy);
  if (corrected) {
    const result = findMatches(corrected);
    matches = result.entries;
    isUnion = result.isUnion;
  }
  if (matches.length === 0) {
    autoCorrectOrFail(name, fuzzy, partial.map((e) => `${e.name} (${e.kind})`));
  }
}
var printed = /* @__PURE__ */ new Set();
function printEntry(entry) {
  if (printed.has(entry.name)) return;
  printed.add(entry.name);
  console.log(`--- ${entry.kind}: ${entry.name} ---`);
  console.log();
  console.log("TL definition:");
  console.log(writeTlEntryToString(entry));
  console.log();
  console.log("TypeScript type:");
  console.log(generateTypescriptDefinitionsForTlEntry(entry));
  if (entry.kind === "class" && schema.unions[entry.type]) {
    const union = schema.unions[entry.type];
    console.log();
    console.log(`Union: Type${entry.type.charAt(0).toUpperCase()}${entry.type.slice(1)} = ${union.classes.map((c) => c.name).join(" | ")}`);
  }
  if (entry.kind === "method") {
    console.log();
    console.log(`Returns: ${entry.type}`);
  }
  console.log();
}
function collectReferencedTypes(entry) {
  const refs = [];
  const seen = /* @__PURE__ */ new Set();
  function addType(typeName) {
    if (seen.has(typeName)) return;
    seen.add(typeName);
    const union = schema.unions[typeName];
    if (union) {
      for (const cls2 of union.classes) {
        refs.push(cls2);
      }
      return;
    }
    const cls = schema.classes[typeName];
    if (cls) {
      refs.push(cls);
    }
  }
  for (const arg of entry.arguments) {
    addType(arg.type);
  }
  if (entry.kind === "method") {
    addType(entry.type);
  }
  return refs;
}
if (isUnion) {
  const { tlNames } = normalizeTsName(name);
  console.log(`=== Union: Type${tlNames[0].charAt(0).toUpperCase()}${tlNames[0].slice(1)} ===`);
  console.log(`Classes: ${matches.map((c) => c.name).join(" | ")}`);
  console.log();
}
for (const entry of matches) {
  printEntry(entry);
}
if (withReferences && matches.length > 0) {
  const allRefs = [];
  for (const entry of matches) {
    allRefs.push(...collectReferencedTypes(entry));
  }
  const unique = allRefs.filter((e) => !printed.has(e.name));
  if (unique.length > 0) {
    console.log("========== Referenced types ==========");
    console.log();
    for (const entry of unique) {
      printEntry(entry);
    }
  }
}
