"use strict";
const $ = (s, el = document) => el.querySelector(s);
/* ---------- ファイルの版チェック（古いファイルが混ざっていたら、画面に理由を出す） ---------- */
(function () {
  const bad = [];
  if (!$("#progress") || !$("#logo")) bad.push("index.html");
  if (typeof PATTERNS === "undefined") bad.push("patterns.js");
  if (typeof OVERVIEW === "undefined" || typeof LX === "undefined") bad.push("extras.js");
  if (typeof IDEAS === "undefined") bad.push("ideas.js");
  if (typeof LEARN === "undefined" || typeof RULE_PRE === "undefined" || !LEARN.strategy || !LEARN.strategy.transfer) bad.push("learn.js");
  if (bad.length) {
    const v = $("#view");
    if (v) v.innerHTML = `<div style="max-width:640px;margin:40px auto;padding:20px 24px;border:3px solid #D93C3C;border-radius:16px;background:#fff;line-height:1.8">
      <h1 style="font-size:1.3rem;margin:0 0 8px">ファイルが一部、古いままです</h1>
      <p>次のファイルを、最新版に上書きしてください：<br><b>${bad.join(" ／ ")}</b></p>
      <p>必要なファイルは全部で7つです：index.html / style.css / app.js / patterns.js / extras.js / learn.js / ideas.js<br>
      上書きしたあと、ブラウザを強制再読み込み（Ctrl + Shift + R）してください。</p></div>`;
    throw new Error("outdated files: " + bad.join(", "));
  }
})();
// 講座つきのパターンには idea（解決のひとこと）が無いので、概要の「一言でいうと」で補う
PATTERNS.forEach((p) => { if (!p.idea && OVERVIEW[p.id]) p.idea = OVERVIEW[p.id][0]; });
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = (s) => s.replace(/\r/g, "").trim();
const view = $("#view");
const COLOR = { create: "teal", struct: "amber", behave: "pink" };
const catStyle = (cat) => `--c:var(--${COLOR[cat]});--t:var(--${COLOR[cat]}-t)`;

/* ---------- 進捗（ブラウザに保存）：k=知る / r=読める / w=書ける ---------- */
const store = {
  all() { try { return JSON.parse(localStorage.getItem("dp-progress") || "{}"); } catch { return {}; } },
  lv(id) { const v = this.all()[id]; return v === true ? { k: true } : (v || {}); },
  mark(id, key) { const a = this.all(); const cur = a[id] === true ? { k: true } : (a[id] || {}); cur[key] = true; a[id] = cur; try { localStorage.setItem("dp-progress", JSON.stringify(a)); } catch {} },
};
function updateProgress() {
  const n = PATTERNS.filter((p) => store.lv(p.id).w).length;
  $("#progress").textContent = `書ける ${n} / ${PATTERNS.length}`;
}

/* ---------- パターン柄の紋章（IDから自動生成） ---------- */
function emblem(id) {
  let h = 2166136261;
  for (const ch of id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  h = (h >>> 0) || 1;
  const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
  const TRI = ["0,0 10,0 0,10", "0,0 10,0 10,10", "10,0 10,10 0,10", "0,0 10,10 0,10"];
  const MIR = [1, 0, 3, 2];
  const shapeAt = (kind, v) => kind === 1 ? `<rect x=".7" y=".7" width="8.6" height="8.6" rx="1.8"/>`
    : kind === 2 ? `<circle cx="5" cy="5" r="4.4"/>` : `<polygon points="${TRI[v]}"/>`;
  let out = "";
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      const r = rnd(); if (r < 0.3) { rnd(); rnd(); continue; }
      const kind = r < 0.55 ? 1 : r < 0.8 ? 2 : 3, v = Math.floor(rnd() * 4), op = rnd() < 0.25 ? 0.5 : 1;
      out += `<g opacity="${op}" transform="translate(${x * 10} ${y * 10})">${shapeAt(kind, v)}</g>`;
      if (x < 2) out += `<g opacity="${op}" transform="translate(${(4 - x) * 10} ${y * 10})">${shapeAt(kind, kind === 3 ? MIR[v] : v)}</g>`;
    }
  }
  return `<svg viewBox="0 0 50 50" fill="currentColor" aria-hidden="true">${out}</svg>`;
}

/* ---------- Python（Pyodide）---------- */
let pyPromise = null;
function getPy() {
  if (!pyPromise) {
    pyPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
      s.onload = () => loadPyodide().then(resolve, reject);
      s.onerror = () => reject(new Error("Python実行環境を読み込めませんでした。ネットワークを確認して、もう一度試してください。"));
      document.head.appendChild(s);
    });
    pyPromise.catch(() => { pyPromise = null; });
  }
  return pyPromise;
}
async function runPython(code, init) {
  let out = "", error = null;
  try {
    const py = await getPy();
    py.setStdout({ batched: (s) => (out += s + "\n") });
    py.setStderr({ batched: (s) => (out += s + "\n") });
    const g = py.globals.get("dict")();
    if (init) for (const [k, v] of Object.entries(init)) g.set(k, v);
    try { await py.runPythonAsync(code, { globals: g }); }
    catch (e) { error = String(e.message || e).trim().split("\n").slice(-3).join("\n"); }
    g.destroy();
  } catch (e) { error = e.message; }
  return { out, error };
}
function showOut(el, r) {
  el.innerHTML = esc(r.out) + (r.error ? `<span class="err">${esc(r.error)}</span>` : "");
  if (!r.out && !r.error) el.textContent = "（出力なし）";
}

/* ---------- 共通パーツ ---------- */
const codeBlock = (c) => `<pre class="code">${esc(c)}</pre>`;
const listHTML = (tag, items) => `<${tag}>${items.map((t) => `<li>${t}</li>`).join("")}</${tag}>`;
function overviewHTML(p) {
  const o = OVERVIEW[p.id]; if (!o) return "";
  return `<p class="lead">${o[0]}</p>
    <div class="card tint"><b>たとえるなら</b><br>${o[1]}</div>
    ${DIAGRAM[p.id] ? `<pre class="code">${esc(DIAGRAM[p.id])}</pre>` : ""}`;
}
const chapterHead = (n, title, sub) => `<header class="ch"><span class="n">${n}</span><div><h2>${title}</h2><p>${sub}</p></div></header>`;
let io = null;

/* ---------- ホーム（図鑑） ---------- */
function pipsHTML(id) {
  const l = store.lv(id);
  return `<span class="pips" aria-label="到達度"><i class="${l.k ? "on" : ""}">知</i><i class="${l.r ? "on" : ""}">読</i><i class="${l.w ? "on" : ""}">書</i></span>`;
}
function homeView() {
  updateProgress();
  const made = PATTERNS.filter((p) => p.lesson);
  const first = made.find((p) => p.id === "strategy") || made[0];
  const art = ["strategy", "singleton", "observer", "decorator", "factory-method", "adapter", "state", "builder", "composite"]
    .map((id) => PATTERNS.find((p) => p.id === id))
    .map((p) => `<div class="t" style="${catStyle(p.cat)}">${emblem(p.id)}</div>`).join("");
  const tile = (p) => {
    const l = store.lv(p.id);
    const st = l.w ? "done" : p.lesson ? "ready" : "soon";
    const label = { done: "書ける！登録済み", ready: "挑戦できる", soon: "準備中" }[st];
    return `<a class="tile ${st}" href="#/p/${p.id}" style="${catStyle(p.cat)}"><span class="em">${emblem(p.id)}</span><b>${p.ja}</b><small>${p.en}</small>${p.lesson ? pipsHTML(p.id) : ""}<span class="badge">${label}</span></a>`;
  };
  view.className = "wide";
  view.innerHTML = `
    <section class="hero">
      <div>
        <h1>Pythonで学ぶ<br>デザインパターン</h1>
        <p class="lead">名前を知っているだけで終わらない。コードの中に見抜けて、自分の手で書けるところまで。全23パターンの図鑑を、「書ける」で埋めていこう。</p>
        <div class="row"><a class="btn primary" href="#/p/${first.id}">最初のお題を始める</a><a class="btn" href="#/quiz">クイズ</a></div>
      </div>
      <div class="hero-art" aria-hidden="true">${art}</div>
    </section>
    <section class="goal" aria-label="3つの到達度">
      <div><b><i>知</i>① 知る</b><span>「こういう形に名前がある」と説明できる。</span><em>鍛える章：わかる</em></div>
      <div><b><i>読</i>② 読める</b><span>初めて見るコードの中に、この形を見抜いて読み解ける。</span><em>鍛える章：見抜く</em></div>
      <div class="main"><b><i>書</i>③ 書ける</b><span>自分で設計して、書ける。このサイトのゴールです。</span><em>鍛える章：直す・書く</em></div>
    </section>
    <section class="teaser" aria-label="考え方">
      <h2>根っこの考え方は、6つだけ</h2>
      <p>23個のパターンは、どれも少数の考え方から生まれています。考え方がわかると、初めて見るパターンも読めて、書けるようになります。</p>
      <div class="chips">${IDEAS.map((i) => `<a href="#/ideas">${i.title}</a>`).join("")}</div>
      <div class="row"><a class="btn primary" href="#/ideas">考え方を読む</a></div>
    </section>
    <div class="dex-head"><h2>図鑑</h2><p>挑戦できる講座 ${made.length} ／ 書ける ${made.filter((p) => store.lv(p.id).w).length} ／ 全 ${PATTERNS.length} パターン</p></div>
    ${CATS.map((c) => `<div class="cat-head"><h3>${c.name}</h3><span>${c.note}</span></div><div class="grid">${PATTERNS.filter((p) => p.cat === c.id).map(tile).join("")}</div>`).join("")}`;
}

/* ---------- 構造チェック ---------- */
async function checkRule(rule, src) {
  if (!rule) return "";
  const r = await runPython(RULE_PRE + "\n" + rule, { __src__: src });
  return r.error ? "" : norm(r.out);
}
function bindTask(c) {
  const busy = (b, label) => { c.runBtn.disabled = b; c.checkBtn.disabled = b; if (b) c.out.textContent = label; };
  c.runBtn.onclick = async () => {
    busy(true, "Pythonを準備中…（初回は数秒かかります）");
    const r = await runPython(c.code.value); busy(false); showOut(c.out, r); c.verdict.innerHTML = "";
  };
  c.checkBtn.onclick = async () => {
    busy(true, "チェック中…（初回は数秒かかります）");
    const r = await runPython(c.code.value); showOut(c.out, r);
    if (r.error) { busy(false); c.verdict.innerHTML = `<div class="verdict ng">エラーが出ています。メッセージを読んで直してみましょう。</div>`; return; }
    if (norm(r.out) !== norm(c.expected)) {
      busy(false);
      c.verdict.innerHTML = `<div class="verdict ng">出力がまだ違います。</div>
        <div class="cmp"><div><h3 class="sub">期待</h3><div class="out">${esc(c.expected)}</div></div>
        <div><h3 class="sub">あなたの出力</h3><div class="out">${esc(norm(r.out)) || "（なし）"}</div></div></div>`;
      return;
    }
    const msg = await checkRule(c.rule, c.code.value);
    busy(false);
    if (msg) { c.verdict.innerHTML = `<div class="verdict ng"><span>出力は合っています。ただ、今回のねらいの形にはなっていません。<br>${esc(msg)}</span></div>`; return; }
    c.onPass();
  };
}
const hintsUI = (box, btn, hints, last) => {
  let hi = 0; const n = hints.length;
  btn.onclick = () => {
    const h = hints[hi];
    box.insertAdjacentHTML("beforeend", hi < n - 1 ? `<div class="card tint"><b>ヒント${hi + 1}</b><br>${h}</div>` : `<div class="card tint"><b>骨組み（穴あきコード）</b>${codeBlock(h)}</div>`);
    hi++;
    btn.textContent = hi < n ? `次のヒントを見る（${hi + 1}/${n}）` : "ヒントは以上です";
    if (hi >= n) btn.disabled = true;
  };
};

/* ---------- 講座 ---------- */
function lessonView(p) {
  updateProgress();
  const cat = CATS.find((c) => c.id === p.cat);
  view.className = "";
  if (!p.lesson) {
    view.innerHTML = `<div style="${catStyle(p.cat)}">
      <a class="back" href="#/">← 図鑑にもどる</a>
      <header class="lhead"><div class="em">${emblem(p.id)}</div><div><span class="chip">${cat.name}</span><h1>${p.ja}<br><small style="font:500 1rem var(--font);color:var(--sub)">${p.en}　（講座は準備中です）</small></h1></div></header>
      <h3 class="sub">概要</h3>${overviewHTML(p)}
      <h3 class="sub">こんな場面で困ったら</h3>
      <p class="scene">${p.scene}</p>
      <details class="card"><summary>ヒント：どう解決する？</summary><p>${p.idea}</p></details>
      <div class="row"><a class="btn primary" href="#/quiz">クイズに挑戦する</a><a class="btn" href="#/">図鑑にもどる</a></div></div>`;
    return;
  }
  const L = p.lesson, X = LX[p.id] || {}, G = LEARN[p.id] || {}, T = G.transfer;
  const made = PATTERNS.filter((q) => q.lesson), nextP = made[made.findIndex((q) => q.id === p.id) + 1];
  const quizzes = [...(G.reads || []).map((q) => ({ ...q, tag: "コードを読む" })), ...(G.judge || []).map((q) => ({ ...q, tag: "判断する" }))];
  const lvl = store.lv(p.id);
  view.innerHTML = `<div style="${catStyle(p.cat)}">
    <a class="back" href="#/">← 図鑑にもどる</a>
    <header class="lhead"><div class="em">${emblem(p.id)}</div><div><span class="chip">${cat.name}のお題</span><h1>${L.title}</h1></div></header>
    <div class="levels" aria-label="到達度">
      <span class="lv ${lvl.k ? "on" : ""}" id="lv-k"><b>①</b>知る</span>
      <span class="lv ${lvl.r ? "on" : ""}" id="lv-r"><b>②</b>読める</span>
      <span class="lv ${lvl.w ? "on" : ""}" id="lv-w"><b>③</b>書ける</span>
    </div>
    <p class="legend">知る＝仕組みを説明できる ／ 読める＝コードの中に見抜ける ／ 書ける＝自分で書ける。ゴールは③です。</p>
    <nav class="steps" aria-label="章">
      <button type="button" data-ch="ch1" class="on">1 困る</button>
      <button type="button" data-ch="ch2">2 直す</button>
      <button type="button" data-ch="ch3" class="lock" title="「直す」をクリアすると開きます">3 わかる</button>
      <button type="button" data-ch="ch4" class="lock" title="「直す」をクリアすると開きます">4 見抜く</button>
      <button type="button" data-ch="ch5" class="lock" title="「直す」をクリアすると開きます">5 書く</button>
    </nav>

    <section class="chapter" id="ch1">
      ${chapterHead(1, "困る", "まず、辛さを体験する")}
      <p>${L.intro}</p>
      ${X.aim ? `<h3 class="sub">このお題のねらい</h3><p class="aim">${X.aim}</p>` : ""}
      ${G.terms ? `<h3 class="sub">出てくる言葉</h3><div class="card"><dl>${G.terms.map((t) => `<dt>${t[0]}</dt><dd>${t[1]}</dd>`).join("")}</dl></div>` : ""}
      ${X.read ? `<h3 class="sub">最初のコードの読み方</h3><div class="card">${listHTML("ol", X.read)}</div>` : ""}
      <h3 class="sub">変更要求が届きました</h3>
      <div class="ticket"><span class="tag">変更要求</span><p>${L.request}</p><p><b>${L.expect}</b></p></div>
      <h3 class="sub">期待する出力</h3>
      ${codeBlock(L.expected)}
    </section>

    <section class="chapter" id="ch2">
      ${chapterHead(2, "直す", "ヒントを使いながら、自分の手で変える")}
      <p>コードは自由に書き換えてOKです。「チェック」では、出力に加えて、<b>コードの形</b>（if を増やさずに済む形になっているか）も確かめます。</p>
      <div class="editor"><header>main.py</header><textarea id="code" spellcheck="false" aria-label="Pythonコード">${esc(L.code)}</textarea></div>
      <div class="row">
        <button class="btn" id="run">実行</button>
        <button class="btn primary" id="check">チェック</button>
        <button class="linkbtn" id="reset">最初のコードに戻す</button>
      </div>
      <div class="out" id="out" aria-live="polite">ここに実行結果が出ます</div>
      <div id="verdict"></div>
      ${G.hints ? `<div id="hints"></div><div class="row"><button class="linkbtn" id="hintbtn">ヒントを見る（1/3）</button></div>` : ""}
      <div class="row"><button class="linkbtn" id="giveup">直せないときは、答えを見る</button></div>
    </section>

    <div id="answer" hidden>
      <section class="chapter" id="ch3">
        ${chapterHead(3, "わかる", "① 知る：名前と仕組みを知る")}
        <div class="reveal">
          <p class="crumb">この形の名前は</p>
          <h3>${L.answerName[0]}<small>${L.answerName[1]}</small></h3>
          ${overviewHTML(p)}
          ${G.principle ? `<div class="principle"><b>この講座の大事な考え方</b><a href="#/ideas">${IDEAS[G.principle.i].title}</a><p>${G.principle.text}</p></div>` : ""}
          ${G.recipe ? `<h3 class="sub">書く手順（レシピ）</h3>
            <p>どのパターンも、考え方は同じです。<b>「変わるところ」と「変わらないところ」を分ける</b>。</p>
            <div class="card tint"><ol>${G.recipe.map((r) => `<li>${r}</li>`).join("")}</ol></div>` : ""}
          ${X.walk ? `<h3 class="sub">解答コードの読み方</h3><div class="card">${listHTML("ol", X.walk)}</div>` : ""}
          <h3 class="sub">ポイント</h3>
          ${listHTML("ul", L.explain)}
          <h3 class="sub">解答例</h3>
          ${codeBlock(L.answerCode)}
          <div class="row"><button class="btn" id="load">作業台に読み込む</button></div>
        </div>
      </section>

      <section class="chapter" id="ch4">
        ${chapterHead(4, "見抜く", "② 読める：コードの中に、この形を見つける")}
        <p>パターンの名前を知らなくても、コードの形から「これはあの形だ」と見抜けるようになりましょう。</p>
        ${G.shapes ? `<h3 class="sub">別の場面で、同じ形</h3>${G.shapes.map((s) => `
          <div class="card"><b>${s.title}</b><p>${s.story}</p>
            <div class="ba"><div><div class="bad">困っている形</div>${codeBlock(s.before)}</div><div><div class="good">直した形</div>${codeBlock(s.after)}</div></div>
            <p class="same">${s.same}</p></div>`).join("")}` : ""}
        ${G.demo ? `<h3 class="sub">実際に動かして体験</h3><p>${G.demo.intro}</p>
          <div class="editor small"><header>demo.py</header><textarea id="demo" spellcheck="false" aria-label="体験用コード">${esc(G.demo.code)}</textarea></div>
          <div class="row"><button class="btn" id="demoRun">実行</button></div>
          <div class="out" id="demoOut" aria-live="polite">ここに実行結果が出ます</div>
          ${listHTML("ul", G.demo.notes)}` : ""}
        ${G.skip ? `<h3 class="sub">使わなくていい場面</h3><div class="card">${codeBlock(G.skip.code)}<p>${G.skip.text}</p></div>` : ""}
        <h3 class="sub">読解・判断クイズ（全${quizzes.length}問に正解すると②達成）</h3>
        <div id="quizProgress" class="legend"></div>
        ${quizzes.map((j, i) => `
          <div class="card judge" data-i="${i}"><span class="tagq">${j.tag}</span>${codeBlock(j.code)}<p><b>${j.q}</b></p>
            <div class="opts">${j.options.map((o, k) => `<button class="opt" data-j="${k}">${o}</button>`).join("")}</div><p class="why"></p></div>`).join("")}
      </section>

      ${T ? `<section class="chapter" id="ch5">
        ${chapterHead(5, "書く", "③ 書ける：ヒントなしで、別のお題に挑戦")}
        <p>${T.brief} ここを自力で書けたら、③達成です。詰まったら、章3の「レシピ」を見返しましょう。</p>
        <h3 class="sub">お題：${T.title}</h3>
        <div class="ticket"><span class="tag">変更要求</span><p>${T.request}</p><p><b>${T.expect}</b></p></div>
        <h3 class="sub">期待する出力</h3>
        ${codeBlock(T.expected)}
        <div class="editor"><header>task.py</header><textarea id="codeT" spellcheck="false" aria-label="Pythonコード（書く）">${esc(T.code)}</textarea></div>
        <div class="row">
          <button class="btn" id="runT">実行</button>
          <button class="btn primary" id="checkT">チェック</button>
          <button class="linkbtn" id="resetT">最初のコードに戻す</button>
        </div>
        <div class="out" id="outT" aria-live="polite">ここに実行結果が出ます</div>
        <div id="verdictT"></div>
        <div id="hintsT"></div>
        <div class="row"><button class="linkbtn" id="hintbtnT">ヒントを見る（1/${T.hints.length}）</button><button class="linkbtn" id="ansT">答えを見る</button></div>
        <div id="ansBoxT" hidden><p>答えを見た場合は、いったん閉じて、もう一度ヒントなしで書いてみましょう。</p>${codeBlock(T.answerCode)}</div>
        <div class="next">
          ${nextP ? `<a class="btn primary" href="#/p/${nextP.id}">次のお題へ</a>` : ""}
          <a class="btn" href="#/">図鑑にもどる</a>
        </div>
      </section>` : ""}
    </div>
  </div>`;

  const answer = $("#answer");
  const steps = [...document.querySelectorAll(".steps button")];
  const refreshLv = () => { const l = store.lv(p.id); [["k", "#lv-k"], ["r", "#lv-r"], ["w", "#lv-w"]].forEach(([k, s]) => $(s).classList.toggle("on", !!l[k])); updateProgress(); };
  const unlock = () => {
    if (!answer.hidden) return;
    answer.hidden = false; store.mark(p.id, "k"); refreshLv();
    steps.forEach((s) => s.classList.remove("lock"));
    setTimeout(() => $("#ch3").scrollIntoView({ behavior: "smooth" }), 80);
  };
  steps.forEach((b) => (b.onclick = () => { if (!b.classList.contains("lock")) $("#" + b.dataset.ch).scrollIntoView({ behavior: "smooth" }); }));
  if (io) io.disconnect();
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) steps.forEach((s) => s.classList.toggle("on", s.dataset.ch === e.target.id));
    }), { rootMargin: "-30% 0px -60% 0px" });
    ["ch1", "ch2", "ch3", "ch4", "ch5"].forEach((id) => { const el = $("#" + id); if (el) io.observe(el); });
  }
  document.querySelectorAll("textarea").forEach((ta) => ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab") { e.preventDefault(); ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end"); }
  }));

  // 章2：直す
  const code = $("#code");
  bindTask({ code, out: $("#out"), verdict: $("#verdict"), runBtn: $("#run"), checkBtn: $("#check"), expected: L.expected, rule: G.fixRule,
    onPass: () => { $("#verdict").innerHTML = `<div class="verdict ok"><span>クリア！出力も、コードの形も合っています。続く「わかる」「見抜く」で仕組みを確かめてから、「書く」でヒントなしに挑戦しましょう。</span></div>`; unlock(); } });
  $("#reset").onclick = () => { code.value = L.code; $("#out").textContent = "ここに実行結果が出ます"; $("#verdict").innerHTML = ""; };
  $("#giveup").onclick = unlock;
  $("#load").onclick = () => { code.value = L.answerCode; $("#ch2").scrollIntoView({ behavior: "smooth" }); };
  if (G.hints) hintsUI($("#hints"), $("#hintbtn"), G.hints);

  // 章4：見抜く
  if (G.demo) {
    $("#demoRun").onclick = async () => {
      const o = $("#demoOut"); $("#demoRun").disabled = true; o.textContent = "Pythonを準備中…（初回は数秒かかります）";
      const r = await runPython($("#demo").value); $("#demoRun").disabled = false; showOut(o, r);
    };
  }
  const solved = new Set();
  const qp = $("#quizProgress");
  const qpText = () => { qp.textContent = `正解 ${solved.size} / ${quizzes.length}　（間違えても、もう一度選べます）`; };
  if (qp) qpText();
  document.querySelectorAll(".judge").forEach((box) => {
    const j = quizzes[+box.dataset.i];
    box.querySelector(".opts").onclick = (e) => {
      const b = e.target.closest(".opt"); if (!b || b.disabled) return;
      const ok = +b.dataset.j === j.answer;
      if (ok) {
        box.querySelectorAll(".opt").forEach((x) => (x.disabled = true));
        b.classList.add("right");
        box.querySelector(".why").textContent = "正解！" + j.why;
        solved.add(+box.dataset.i); qpText();
        if (solved.size === quizzes.length) { store.mark(p.id, "r"); refreshLv(); qp.textContent = "全問正解！② 読める を達成しました。"; }
      } else {
        b.classList.add("wrong"); b.disabled = true;
        box.querySelector(".why").textContent = "惜しい。コードをもう一度読んで、別の選択肢を選んでみましょう。";
      }
    };
  });

  // 章5：書く
  if (T) {
    const codeT = $("#codeT");
    bindTask({ code: codeT, out: $("#outT"), verdict: $("#verdictT"), runBtn: $("#runT"), checkBtn: $("#checkT"), expected: T.expected, rule: T.rule,
      onPass: () => {
        store.mark(p.id, "w"); refreshLv();
        $("#verdictT").innerHTML = `<div class="verdict ok"><span class="pop">${emblem(p.id)}</span><span>③ 書ける を達成！出力も、コードの形も合っています。図鑑に「${L.answerName[0]}」を登録しました。</span></div>`;
      } });
    $("#resetT").onclick = () => { codeT.value = T.code; $("#outT").textContent = "ここに実行結果が出ます"; $("#verdictT").innerHTML = ""; };
    hintsUI($("#hintsT"), $("#hintbtnT"), T.hints);
    $("#ansT").onclick = () => { $("#ansBoxT").hidden = false; };
  }
}

/* ---------- 考え方 ---------- */
function ideasView() {
  updateProgress();
  view.className = "";
  view.innerHTML = `
    <a class="back" href="#/">← 図鑑にもどる</a>
    <h1 style="font-size:clamp(1.8rem,5vw,2.6rem);font-weight:900">考え方</h1>
    <p class="lead">デザインパターンは23個ありますが、根っこの考え方は、数個だけです。考え方がわかると、初めて見るパターンも読めて、自分でも書けるようになります。</p>
    ${IDEAS.map((d) => `
      <article class="idea">
        <h2>${d.title}</h2>
        <p class="lead">${d.lead}</p>
        ${d.body.map((t) => `<p>${t}</p>`).join("")}
        <div class="card tint"><b>こんなときは、この考え方</b><br>${d.sign}</div>
        <div class="ba"><div><div class="bad">困っている形</div>${codeBlock(d.before)}</div><div><div class="good">考え方を使った形</div>${codeBlock(d.after)}</div></div>
        ${d.patterns.length ? `<div class="chips"><span>この考え方が出てくるパターン：</span>${d.patterns.map((id) => { const q = PATTERNS.find((x) => x.id === id); return q ? `<a href="#/p/${id}">${q.ja}</a>` : ""; }).join("")}</div>` : ""}
      </article>`).join("")}
    <div class="next"><a class="btn primary" href="#/">図鑑にもどる</a><a class="btn" href="#/quiz">クイズ</a></div>`;
}

/* ---------- クイズ（AI出題のみ） ---------- */
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// 選択肢の位置をシャッフル（正解の位置が偏らないように）
function withShuffledOptions(q) {
  const order = shuffle(q.options.map((_, i) => i));
  return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
}
const KINDS = [["mix", "おまかせ"], ["scene", "場面から選ぶ"], ["code", "コードを読む"]];
async function aiAvailable() {
  try { const r = await fetch("/api/quiz", { cache: "no-store" }); if (!r.ok) return false; const j = await r.json(); return !!j.enabled; } catch { return false; }
}
async function aiQuestions(kind, scope) {
  const focus = scope === "lesson" ? PATTERNS.filter((p) => p.lesson).map((p) => p.id) : [];
  const r = await fetch("/api/quiz", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ n: 5, kind, focus }) });
  let j = {}; try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error(j.error || "問題を作れませんでした。もう一度試してください。");
  return j.questions.map((q) => {
    const p = PATTERNS.find((x) => x.id === q.pattern);
    return withShuffledOptions(q.type === "scene"
      ? { tag: "AI", heading: "この場面に効くパターンは？", scene: q.scene, options: q.options, answer: q.answer, why: q.why, pid: p && p.id }
      : { tag: "AI", heading: q.q, code: q.code, options: q.options, answer: q.answer, why: q.why, pid: p && p.id });
  });
}

function quizMenu() {
  updateProgress(); view.className = "";
  const nLesson = PATTERNS.filter((p) => p.lesson).length;
  const SCOPES = [["all", `全${PATTERNS.length}パターン`], ["lesson", `講座があるパターン（${nLesson}）`]];
  const seg = (id, items) => `<div class="seg" id="${id}" role="group">${items.map(([v, l], i) => `<button type="button" data-v="${v}" class="${i === 0 ? "on" : ""}">${l}</button>`).join("")}</div>`;
  view.innerHTML = `
    <h1 style="font-size:clamp(1.8rem,5vw,2.6rem);font-weight:900">クイズ</h1>
    <p class="lead">AIが、毎回新しい問題を5問、その場で作ります。ここでの正解数は、図鑑には影響しません。気軽に何度でも挑戦してください。</p>
    <div id="quizNotice"></div>
    <h3 class="sub">問題の種類</h3>${seg("segKind", KINDS)}
    <h3 class="sub">対象のパターン</h3>${seg("segScope", SCOPES)}
    <div class="row"><button class="btn primary" id="startQuiz" disabled>クイズを始める</button></div>
    <p class="legend">AIが作る問題には、誤りが含まれる可能性があります。気になったときは、講座の解説で確かめてください。問題の作成には、10〜20秒ほどかかります。</p>`;
  const pick = (id) => { const el = $("#" + id + " button.on"); return el ? el.dataset.v : ""; };
  ["segKind", "segScope"].forEach((id) => {
    $("#" + id).onclick = (e) => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll("#" + id + " button").forEach((x) => x.classList.toggle("on", x === b)); };
  });
  $("#startQuiz").onclick = () => { location.hash = `#/quiz/play?kind=${pick("segKind")}&scope=${pick("segScope")}`; };
  aiAvailable().then((ok) => {
    if (ok) { $("#startQuiz").disabled = false; return; }
    $("#quizNotice").innerHTML = `<div class="verdict ng"><span>クイズは、いまは利用できません。<br><small>（管理者の方へ：Vercel の環境変数 GEMINI_API_KEY と、api/quiz.js を設定してください。手順は README にあります。）</small></span></div>`;
  });
}

function runQuiz(kind, scope) {
  updateProgress(); view.className = "";
  const title = "クイズ";
  let questions = [], n = 0, score = 0, wrong = [];
  const start = (qs) => { questions = qs; n = 0; score = 0; wrong = []; ask(); };
  async function begin() {
    view.innerHTML = `<p class="crumb">${title}</p><div class="scene">AIが問題を作っています…（10〜20秒ほどかかります）</div>`;
    try { start(await aiQuestions(kind, scope)); }
    catch (e) { view.innerHTML = `<p class="crumb">${title}</p><div class="verdict ng"><span>${esc(e.message)}</span></div><div class="row"><button class="btn primary" id="retry">もう一度試す</button><a class="btn" href="#/quiz">条件を変える</a></div>`; $("#retry").onclick = begin; }
  }
  function ask() {
    if (n >= questions.length) {
      view.innerHTML = `<p class="crumb">${title}　結果</p><div class="score">${score}<small style="font-size:1.4rem"> / ${questions.length}</small></div>
        <p>${wrong.length ? "間違えた問題は、もう一度確かめてみましょう。該当の講座も見返すと、定着します。" : "全問正解です！"}</p>
        <div class="row">
          ${wrong.length ? `<button class="btn primary" id="review">間違えた問題だけ復習（${wrong.length}問）</button>` : ""}
          <button class="btn ${wrong.length ? "" : "primary"}" id="again">新しい問題でもう一度</button>
          <a class="btn" href="#/quiz">条件を変える</a>
        </div>`;
      const rv = $("#review"); if (rv) rv.onclick = () => start(wrong.map(withShuffledOptions));
      $("#again").onclick = begin; return;
    }
    const q = questions[n];
    view.innerHTML = `<p class="crumb">${title}　${n + 1} / ${questions.length}</p>
      <div class="bar"><i style="width:${(n / questions.length) * 100}%"></i></div>
      <h1 style="font-size:1.5rem;font-weight:900;line-height:1.5">${esc(q.heading)}</h1>
      ${q.code ? codeBlock(q.code) : ""}${q.scene ? `<p class="scene">${esc(q.scene)}</p>` : ""}
      <div class="opts" id="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join("")}</div>
      <div id="fb"></div>`;
    $("#opts").onclick = (e) => {
      const b = e.target.closest(".opt"); if (!b || b.disabled) return;
      const ok = +b.dataset.i === q.answer;
      document.querySelectorAll(".opt").forEach((x) => (x.disabled = true));
      b.classList.add(ok ? "right" : "wrong");
      if (ok) score++; else { $(`.opt[data-i="${q.answer}"]`).classList.add("right"); wrong.push(q); }
      const target = q.pid && PATTERNS.find((x) => x.id === q.pid);
      $("#fb").innerHTML = `<div class="card tint"><b>${ok ? "正解！" : "正解は「" + esc(q.options[q.answer]) + "」"}</b><br>${esc(q.why)}
        ${target && target.lesson ? `<br><a href="#/p/${target.id}">「${target.ja}」の講座を見る</a>` : ""}</div>
        <div class="row"><button class="btn primary" id="next">${n + 1 < questions.length ? "次へ" : "結果を見る"}</button></div>`;
      $("#next").onclick = () => { n++; ask(); window.scrollTo(0, 0); };
      $("#next").focus();
    };
  }
  begin();
}
function quizRoute(play, params) {
  if (!play) return quizMenu();
  const kind = KINDS.some((k) => k[0] === params.get("kind")) ? params.get("kind") : "mix";
  const scope = params.get("scope") === "lesson" ? "lesson" : "all";
  runQuiz(kind, scope);
}

/* ---------- ルーター ---------- */
function route() {
  const h = location.hash || "#/";
  const m = h.match(/^#\/p\/(.+)$/);
  const p = m && PATTERNS.find((x) => x.id === m[1]);
  if (io) { io.disconnect(); io = null; }
  const qm = h.match(/^#\/quiz(?:\/play(?:\?(.*))?)?$/);
  if (p) lessonView(p); else if (qm) quizRoute(h.startsWith("#/quiz/play"), new URLSearchParams(qm[1] || "")); else if (h === "#/ideas") ideasView(); else homeView();
  window.scrollTo(0, 0);
}
$("#logo").innerHTML = `<span style="display:block;width:30px;height:30px">${emblem("logo-dp")}</span>`;
window.addEventListener("hashchange", route);
route();
