// T1 / issue #2 存储后端适配层 —— 契约单测。
// 零依赖：node:assert + node:test，直接 node tests/t1-store-backend.mjs 就能跑。
// 测的是 index.html 里的真源码，不是副本：harness 抽内联脚本块，在桩全局下求值。
import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStoreModule, evalModuleFenced, makeWindowStub } from './lib/inline.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(HERE, '..', 'index.html');

const win = loadStoreModule(INDEX);
const M = win.__tasteModules;

test('模块通过 window.__tasteModules 交接', () => {
  assert.ok(M, 'index.html 里没有找到 window.__tasteModules —— 存储后端适配层还没落地');
  assert.equal(typeof M.makeKeyNotFoundError, 'function');
  assert.equal(typeof M.MemoryStore, 'function');
  assert.equal(typeof M.makeIndexedDBStore, 'function');
});

test('两种后端都满足同一份契约（内存 + 假 IndexedDB）', async (t) => {
  const cases = [
    ['MemoryStore', () => new M.MemoryStore()],
    ['IndexedDBStore', () => new (M.makeIndexedDBStore(fakeIndexedDB()))('yuki-taste-test')],
  ];
  for (const [label, make] of cases) {
    await t.test(label, async () => {
      const store = make();
      await store.ready;
      assert.deepEqual(await store.keys(), [], '初始应当是空的');
      assert.equal(await store.get('nope'), undefined, '读不存在的键返回 undefined，不抛错');

      await store.set('a', { title: 'Stillpage', n: 1 });
      await store.set('b', 'plain');
      assert.deepEqual(await store.get('a'), { title: 'Stillpage', n: 1 });
      assert.equal(await store.get('b'), 'plain');

      const blob = new Blob([new Uint8Array([1, 2, 3, 255])], { type: 'image/jpeg' });
      await store.set('img', blob);
      const back = await store.get('img');
      assert.equal(back.type, 'image/jpeg');
      assert.deepEqual(new Uint8Array(await back.arrayBuffer()), new Uint8Array([1, 2, 3, 255]));

      assert.deepEqual((await store.keys()).sort(), ['a', 'b', 'img']);

      await store.delete('a');
      assert.equal(await store.get('a'), undefined, '删后读不到');
      assert.deepEqual((await store.keys()).sort(), ['b', 'img']);

      await assert.rejects(() => store.delete('a'), (err) => err && err.code === 'KEY_NOT_FOUND',
        '删不存在的键要抛可识别的失败信号，不能静默成功');

      if (store.close) store.close();
    });
  }
});

test('MemoryStore 的键不会互相串味', async () => {
  const a = new M.MemoryStore();
  const b = new M.MemoryStore();
  await a.set('x', 1);
  assert.equal(await b.get('x'), undefined);
  assert.deepEqual(await b.keys(), []);
});

test('IndexedDBStore 不缓存已关闭的连接（close 后新开一次）', async () => {
  const idb = fakeIndexedDB();
  const store = new (M.makeIndexedDBStore(idb))('yuki-taste-test-2');
  await store.ready;
  await store.set('k', 'v');
  store.close();
  assert.equal(await store.get('k'), 'v', 'close 之后应当能重新打开并读回');
});

// 门禁本身也要被验：一个假模块故意碰宿主对象，必须被拦下来。
// 否则「不引用任何全局对象」就只是我嘴上的说法，不是被证明的事实。
test('纯度门禁能抓住裸全局、够不着宿主对象、也堵死了 Function 逃逸', () => {
  const fence = (src) => evalModuleFenced(src, makeWindowStub());
  for (const bad of ['var a = indexedDB;', 'var b = localStorage;', 'var c = document;', 'var d = fetch;']) {
    assert.throws(() => fence(bad), /碰了全局/, '应当拦下：' + bad);
  }

  // 内建对象是正当的，不该误伤（包进 IIFE —— 真实的模块块就是这么写的，
  // 而在 with 作用域里直接 var 声明名字会被 has 陷阱劫持，那是 with 的固有脾气，不是缺陷）
  assert.doesNotThrow(() => fence('(function(){ window.__tasteModules = { ok: 1 }; })();'));
  assert.doesNotThrow(() => fence('(function(){ var m = new Map(); m.set(1, new Promise(function(){})); })();'));

  // 宿主对象被形参遮蔽成 undefined —— 所以 globalThis 这条道够不着真身。
  // （真身确实存在：这一行在 Node 里能拿到真 fetch，见下面的对照）
  assert.equal(fence('(function(){ return globalThis.fetch; })();'), undefined,
    'globalThis.fetch 必须是 undefined，说明形参遮蔽真的生效了');
  assert.equal(typeof globalThis.fetch, 'function', '对照：Node 里 globalThis.fetch 本来是真的存在');

  // 而且不能靠 Function 构造器给自己挣一个真全局。
  // Function 刻意不在语言内建名单里，所以它落进栅栏的 has 陷阱，当场 ReferenceError；
  // 就算它漏过去，也只会拿到被绑成 undefined 的形参（下一次修改两边任一生效都拦得住）。
  assert.throws(() => fence('var g = new Function("return typeof process");'),
    /碰了全局 Function|Function is not a constructor/,
    'Function 必须够不着，否则一行 eval 就能逃出栅栏');
});

// —— 一个够用的假 IndexedDB：只实现这张票用到的那一小撮结构化克隆语义。
function fakeIndexedDB() {
  const dbs = new Map();
  let opened = 0;

  function makeDB() {
    const stores = new Map();
    return {
      objectStoreNames: { contains: (n) => stores.has(n) },
      createObjectStore: (n) => { stores.set(n, new Map()); return {}; },
      transaction() {
        const name = arguments[0];
        if (!stores.has(name)) throw new Error('NOT_FOUND_ERR: object store ' + name);
        const tx = { oncomplete: null, onerror: null, onabort: null, error: null, objectStore: () => storeAPI(stores.get(name)) };
        queueMicrotask(() => queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); }));
        return tx;
      },
      close() {},
    };
  }

  function storeAPI(map) {
    return {
      get: (k) => req(() => structuredClone(map.get(k))),
      put: (v, k) => req(() => { map.set(k, structuredClone(v)); return undefined; }),
      delete: (k) => req(() => { map.delete(k); return undefined; }),
      getAllKeys: () => req(() => [...map.keys()]),
    };
    function req(run) {
      let done = false;
      const r = { result: undefined, error: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        try { r.result = run(); }
        catch (e) { r.error = e; if (r.onerror) return r.onerror({ target: r }); throw e; }
        done = true;
        if (r.onsuccess) r.onsuccess({ target: r });
      });
      void done;
      return r;
    }
  }

  return {
    open(name) {
      const r = { result: null, error: null, onupgradeneeded: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        let db = dbs.get(name);
        let upgraded = false;
        if (!db) { db = makeDB(); dbs.set(name, db); upgraded = true; }
        r.result = db;
        if (upgraded && r.onupgradeneeded) r.onupgradeneeded({ target: r });
        if (r.onsuccess) r.onsuccess({ target: r });
      });
      return r;
    },
    get _opened() { return opened++; },
  };
}
