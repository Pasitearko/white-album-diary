// 从 index.html 里抽内联 <script> 块，在受控的桩全局下求值。
// 站点是单文件、零构建，所以模块本身没法被 import —— 这是唯一的真源码入口。
import fs from 'node:fs';

// 只有带交接标记的块才是「模块」。
// 站点其余脚本（CDN 兜底换源、壁纸预载、以及第 2191 行起的整个 App）会去碰
// location / document，抽出来在 Node 里跑没有意义 —— 窄选取比广选取稳。
const HANDOFF = '__tasteModules';

export function inlineBlocks(html) {
  const out = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const line = html.slice(0, m.index).split('\n').length;
    out.push({ line, src: m[1] });
  }
  return out;
}

export function moduleBlocks(html, marker = HANDOFF) {
  return inlineBlocks(html).filter((b) => b.src.includes(marker));
}

// window 只允许「模块交接」这一件事；读任何别的属性都抛错，
// 于是「模块碰了全局」会当场变成测试失败，而不是悄悄过去。
// 注意 has 必须返回 true：源码里写着 typeof window !== 'undefined'，不这样写模块根本不会交接。
export function makeWindowStub() {
  let mods = null;
  const stub = {};
  Object.defineProperty(stub, '__tasteModules', {
    get() { return mods; },
    set(v) {
      if (mods !== null) throw new Error('__tasteModules 被写了两次 —— 脚本块求值了不止一次？');
      mods = v;
    },
    enumerable: true,
    configurable: false,
  });
  return new Proxy(stub, {
    has(t, k) {
      if (k === '__tasteModules') return Reflect.has(t, k);
      return true; // 骗过 typeof window !== 'undefined'
    },
    get(t, k) {
      if (k === '__tasteModules') return mods;
      throw new ReferenceError(
        'index.html 的模块碰了全局 window.' + String(k) + ' —— 存储层必须靠构造参数注入，不许读全局'
      );
    },
  });
}

// 语言内建（ECMAScript / ECMA-402）。模块用它们是正当的。
const LANGUAGE_BUILTINS = [
  'globalThis', 'Infinity', 'NaN', 'undefined',
  'Object', 'Boolean', 'Symbol', 'Error', 'AggregateError', 'EvalError',
  'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError',
  'Number', 'BigInt', 'Math', 'Date', 'String', 'RegExp', 'Array', 'Int8Array',
  'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array',
  'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'WeakRef', 'FinalizationRegistry',
  'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Atomics', 'JSON',
  'Promise', 'Proxy', 'Reflect', 'Intl', 'Iterator',
  // 注意：Function 刻意不在这里。它是逃逸通道，必须留给 HOST_OBJECTS 遮蔽成 undefined。
  // 以前它同时出现在两份名单里，结果是形参遮蔽赢、`new Function` 报 TypeError 而不是
  // 被 has 陷阱拦下 —— 安全但消息误导，测试也只能写出「两种错都接受」的模糊断言。
];

// 刻意**不**在这个名单里的宿主对象（写进去就该当场炸）：
// indexedDB / localStorage / sessionStorage / document / window.devicePixelRatio /
// fetch / Blob / File / FileReader / Image / URL / location / navigator / alert / setTimeout
// —— 它们全都必须由构造参数注入，或者由调用方在模块外面处理好。
export const HOST_OBJECTS = [
  'indexedDB', 'localStorage', 'sessionStorage', 'document', 'fetch', 'Blob', 'File',
  'FileReader', 'Image', 'URL', 'location', 'navigator', 'alert', 'setTimeout',
  'requestAnimationFrame', 'getComputedStyle', 'matchMedia', 'showDirectoryPicker',
  'crypto', 'performance', 'history', 'screen', 'innerWidth', 'addEventListener',
  // Function 是逃逸通道：new Function('return this')() 就能挣回真全局，所以它也不能放行
  'Function',
];

// 只注入 window 和语言内建。裸标识符由 Proxy.has 劫持，
// 所以模块里直接写 indexedDB / localStorage / document 都会当场抛错。
export function evalModuleFenced(src, win, allowed = LANGUAGE_BUILTINS) {
  // 形参只放 window 和宿主对象；语言内建**不**当形参，否则会把真的 Map/Promise 遮蔽成 undefined。
  const names = ['window', ...HOST_OBJECTS];
  const args = names.map((n) => (n === 'window' ? win : undefined));
  // 宿主对象全部绑成 undefined —— 这是关键：它们既不能当裸全局读到，
  // 也不能顺着 globalThis.indexedDB 爬回真身（那个名字已经被形参遮蔽了）。
  // eslint-disable-next-line no-new-func
  const fn = new Function(...names, 'fence', 'with (fence) { ' + src + '\n}');
  fn(...args, makeFence(allowed));
}

function makeFence(allowed) {
  const ok = new Set(['window', ...allowed]); // window 是唯一允许的注入点
  return new Proxy({}, {
    has(_t, k) {
      if (typeof k === 'symbol') return false;
      return !ok.has(k); // 注入的名字走真作用域（形参），其余劫持
    },
    get(_t, k) {
      if (typeof k === 'symbol') return undefined;
      if (ok.has(k)) return undefined;
      throw new ReferenceError(
        'index.html 的存储后端碰了全局 ' + String(k) + ' —— 必须靠构造参数注入，不许读全局'
      );
    },
  });
}

// 求值模块块。返回 window 桩，模块挂在它的 __tasteModules 上。
export function loadStoreModule(path, marker = HANDOFF, allowed = LANGUAGE_BUILTINS) {
  const html = fs.readFileSync(path, 'utf8');
  const blocks = moduleBlocks(html, marker);
  if (blocks.length === 0) return makeWindowStub(); // 模块还没落地 —— 让断言去报错
  const win = makeWindowStub();
  for (const b of blocks) evalModuleFenced(b.src, win, allowed);
  return win;
}
