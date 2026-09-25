// T4 / issue #7：品味库落盘这一层。
//
// 这一层是纯函数 + 一个「不吃全局、只吃注入的目录句柄」的镜像器，所以能在这里
// 用 node:assert 直接测：给一个假目录句柄（记录所有写入、能查任意路径），
// 断言产出的文件路径与内容。真机那一半由 .shots/probe-t4-disk.mjs 在浏览器里跑
// （file:// 下拿不到真目录句柄，那个探针会把站点用 http 起起来走 OPFS）。
//
// 规格里三层持久化是：localStorage 只放条目元数据、IndexedDB 放缩略图 Blob、
// 磁盘是镜像。T3 的仓库写进 store 的载荷**已经剥掉** images[].dataUrl，
// 所以「图还在不在」只能问 IndexedDB —— 这个文件的后半段测的就是那个入口。
//
// 运行：node tests/t4-disk-mirror.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { moduleBlocks, makeWindowStub, evalModuleFenced } from './lib/inline.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const INDEX = join(HERE, '..', 'index.html');

// —— 假目录句柄：只提供这一层真正会用到的那几个方法 ——
// 故意不实现 `entries()` / `keys()`：磁盘句柄在真实事件里没有可靠的枚举手段，
// 所以「清掉多余文件」只能靠调用方传进来的记忆，不能靠现读目录。
function fakeDir(files = {}) {
  const disk = new Map(Object.entries(files));
  const dirs = new Set();
  const pathOf = (dirPath, name) => dirPath + '/' + name;
  let removeFails = false;

  function makeDir(dirPath) {
    return {
      kind: 'directory',
      get name() { return dirPath; },
      getDirectoryHandle(name, opts = {}) {
        if (!opts.create && !dirs.has(pathOf(dirPath, name))) throw new Error('NotFoundError: ' + pathOf(dirPath, name));
        dirs.add(pathOf(dirPath, name));
        return Promise.resolve(makeDir(pathOf(dirPath, name)));
      },
      getFileHandle(name, opts = {}) {
        const p = pathOf(dirPath, name);
        if (!disk.has(p) && !opts.create) throw new Error('NotFoundError: ' + p);
        return Promise.resolve({
          kind: 'file',
          name,
          async createWritable() {
            let buf = null;
            return {
              async write(data) { buf = data; },
              async close() { disk.set(p, buf); },
            };
          },
          async getFile() {
            if (!disk.has(p)) throw new Error('NotFoundError: ' + p);
            return { name, _path: p, _data: disk.get(p) };
          },
        });
      },
      removeEntry(name, opts = {}) {
        if (removeFails) return Promise.reject(new Error('NotAllowedError'));
        const p = pathOf(dirPath, name);
        if (!disk.has(p) && !dirs.has(p)) throw new Error('NotFoundError: ' + p);
        disk.delete(p);
        dirs.delete(p);
        return Promise.resolve();
      },
    };
  }

  const root = makeDir('root');
  return Object.assign(root, {
    // 测试辅助：把删除整个变成硬失败，模拟权限不足
    _makeRemoveFail: () => { removeFails = true; },
    _disk: disk,
    _list: () => [...disk.keys()].filter((k) => k.startsWith('root/')).sort(),
  });
}

function freshModules() {
  const html = readFileSync(INDEX, 'utf8');
  const blocks = moduleBlocks(html);
  const win = makeWindowStub();
  for (const b of blocks) evalModuleFenced(b.src, win);
  const m = win.__tasteModules;
  assert.ok(m, 'index.html 应当通过 window.__tasteModules 交出模块');
  return m;
}

const utf8 = (d) => Buffer.from(d.buffer || d).toString('utf8');
const asText = (data) => {
  if (typeof data === 'string') return data;
  if (!data) throw new Error('磁盘上是空的：' + JSON.stringify(data));
  return utf8(data);
};

function makeItem(over = {}) {
  return Object.assign({
    id: 'taste_1700000000000_0',
    type: 'link',
    title: 'Stillpage',
    subtitle: 'warm editorial × print DNA',
    url: 'https://example.com/stillpage',
    tags: ['halftone', 'warm paper'],
    category: 'Print-Tech Paper',
    note: '像印在纸上的网页。',
    images: [],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  }, over);
}

const pngBytes = (n) => new Uint8Array([137, 80, 78, 71, n, n, n]);

test('模块通过 window.__tasteModules 交出落盘这一层的接口', () => {
  const m = freshModules();
  assert.equal(typeof m.TASTE_DIR_NAME, 'string');
  assert.equal(typeof m.tasteLibraryMarkdown, 'function');
  assert.equal(typeof m.tasteImageFilename, 'function');
  assert.equal(typeof m.mirrorTasteLibrary, 'function');
});

test('图片文件名以条目 id 开头，同一条目的多张图不会互相覆盖', () => {
  const m = freshModules();
  const id = 'taste_1700000000000_0';
  assert.equal(m.tasteImageFilename(id, 0), id + '-1.jpg');
  assert.equal(m.tasteImageFilename(id, 1), id + '-2.jpg');
  assert.equal(m.tasteImageFilename(id, 9), id + '-10.jpg');
  // id 里的引号等字符不能带进文件名
  assert.ok(!/[\\/:*?"<>|]/.test(m.tasteImageFilename('a/b"c', 0)));
});

test('汇总 markdown 按收录时间倒序，每条含标题、网址、标签、分类、笔记', () => {
  const m = freshModules();
  const older = makeItem({ id: 'taste_1', title: '旧的', createdAt: 1000, updatedAt: 1000,
    url: 'https://old.example', tags: ['甲', '乙'], category: '分类甲', note: '旧笔记' });
  const newer = makeItem({ id: 'taste_2', title: '新的', createdAt: 2000, updatedAt: 2000,
    url: '', tags: [], category: '', note: '新笔记', type: 'note' });
  const md = m.tasteLibraryMarkdown([older, newer]);

  assert.ok(md.indexOf('新的') < md.indexOf('旧的'), '倒序：新收录的排在前面');
  for (const needle of ['https://old.example', '甲', '乙', '分类甲', '旧笔记', '新笔记']) {
    assert.ok(md.includes(needle), 'markdown 里应当有 ' + needle);
  }
  // 没有网址、没有标签、没有分类时不留空洞的 `- 网址：`
  assert.ok(!/-\s*网址：\s*$/m.test(md), '没有网址就不该产出空的网址行');
  assert.ok(!/-\s*标签：\s*$/m.test(md), '没有标签就不该产出空的标签行');
  // 单文件汇总：不按条目拆成一堆小文件，所以这里只有一个字符串
  assert.equal(typeof md, 'string');
});

test('markdown 里没有条目时也是合法的一段文本', () => {
  const m = freshModules();
  const md = m.tasteLibraryMarkdown([]);
  assert.equal(typeof md, 'string');
  assert.ok(md.length > 0, '空库也要有一句话，不能是空文件');
  assert.ok(/品味库/.test(md), '空库的说明里也要出现「品味库」');
});

test('镜像写出 index.json、品味库.md、images/<id>-<n>.jpg 三样东西', async () => {
  const m = freshModules();
  const dir = fakeDir();
  const item = makeItem({
    id: 'taste_a',
    images: [
      { id: 'i1', name: 'a.jpg', addedAt: 11, dataUrl: 'data:image/jpeg;base64,AAA' },
      { id: 'i2', name: 'b.jpg', addedAt: 12, dataUrl: 'data:image/jpeg;base64,BBB' },
    ],
  });
  const calls = [];
  const res = await m.mirrorTasteLibrary({
    dir,
    items: [item],
    lastMirrored: {},
    blobFromDataUrl: async (u) => { calls.push(u); return pngBytes(u.length); },
  });

  assert.deepEqual(dir._list(), [
    'root/品味库/images/taste_a-1.jpg',
    'root/品味库/images/taste_a-2.jpg',
    'root/品味库/index.json',
    'root/品味库/品味库.md',
  ]);
  const index = JSON.parse(asText(dir._disk.get('root/品味库/index.json')));
  assert.equal(index.items.length, 1);
  assert.equal(index.items[0].id, 'taste_a');
  // 索引里不许夹带图片字节：它每轮整份覆盖写，而图片就躺在隔壁
  const rawIndex = asText(dir._disk.get('root/品味库/index.json'));
  assert.ok(!rawIndex.includes('base64'), 'index.json 里不该出现 base64 的图片字节');
  assert.equal(index.items[0].images[0].dataUrl, undefined);
  assert.equal(index.items[0].images[0].id, 'i1', '去字节只去掉 dataUrl，图片的身份信息要留着');
  assert.equal(item.images[0].dataUrl, 'data:image/jpeg;base64,AAA', '不能就地改写调用方传进来的条目');
  assert.ok(asText(dir._disk.get('root/品味库/品味库.md')).includes('Stillpage'));
  assert.equal(calls.length, 2, '两张图各解码一次');
  assert.equal(res.removed.length, 0);
  // 记忆里记的键是相对 品味库/ 的路径
  assert.ok(res.mirrored['index.json']);
  assert.ok(res.mirrored['品味库.md']);
  assert.ok(res.mirrored['images/taste_a-1.jpg']);
  assert.ok(res.mirrored['images/taste_a-2.jpg']);
});

test('删掉一条之后，它独占的图跟着消失，别人的图不受影响', async () => {
  const m = freshModules();
  const dir = fakeDir();
  const a = makeItem({ id: 'taste_a', images: [{ id: 'i1', name: 'a.jpg', addedAt: 11, dataUrl: 'data:image/jpeg;base64,AAA' }] });
  const b = makeItem({ id: 'taste_b', title: 'SPADE', createdAt: 2, images: [{ id: 'i2', name: 'b.jpg', addedAt: 12, dataUrl: 'data:image/jpeg;base64,BBB' }] });
  const blob = async () => pngBytes(1);

  const first = await m.mirrorTasteLibrary({ dir, items: [a, b], lastMirrored: {}, blobFromDataUrl: blob });
  assert.equal(dir._list().length, 4);

  const second = await m.mirrorTasteLibrary({ dir, items: [b], lastMirrored: first.mirrored, blobFromDataUrl: blob });
  assert.deepEqual(second.removed, ['images/taste_a-1.jpg']);
  assert.deepEqual(dir._list(), [
    'root/品味库/images/taste_b-1.jpg',
    'root/品味库/index.json',
    'root/品味库/品味库.md',
  ]);
  const index = JSON.parse(asText(dir._disk.get('root/品味库/index.json')));
  assert.equal(index.items.length, 1);
  assert.equal(index.items[0].id, 'taste_b');
});

test('磁盘上删除失败时不报错、不中断，剩下的文件照写', async () => {
  const m = freshModules();
  const dir = fakeDir();
  const a = makeItem({ id: 'taste_a', images: [{ id: 'i1', name: 'a.jpg', addedAt: 11, dataUrl: 'data:image/jpeg;base64,AAA' }] });
  const b = makeItem({ id: 'taste_b', title: 'SPADE', createdAt: 2, images: [{ id: 'i2', name: 'b.jpg', addedAt: 12, dataUrl: 'data:image/jpeg;base64,BBB' }] });
  const blob = async () => pngBytes(1);

  const first = await m.mirrorTasteLibrary({ dir, items: [a, b], lastMirrored: {}, blobFromDataUrl: blob });
  dir._makeRemoveFail();

  const second = await m.mirrorTasteLibrary({ dir, items: [b], lastMirrored: first.mirrored, blobFromDataUrl: blob });
  assert.deepEqual(second.removed, [], '删不掉就不算删掉');
  // 删失败的那张图仍然记在记忆里，下一轮还会再试
  assert.ok(second.mirrored['images/taste_a-1.jpg'], '删不掉的图要留在记忆里给下一轮再试');
  assert.ok(dir._list().includes('root/品味库/images/taste_a-1.jpg'), '删除失败时文件还在，这不是错误');
  assert.ok(asText(dir._disk.get('root/品味库/index.json')).includes('taste_b'), '后面的写入没有被中断');
});

test('只有元数据没有字节的图，不许写出空文件', async () => {
  const m = freshModules();
  const dir = fakeDir();
  const item = makeItem({ id: 'taste_a', images: [{ id: 'i1', name: 'a.jpg', addedAt: 11 }] });
  const res = await m.mirrorTasteLibrary({
    dir, items: [item], lastMirrored: {},
    blobFromDataUrl: async () => { throw new Error('不该被调用：这张图没有字节'); },
  });
  assert.deepEqual(dir._list(), ['root/品味库/index.json', 'root/品味库/品味库.md']);
  assert.equal(res.mirrored['images/taste_a-1.jpg'], undefined);
});

test('不是 data: URL 的字节地址一律不写盘（防的是「文件在、图全坏」）', async () => {
  const m = freshModules();
  const dir = fakeDir();
  const bad = [
    Promise.resolve('data:image/jpeg;base64,AAA'), // 少一个 await 的经典症状
    '[object Promise]',
    '',
    null,
    42,
  ];
  const item = makeItem({
    id: 'taste_a',
    images: bad.map((dataUrl, i) => ({ id: 'i' + i, name: 'x.jpg', addedAt: 11, dataUrl })),
  });
  let calls = 0;
  const res = await m.mirrorTasteLibrary({
    dir, items: [item], lastMirrored: {},
    blobFromDataUrl: async (u) => { calls++; return pngBytes(3); }, // 真被调用了就说明坏值漏过去了
  });
  assert.equal(calls, 0, '坏字节地址不该送去解码');
  assert.deepEqual(dir._list(), ['root/品味库/index.json', 'root/品味库/品味库.md']);
  assert.equal(Object.keys(res.mirrored).some((p) => p.startsWith('images/')), false);
});

test('条目还在、只是字节读不到：磁盘上那份是最后的副本，绝不当残留删掉', async () => {
  const m = freshModules();
  const dir = fakeDir({ 'root/品味库/images/taste_a-1.jpg': 'old-bytes' });
  // 没有 dataUrl ＝ 真相源（IndexedDB）里读不到字节，不是「用户删了这张图」
  const item = makeItem({ id: 'taste_a', images: [{ id: 'i1', name: 'a.jpg', addedAt: 11 }] });
  const res = await m.mirrorTasteLibrary({
    dir,
    items: [item],
    lastMirrored: { 'images/taste_a-1.jpg': 'images/taste_a-1.jpg@11#9' },
    blobFromDataUrl: async () => { throw new Error('没有字节就不该去解码'); },
  });
  assert.deepEqual(res.removed, [], '「读不到字节」不等于「用户删了图」，不能删磁盘上那份');
  assert.ok(dir._list().includes('root/品味库/images/taste_a-1.jpg'), '磁盘上那份必须留着');
});

test('汇总 md 只给真有字节的图写链接（写了就是死链）', () => {
  const m = freshModules();
  const item = makeItem({
    id: 'taste_a',
    images: [
      { id: 'i1', name: 'a.jpg', addedAt: 11 },                                    // 字节丢了
      { id: 'i2', name: 'b.jpg', addedAt: 12, dataUrl: 'data:image/jpeg;base64,BBB' },
    ],
  });
  const md = m.tasteLibraryMarkdown([item]);
  assert.ok(!md.includes('图1'), '没字节的那张不该出现在 md 里');
  // 编号仍然按数组下标走：第二张写的还是 -2.jpg，和磁盘上的文件名对得上
  assert.ok(md.includes('![图2](images/taste_a-2.jpg)'), md);
});

test('没变的图不重复解码（第二次同步不碰已经写好的图）', async () => {
  const m = freshModules();
  const dir = fakeDir();
  const item = makeItem({ id: 'taste_a', images: [{ id: 'i1', name: 'a.jpg', addedAt: 11, dataUrl: 'data:image/jpeg;base64,AAA' }] });
  let calls = 0;
  const blob = async () => { calls++; return pngBytes(1); };

  const first = await m.mirrorTasteLibrary({ dir, items: [item], lastMirrored: {}, blobFromDataUrl: blob });
  assert.equal(calls, 1);
  await m.mirrorTasteLibrary({ dir, items: [item], lastMirrored: first.mirrored, blobFromDataUrl: blob });
  assert.equal(calls, 1, '图没变就不该再解码一次');
  // 图的内容变了（哪怕 addedAt 没变）就该重写
  const changed = makeItem({ id: 'taste_a', images: [{ id: 'i1', name: 'a.jpg', addedAt: 11, dataUrl: 'data:image/jpeg;base64,AAAAAAA' }] });
  await m.mirrorTasteLibrary({ dir, items: [changed], lastMirrored: first.mirrored, blobFromDataUrl: blob });
  assert.equal(calls, 2, '图换了字节就要重写');
});

test('汇总 markdown 是一份能直接读的完整文本（golden）', () => {
  const m = freshModules();
  const item = makeItem({
    id: 'taste_1700000000000_0',
    title: 'Stillpage',
    subtitle: 'warm editorial × print DNA',
    url: 'https://example.com/stillpage',
    tags: ['halftone', 'warm paper'],
    category: 'Print-Tech Paper',
    note: '像印在纸上的网页。',
    images: [{ id: 'i1', name: 'a.jpg', addedAt: 11, dataUrl: 'data:image/jpeg;base64,AAA' }],
    createdAt: Date.UTC(2024, 0, 2, 3, 4),
    updatedAt: Date.UTC(2024, 0, 2, 3, 4),
  });
  const md = m.tasteLibraryMarkdown([item]);
  assert.equal(md, [
    '# 品味库',
    '',
    '> 按收录时间倒序。这个文件是只读的汇总，改它不会影响网站里的数据。',
    '',
    '## Stillpage',
    '',
    '- 收录：2024年1月2日 11:04',
    '- 副标题：warm editorial × print DNA',
    '- 网址：https://example.com/stillpage',
    '- 标签：halftone、warm paper',
    '- 分类：Print-Tech Paper',
    '',
    '像印在纸上的网页。',
    '',
    '![图1](images/taste_1700000000000_0-1.jpg)',
    '',
  ].join('\n'));
});

// ——— 图片字节的真相源 ———

// —— 假的存储后端：和 T1 的内存实现同契约，但值可以是任意东西 ——
function fakeStore(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    ready: Promise.resolve(),
    async get(key) { return map.has(key) ? map.get(key) : undefined; },
    async set(key, value) { map.set(key, value); },
    async delete(key) { map.delete(key); },
    async keys() { return [...map.keys()]; },
    _map: map,
  };
}

// 这一层不碰 Blob（那是宿主对象，必须注入），所以字节就当作不透明值
const fakeBlob = (dataUrl) => ({ type: 'image/jpeg', _dataUrl: dataUrl });
const fakeDataUrl = (blob) => blob._dataUrl;
const img = (id, dataUrl, over = {}) => Object.assign({ id, name: id + '.jpg', addedAt: 1, dataUrl }, over);

test('图片仓库按「条目 id + 图片 id」存取，同一张图重复存会覆盖', async () => {
  const m = freshModules();
  const store = fakeStore();
  const images = m.makeImageStore({ store, makeDataUrl: fakeDataUrl });

  await images.put('taste_a', img('i1', 'data:image/jpeg;base64,AAA'), fakeBlob('data:image/jpeg;base64,AAA'));
  await images.put('taste_a', img('i2', 'data:image/jpeg;base64,BBB'), fakeBlob('data:image/jpeg;base64,BBB'));
  await images.put('taste_a', img('i1', 'data:image/jpeg;base64,CCC'), fakeBlob('data:image/jpeg;base64,CCC'));

  assert.equal(await images.has('taste_a', 'i1'), true);
  assert.equal(await images.has('taste_a', 'i9'), false, '没存过的图片 id 应当是「没有」');
  const got = await images.get('taste_a', 'i1');
  assert.equal(fakeDataUrl(got), 'data:image/jpeg;base64,CCC', '重复存同一张图应当是覆盖，不是追加');
  assert.equal(await images.count(), 2, '三张图覆盖过后只该剩下两个键');
});

test('图片仓库只认自己前缀的键，别的数据不许被它删掉', async () => {
  const m = freshModules();
  const store = fakeStore({ 'yuki_taste_v1': { version: 1, items: [] }, other: 1 });
  const images = m.makeImageStore({ store, makeDataUrl: fakeDataUrl });
  await images.put('taste_a', img('i1', 'data:x'), fakeBlob('data:x'));

  const keys = await store.keys();
  assert.ok(keys.includes('yuki_taste_v1'), '别处的键还在');
  await images.removeItem('taste_b');
  assert.ok((await store.keys()).includes('other'), '删一个没有图片的条目不该碰别的键');

  await images.removeItem('taste_a');
  assert.equal(await images.count(), 0);
  assert.ok((await store.keys()).includes('yuki_taste_v1'), '清图片不许顺手清掉条目元数据');
});

test('补图：把缺字节的图补回来，已经有的不重复读，读不到的记在 missing 里', async () => {
  const m = freshModules();
  const store = fakeStore();
  const images = m.makeImageStore({ store, makeDataUrl: fakeDataUrl });
  await images.put('taste_a', img('i1', 'data:image/jpeg;base64,ONE'), fakeBlob('data:image/jpeg;base64,ONE'));

  const items = [
    { id: 'taste_a', images: [img('i1', 'data:image/jpeg;base64,STALE'), img('i2', 'data:image/jpeg;base64,NONE')] },
    { id: 'taste_b', images: [img('i3', 'data:image/jpeg;base64,GONE')] },
    { id: 'taste_c', images: [] },
  ];
  const res = await m.hydrateImageDataUrls(items, { images, makeDataUrl: fakeDataUrl });

  assert.equal(res.hydrated, 1, '只有 i1 真的从仓库里取到了字节');
  assert.equal(res.missing, 2, 'i2 与 i3 都没有字节');
  assert.equal(res.items[0].images[0].dataUrl, 'data:image/jpeg;base64,ONE', '仓库里的字节要盖过元数据里那份过期的');
  assert.equal(res.items[0].images[1].dataUrl, undefined, '取不到字节就保持没有，不能编一份出来');
  assert.equal(res.items[2].images.length, 0);
  // 不能就地改调用方给的那个对象（渲染层还拿着它）
  assert.equal(items[0].images[0].dataUrl, 'data:image/jpeg;base64,STALE', 'hydrate 不该就地改写传进来的条目');
});

test('补图时 makeDataUrl 是异步的也必须等出结果，不能把 Promise 交给落盘层', async () => {
  const m = freshModules();
  const store = fakeStore();
  const asyncDataUrl = async (blob) => blob._dataUrl;
  const images = m.makeImageStore({ store, makeDataUrl: asyncDataUrl });
  await images.put('taste_a', img('i1', 'x'), fakeBlob('data:image/jpeg;base64,ONE'));

  const res = await m.hydrateImageDataUrls([{ id: 'taste_a', images: [img('i1', '')] }], { images, makeDataUrl: asyncDataUrl });
  assert.equal(typeof res.items[0].images[0].dataUrl, 'string', 'dataUrl 必须是字符串，不是 Promise');
  assert.equal(res.items[0].images[0].dataUrl, 'data:image/jpeg;base64,ONE');
});

test('图片仓库与补图都要求注入，缺参数当场抛 TypeError', async () => {
  const m = freshModules();
  assert.throws(() => m.makeImageStore(), TypeError);
  assert.throws(() => m.makeImageStore({ makeDataUrl: fakeDataUrl }), TypeError);
  assert.throws(() => m.makeImageStore({ store: fakeStore(), makeDataUrl: null }), TypeError);
  assert.throws(() => m.makeImageStore({ store: { get: async () => {} }, makeDataUrl: fakeDataUrl }), TypeError);

  const images = m.makeImageStore({ store: fakeStore(), makeDataUrl: fakeDataUrl });
  await assert.rejects(() => m.hydrateImageDataUrls(null, { images, makeDataUrl: fakeDataUrl }), TypeError);
  await assert.rejects(() => m.hydrateImageDataUrls([], {}), TypeError);
});

test('落盘这一层不碰任何全局（只认注入的目录句柄、store 与 makeDataUrl）', () => {
  const html = readFileSync(INDEX, 'utf8');
  const src = moduleBlocks(html).map((b) => b.src).join('\n');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  // 只查「会读到宿主」的名字：indexedDB 在这一层是构造参数的名字（makeIndexedDBStore），
  // 出现它是正当的；能不能读到全局由栅栏在求值时就地拦下（见 freshModules）。
  for (const name of ['document', 'localStorage', 'fetch']) {
    assert.ok(!new RegExp('\\b' + name + '\\b').test(code), '落盘这一层不该出现 ' + name);
  }
  assert.ok(!/window\s*\./.test(code.replace(/window\.__tasteModules[^\n]*/g, '')),
    '除了交接那一句，落盘这一层不该读 window 上的任何东西');
});
