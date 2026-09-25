// T8 / issue #5 备份编解码 —— 契约单测。
// 零依赖：node:assert + node:test，直接 node tests/t8-backup-codec.mjs 就能跑。
//
// 这是全站最不能坏的一块：向后兼容一旦坏了，用户当场丢数据。所以这里的测试
// 刻意分成三类 —— 新格式往返、旧格式（改造前导出的纯日记）兼容、垃圾输入要抛。
import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { moduleBlocks, evalModuleFenced, makeWindowStub } from './lib/inline.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(HERE, '..', 'index.html');

// 每个用例读一份干净的模块实例，避免用例之间通过模块级缓存互相串味。
function freshMods() {
  const w = makeWindowStub();
  for (const b of moduleBlocks(fs.readFileSync(INDEX, 'utf8'))) evalModuleFenced(b.src, w);
  return w.__tasteModules;
}

// 改造前那个格式：扁平对象，键就是日记的日期键。
function legacyDiary() {
  return {
    '2024-01-31': { content: '一月最后一天', words: 6, tags: ['旧'], images: [], updatedAt: 1706659200000 },
    '2024-12-01#2': { content: '这一天写了两次', words: 7, images: [], updatedAt: 1733011200000 },
  };
}

// T9 会把 IndexedDB 里的图读出来、转成 data URL 再交给 buildBackup，
// 所以这里按 dataUrl 已经在条目里的形状来测（base64 是内联在同一个 JSON 里的）。
function tasteItems() {
  return [
    {
      id: 'taste_1700000001000_0',
      type: 'link',
      title: 'Stillpage',
      subtitle: 'warm editorial × print DNA',
      url: 'https://example.com/stillpage',
      tags: ['halftone CMYK dot texture', 'warm paper ground'],
      category: 'Print-Tech Paper',
      note: '',
      images: [{ id: 'img_1', dataUrl: 'data:image/jpeg;base64,AAAA', name: 'cover.jpg', addedAt: 1700000001000 }],
      createdAt: 1700000001000,
      updatedAt: 1700000002000,
    },
    {
      id: 'taste_1700000003000_1',
      type: 'note',
      title: 'SPADE',
      subtitle: '',
      url: '',
      tags: ['mono data callouts'],
      category: '',
      note: '只记一句话',
      images: [],
      createdAt: 1700000003000,
      updatedAt: 1700000003000,
    },
  ];
}

function fullDiary() {
  return Object.assign(legacyDiary(), {
    '2024-06-30': {
      content: '今天贴了张图',
      words: 6,
      tags: ['摄影'],
      images: [{ id: 'img_9', dataUrl: 'data:image/jpeg;base64,BBBB', name: 'x.jpg', addedAt: 1719705600000 }],
      updatedAt: 1719705600000,
    },
  });
}

test('模块交接了 buildBackup 与 parseBackup', () => {
  const M = freshMods();
  assert.ok(M, 'index.html 里没有找到 window.__tasteModules');
  assert.equal(typeof M.buildBackup, 'function', '导出里没有 buildBackup');
  assert.equal(typeof M.parseBackup, 'function', '导出里没有 parseBackup');
});

test('buildBackup 产出新格式：顶层同时含日记与品味库，并且带版本标记和两个键', () => {
  const M = freshMods();
  const diary = fullDiary();
  const taste = { items: tasteItems() };
  const raw = M.buildBackup(diary, taste);

  assert.equal(typeof raw, 'string', '导出的是字符串，落盘/下载都是文本');
  const parsed = JSON.parse(raw);
  assert.equal(typeof parsed.version, 'number', '顶层要有版本标记');
  assert.ok('diary' in parsed, '顶层要有 diary 键');
  assert.ok('taste' in parsed, '顶层要有 taste 键');
  assert.deepEqual(parsed.diary, diary, '日记原样带过去');
  assert.deepEqual(parsed.taste, taste, '品味库原样带过去');

  const back = M.parseBackup(raw);
  assert.deepEqual(back.diary, diary);
  assert.deepEqual(back.taste, taste);
});

test('buildBackup 也吃对象，parseBackup 也吃对象', () => {
  const M = freshMods();
  const diary = fullDiary();
  const taste = { items: tasteItems() };
  const built = M.parseBackup(M.buildBackup(diary, taste));
  const obj = M.buildBackup(diary, taste, { asObject: true });
  assert.equal(typeof obj, 'object', 'asObject 要真的给对象');
  assert.deepEqual(M.parseBackup(obj), built);
});

test('新的统一格式导出再导入一次，内容一模一样（幂等）', () => {
  const M = freshMods();
  const diary = fullDiary();
  const taste = { items: tasteItems() };

  const first = M.buildBackup(diary, taste);
  const back = M.parseBackup(first);
  const second = M.buildBackup(back.diary, back.taste);

  assert.deepEqual(back.diary, diary, '日记要逐字段还原');
  assert.deepEqual(back.taste, taste, '品味库要逐字段还原（标签、分类、图片顺序都不许变）');
  assert.equal(second, first, '同一份数据导出 → 导入 → 再导出，字节要一致');
});

test('parseBackup 吃改造前的纯日记备份：判定为日记并完整还原，品味库为空', () => {
  const M = freshMods();
  const legacy = legacyDiary();
  const back = M.parseBackup(JSON.stringify(legacy));

  assert.deepEqual(back.diary, legacy, '旧备份的日期键要原样还原');
  assert.equal(back.taste, null, '旧备份里没有品味库，taste 要给 null 而不是空壳');
  assert.equal(back.kind, 'diary', '要能告诉调用方这是旧版备份（好去 toast 那句说明）');
});

test('旧备份里混着非日期键也照样认：跳过那些键，日期条目一条不少', () => {
  const M = freshMods();
  // 改造前的导入是「跳过」非日期键继续导入其余（index.html 旧导入那句
  // `if(!DATE_KEY.test(k))return;`）。用户手加一个 "version" 或备注键，
  // 今天能导入，升级后不能反而变成「这不是一个能认出来的备份文件」。
  const messy = Object.assign({ '备注': 'b', 'version': 1 }, legacyDiary(), { '2024-1-31': { content: '键格式不对，跳过' } });
  const back = M.parseBackup(JSON.stringify(messy));

  assert.equal(back.kind, 'diary', '有日期键就该认出来，哪怕夹着别的键');
  assert.deepEqual(Object.keys(back.diary).sort(), ['2024-01-31', '2024-12-01#2', '2024-1-31', 'version', '备注'].sort(), '原对象原样给出去');
  assert.deepEqual(
    back.entries.map((e) => e.key),
    ['2024-01-31', '2024-12-01#2'],
    '但导入清单只收日期键，坏的/备注键一律跳过',
  );
  assert.ok(back.entries.every((e) => e.dataset === 'diary'));
});

test('parseBackup 吃两种键都缺的垃圾输入时抛可识别的错误，不静默返回半截数据', () => {
  const M = freshMods();
  const garbage = [
    '',
    '   ',
    'not json at all {{{',
    '[]',
    '[1,2,3]',
    'null',
    '42',
    '"一个字符串"',
    '{}',
    '{"hello":"world"}',
    '{"hello":"world","n":1}', // 多个非日期键，仍然一个日期键都没有
    // 注意：「有日期键 + 非日期键」**不算**垃圾（旧导入会跳过非日期键），
    // 那种情况由下面那条用例管；这里只放一个日期键都没有的输入。
  ];

  for (const bad of garbage) {
    assert.throws(
      () => M.parseBackup(bad),
      (err) => err && err.code === 'BACKUP_UNRECOGNIZED',
      '这种输入要抛 BACKUP_UNRECOGNIZED，而不是静默返回半截数据：' + bad,
    );
  }
});

test('旧备份的判据是「至少有一个日期键」，比的是日期正则而不是键的位置', () => {
  const M = freshMods();
  // 三个位置各钉一颗：非日期键在前 / 夹在中间 / 在最后，都要照样认出来。
  // looksLikeLegacyDiary 的循环一旦写坏（提前 return、用 every 之类），
  // 只测一个位置的话绿灯照样亮。
  for (const where of ['前', '中', '后']) {
    const messy = legacyDiary();
    const withJunk =
      where === '前'
        ? Object.assign({ 备注: 'x' }, messy)
        : where === '中'
          ? { '2024-01-31': messy['2024-01-31'], 备注: 'x', '2024-12-01#2': messy['2024-12-01#2'] }
          : Object.assign({}, messy, { 备注: 'x' });
    const back = M.parseBackup(withJunk);
    assert.equal(back.kind, 'diary', '非日期键在' + where + '时也要认出来');
    assert.equal(back.entries.length, 2, '非日期键在' + where + '时日期条目都要收进清单');
  }

  // 一个日期键都没有 → 还是垃圾，抛错（空对象与纯垃圾对象无法与旧备份区分）
  for (const junk of [{}, { 备注: 'x' }, { version: 1 }]) {
    assert.throws(() => M.parseBackup(junk), (err) => err && err.code === 'BACKUP_UNRECOGNIZED');
  }
});

test('新格式里只有品味库、或只有日记，也各自认得出来', () => {
  const M = freshMods();
  const onlyTaste = M.parseBackup(JSON.stringify({ version: 1, taste: { items: tasteItems() } }));
  assert.deepEqual(onlyTaste.taste, { items: tasteItems() });
  assert.equal(onlyTaste.diary, null);

  const onlyDiary = M.parseBackup(JSON.stringify({ version: 1, diary: fullDiary() }));
  assert.deepEqual(onlyDiary.diary, fullDiary());
  assert.equal(onlyDiary.taste, null);
});

test('空的品味库也照样导出，导入回来是空列表而不是缺失', () => {
  const M = freshMods();
  const back = M.parseBackup(M.buildBackup(fullDiary(), { items: [] }));
  assert.deepEqual(back.taste, { items: [] }, '空库要明确是 { items: [] }，别让 T9 去猜 undefined');
  assert.equal(back.taste.items.length, 0);
});

test('新格式里日记/品味库的值形状不对时当场抛错，不把垃圾推给界面层', () => {
  const M = freshMods();
  // 之前只查了键在不在，没查值的类型：这些会被「解析成功」原样返回，
  // 然后 T9 在 Object.keys(null) / Object.keys("字符串") 上炸掉。
  const bad = [
    { diary: '字符串' },
    { diary: 42 },
    { diary: [1, 2] },
    { taste: '不是对象' },
    { taste: [] },
    { version: 1, diary: null, taste: 'x' },
  ];
  for (const payload of bad) {
    assert.throws(
      () => M.parseBackup(payload),
      (err) => err && err.code === 'BACKUP_UNRECOGNIZED',
      '形状不对要抛 BACKUP_UNRECOGNIZED：' + JSON.stringify(payload),
    );
  }
  // 值明确写成 null 是合法的「这份备份里没有它」，不能当成坏数据
  const ok = M.parseBackup({ version: 1, diary: null, taste: { items: [] } });
  assert.equal(ok.diary, null);
  assert.deepEqual(ok.taste, { items: [] });
});

test('entries 把两种格式摊平成同一张导入清单，判重键各归各的', () => {
  const M = freshMods();
  // 日记按日期键、品味库按条目 id，T9 拿到的是一个循环就能落库的列表
  const back = M.parseBackup(JSON.stringify({ version: 1, diary: legacyDiary(), taste: { items: tasteItems() } }));
  assert.deepEqual(back.entries.map((e) => e.dataset + ':' + e.key), [
    'diary:2024-01-31',
    'diary:2024-12-01#2',
    'taste:taste_1700000001000_0',
    'taste:taste_1700000003000_1',
  ]);
  // value 就是那份数据本身，不是副本也不是包装
  assert.deepEqual(back.entries[0].value, legacyDiary()['2024-01-31']);
  assert.deepEqual(back.entries[2].value, tasteItems()[0]);

  // 旧格式走同一条路
  const legacy = M.parseBackup(JSON.stringify(legacyDiary()));
  assert.deepEqual(
    legacy.entries.map((e) => e.key),
    ['2024-01-31', '2024-12-01#2'],
  );

  // 空库 / 缺数据集都给空清单，不是 undefined
  assert.deepEqual(M.parseBackup({ version: 1, taste: { items: [] } }).entries, []);
  assert.deepEqual(M.parseBackup({ version: 1, diary: {} }).entries, []);
});

test('来自更新版本的备份照样解析，只用 versionAhead 说一声', () => {
  const M = freshMods();
  // 拒绝高版本 = 换机器/降级时把能救的数据挡在门外，与「备份是唯一救命绳」相抵。
  const ahead = M.parseBackup(JSON.stringify({ version: 999, diary: legacyDiary(), taste: { items: [] } }));
  assert.equal(ahead.version, 999, '原样记下看到的版本号');
  assert.equal(ahead.versionAhead, true, '要让 T9 能提示「来自更新版本」');
  assert.deepEqual(ahead.diary, legacyDiary(), '高版本不拦，数据照常给');

  const current = M.parseBackup({ version: 1, diary: legacyDiary() });
  assert.equal(current.versionAhead, false);
  const missing = M.parseBackup({ diary: legacyDiary() });
  assert.equal(missing.version, 1, '没有版本号按当前版本算');
  assert.equal(missing.versionAhead, false);
});

test('备份编解码不认识任何全局对象', () => {
  const fence = (src) => evalModuleFenced(src, makeWindowStub());
  // window 是门禁允许的注入点，所以它不在这张名单里 —— 这里验的是门禁
  // 自己还能拦住裸全局（辅助库的回归护栏）。
  for (const bad of ['var a = localStorage;', 'var b = indexedDB;', 'var c = document;', 'var d = fetch;']) {
    assert.throws(() => fence(bad), /碰了全局/, '门禁本身要还能拦下：' + bad);
  }
  assert.equal(typeof globalThis.fetch, 'function', '对照：Node 里本来就有 fetch，不是它不存在');
});
