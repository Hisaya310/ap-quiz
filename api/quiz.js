// Vercel サーバー関数：Google Gemini API（無料枠）で、デザインパターンの4択問題を作る。
// APIキーは環境変数 GEMINI_API_KEY に入れる（ブラウザ側のコードには絶対に書かない）。
// 任意の環境変数：
//   GEMINI_MODELS        使うモデル名（カンマ区切り。先頭から順に試す）
//   AI_QUIZ_PER_IP       同じ人が10分間に出題できる回数（既定 8）
//   AI_QUIZ_DAILY_LIMIT  サイト全体の1日の上限（既定 300）

const PATTERNS = [
  ["singleton", "Singleton", "シングルトン"], ["factory-method", "Factory Method", "ファクトリーメソッド"],
  ["abstract-factory", "Abstract Factory", "アブストラクトファクトリー"], ["builder", "Builder", "ビルダー"],
  ["prototype", "Prototype", "プロトタイプ"], ["adapter", "Adapter", "アダプター"], ["bridge", "Bridge", "ブリッジ"],
  ["composite", "Composite", "コンポジット"], ["decorator", "Decorator", "デコレータ"], ["facade", "Facade", "ファサード"],
  ["flyweight", "Flyweight", "フライウェイト"], ["proxy", "Proxy", "プロキシ"],
  ["chain-of-responsibility", "Chain of Responsibility", "責任の連鎖"], ["command", "Command", "コマンド"],
  ["interpreter", "Interpreter", "インタープリタ"], ["iterator", "Iterator", "イテレータ"], ["mediator", "Mediator", "メディエータ"],
  ["memento", "Memento", "メメント"], ["observer", "Observer", "オブザーバー"], ["state", "State", "ステート"],
  ["strategy", "Strategy", "ストラテジー"], ["template-method", "Template Method", "テンプレートメソッド"], ["visitor", "Visitor", "ビジター"],
];
const IDS = PATTERNS.map((p) => p[0]);

// 先頭のモデルから順に試し、使えなければ（廃止・混雑など）次のモデルに切り替える
const DEFAULT_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const modelList = () => (process.env.GEMINI_MODELS ? process.env.GEMINI_MODELS.split(",").map((s) => s.trim()).filter(Boolean) : DEFAULT_MODELS);

const hits = new Map();   // IP ごとの回数（サーバーが再起動すると消える、簡易的な制限）
let day = "", dayCount = 0;
function limited(ip) {
  const now = Date.now(), perIp = Number(process.env.AI_QUIZ_PER_IP || 8), daily = Number(process.env.AI_QUIZ_DAILY_LIMIT || 300);
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; dayCount = 0; }
  if (dayCount >= daily) return "本日のAI出題の上限に達しました。明日また試してください。";
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (arr.length >= perIp) return "短時間に何度も出題しています。少し待ってから、もう一度試してください。";
  arr.push(now); hits.set(ip, arr); dayCount++;
  return "";
}

function schema(n) {
  return {
    type: "object",
    properties: {
      questions: {
        type: "array", minItems: n, maxItems: n,
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["scene", "code"] },
            pattern: { type: "string", enum: IDS },
            text: { type: "string" },
            code: { type: "string" },
            options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
            answer: { type: "integer", minimum: 0, maximum: 3 },
            why: { type: "string" },
          },
          required: ["type", "pattern", "text", "options", "answer", "why"],
        },
      },
    },
    required: ["questions"],
  };
}

function buildPrompt(n, focus, kind) {
  const list = PATTERNS.map((p) => `${p[0]}: ${p[1]}（${p[2]}）`).join("\n");
  const target = focus.length ? `出題するパターンは、次のidから選ぶこと：${focus.join(", ")}` : "出題するパターンは、下の一覧から、できるだけ散らして選ぶこと。";
  return [
    `あなたは、Pythonで学ぶデザインパターンの学習サイトの、経験豊富な出題担当です。初学者向けの4択問題を、日本語で${n}問、オリジナルで作成してください。`,
    "",
    "【パターン一覧（id: 英語名（日本語名））】",
    list,
    "",
    "【出題の種類】",
    "・type が \"scene\"：困っている場面の説明を text に書く。options には「英語名（日本語名）」の4つを入れる（正解を含め、紛らわしい似たパターンを1つは混ぜる）。code は空でよい。",
    "・type が \"code\"：問いを text に、15行以内のPythonコードを code に書く（出力の予測／役割の特定／そのパターンが必要かの判断、のいずれか）。options は問いに合う4つの選択肢。",
    "",
    "【ルール】",
    "・" + target,
    "・text や code の中に、そのパターンの名前（英語・日本語）を書いてはいけない（答えが分かってしまうため）。",
    "・正解はちょうど1つ。answer は options の位置（0〜3）。事実として誤りがなく、正解が確実に1つに決まる問題だけを作ること。",
    "・why は、1〜2文で、なぜその答えになるかを、初学者に分かる言葉で説明すること。",
    "・コードは、Python 3 で正しく動くものにすること。",
    kind === "scene" ? `・${n}問すべて、type は "scene" にすること。` : kind === "code" ? `・${n}問すべて、type は "code" にすること。` : `・${n}問のうち、scene と code を、おおよそ半分ずつにすること。`,
    "・出力は、指定したJSONスキーマの形式のみとし、前置きやコードブロック記法は一切含めないこと。",
  ].join("\n");
}

async function callGemini(apiKey, model, prompt, n) {
  const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema(n), temperature: 1.0, maxOutputTokens: 4000 },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error("HTTP " + resp.status + ": " + t.slice(0, 200));
  }
  const data = await resp.json();
  const text = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error("no text (finishReason: " + (data && data.candidates && data.candidates[0] && data.candidates[0].finishReason) + ")");
  return JSON.parse(text);
}

function validate(data, n, kind) {
  const out = [];
  for (const q of (data && data.questions) || []) {
    const p = PATTERNS.find((x) => x[0] === q.pattern);
    if (!p || !["scene", "code"].includes(q.type)) continue;
    if ((kind === "scene" || kind === "code") && q.type !== kind) continue;
    if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => typeof o !== "string" || !o.trim() || o.length > 120)) continue;
    if (new Set(q.options).size !== 4) continue;
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) continue;
    if (typeof q.why !== "string" || !q.why.trim() || q.why.length > 400) continue;
    if (typeof q.text !== "string" || !q.text.trim() || q.text.length > 400) continue;
    const code = typeof q.code === "string" ? q.code : "";
    if (q.type === "code" && (!code.trim() || code.length > 1200)) continue;
    const all = q.text + (q.type === "code" ? code : "");
    if (all.toLowerCase().includes(p[1].toLowerCase()) || all.includes(p[2])) continue;   // 答えの名前が漏れている問題は捨てる
    out.push(q.type === "scene"
      ? { type: "scene", pattern: q.pattern, scene: q.text, options: q.options, answer: q.answer, why: q.why }
      : { type: "code", pattern: q.pattern, q: q.text, code, options: q.options, answer: q.answer, why: q.why });
  }
  return out.slice(0, n);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const apiKey = process.env.GEMINI_API_KEY;
  if (req.method === "GET") return res.status(200).json({ enabled: !!apiKey });
  if (req.method !== "POST") return res.status(405).json({ error: "このメソッドは使えません。" });
  if (!apiKey) return res.status(503).json({ error: "AI出題は、この環境では有効になっていません（GEMINI_API_KEY が未設定です）。" });

  const ip = String((req.headers["x-forwarded-for"] || "").split(",")[0] || (req.socket && req.socket.remoteAddress) || "unknown").trim();
  const msg = limited(ip);
  if (msg) return res.status(429).json({ error: msg });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const n = Math.min(5, Math.max(1, parseInt(body.n, 10) || 5));
  const kind = ["scene", "code"].includes(body.kind) ? body.kind : "mix";
  const focus = (Array.isArray(body.focus) ? body.focus : []).filter((id) => IDS.includes(id)).slice(0, 8);
  const prompt = buildPrompt(n, focus, kind);

  const errors = [];
  for (const model of modelList()) {
    for (let retry = 0; retry < 2; retry++) {
      try {
        const questions = validate(await callGemini(apiKey, model, prompt, n), n, kind);
        if (questions.length) return res.status(200).json({ questions });
        errors.push(model + ": no valid questions");
        break;
      } catch (e) {
        const m = e && e.message ? e.message : "unknown";
        errors.push(model + ": " + m);
        // 混雑による一時的な 503 は、同じモデルでもう一度だけ試す
        if (retry === 0 && /503|UNAVAILABLE/i.test(m)) { await new Promise((r) => setTimeout(r, 700)); continue; }
        break;
      }
    }
  }
  console.error("AI quiz failed:", errors.join(" / "));   // 詳細はVercelのログにだけ残す（画面には出さない）
  return res.status(502).json({ error: "問題を作れませんでした。時間をおいて、もう一度試してください。" });
};
// 実行時間の上限（秒）
module.exports.config = { maxDuration: 30 };
module.exports._test = { validate, buildPrompt, schema, PATTERNS };
