// Vercel Serverless Function
// GET /api/generate-question?cat=tech,mgmt,strategy&diff=all|1|2|3
//
// Generates one original 応用情報技術者試験-style multiple-choice question
// using the Google Gemini API (free tier). The API key is read from the
// GEMINI_API_KEY environment variable on the server, so it is never exposed
// to the browser.

const CAT_LABELS = {
  tech: "テクノロジ系(コンピュータ科学・アルゴリズム・データベース・ネットワーク・セキュリティなど)",
  mgmt: "マネジメント系(プロジェクトマネジメント・サービスマネジメント・システム開発・システム監査など)",
  strategy: "ストラテジ系(経営戦略・マーケティング・会計財務・法務・企業活動など)"
};

const DIFF_LABELS = {
  1: "やさしい(基本的な用語・定義を問うレベル)",
  2: "ふつう(標準的な応用知識を問うレベル)",
  3: "むずかしい(計算や具体的な事例分析を要するレベル)"
};

const SCHEMA = {
  type: "object",
  properties: {
    q: { type: "string" },
    opts: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
    answer: { type: "integer", minimum: 0, maximum: 3 },
    exp: { type: "string" },
    cat: { type: "string", enum: ["tech", "mgmt", "strategy"] },
    diff: { type: "integer", minimum: 1, maximum: 3 }
  },
  required: ["q", "opts", "answer", "exp", "cat", "diff"]
};

const MODEL = "gemini-2.5-flash";

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildPrompt(cat, diff) {
  return [
    "あなたは日本の情報処理技術者試験「応用情報技術者試験」の午前問題(四択問題)を作成する、経験豊富な問題作成者です。",
    "次の条件を満たす、オリジナルの四択問題を1問だけ日本語で作成してください。過去問の丸写しではなく、教科書的に正確な内容の新しい問題文にしてください。",
    "",
    "・分野: " + CAT_LABELS[cat],
    "・難易度: " + DIFF_LABELS[diff],
    "・選択肢(opts)はちょうど4つ。正解は1つだけとし、誤りの選択肢も紛らわしく、もっともらしい内容にすること。",
    "・解説(exp)は2〜3文程度で、なぜその選択肢が正解なのか、必要なら簡単な計算過程も含めて説明すること。",
    "・内容は事実として正確であること。専門用語の意味を誤って説明しないこと。",
    "・出力は指定したJSONスキーマの形式のみとし、前置きや余計な文章、マークダウンのコードブロック記法は一切含めないこと。",
    "・cat フィールドには \"" + cat + "\" を、diff フィールドには " + diff + " をそのまま設定すること。"
  ].join("\n");
}

function validate(obj) {
  return !!obj &&
    typeof obj.q === "string" && obj.q.trim().length > 0 &&
    Array.isArray(obj.opts) && obj.opts.length === 4 &&
    obj.opts.every(o => typeof o === "string" && o.trim().length > 0) &&
    Number.isInteger(obj.answer) && obj.answer >= 0 && obj.answer <= 3 &&
    typeof obj.exp === "string" && obj.exp.trim().length > 0;
}

async function callGemini(apiKey, prompt) {
  const resp = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
          temperature: 1.0,
          maxOutputTokens: 1000
        }
      })
    }
  );

  if (!resp.ok) {
    const bodyText = await resp.text().catch(() => "");
    throw new Error("Gemini API HTTP " + resp.status + ": " + bodyText.slice(0, 300));
  }

  const data = await resp.json();
  const text =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;

  if (!text) {
    throw new Error("Gemini returned no text (finishReason: " +
      (data && data.candidates && data.candidates[0] && data.candidates[0].finishReason) + ")");
  }
  return JSON.parse(text);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      ok: false,
      error: "AI機能がまだ設定されていません(GEMINI_API_KEYが未設定です)。Vercelの環境変数を確認してください。"
    });
    return;
  }

  const query = req.query || {};
  const catParam = Array.isArray(query.cat) ? query.cat[0] : query.cat;
  const cats = String(catParam || "tech,mgmt,strategy")
    .split(",")
    .map(s => s.trim())
    .filter(c => CAT_LABELS[c]);
  const cat = cats.length ? pick(cats) : "tech";

  const diffParam = Array.isArray(query.diff) ? query.diff[0] : query.diff;
  const diff = (!diffParam || diffParam === "all")
    ? (1 + Math.floor(Math.random() * 3))
    : Math.min(3, Math.max(1, parseInt(diffParam, 10) || 2));

  const prompt = buildPrompt(cat, diff);

  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const parsed = await callGemini(apiKey, prompt);
      if (validate(parsed)) {
        res.status(200).json({
          ok: true,
          question: {
            q: parsed.q,
            opts: parsed.opts,
            answer: parsed.answer,
            exp: parsed.exp,
            cat: CAT_LABELS[parsed.cat] ? parsed.cat : cat,
            diff: [1, 2, 3].includes(parsed.diff) ? parsed.diff : diff
          }
        });
        return;
      }
      lastErr = new Error("model returned an unexpected shape");
    } catch (e) {
      lastErr = e;
    }
  }

  res.status(502).json({
    ok: false,
    error: "AI問題の生成に失敗しました。時間をおいて再試行してください。(" +
      (lastErr && lastErr.message ? lastErr.message : "unknown error") + ")"
  });
};
