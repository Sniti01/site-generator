// Копия `docs/reports/2026-09-26-7thserpent-pachka-2/instrumenty/kontrast-geroy-snyatie.js` (сессия 15,
// 6c127da) для сессии 16 (П93 п. 0г: «контраст героя — повторным замером» после правки sizes);
// отличие — адрес сервера, папка кадров, хеш сборки и эта строка шапки.
// Скрипт съёмки для замера контраста текста героя на страницах маршрута второго сайта
// (сессия 15, П91 п. 3: «Текст героя поверх арта — замером пикселей полосой из 31 окна
// (как главная, П79) по реальному арту») — для browser_run_code_unsafe Playwright MCP
// (параметр filename). Пара к вычислителю
// docs/reports/2026-09-23-7thserpent-glavnaya/instrumenty/kontrast-art.mjs (сессия 9,
// без правки): тот же формат кадров `ka-<Ш>x<В>-<место>.png` и `boxes.json`.
//
// Копия docs/reports/2026-09-25-7thserpent-pachka-1/instrumenty/kontrast-cta-snyatie.js
// (сессия 14, заморожен на 734afa7; сам он — копия скрипта главной сессии 9); что изменено
// против копии:
//   1. СТРАНИЦЫ — четыре страницы пачки 2 с героем (`/max-payne-3/`, `/max-payne-2/`,
//      `/max-payne-1/`, `/remake/`).
//   2. МЕСТА — героя, как у главной, но заголовок и лид — порознь: `herotitle` — заголовок
//      (`.hero__title`; колонка `.hero__inner` скрывается, прокрутка — 0), `herolead` — лид
//      (`.hero__lead`; прокрутка «верх колонки `.hero__text` минус 120»: у страниц маршрута
//      `h1` длиннее, чем у главной, и на 360×740 лид при прокрутке 0 уходил за нижний край
//      окна — первый прогон, «срезана»/«вне кадра»); `herobtn` — надпись контурной
//      кнопки (`.btn-secondary`; колонка скрывается, прокрутка «верх места минус 120», как
//      у главной). Залитая кнопка стоит на сплошной заливке фонаря — пара токенов гейта,
//      здесь не мерится. У страниц с подписью кадра (`.podpis-geroya`, место `dopisek`
//      героя ядра) — четвёртое место `podpis`: подпись лежит на СВОЕЙ подложке (правило
//      маршрута: фон `--bg` 78 %, как у подписи кадра ядра), поэтому прячется только текст
//      (`color: transparent`), а подложка остаётся в кадре — скрытие блока целиком мерило бы
//      текст против сырого арта, которого под буквами нет.
//   3. СТОП, если на странице нет `section.hero` или он не один, и если подпись кадра
//      объявлена у страницы (`podpis: true` в СТРАНИЦЫ), а на странице её нет, — и наоборот.
//   4. Адрес сервера — BASE (статический сервер копии dist/ сессии), папка — DIR.
//   5. СТОП, ЕСЛИ ТЕКСТ МЕСТА ЧЕМ-ТО НАКРЫТ («судью судят», раунд 1, P2-R1-MARSHRUT-2, K1):
//      вычислитель берёт цвет букв ОБЪЯВЛЕННЫЙ (`getComputedStyle().color`), а фон — по
//      пикселям; это верно, только пока над буквами ничего не лежит. Первая редакция подписи
//      кадра лежала под скримом и под прозрачностью 0,75 рамки арта — инструмент сообщал 6–8:1
//      там, где нарисовано 1,1–1,5:1. Поэтому для каждой рамки строки в трёх точках средней
//      линии (10, 50 и 90 % ширины) `elementFromPoint` обязан вернуть сам носитель текста или
//      его потомка — на время проверки всем элементам и их псевдоэлементам `::before`/`::after`
//      возвращается `pointer-events` (иначе проверка не видела бы накрывающий слой с
//      `pointer-events: none`; раунд 2, KR2-1: скрим `::after` у `.hero` проходил), зерно снято,
//      как на кадре; произведение `opacity` носителя и всех предков — 1; цвет букв — в формате
//      `rgb()`/`rgba()` (иной формат вычислитель не прочтёт) и с альфой 1 (раунд 2, KR2-5).
//      Точки вне окна не проверяются (такие строки вычислитель и так называет «вне кадра»).
//      ПРЕДЕЛЫ проверки попаданием (раунд 2, KR2-2..4 — каждый подтверждён опытом и даёт ложный
//      проход): слой со встроенным `style="pointer-events:none!important"` (встроенное
//      `!important` сильнее листа); слой с атрибутом `inert`; `box-shadow` соседа поверх букв;
//      псевдоэлемент самого носителя (`.hero__lead::after` — `elementFromPoint` отдаёт хозяина);
//      позиционированный потомок носителя поверх букв; `-webkit-text-fill-color` (нарисованный
//      цвет ≠ `color`); `filter`, `mix-blend-mode` и `backdrop-filter` предков; частичная обрезка
//      (`clip-path`, `overflow`) и узкий слой между тремя точками строки. Скан четырёх страниц
//      сессии 15 на 390, 800 и 1440 ни одного из них не нашёл, а замер нарисованных пикселей
//      (кадр с текстом против кадра без него) независимо дал те же числа (раунд 2, линзы
//      «маршрут» и «контраст»), — поэтому вердикт сессии в силе; для чужой страницы или новой
//      правки героя пределы надо закрывать пиксельной проверкой, а не этим скриптом.
//   6. СБОРКА — строка SBORKA (хеш коммита, с которого собрана раздаваемая копия): без неё
//      съёмка не начинается, возвращается в итоговой строке и лежит в `window.__kaSborka`;
//      формат `boxes.json` прежний (его читает вычислитель без правки), хеш пишется первой
//      строкой каждого файла замера (раунд 1, S1: замер /remake/ r1 снят не с той сборки,
//      а в файлах хеша не было). Предел (раунд 2, KR2-6): хеш — заявление ведущего, съёмка его
//      с раздаваемым HTML не сверяет. Цепочку замыкает порядок работы, а не скрипт: раздаваемая
//      копия побайтно равна `dist/` сборки коммита SBORKA (`diff -r`), а тот `dist/` — сверке
//      `proby-p2.mjs --tolko-dist` при чистом дереве (`src` и `structure` = HEAD); оба итога —
//      в файлах замера.
//   7. СКРЫТИЕ — полным правилом места в MESTA, а не селектором с общим хвостом (следует из п. 2:
//      у подписи прячутся только буквы). Папку кадров перед прогоном очищать, рамки выгружать
//      только после ответа «ok» (предел R1-INSTR-15 сессии 14, раунд 2, KR2-7).
// Остальное — дословно копии: ОКНА (31), загрузка заново на каждом окне, сверка ответа 200
// и canonical страницы, ожидание картинок под сроком 8 с и стоп при недогрузке, рамки строк
// getClientRects по текстовым узлам с вычисленным цветом, скрытие зерна, осадка 250 мс.
// ПРЕДЕЛЫ — копии (шапки kontrast-art.mjs и kontrast-art-snyatie.js): зерно снято и не
// учтено; колонка скрывается целиком; между окнами полосы не судится; высоты окон 700–1180;
// рамки живут в window.__ka последней страницы и пишутся один раз, после всех страниц.
// Выгрузка: browser_evaluate (() => JSON.stringify(window.__ka[<адрес>])) с filename
// <dir>/<слаг>/boxes.json, затем node kontrast-art.mjs <dir>/<слаг> <dir>/<слаг>/boxes.json.
async (page) => {
  const BASE = 'http://127.0.0.1:4422';
  const DIR = 'ka-p3g1';
  const SBORKA = '103c0e8';
  if (!/^[0-9a-f]{7,40}$/.test(SBORKA)) throw new Error('СТОП: SBORKA — не хеш коммита');
  const dir = 'D:/SEO/cloud/site-generator/.playwright-mcp/' + DIR + '/';
  const STRANICY = [
    ['/max-payne-3/', 'max-payne-3', { podpis: false }],
    ['/max-payne-2/', 'max-payne-2', { podpis: false }],
    ['/max-payne-1/', 'max-payne-1', { podpis: false }],
    ['/remake/', 'remake', { podpis: true }],
  ];
  const OKNA = [
    [360, 740], [390, 844], [414, 896], [480, 800], [560, 800], [600, 900], [640, 900],
    [641, 900], [700, 900], [720, 900], [768, 1024], [800, 900], [820, 1180], [860, 900],
    [900, 700], [960, 800], [1000, 900], [1024, 768], [1025, 900], [1060, 900], [1100, 800],
    [1140, 900], [1180, 900], [1194, 834], [1200, 900], [1280, 800], [1359, 900], [1360, 900],
    [1440, 900], [1600, 900], [1920, 1080],
  ];
  const MESTA_OBSHCHIE = [
    ['herotitle', '.hero', ['.hero__title'], '.hero__inner{visibility:hidden!important}'],
    ['herolead', '.hero__text', ['.hero__lead'], '.hero__inner{visibility:hidden!important}'],
    ['herobtn', '.hero__actions', ['.btn-secondary'], '.hero__inner{visibility:hidden!important}'],
  ];
  const MESTO_PODPISI = ['podpis', '.hero', ['.podpis-geroya'], '.podpis-geroya{color:transparent!important;text-shadow:none!important}'];
  const vse = {};
  for (const [adres, slug, opcii] of STRANICY) {
    const MESTA = opcii.podpis ? [...MESTA_OBSHCHIE, MESTO_PODPISI] : MESTA_OBSHCHIE;
    const all = {};
    for (const [w, h] of OKNA) {
      await page.setViewportSize({ width: w, height: h });
      const otvet = await page.goto(BASE + adres, { waitUntil: 'networkidle' });
      if (!otvet || otvet.status() !== 200) throw new Error('СТОП: на ' + adres + ' ответ ' + (otvet ? otvet.status() : 'нет'));
      const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href ?? null);
      if (canonical !== 'https://www.7thserpent.com' + adres) throw new Error('СТОП: на ' + adres + ' canonical ' + canonical + ', ждали https://www.7thserpent.com' + adres);
      const sostav = await page.evaluate(() => ({ geroev: document.querySelectorAll('section.hero').length, podpisey: document.querySelectorAll('section.hero .podpis-geroya, section.hero .foto__credit').length }));
      if (sostav.geroev !== 1) throw new Error('СТОП: на ' + adres + ' героев ' + sostav.geroev + ', ждали один');
      if ((sostav.podpisey > 0) !== opcii.podpis) throw new Error('СТОП: на ' + adres + ' подписей кадра ' + sostav.podpisey + ', а в СТРАНИЦЫ podpis: ' + opcii.podpis);
      const uslovia = await page.evaluate(async () => {
        document.documentElement.style.scrollBehavior = 'auto';
        await document.fonts.ready;
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
        const t0 = Date.now();
        while ([...document.images].some((i) => !i.complete) && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
        return { dpr: window.devicePixelRatio, clientWidth: document.documentElement.clientWidth, innerHeight: window.innerHeight, nezagruzheno: [...document.images].filter((i) => !i.complete || !i.naturalWidth).length };
      });
      if (uslovia.nezagruzheno) throw new Error('СТОП: на ' + adres + ' ' + w + '×' + h + ' не загружено картинок: ' + uslovia.nezagruzheno);
      const kadry = {};
      for (const [name, sel, targets, hide] of MESTA) {
        const proverka = await page.addStyleTag({ content: '*,*::before,*::after{pointer-events:auto!important}.grain{display:none!important}' });
        const boxes = await page.evaluate(async ({ sel, targets }) => {
          const sec = document.querySelector(sel);
          if (!sec) throw new Error('нет места ' + sel);
          const top = sec.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: sel === '.hero' ? 0 : Math.max(0, top - 120), behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 300));
          const out = [];
          for (const t of targets) for (const el of sec.querySelectorAll(t)) {
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let n;
            while ((n = walker.nextNode())) {
              if (!n.textContent.trim()) continue;
              const r = document.createRange();
              r.selectNodeContents(n);
              const nositel = n.parentElement;
              const color = getComputedStyle(nositel).color;
              if (!/^rgba?\(/.test(color)) throw new Error('СТОП: у текста «' + n.textContent.trim().slice(0, 30) + '» цвет ' + color + ' не в формате rgb() — вычислитель его не прочтёт');
              const alfa = Number((color.match(/[\d.]+/g) || [])[3] ?? 1);
              if (alfa !== 1) throw new Error('СТОП: у текста «' + n.textContent.trim().slice(0, 30) + '» альфа цвета ' + color + ' меньше 1 — вычисленный цвет не равен нарисованному');
              let opacity = 1;
              for (let e = nositel; e; e = e.parentElement) opacity *= Number(getComputedStyle(e).opacity);
              if (opacity !== 1) throw new Error('СТОП: у текста «' + n.textContent.trim().slice(0, 30) + '» произведение opacity предков ' + opacity + ' — вычисленный цвет не равен нарисованному');
              for (const b of r.getClientRects()) {
                for (const dolya of [0.1, 0.5, 0.9]) {
                  const px = b.x + b.width * dolya;
                  const py = b.y + b.height / 2;
                  if (px < 0 || py < 0 || px >= document.documentElement.clientWidth || py >= window.innerHeight) continue;
                  const naVerkhu = document.elementFromPoint(px, py);
                  if (!naVerkhu || !nositel.contains(naVerkhu)) throw new Error('СТОП: текст «' + n.textContent.trim().slice(0, 30) + '» в точке (' + Math.round(px) + ', ' + Math.round(py) + ') накрыт: сверху ' + (naVerkhu ? naVerkhu.tagName.toLowerCase() + '.' + [...naVerkhu.classList].join('.') : 'ничего') + ' — вычисленный цвет не равен нарисованному');
                }
                out.push({ t, color, x: b.x, y: b.y, w: b.width, h: b.height, text: n.textContent.trim().slice(0, 40) });
              }
            }
          }
          return out;
        }, { sel, targets });
        await proverka.evaluate((el) => el.remove());
        if (!boxes.length) throw new Error('СТОП: у места ' + name + ' на ' + adres + ' ' + w + ' нет ни одной строки текста');
        const handle = await page.addStyleTag({ content: hide + '.grain{display:none!important}' });
        await page.waitForTimeout(250);
        await page.screenshot({ path: dir + slug + '/' + `ka-${w}x${h}-${name}.png` });
        await handle.evaluate((el) => el.remove());
        kadry[name] = boxes;
      }
      all[`${w}x${h}`] = { uslovia, kadry };
    }
    vse[adres] = all;
  }
  await page.evaluate(({ a, s }) => { window.__ka = a; window.__kaSborka = s; }, { a: vse, s: SBORKA });
  return 'ok: сборка ' + SBORKA + '; ' + Object.entries(vse).map(([a, v]) => a + ' ' + Object.keys(v).length + ' окон').join(', ');
}
