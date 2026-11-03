# Pythonで学ぶ デザインパターン

静的サイトです（ビルド不要）。Pythonはブラウザ内で Pyodide が実行します。

## 公開手順（以前のサイトと同じ）
1. このフォルダの中身（index.html / style.css / app.js / patterns.js / extras.js / learn.js / ideas.js、フォルダ api/quiz.js）をGitHubの新しいリポジトリにアップロード
2. Vercelで「Add New → Project」→ そのリポジトリを Import
3. Framework Preset は「Other」のまま、設定はいじらず Deploy

## 講座の増やし方
`patterns.js` の該当パターンに `lesson: { ... }` を足すだけです。
Strategy / Observer / Decorator の3つが見本になっています。

`extras.js` には各パターンの「現場での使いどころ・Pythonでの出会い方・使いすぎ注意」を書きます。講座が無いパターンにも表示されます。

`learn.js` には、講座ごとの「出てくる言葉・ヒント・別の場面で同じ形・動かして体験・使わなくていい場面・判断クイズ」を書きます。

## 学習設計（3つの到達度）
- ① 知る（わかる章） → ② 読める（見抜く章） → ③ 書ける（直す・書く章）
- 「チェック」は出力に加えて、Pythonの ast でコードの形も確認します（`learn.js` の fixRule / transfer.rule）。
- 新しい講座を作るときは、`lesson`（patterns.js）、`LX`（extras.js）、`LEARN`（learn.js）に、reads（読解問題）と transfer（書く課題）まで揃えてください。

`ideas.js` には、「考え方」ページ（6つの根っこの考え方）を書きます。各講座の `LEARN[id].principle` で、その講座が体現している考え方に結びつけます。

## クイズ（AI出題のみ）
- クイズは、Gemini が毎回その場で作る問題（5問）だけです。固定の問題バンクはありません。
- 種類（おまかせ／場面から選ぶ／コードを読む）と、対象（全パターン／講座があるパターン）を選べます。
- 間違えた問題だけを復習できます。
- `GEMINI_API_KEY` が未設定だと、クイズは利用できません（下の設定が必須です）。
- 講座の中の「読解・判断クイズ」（章4）は、②達成のための講座の一部で、固定の問題です。

## AI出題の設定（必須・サーバー関数・Google Gemini の無料枠）
Vercel の「サーバー関数」（`api/quiz.js`）で、Gemini API を使って、AIが問題を作ります。**APIキーはブラウザ側のコードに書かず、Vercel の環境変数にだけ入れます。**
1. GitHub に `api/quiz.js` があることを確認（リポジトリのトップに `api` フォルダ → その中に `quiz.js`）
2. Vercel のプロジェクトの Settings → Environment Variables で、`GEMINI_API_KEY` を追加（値は Gemini のAPIキー。他のプロジェクトと同じキーでも構いません）
3. 再デプロイ（Deployments → 最新の「…」→ Redeploy）
4. クイズ画面の「クイズを始める」が押せるようになります（環境変数が無いときは、「いまは利用できません」と表示されます）

任意の環境変数
- `GEMINI_MODELS`：使うモデル名（カンマ区切り。先頭から順に試し、使えなければ次へ）。既定は `gemini-3.8-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite`
- `AI_QUIZ_PER_IP`：同じ人が10分間に出題できる回数（既定 8）
- `AI_QUIZ_DAILY_LIMIT`：サイト全体の1日の上限（既定 300）

注意：
- 無料枠の上限は、キー（Google Cloud のプロジェクト）ごとに数えられます。同じキーを他のアプリと共有すると、上限も共有されます。
- 上の回数制限は簡易的なものです（サーバーの再起動で数え直されます）。
