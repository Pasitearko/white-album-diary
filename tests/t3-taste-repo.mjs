// T3 / issue #6 品味库条目仓库 —— 契约单测。
// 零依赖：node:assert + node:test，直接 node tests/t3-taste-repo.mjs 就能跑。
//
// 这一层的全部意义在于「它不认识任何全局对象」：存储后端由构造参数注入，
// 所以单测能把 T1 的 MemoryStore 换进去，在 Node 里直接跑，不需要浏览器。
import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { moduleBlocks, evalModuleFenced, makeWindowStub } from './lib/inline.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(HERE, '..', 'index.html');

// 读一份**干净的**模块实例。契约测试之间不能通过模块级缓存互相串味。
// 每条用例都从这里取模块 —— 不另走第二条求值路径，否则「交接」那条用例
// 验的就不是其余用例正在验的那份代码了。
function freshModules() {
  const blocks = moduleBlocks(fs.readFileSync(INDEX, 'utf8'));
  const w = makeWindowStub();
  for (const b of blocks) evalModuleFenced(b.src, w);
  return w.__tasteModules;
}

// 一个受控的时钟，用来把 createdAt / updatedAt 钉死，避免同毫秒竞态。
function fixedClock(t0 = 1_700_000_000_000) {
  let t = t0;
  const clock = () => (t += 1000);
  clock.set = (v) => { t = v; };
  return clock;
}

// createTasteRepo 是异步的（要先等后端就绪、再读回已有条目），所以这里也得 await。
async function makeRepo(mods, store, clock) {
  return mods.createTasteRepo({ store, clock: clock || fixedClock() });
}

// 造一条样例。over 里显式给了 title 就用它，否则给一个按序号区分的默认标题
// —— 早先这里把 title 写死在最后展开，结果它会把调用方传进来的 title 悄悄盖掉。
function sample(n, over) {
  const base = {
    title: 'Stillpage ' + n,
    subtitle: 'warm editorial × print DNA',
    url: 'https://example.com/stillpage' + n,
    tags: ['halftone CMYK dot texture', 'warm paper ground'],
    category: 'Print-Tech Paper',
    note: '排版参考',
    type: 'link',
    images: [],
  };
  return Object.assign(base, over || {});
}

test('模块交接了 createTasteRepo', () => {
  const mods = freshModules();
  assert.ok(mods, 'index.html 里没有找到 window.__tasteModules');
  assert.equal(typeof mods.createTasteRepo, 'function', '导出里没有 createTasteRepo');
});

test('新增、更新、删除分别可用（更新与删除不存在的条目都要抛可识别的失败信号）', async () => {
  const mods = freshModules();
  const repo = await makeRepo(mods, new mods.MemoryStore());

  const a = await repo.add(sample(1));
  assert.ok(a.id, '新增后应当拿到一个 id');
  assert.equal((await repo.list()).length, 1, '新增后列表里应当有它');

  const b = await repo.add(sample(2));
  assert.notEqual(a.id, b.id, '两件条目的 id 不能撞');
  assert.deepEqual((await repo.list()).map((x) => x.id).sort(), [a.id, b.id].sort());

  const before = await repo.get(a.id);
  await repo.update(a.id, { title: '改过的标题' });
  const after = await repo.get(a.id);
  assert.equal(after.title, '改过的标题', '更新要真的写进去');
  assert.equal(after.createdAt, before.createdAt, 'createdAt 是收录时间，更新不许改它');
  assert.ok(after.updatedAt > before.updatedAt, 'updatedAt 要往前走');

  await repo.delete(a.id);
  assert.equal(await repo.get(a.id), undefined, '删后读不到');
  assert.equal((await repo.list()).length, 1);

  // 两条路径都要给同一个可识别的 code：站内把「可识别的失败信号」当硬要求，
  // 只测删除不测更新，等于把一半的契约留在没被钉住的地方。
  await assert.rejects(() => repo.delete(a.id), (err) => err && err.code === 'KEY_NOT_FOUND',
    '删除不存在的条目要抛可识别的失败信号，不能静默成功');
  await assert.rejects(() => repo.update('taste_根本不存在', { title: 'x' }),
    (err) => err && err.code === 'KEY_NOT_FOUND',
    '更新不存在的条目同样要抛 KEY_NOT_FOUND，不能悄悄新增一条或静默成功');
  assert.equal((await repo.list()).length, 1, '失败的更新不许在库里留下任何东西');
});

test('条目按 createdAt 倒序，最新的排在最前', async () => {
  const mods = freshModules();
  const repo = await makeRepo(mods, new mods.MemoryStore());
  const older = await repo.add(sample(1));
  const newer = await repo.add(sample(2));
  // 再造一条，时间戳明确落在两条之间，检验的不是「插入顺序」而是「createdAt 排序」
  const middle = await repo.add(sample(3, { createdAt: older.createdAt + 1 }));

  const ids = (await repo.list()).map((x) => x.id);
  assert.deepEqual(ids, [newer.id, middle.id, older.id]);
});

test('搜索对五个字段各命中一次都能返回该条目，且大小写不敏感', async () => {
  const mods = freshModules();
  const repo = await makeRepo(mods, new mods.MemoryStore());
  // 五个字段各塞一个只有它有、别的字段都没有的探针词，逐字段搜它自己那个词。
  // 判据是「每个字段都能被搜到」，所以探针必须逐字段不同，否则一次命中就能冒充五次。
  const probes = {
    title: 'zebrafish',
    subtitle: 'provencal',
    note: 'incunabula',
    url: 'quixotic',
    tags: 'omphalos',
  };
  await repo.add(sample(1, {
    title: 'A ' + probes.title,
    subtitle: 'B ' + probes.subtitle,
    note: 'C ' + probes.note,
    url: 'https://example.com/' + probes.url,
    tags: ['D ' + probes.tags],
  }));
  await repo.add(sample(2, { title: '完全无关的一条' }));

  for (const field of Object.keys(probes)) {
    const hits = await repo.list({ search: probes[field] });
    assert.equal(hits.length, 1, '搜索命中 ' + field + ' 时应当只筛出那一条');
    assert.equal(hits[0].title, 'A ' + probes.title);
  }

  assert.equal((await repo.list({ search: 'ZeBrAfIsH' })).length, 1, '搜索要大小写不敏感');
  assert.equal((await repo.list({ search: '   ' })).length, 2, '空白搜索词等于没筛');
});

test('标签多选取交集；结果为空时返回空列表而不是全部', async () => {
  const mods = freshModules();
  const repo = await makeRepo(mods, new mods.MemoryStore());
  const both = await repo.add(sample(1, { tags: ['设计', '排版'] }));
  const one = await repo.add(sample(2, { tags: ['设计'] }));
  await repo.add(sample(3, { tags: ['摄影'] }));

  const hit = await repo.list({ tags: ['设计', '排版'] });
  assert.deepEqual(hit.map((x) => x.id), [both.id], '取交集：两颗都有的才留下');

  const single = await repo.list({ tags: ['设计'] });
  assert.deepEqual(single.map((x) => x.id).sort(), [both.id, one.id].sort());

  const empty = await repo.list({ tags: ['设计', '不存在的标签'] });
  assert.deepEqual(empty, [], '筛不出东西要返回空列表，不能退化成返回全部');

  assert.equal((await repo.list({ tags: [] })).length, 3, '空标签筛选等于没筛');
});

test('编号随筛选结果重算', async () => {
  const mods = freshModules();
  const repo = await makeRepo(mods, new mods.MemoryStore());
  for (let i = 0; i < 200; i++) await repo.add(sample(i, { tags: i < 12 ? ['入选'] : ['其它'] }));

  const all = await repo.list();
  assert.equal(all.length, 200);
  assert.deepEqual(repo.numbering(all, 0), { index: 1, total: 200 });

  const picked = await repo.list({ tags: ['入选'] });
  assert.equal(picked.length, 12);
  assert.deepEqual(repo.numbering(picked, 0), { index: 1, total: 12 }, '筛出 12 件时总数就是 12');
  assert.deepEqual(repo.numbering(picked, 5), { index: 6, total: 12 });

  const none = await repo.list({ search: '没有任何东西叫这个名字' });
  assert.equal(none.length, 0);
  // 空筛选结果下的编号是显式契约而不是巧合：total 为 0 时 index 兜到 1，
  // 卡片上会显示「01 / 00」，要不要挡住它是渲染层（T7）的决定。
  assert.deepEqual(repo.numbering(none, 0), { index: 1, total: 0 });

  // 越界的下标被防御性钳位，不会返回负序号或越过总数（正常调用不会走到这里，
  // 因为 i 是渲染循环里的真实下标；这条断言把这个语义钉成显式的）。
  assert.deepEqual(repo.numbering(picked, -1), { index: 1, total: 12 }, '负下标钳到第一项');
  assert.deepEqual(repo.numbering(picked, 99), { index: 12, total: 12 }, '超界下标钳到最后一项');
});

test('读得懂早期格式的裸数组快照，不会把库读空', async () => {
  const mods = freshModules();
  const store = new mods.MemoryStore();
  // 早期格式：store 里直接就是条目数组，没有 { version, items } 信封。
  // 这条兼容分支没有测试钉住就等于没有，而它一坏就是把用户的库读成空的。
  await store.set('yuki_taste_v1', [
    sample(1, { id: 'taste_old_1', createdAt: 1_600_000_000_000 }),
    sample(2, { id: 'taste_old_2', createdAt: 1_600_000_001_000 }),
  ]);

  const repo = await makeRepo(mods, store);
  assert.equal((await repo.list()).length, 2, '裸数组快照要能读出来');
  assert.equal((await repo.get('taste_old_1')).title, 'Stillpage 1');

  // 读进来之后再写回去，是带着信封的新格式
  await repo.add(sample(3));
  const written = await store.get('yuki_taste_v1');
  assert.equal(written.version, 1, '写回时要升级成带版本号的信封');
  assert.equal(written.items.length, 3);
});

test('注入的存储不满足契约时，构造要当场拒绝', async () => {
  const mods = freshModules();
  await assert.rejects(() => mods.createTasteRepo({}), (err) => err instanceof TypeError,
    '没给存储后端要抛 TypeError，而不是等到第一次读库才炸');
  await assert.rejects(() => mods.createTasteRepo({ store: { get: () => {} } }), (err) => err instanceof TypeError,
    '只给了半个后端（缺 set）也要拒绝');
  await assert.rejects(() => mods.createTasteRepo({ store: { get: () => {}, set: () => {} } }),
    (err) => err instanceof TypeError,
    '删除路径要用 store.delete，所以只有 get/set 的后端也算不合格');
});

test('图片字节不跟着元数据落进 store：信封里只留 id / name / addedAt', async () => {
  const mods = freshModules();
  const store = new mods.MemoryStore();
  const repo = await makeRepo(mods, store);
  // T5 会把缩略图压成 data URL 塞进条目；那些字节的归宿是 IndexedDB，不是 localStorage。
  const dataUrl = 'data:image/jpeg;base64,' + 'A'.repeat(2048);
  await repo.add(sample(1, {
    images: [{ id: 'img_1', dataUrl: dataUrl, name: 'cover.jpg', addedAt: 1700000000000 }],
  }));

  const written = await store.get('yuki_taste_v1');
  const img = written.items[0].images[0];
  assert.equal(img.id, 'img_1', '图片的 id 要留着 —— 渲染层靠它去 IndexedDB 取图');
  assert.equal(img.name, 'cover.jpg');
  assert.equal(img.addedAt, 1700000000000);
  assert.equal('dataUrl' in img, false, 'base64 不许进 store 载荷');
  assert.ok(JSON.stringify(written).length < 1000,
    '载荷不该被图片字节撑大，实测长度 ' + JSON.stringify(written).length);
});

test('剥掉图片数据只影响落盘载荷，不影响调用方刚拿到的那个条目', async () => {
  const mods = freshModules();
  const repo = await makeRepo(mods, new mods.MemoryStore());
  const dataUrl = 'data:image/jpeg;base64,BBBB';
  const added = await repo.add(sample(1, { images: [{ id: 'img_1', dataUrl: dataUrl, name: 'c.jpg' }] }));
  assert.equal(added.images[0].dataUrl, dataUrl, '返回给调用方的条目要原样带图，否则卡片当场变空白');
  assert.equal((await repo.get(added.id)).images[0].dataUrl, dataUrl, '本轮会话内读回来也还带着图');
});

test('仓库从注入的存储里恢复：新建实例能读回上一条数据', async () => {
  const mods = freshModules();
  const store = new mods.MemoryStore();
  const clock = fixedClock();
  const repo = await makeRepo(mods, store, clock);
  const a = await repo.add(sample(1));

  const elsewhere = await mods.createTasteRepo({ store: new mods.MemoryStore() });
  assert.deepEqual(await elsewhere.list(), [], '换一个存储就应当是空库（证明它读的是注入的那个）');

  const reopened = await makeRepo(mods, store, clock);
  const back = await reopened.get(a.id);
  assert.ok(back, '用同一个存储新建仓库，数据应当能读回来');
  assert.equal(back.title, a.title);
  assert.deepEqual(back.tags, a.tags);
});

// 这条测的其实是辅助库的围栏本身（T1 的回归护栏），不是被测模块 —— 名字要说实话。
// 真模块的隔离性由 freshModules() 在桩 window 下求值来保证：源码里任何裸全局
// 都会在求值那一刻当场抛错，不必等这条用例来抓。
test('纯度门禁本身还能拦住裸全局（辅助库的回归护栏）', () => {
  const fence = (src) => evalModuleFenced(src, makeWindowStub());
  for (const bad of ['var a = localStorage;', 'var b = indexedDB;', 'var c = document;', 'var d = window.__x;']) {
    assert.throws(() => fence(bad), /碰了全局/, '门禁本身要还能拦下：' + bad);
  }
});
