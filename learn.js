// 完成講座の「出てくる言葉」「ヒント」「別の場面で同じ形」「動かして体験」「使わなくていい場面」「判断クイズ」
const LEARN = {
  strategy: {
    terms: [["辞書（dict）", "名前と中身の対応表です。{\"a\": 1} なら、\"a\" を渡すと 1 が取り出せます。"], ["lambda（ラムダ）", "名前のない短い関数です。lambda p: p * 0.8 は「p を受け取って 0.8 倍して返す」という意味です。"], ["if / elif", "「もし〜なら」の分岐です。elif は「そうでなくて、もし〜なら」です。"]],
    hints: ["割引のやり方を、if で分けるのではなく、1つずつ「関数」として取り出せないか考えてみましょう。", "名前（\"student\" など）から、その関数を取り出せるように、辞書 {名前: 関数} を作ってみましょう。", `DISCOUNTS = {
    "normal": lambda p: p,
    # ここに student / senior / member を足す
}

def calc(kind, price):
    return ____(price)   # ____ に何が入る？`],
    shapes: [
      { title: "送料の計算", story: "配送方法（通常・速達・店頭受取）で、送料の計算が変わります。方法が増えるたびに elif が伸びていきます。",
        before: `def shipping(method, weight):
    if method == "normal":
        return 500
    elif method == "express":
        return 500 + weight * 100
    elif method == "pickup":
        return 0`,
        after: `SHIPPING = {
    "normal": lambda w: 500,
    "express": lambda w: 500 + w * 100,
    "pickup": lambda w: 0,
}

def shipping(method, weight):
    return SHIPPING[method](weight)`,
        same: "割引のときと同じ形です。「種類で分けて、やり方を変える」if が、種類の数だけ伸びていきます。" },
      { title: "商品の並べ替え", story: "商品一覧を、価格順・名前順で並べ替えます。並べ方が増えるたびに分岐が増えます。",
        before: `def sort_items(items, order):
    if order == "price":
        return sorted(items, key=lambda x: x["price"])
    elif order == "name":
        return sorted(items, key=lambda x: x["name"])`,
        after: `KEYS = {
    "price": lambda x: x["price"],
    "name": lambda x: x["name"],
}

def sort_items(items, order):
    return sorted(items, key=KEYS[order])`,
        same: "「並べ方」という、やり方の部分だけを部品にして取り替えています。" }],
    demo: { intro: "Python の sorted には、最初から「やり方を渡す」口があります。key に関数を渡して、並べ方を取り替えてみましょう。",
      code: `words = ["banana", "fig", "cherry"]
print(sorted(words))                       # 五十音（アルファベット）順
print(sorted(words, key=len))              # 文字数が短い順
print(sorted(words, key=lambda w: w[-1]))  # 最後の1文字の順`,
      notes: ["同じ sorted で、key に渡す関数を変えるだけで、並べ方が変わります。これがストラテジーの考え方です。", "ぜひ key=lambda w: w[0] （最初の1文字）なども試してみてください。"] },
    skip: { code: `def price_with_tax(price):
    return price * 1.1`, text: "計算のやり方が1つだけで、増える予定もないなら、そのまま書くのが一番読みやすいです。目安は「やり方が3つ以上に増えそう」なときです。" },
    judge: [
      { code: `def greet(lang):
    if lang == "ja":
        return "こんにちは"
    elif lang == "en":
        return "Hello"`, q: "対応する言語はこの2つで固定です（増える予定はありません）。どうしますか？", options: ["このままでよい", "辞書に切り出して、ストラテジーの形にする", "言語ごとにクラスを作る"], answer: 0, why: "増えない2つの分岐は、if が一番読みやすい形です。パターンは「困ったとき」に使うものです。" },
      { code: `def tax(kind, price):
    if kind == "food":
        return price * 0.08
    elif kind == "book":
        return price * 0.08
    elif kind == "tool":
        return price * 0.10
    # 来月: 酒・薬・サービス…と増える予定`, q: "来月から種類がどんどん増えます。どうしますか？", options: ["elif を足し続ける", "種類ごとの計算を部品にして、辞書で選ぶ", "if を全部消して、固定の値にする"], answer: 1, why: "増え続ける分岐は、部品に分けて選ぶ形にすると、足すだけで済みます。" }],
  },

  observer: {
    terms: [["クラス", "データと動きをひとまとめにした「設計図」です。"], ["インスタンス", "設計図から作った実物です。th = Thermometer() の th が実物です。"], ["関数を渡す", "Python では関数も値の1つなので、リストに入れたり、引数で渡したりできます。"]],
    hints: ["温度計が画面やログを直接呼ぶのをやめて、「知らせる相手のリスト」を持つ形にできないか考えてみましょう。", "リストに関数を登録する subscribe() を作り、set() の中でリストの全員を呼んでみましょう。", `class Thermometer:
    def __init__(self):
        self.listeners = []

    def subscribe(self, fn):
        ____   # リストに fn を追加

    def set(self, t):
        for fn in self.listeners:
            ____   # fn に t を渡して呼ぶ`],
    shapes: [
      { title: "在庫が変わったときの通知", story: "在庫が変わると、画面表示と発注メールを更新します。通知先が増えるたびに、在庫クラスを書き換えることになります。",
        before: `class Stock:
    def set(self, n):
        self.n = n
        print("画面を更新:", n)
        print("発注メールを送る:", n)`,
        after: `class Stock:
    def __init__(self):
        self.listeners = []

    def subscribe(self, fn):
        self.listeners.append(fn)

    def set(self, n):
        self.n = n
        for fn in self.listeners:
            fn(n)`,
        same: "温度計と同じ形です。「変わったことを、複数の相手に知らせたい」ときの形です。" },
      { title: "ボタンが押されたときの処理", story: "ボタンが押されたら、ログ記録・画面更新・集計をします。処理が増えるたびに、ボタン側を直すことになります。",
        before: `class Button:
    def click(self):
        print("ログに記録")
        print("画面を更新")`,
        after: `class Button:
    def __init__(self):
        self.handlers = []

    def on_click(self, fn):
        self.handlers.append(fn)

    def click(self):
        for fn in self.handlers:
            fn()`,
        same: "画面のボタンやイベント処理は、たいてい、この形で作られています。" }],
    demo: { intro: "Python のログ機能（logging）は、1つのログを複数の出力先に同時に届けられます。出力先（handler）を足すだけで、受け取る相手が増えます。",
      code: `import logging, sys

log = logging.getLogger("demo")
log.setLevel(logging.INFO)

for tag in ["画面", "ファイル"]:
    h = logging.StreamHandler(sys.stdout)
    h.setFormatter(logging.Formatter(tag + ": %(message)s"))
    log.addHandler(h)      # ← 出力先を登録している

log.info("起動しました")`,
      notes: ["log.info を1回呼んだだけで、登録した2つの出力先に届きます。log 側は、相手が誰かを知りません。", "for の中身を [\"画面\", \"ファイル\", \"メール\"] に変えると、log.info の行は変えずに出力先が増えます。"] },
    skip: { code: `def show_temp(t):
    print("現在", t, "度")`, text: "知らせる相手が1つだけで、増えそうにないなら、そのまま呼ぶほうが分かりやすいです。「相手が増え続ける」ときに使います。" },
    judge: [
      { code: `class OrderForm:
    def submit(self):
        send_mail()
        write_log()
        update_screen()
        # 来月: スマホ通知・チャット通知も追加予定`, q: "通知先が増え続けます。どうしますか？", options: ["submit の中に呼び出しを足し続ける", "通知先を登録式にして、submit は全員に知らせるだけにする", "submit を2つに分ける"], answer: 1, why: "登録式にすれば、通知先が増えても submit は変わりません。" },
      { code: `def start():
    config = load_config()
    print("設定を読み込みました")`, q: "起動時に1回だけ設定を読み込む処理です。オブザーバーは必要ですか？", options: ["必要。通知の仕組みを入れる", "不要。知らせたい相手がいない", "必要。登録式にしておく"], answer: 1, why: "知らせる相手がいない処理に、仕組みは要りません。" }],
  },

  decorator: {
    terms: [["クラス", "データと動きをひとまとめにした「設計図」です。"], ["self.base", "このオブジェクトが持っている「中身」です。Milk の中身は Coffee です。"], ["cost()", "値段を返すメソッド（クラスの中の関数）です。"]],
    hints: ["ミルクを「新しい種類のコーヒー」ではなく、「コーヒーを包むもの」と考えてみましょう。", "包むクラスは、中身（base）を持ち、cost() で「中身の値段 + 自分の分」を返します。", `class Milk:
    def __init__(self, base):
        self.base = base

    def cost(self):
        return ____ + 50   # ____ は中身の値段`],
    shapes: [
      { title: "処理の前後にログを出す", story: "関数ごとに「開始」「終了」のログを出しています。関数が増えるたび、同じコードをコピペしています。",
        before: `def fetch_user():
    print("開始")
    data = "user"
    print("終了")
    return data

def fetch_item():
    print("開始")
    data = "item"
    print("終了")
    return data`,
        after: `def with_log(fn):
    def wrapper():
        print("開始")
        result = fn()
        print("終了")
        return result
    return wrapper

@with_log
def fetch_user():
    return "user"`,
        same: "本体はそのままで、前後に機能を足しています。@with_log が、包む部品を付ける書き方です。" },
      { title: "文字の装飾", story: "文字を太字・斜体にします。組み合わせごとにクラスを作ると、数が爆発します。",
        before: `class BoldText:
    def render(self): return "<b>hello</b>"
class ItalicText:
    def render(self): return "<i>hello</i>"
class BoldItalicText:
    def render(self): return "<b><i>hello</i></b>"`,
        after: `class Text:
    def render(self): return "hello"

class Bold:
    def __init__(self, base): self.base = base
    def render(self): return "<b>" + self.base.render() + "</b>"

class Italic:
    def __init__(self, base): self.base = base
    def render(self): return "<i>" + self.base.render() + "</i>"

print(Bold(Italic(Text())).render())`,
        same: "コーヒーのトッピングと同じ形です。包んで足せば、組み合わせ分のクラスは要りません。" }],
    demo: { intro: "Python には、デコレータが最初から入っています。functools.lru_cache は、「結果を覚えておく」機能を、あとから関数に包んで足す部品です。",
      code: `from functools import lru_cache

@lru_cache
def slow_square(n):
    print("計算中…", n)
    return n * n

print(slow_square(4))
print(slow_square(4))`,
      notes: ["2回目は「計算中…」が表示されません。覚えていた結果を返しているからです。", "slow_square の中身は書き換えず、@lru_cache を付けただけで、機能が増えています。"] },
    skip: { code: `class Coffee:
    def cost(self):
        return 300`, text: "トッピングが増える予定がないなら、cost() を直接書けば十分です。「機能の組み合わせが増える」ときに使います。" },
    judge: [
      { code: `def get_user():
    start = time.time()
    pass  # 本処理
    print("所要時間", time.time() - start)

def get_item():
    start = time.time()
    pass  # 本処理
    print("所要時間", time.time() - start)
# 他の10個の関数にも、同じ計測を貼っている`, q: "同じ計測コードを、10個の関数にコピペしています。どうしますか？", options: ["計測を「包む部品（デコレータ）」にして、各関数に付ける", "コピペを続ける", "計測をやめる"], answer: 0, why: "共通の機能は、包む部品にしておくと、1か所の修正で全部に反映されます。" },
      { code: `class Coffee:
    def cost(self):
        return 300`, q: "トッピングは今後も追加しない予定です。デコレータは必要ですか？", options: ["必要。念のため入れておく", "不要。このままでよい", "必要。クラスを増やす"], answer: 1, why: "増えない機能のために、仕組みは要りません。" }],
  },

  "factory-method": {
    terms: [["クラスを変数に入れる", "SmsSender（かっこなし）はクラスそのもの。SmsSender() とかっこを付けると、実物が1つ作られます。"], ["辞書（dict）", "名前と中身の対応表です。{\"a\": 1} なら、\"a\" から 1 を取り出せます。"], ["ValueError", "値がおかしいときに、わざと出すエラーです。"]],
    hints: ["同じ if が2か所にあります。「作る」仕事だけを、1つの関数に取り出せないか考えてみましょう。", "種類からクラスを引く辞書 SENDERS を作り、create_sender(kind) がそれを使って作って返す形にしてみましょう。", `SENDERS = {
    "email": EmailSender,
    # ここに sms / push を足す
}

def create_sender(kind):
    if kind not in SENDERS:
        raise ValueError("unknown: " + kind)
    return ____   # クラスにかっこを付けて作る`],
    shapes: [
      { title: "ファイルの読み込み", story: "ファイルの種類（CSV・JSON）で、読み込む役を作り分けます。同じ if が、読む処理と確認処理の両方にあります。",
        before: `def load(path):
    if path.endswith(".csv"):
        reader = CsvReader()
    elif path.endswith(".json"):
        reader = JsonReader()
    return reader.read(path)

def preview(path):
    if path.endswith(".csv"):
        reader = CsvReader()
    elif path.endswith(".json"):
        reader = JsonReader()
    return reader.read(path)[:5]`,
        after: `READERS = {".csv": CsvReader, ".json": JsonReader}

def create_reader(path):
    for ext, cls in READERS.items():
        if path.endswith(ext):
            return cls()
    raise ValueError("unknown: " + path)

def load(path):
    return create_reader(path).read(path)

def preview(path):
    return create_reader(path).read(path)[:5]`,
        same: "通知のときと同じ形です。「作る判断の if」が、あちこちにコピーされています。" },
      { title: "支払い方法", story: "支払い方法（カード・QR）で、支払い役を作り分けます。店頭と通販の両方で、同じ if を書いています。",
        before: `def pay_at_shop(kind):
    if kind == "card":
        p = CardPay()
    elif kind == "qr":
        p = QrPay()
    p.pay()

def pay_online(kind):
    if kind == "card":
        p = CardPay()
    elif kind == "qr":
        p = QrPay()
    p.pay()`,
        after: `PAYS = {"card": CardPay, "qr": QrPay}

def create_pay(kind):
    return PAYS[kind]()

def pay_at_shop(kind):
    create_pay(kind).pay()

def pay_online(kind):
    create_pay(kind).pay()`,
        same: "支払い方法が増えても、足すのは create_pay の辞書だけです。" }],
    demo: { intro: "Python の open() も、実は作り分けをしています。モードの文字列によって、作られるクラスが変わります。",
      code: `with open("/tmp/a.txt", "w") as f:
    print(type(f).__name__)    # テキスト用

with open("/tmp/a.bin", "wb") as f:
    print(type(f).__name__)    # バイナリ用`,
      notes: ["\"w\" と \"wb\" で、作られるクラスが違います。使う側は、どのクラスかを意識せず f.write() を呼べます。", "「どれを作るか」の判断を、open() が引き受けているわけです。"] },
    skip: { code: `sender = EmailSender()
sender.send("こんにちは")`, text: "送り方が1つだけで、増える予定もないなら、直接作れば十分です。「同じ作り分けが、あちこちに出てきた」ときに使います。" },
    judge: [
      { code: `def pay_at_shop(kind):
    if kind == "card": p = CardPay()
    elif kind == "qr": p = QrPay()
    p.pay()

def pay_online(kind):
    if kind == "card": p = CardPay()
    elif kind == "qr": p = QrPay()
    p.pay()

def refund(kind):
    if kind == "card": p = CardPay()
    elif kind == "qr": p = QrPay()
    p.refund()`, q: "同じ if が3か所にあります。来月は支払い方法が増えます。どうしますか？", options: ["3か所とも書き足す", "作る判断を create_pay() の1か所に集める", "クラス名を短くする"], answer: 1, why: "作る判断を1か所に集めれば、増えたときに直すのはそこだけです。" },
      { code: `sender = EmailSender()
sender.send("こんにちは")`, q: "送り方は今後もメールだけです。ファクトリーは必要ですか？", options: ["不要。直接作ればよい", "必要。念のため辞書を作る", "必要。create 関数を足す"], answer: 0, why: "作り分けが無いなら、直接作るのが一番シンプルです。" }],
  },

  state: {
    terms: [["状態（state）", "「今どういう状況か」を表す印です。自動販売機なら「待機中」「お金あり」「売り切れ」です。"], ["メソッド", "クラスの中の関数です。insert_coin() や push_button() がそうです。"], ["self", "そのオブジェクト自身のことです。self.state は「自分の今の状態」です。"]],
    hints: ["「状態ごとの動き」を、状態ごとの別のクラスに移せないか考えてみましょう。", "VendingMachine は自分で判断せず、今の状態に任せます。self.state.insert_coin(self) のような形です。", `class SoldOut:
    def insert_coin(self, vm):
        print("売り切れです")

    def push_button(self, vm):
        ____   # 売り切れのときは？

class VendingMachine:
    def insert_coin(self):
        self.state.insert_coin(self)   # 状態に任せる`],
    shapes: [
      { title: "記事の公開状態", story: "記事に「下書き・公開中・削除済み」の状態があり、状態ごとに、編集や公開の可否が変わります。メソッドごとに同じような if が並びます。",
        before: `class Article:
    def publish(self):
        if self.status == "draft":
            self.status = "published"
        else:
            print("公開できません")

    def edit(self):
        if self.status == "draft":
            print("編集できます")
        elif self.status == "published":
            print("公開中は編集できません")
        else:
            print("削除済みは編集できません")`,
        after: `class Draft:
    def publish(self, a): a.state = Published()
    def edit(self, a): print("編集できます")

class Published:
    def publish(self, a): print("すでに公開中です")
    def edit(self, a): print("公開中は編集できません")

class Article:
    def __init__(self): self.state = Draft()
    def publish(self): self.state.publish(self)
    def edit(self): self.state.edit(self)`,
        same: "自動販売機と同じ形です。「状態ごとに動きが違う」if が、メソッドの数だけ並んでいます。" },
      { title: "ゲームキャラの状態", story: "キャラに「通常・毒・無敵」の状態があり、ダメージを受けたときの動きが変わります。状態が増えるたび、if を書き足します。",
        before: `class Hero:
    def damage(self, n):
        if self.status == "normal":
            self.hp -= n
        elif self.status == "poison":
            self.hp -= n * 2
        elif self.status == "invincible":
            pass`,
        after: `class Normal:
    def damage(self, hero, n): hero.hp -= n

class Poison:
    def damage(self, hero, n): hero.hp -= n * 2

class Invincible:
    def damage(self, hero, n): pass

class Hero:
    def damage(self, n):
        self.state.damage(self, n)`,
        same: "状態を足すときは、クラスを1つ足すだけです。Hero には手を入れません。" }],
    demo: { intro: "いちばん小さなステートの例として、信号機を動かしてみましょう。「今の状態」が、動きも「次の状態」も決めています。",
      code: `class Red:
    def show(self):
        print("止まれ")
    def next(self):
        return Green()

class Green:
    def show(self):
        print("進め")
    def next(self):
        return Red()

light = Red()
for _ in range(4):
    light.show()
    light = light.next()`,
      notes: ["if が1つもありません。今の状態のクラスが、自分の動きと次の状態を知っています。", "Yellow（注意）クラスを足して、Green の next から Yellow を経由させてみてください。"] },
    skip: { code: `class Light:
    def toggle(self):
        self.on = not self.on`, text: "ON/OFFの2状態だけなら、True/False で十分です。状態が増えて、メソッドごとに同じ if が並び始めたときが出番です。" },
    judge: [
      { code: `class Order:
    def pay(self):
        if self.status == "new": pass
        elif self.status == "paid": pass
        elif self.status == "shipped": pass
        # …全5種類
    def cancel(self):
        if self.status == "new": pass
        elif self.status == "paid": pass
        elif self.status == "shipped": pass
        # …全5種類`, q: "状態が5種類あり、どのメソッドにも同じ if が並んでいます。どうしますか？", options: ["状態ごとにクラスを分けて、動きを任せる", "if の順番を入れ替える", "メソッドを1つにまとめる"], answer: 0, why: "状態ごとにクラスを分けると、動きが状態ごとにまとまり、状態を足しやすくなります。" },
      { code: `class Light:
    def toggle(self):
        self.on = not self.on`, q: "ON/OFFの2状態だけです。ステートは必要ですか？", options: ["必要。クラスを2つ作る", "必要。Enumも使う", "不要。このままで読みやすい"], answer: 2, why: "2状態なら、True/False が一番シンプルです。" }],
  },
};

// ================= 到達度対応：構造チェック・読解問題・書く課題・レシピ =================
// 構造チェック用のPython補助関数（ユーザーのコードを ast で調べる）
const RULE_PRE = `import ast
tree = ast.parse(__src__)
def func(name):
    return [n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.name == name]
def klass(name):
    return [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef) and n.name == name]
def has_if(n):
    return any(isinstance(x, ast.If) for x in ast.walk(n))
def has_print(n):
    return any(isinstance(x, ast.Call) and getattr(x.func, "id", None) == "print" for x in ast.walk(n))
def methods(c):
    return [m for m in c.body if isinstance(m, ast.FunctionDef) and m.name != "__init__"]
def wrappers():
    out = []
    for c in ast.walk(tree):
        if isinstance(c, ast.ClassDef):
            for m in c.body:
                if isinstance(m, ast.FunctionDef) and m.name == "__init__" and len(m.args.args) >= 2:
                    out.append(c.name)
    return out
def count_str(s):
    return sum(1 for x in ast.walk(tree) if isinstance(x, ast.Constant) and x.value == s)
`;

Object.assign(LEARN.strategy, {
  recipe: ["変わるところを探す：割引の「やり方」（種類ごとに計算が違う）", "切り出す：やり方を1つずつ関数にして、辞書に名前つきで並べる", "残すところ：calc は、辞書から選んで呼ぶだけ。足すときは辞書に1行"],
  fixRule: `fs = func("calc")
if not fs:
    print("calc という関数が見つかりません。名前は変えずに残しましょう。")
elif any(has_if(f) for f in fs):
    print("calc の中に if / elif が残っています。割引のやり方を部品にして、選ぶだけの形にしましょう。")
`,
  reads: [
    { code: `FEES = {
    "dog": lambda kg: 3000 + kg * 100,
    "cat": lambda kg: 2500,
    "rabbit": lambda kg: 1500,
}

def boarding_fee(animal, kg):
    return FEES[animal](kg)`, q: "ペットホテルの料金計算です。新しく「鳥」の料金を足すとき、書き足す場所はどこですか？", options: ["FEES の辞書に1行", "boarding_fee の中に elif", "FEES と boarding_fee の両方を書き換える"], answer: 0, why: "料金のやり方は FEES に集まっていて、boarding_fee は選んで呼ぶだけです。だから辞書に足すだけで済みます。" },
    { code: `FEES = {
    "dog": lambda kg: 3000 + kg * 100,
    "cat": lambda kg: 2500,
}

def boarding_fee(animal, kg):
    return FEES[animal](kg)`, q: "このコードで「やり方の部品」にあたるのはどれですか？", options: ["boarding_fee という関数", "lambda で書かれた、動物ごとの料金計算", "animal という引数"], answer: 1, why: "動物ごとに違う計算（やり方）が、1つずつの関数になっています。これがやり方の部品です。" }],
  transfer: {
    title: "ポイント還元のルールが増えていく",
    brief: "ここまでの学びを、別の場面で、自力で使ってみましょう。",
    code: `def points(rank, price):
    if rank == "bronze":
        return int(price * 0.01)
    elif rank == "silver":
        return int(price * 0.02)
    elif rank == "gold":
        return int(price * 0.03)
    else:
        raise ValueError("unknown: " + rank)

print(points("bronze", 1000))
print(points("gold", 1000))
print(points("platinum", 1000))   # ← 新ランク
`,
    request: "会員ランク「プラチナ」を追加します。ポイントは「購入額の5% + 100ポイントのボーナス」です。来月からは「ダイヤ」「ブラック」も増える予定です。ランクが増えるたびに if を足さずに済む形にしてください。",
    expect: "次の3行を出力してください",
    expected: "10\n30\n150",
    rule: `fs = func("points")
if not fs:
    print("points という関数が見つかりません。名前は変えずに残しましょう。")
elif any(has_if(f) for f in fs):
    print("points の中に if / elif が残っています。ランクごとの計算を部品にして、選ぶだけの形にしましょう。")
`,
    hints: ["ランクごとの計算を、1つずつ関数（lambda）にして、辞書に並べてみましょう。プラチナだけ「5% + 100」と計算が違う点に注意です。", `RULES = {
    "bronze": lambda p: int(p * 0.01),
    # silver / gold / platinum を足す
}

def points(rank, price):
    return ____`],
    answerCode: `RULES = {
    "bronze": lambda p: int(p * 0.01),
    "silver": lambda p: int(p * 0.02),
    "gold": lambda p: int(p * 0.03),
    "platinum": lambda p: int(p * 0.05) + 100,
}

def points(rank, price):
    return RULES[rank](price)

print(points("bronze", 1000))
print(points("gold", 1000))
print(points("platinum", 1000))
`,
  },
});

Object.assign(LEARN.observer, {
  recipe: ["変わるところを探す：通知先（画面・ログ・警報…が増えていく）", "切り出す：通知先を1つずつ関数にして、登録できるリスト（listeners）に入れる", "残すところ：温度計は、登録された全員に知らせるだけ"],
  fixRule: `cs = klass("Thermometer")
if not cs:
    print("Thermometer クラスが見つかりません。")
elif any(has_print(c) for c in cs):
    print("Thermometer の中に print が残っています。表示・保存・警報は外の関数に出して、登録する形にしましょう。")
`,
  reads: [
    { code: `class Timer:
    def __init__(self):
        self.callbacks = []

    def on_finish(self, fn):
        self.callbacks.append(fn)

    def finish(self):
        for fn in self.callbacks:
            fn()

timer = Timer()
timer.on_finish(lambda: print("音を鳴らす"))
timer.on_finish(lambda: print("通知を出す"))
timer.finish()`, q: "タイマーのコードです。「知らせを受け取る側」にあたるのはどれですか？", options: ["Timer クラス", "lambda: print(...) の関数たち", "finish メソッド"], answer: 1, why: "on_finish で登録されている、音・通知の関数が受け取る側です。Timer は知らせる側です。" },
    { code: `class Timer:
    def __init__(self):
        self.callbacks = []

    def on_finish(self, fn):
        self.callbacks.append(fn)

    def finish(self):
        for fn in self.callbacks:
            fn()`, q: "「メール送信」も終了時に実行したくなりました。Timer の書き換えは必要ですか？", options: ["必要。finish にメール送信を書き足す", "不要。メール送信の関数を on_finish で登録するだけ", "必要。callbacks を増やす"], answer: 1, why: "登録式なので、受け取る側を増やすだけです。Timer は変わりません。" }],
  transfer: {
    title: "注文が確定したときの処理が増えていく",
    brief: "ここまでの学びを、別の場面で、自力で使ってみましょう。",
    code: `class Order:
    def confirm(self):
        print("在庫を引き当てる")
        print("領収書を発行する")

order = Order()
order.confirm()
`,
    request: "注文確定のときに「ポイントを付与する」処理も実行します。来月は「配送を手配する」「メールで通知する」も増える予定です。そのたびに Order を書き換えずに済む形にしてください。",
    expect: "次の3行を出力してください（在庫 → 領収書 → ポイントの順）",
    expected: "在庫を引き当てる\n領収書を発行する\nポイントを付与する",
    rule: `cs = klass("Order")
if not cs:
    print("Order クラスが見つかりません。")
elif any(has_print(c) for c in cs):
    print("Order の中に print が残っています。各処理は外の関数にして、登録する形にしましょう。")
`,
    hints: ["Order が処理を直接持つのをやめて、「実行する処理のリスト」を持つ形にしてみましょう。処理は外の関数にします。", `class Order:
    def __init__(self):
        self.listeners = []

    def subscribe(self, fn):
        ____

    def confirm(self):
        ____   # 登録された処理を順に実行`],
    answerCode: `class Order:
    def __init__(self):
        self.listeners = []

    def subscribe(self, fn):
        self.listeners.append(fn)

    def confirm(self):
        for fn in self.listeners:
            fn()

def reserve_stock():
    print("在庫を引き当てる")

def issue_receipt():
    print("領収書を発行する")

def give_points():
    print("ポイントを付与する")

order = Order()
order.subscribe(reserve_stock)
order.subscribe(issue_receipt)
order.subscribe(give_points)
order.confirm()
`,
  },
});

Object.assign(LEARN.decorator, {
  recipe: ["変わるところを探す：トッピングの組み合わせ", "切り出す：トッピングを、中身を包んで値段を足すクラスにする", "残すところ：本体（Coffee）は何も知らないまま。トッピングは重ねて使う"],
  fixRule: `if len(wrappers()) < 2:
    print("中身（base）を受け取って包むクラスが2つ以上ありません。トッピングを「包むクラス」にしてみましょう。")
`,
  reads: [
    { code: `class Pizza:
    def price(self):
        return 800

class Cheese:
    def __init__(self, base):
        self.base = base
    def price(self):
        return self.base.price() + 150

class Corn:
    def __init__(self, base):
        self.base = base
    def price(self):
        return self.base.price() + 100

order = Corn(Cheese(Pizza()))
print(order.price())`, q: "このコードを実行すると、何が表示されますか？", options: ["800", "1050", "1100"], answer: 1, why: "内側から順に、ピザ800円 → チーズで+150 → コーンで+100。合計1050円です。" },
    { code: `class Pizza:
    def price(self):
        return 800

class Cheese:
    def __init__(self, base):
        self.base = base
    def price(self):
        return self.base.price() + 150`, q: "このコードで「包む皮」にあたるクラスはどれですか？", options: ["Pizza", "Cheese", "price メソッド"], answer: 1, why: "Cheese は base（中身）を受け取り、その値段に自分の分を足しています。包む皮です。" }],
  transfer: {
    title: "ラーメン屋のトッピングが増えていく",
    brief: "ここまでの学びを、別の場面で、自力で使ってみましょう。",
    code: `class Ramen:
    def price(self):
        return 800

class RamenBig:
    def price(self):
        return 900

class RamenEgg:
    def price(self):
        return 900

class RamenBigEgg:
    def price(self):
        return 1000

print(Ramen().price())
print(RamenBigEgg().price())
# 新: チャーシュー(+200円) → 全部のせは？
`,
    request: "新しいトッピング「チャーシュー（+200円）」を追加します。大盛り（+100円）・味玉（+100円）との組み合わせごとにクラスを作ると、数が増えすぎます。トッピングを重ねられる形に作り替えてください。",
    expect: "次の3行を出力してください（ラーメン / 大盛り+味玉 / 大盛り+味玉+チャーシュー）",
    expected: "800\n1000\n1200",
    rule: `if len(wrappers()) < 2:
    print("中身を受け取って包むクラスが2つ以上ありません。トッピングを「包むクラス」にしてみましょう。")
`,
    hints: ["大盛り・味玉・チャーシューを、「ラーメンを包んで値段を足すクラス」にしてみましょう。", `class Big:
    def __init__(self, base):
        self.base = base

    def price(self):
        return ____   # 中身の値段 + 100`],
    answerCode: `class Ramen:
    def price(self):
        return 800

class Big:
    def __init__(self, base):
        self.base = base
    def price(self):
        return self.base.price() + 100

class Egg:
    def __init__(self, base):
        self.base = base
    def price(self):
        return self.base.price() + 100

class Chashu:
    def __init__(self, base):
        self.base = base
    def price(self):
        return self.base.price() + 200

print(Ramen().price())
print(Egg(Big(Ramen())).price())
print(Chashu(Egg(Big(Ramen()))).price())
`,
  },
});

Object.assign(LEARN["factory-method"], {
  recipe: ["変わるところを探す：何を作るか（種類が増えていく）", "切り出す：種類→クラスの対応表と、作る関数（create_xxx）を用意する", "残すところ：使う側は、create_xxx に頼むだけ"],
  fixRule: `fs = func("booking_done") + func("booking_cancel")
if len(fs) < 2:
    print("booking_done と booking_cancel の両方を残しましょう。")
elif any(has_if(f) for f in fs):
    print("booking_done / booking_cancel の中に if が残っています。作る判断を1か所の関数に集めましょう。")
`,
  reads: [
    { code: `EXPORTERS = {
    "pdf": PdfExporter,
    "csv": CsvExporter,
}

def create_exporter(fmt):
    return EXPORTERS[fmt]()

def export_report(fmt):
    create_exporter(fmt).run("売上")`, q: "レポート出力のコードです。「どのクラスを作るか決める場所」はどれですか？", options: ["export_report", "create_exporter", "run"], answer: 1, why: "形式の名前からクラスを選んで作るのは create_exporter です。作る判断がここに集まっています。" },
    { code: `EXPORTERS = {
    "pdf": PdfExporter,
    "csv": CsvExporter,
}

def create_exporter(fmt):
    return EXPORTERS[fmt]()

def export_report(fmt):
    create_exporter(fmt).run("売上")`, q: "Excel形式を足すとき、触る場所はどこですか？", options: ["EXPORTERS に1行と、Excel用クラスの追加だけ", "export_report を書き換える", "すべての関数に elif を足す"], answer: 0, why: "作る判断は EXPORTERS と create_exporter に集まっているので、export_report は変わりません。" }],
  transfer: {
    title: "ゲームの敵の登場場所が増えていく",
    brief: "ここまでの学びを、別の場面で、自力で使ってみましょう。",
    code: `class Slime:
    def attack(self):
        print("スライムの体当たり")

class Goblin:
    def attack(self):
        print("ゴブリンの棍棒")

def spawn_field(kind):
    if kind == "slime":
        e = Slime()
    elif kind == "goblin":
        e = Goblin()
    else:
        raise ValueError("unknown: " + kind)
    e.attack()

def spawn_cave(kind):
    print("洞窟に出現!")
    if kind == "slime":
        e = Slime()
    elif kind == "goblin":
        e = Goblin()
    else:
        raise ValueError("unknown: " + kind)
    e.attack()

spawn_field("slime")
spawn_cave("goblin")
spawn_field("dragon")   # ← 新しい敵
`,
    request: "新しい敵「ドラゴン」（攻撃は「ドラゴンのブレス」）を追加します。来月は敵が10種類ほど増える予定です。敵を作る if が2か所にコピーされているので、作る判断を1か所に集めてください。",
    expect: "次の4行を出力してください",
    expected: "スライムの体当たり\n洞窟に出現!\nゴブリンの棍棒\nドラゴンのブレス",
    rule: `fs = func("spawn_field") + func("spawn_cave")
if len(fs) < 2:
    print("spawn_field と spawn_cave の両方を残しましょう。")
elif any(has_if(f) for f in fs):
    print("spawn_field / spawn_cave の中に if が残っています。敵を作る判断を1か所の関数に集めましょう。")
`,
    hints: ["「どの敵を作るか」の判断だけを、create_enemy(kind) という関数に取り出してみましょう。", `ENEMIES = {
    "slime": Slime,
    # goblin / dragon を足す
}

def create_enemy(kind):
    return ____   # クラスにかっこを付けて作る`],
    answerCode: `class Slime:
    def attack(self):
        print("スライムの体当たり")

class Goblin:
    def attack(self):
        print("ゴブリンの棍棒")

class Dragon:
    def attack(self):
        print("ドラゴンのブレス")

ENEMIES = {"slime": Slime, "goblin": Goblin, "dragon": Dragon}

def create_enemy(kind):
    if kind not in ENEMIES:
        raise ValueError("unknown: " + kind)
    return ENEMIES[kind]()

def spawn_field(kind):
    create_enemy(kind).attack()

def spawn_cave(kind):
    print("洞窟に出現!")
    create_enemy(kind).attack()

spawn_field("slime")
spawn_cave("goblin")
spawn_field("dragon")
`,
  },
});

Object.assign(LEARN.state, {
  recipe: ["変わるところを探す：状態ごとの動き（どのメソッドにも if が並ぶ）", "切り出す：状態ごとにクラスを作り、各クラスに「その状態での動き」を書く", "残すところ：本体は、今の状態に任せるだけ。状態の切り替えは state を入れ替える"],
  fixRule: `cs = klass("VendingMachine")
ms = [m for c in cs for m in methods(c)]
if not cs:
    print("VendingMachine クラスが見つかりません。")
elif any(has_if(m) for m in ms):
    print("VendingMachine のメソッドに if が残っています。状態ごとのクラスに動きを任せましょう。")
`,
  reads: [
    { code: `class Off:
    def press(self, lamp):
        lamp.state = Low()
        print("弱")

class Low:
    def press(self, lamp):
        lamp.state = High()
        print("強")

class High:
    def press(self, lamp):
        lamp.state = Off()
        print("消灯")

class Lamp:
    def __init__(self):
        self.state = Off()
    def press(self):
        self.state.press(self)

lamp = Lamp()
lamp.press()
lamp.press()
lamp.press()`, q: "ランプのコードです。実行すると、どう表示されますか？", options: ["弱 → 強 → 消灯", "消灯 → 弱 → 強", "弱 → 弱 → 弱"], answer: 0, why: "最初は Off。押すたびに Off→Low→High→Off と状態が移り、表示は「弱」「強」「消灯」の順です。" },
    { code: `class Lamp:
    def __init__(self):
        self.state = Off()
    def press(self):
        self.state.press(self)`, q: "このコードで、ランプの「今の状態」を持っているのはどれですか？", options: ["self.state", "press という名前", "Lamp という名前"], answer: 0, why: "self.state が、今の状態のオブジェクトを指しています。押されると、これに処理を任せます。" }],
  transfer: {
    title: "ドアに「鍵」が加わる",
    brief: "ここまでの学びを、別の場面で、自力で使ってみましょう。",
    code: `class Door:
    def __init__(self):
        self.state = "closed"   # closed=閉 / opened=開

    def open(self):
        if self.state == "closed":
            self.state = "opened"
            print("開きました")
        elif self.state == "opened":
            print("すでに開いています")

    def close(self):
        if self.state == "opened":
            self.state = "closed"
            print("閉まりました")
        elif self.state == "closed":
            print("すでに閉まっています")

door = Door()
door.open()
door.open()
door.close()
door.lock()   # ← まだ無い
door.open()
`,
    request: "ドアに「施錠（lock）」を追加します。閉まっているドアだけ施錠でき、施錠中は開閉しようとすると「鍵がかかっています」と表示します。来月は「解錠（unlock）」や「故障中」も増える予定です。状態が増えても、Door のメソッドに if を足さずに済む形にしてください。",
    expect: "次の5行を出力してください",
    expected: "開きました\nすでに開いています\n閉まりました\n施錠しました\n鍵がかかっています",
    rule: `cs = klass("Door")
ms = [m for c in cs for m in methods(c)]
if not cs:
    print("Door クラスが見つかりません。")
elif any(has_if(m) for m in ms):
    print("Door のメソッドに if が残っています。状態ごとのクラスに動きを任せましょう。")
`,
    hints: ["「閉」「開」「施錠」を、状態ごとのクラスにして、open / close / lock をそれぞれのクラスに書いてみましょう。", `class Locked:
    def open(self, door):
        print("鍵がかかっています")

    def close(self, door):
        ____

class Door:
    def __init__(self):
        self.state = Closed()

    def open(self):
        self.state.open(self)   # 状態に任せる`],
    answerCode: `class Closed:
    def open(self, d):
        d.state = Opened()
        print("開きました")
    def close(self, d):
        print("すでに閉まっています")
    def lock(self, d):
        d.state = Locked()
        print("施錠しました")

class Opened:
    def open(self, d):
        print("すでに開いています")
    def close(self, d):
        d.state = Closed()
        print("閉まりました")
    def lock(self, d):
        print("閉めてから施錠してください")

class Locked:
    def open(self, d):
        print("鍵がかかっています")
    def close(self, d):
        print("鍵がかかっています")
    def lock(self, d):
        print("すでに施錠されています")

class Door:
    def __init__(self):
        self.state = Closed()
    def open(self):
        self.state.open(self)
    def close(self):
        self.state.close(self)
    def lock(self):
        self.state.lock(self)

door = Door()
door.open()
door.open()
door.close()
door.lock()
door.open()
`,
  },
});

// ================= 新講座：Template Method / Command / Adapter =================
LEARN["template-method"] = {
  terms: [["継承（class B(A)）", "親クラス A の機能を、子クラス B が受け継ぐ仕組みです。class SalesReport(Report) は「Report の子」です。"], ["上書き（オーバーライド）", "親が用意したメソッドを、子が自分の中身で書き換えることです。"], ["NotImplementedError", "「ここはまだ書かれていません。子クラスで書いてください」という印のエラーです。"]],
  hints: ["流れ（見出し → 本文 → 締め）は、全レポートで同じです。違うのは本文だけ。流れを1か所に書いて、本文だけを差し替えられないか考えてみましょう。", "親クラス Report に show() を書き、その中で本文の部分に self.body() を呼びます。子クラスは body() だけを書きます。", `class Report:
    def show(self):
        print("=== レポート ===")
        ____          # 本文（子クラスが書く部分）を呼ぶ
        print("=== 終わり ===")

class SalesReport(Report):
    def body(self):
        print("売上: 120万円")`],
  recipe: ["変わるところを探す：レポートごとの本文（見出しと締めは変わらない）", "切り出す：流れ（見出し → body() → 締め）を親に書き、本文は子の body() に書く", "残すところ：親の show() は、子の中身を知らず、body() を呼ぶだけ"],
  fixRule: `n1 = count_str("=== レポート ===")
n2 = count_str("=== 終わり ===")
if n1 > 1 or n2 > 1:
    print("見出しや締めの文言が、まだ複数の場所に書かれています。流れ（見出し → 本文 → 締め）を1か所にまとめましょう。")
`,
  principle: { i: 0, text: "変わらないのは「見出し → 本文 → 締め」という流れ。変わるのは「本文」だけ。流れは親に1回だけ書き、変わる本文だけを子に書かせました。" },
  shapes: [
    { title: "データの取り込み", story: "CSVとJSONを取り込みます。「ファイルを開く → 読む → 保存する」の流れは同じで、読み方だけが違います。",
      before: `def import_csv(path):
    print("ファイルを開く:", path)
    print("CSVを読む")
    print("保存する")

def import_json(path):
    print("ファイルを開く:", path)
    print("JSONを読む")
    print("保存する")`,
      after: `class Importer:
    def read(self):
        raise NotImplementedError

    def run(self, path):
        print("ファイルを開く:", path)
        self.read()
        print("保存する")

class CsvImporter(Importer):
    def read(self):
        print("CSVを読む")`,
      same: "レポートと同じ形です。流れは同じで、1か所だけ違うコードが、コピペされています。" },
    { title: "ゲームのターン処理", story: "キャラごとに行動が違いますが、「ターン開始 → 行動 → ターン終了」の流れは同じです。",
      before: `def warrior_turn():
    print("ターン開始")
    print("剣で攻撃")
    print("ターン終了")

def mage_turn():
    print("ターン開始")
    print("魔法で攻撃")
    print("ターン終了")`,
      after: `class Character:
    def action(self):
        raise NotImplementedError

    def turn(self):
        print("ターン開始")
        self.action()
        print("ターン終了")

class Warrior(Character):
    def action(self):
        print("剣で攻撃")`,
      same: "キャラが増えても、書くのは action() だけです。ターンの流れを変えるときは、親の1か所だけを直します。" }],
  demo: { intro: "Python のテスト機能（unittest）は、この形で作られています。流れ「準備 → テスト → 後片付け」は決まっていて、自分が書くのは、真ん中のテストの中身だけです。",
    code: `import unittest

class DemoTest(unittest.TestCase):
    def setUp(self):
        print("準備：データを用意する")

    def tearDown(self):
        print("後片付け：データを消す")

    def test_a(self):
        print("  テストAを実行")

    def test_b(self):
        print("  テストBを実行")

unittest.main(argv=["x"], exit=False, verbosity=0)`,
    notes: ["テストを書く人は、setUp / tearDown / test_… のメソッドを書くだけです。呼ぶ順番（流れ）は、unittest が決めています。", "テストごとに「準備 → 実行 → 後片付け」が繰り返されている点に注目してください。"] },
  skip: { code: `def sales_report():
    print("=== レポート ===")
    print("売上: 120万円")
    print("=== 終わり ===")`, text: "レポートが1種類だけで、増える予定もないなら、そのまま書くのが一番読みやすいです。「同じ流れで、一部だけ違うもの」が2つ3つと出てきたときが出番です。" },
  judge: [
    { code: `def import_csv(path):
    open_file(path)
    parse_csv()
    save()

def import_json(path):
    open_file(path)
    parse_json()
    save()

def import_xml(path):
    open_file(path)
    parse_xml()
    save()`, q: "流れは同じで、読み方（parse）だけが違う関数が3つあります。どうしますか？", options: ["親クラスに流れを書き、読み方だけを子クラスで書く", "3つの関数を、そのまま残す", "ファイルを開く処理だけ、別のファイルに移す"], answer: 0, why: "流れを親の1か所に書けば、読み方だけを子が書けます。形式が増えても、流れは変わりません。" },
    { code: `def backup():
    print("コピーする")
    print("完了")`, q: "バックアップ処理は1種類だけで、他の種類の予定はありません。テンプレートメソッドは必要ですか？", options: ["必要。念のため親クラスを作る", "不要。そのままでよい", "必要。子クラスを3つ作る"], answer: 1, why: "「同じ流れで一部だけ違う」ものが無いので、仕組みは要りません。" }],
  reads: [
    { code: `class Cooking:
    def cook(self):
        self.prepare()
        self.heat()
        print("盛りつけ")

    def prepare(self):
        print("材料を切る")

    def heat(self):
        raise NotImplementedError

class Curry(Cooking):
    def heat(self):
        print("煮込む")

class Steak(Cooking):
    def heat(self):
        print("焼く")

Steak().cook()`, q: "実行すると、どの順に表示されますか？", options: ["材料を切る → 焼く → 盛りつけ", "焼く → 材料を切る → 盛りつけ", "材料を切る → 盛りつけ"], answer: 0, why: "流れは親の cook() が決めます（切る → heat → 盛りつけ）。heat だけ、Steak が「焼く」に差し替えています。" },
    { code: `class Cooking:
    def cook(self):
        self.prepare()
        self.heat()
        print("盛りつけ")

    def prepare(self):
        print("材料を切る")

    def heat(self):
        raise NotImplementedError

class Curry(Cooking):
    def heat(self):
        print("煮込む")`, q: "このコードで、「子クラスが書く部分」にあたるメソッドはどれですか？", options: ["prepare", "heat", "cook"], answer: 1, why: "親では heat が「まだ書かれていない」印になっていて、子（Curry）が中身を書いています。" }],
  transfer: {
    title: "メールの文面が増えていく",
    brief: "ここまでの学びを、別の場面で、自力で使ってみましょう。",
    code: `def thanks_mail(name):
    print("こんにちは、" + name + "さん")
    print("ご購入ありがとうございます。")
    print("--- カスタマーサポート ---")

def shipped_mail(name):
    print("こんにちは、" + name + "さん")
    print("商品を発送しました。")
    print("--- カスタマーサポート ---")

thanks_mail("田中")
shipped_mail("鈴木")
# 新: キャンセルのメール（佐藤さん）も出す
`,
    request: "新しく「キャンセル受付メール」（本文は「ご注文をキャンセルしました。」、宛先は佐藤さん）を追加します。さらに、すべてのメールの署名を「--- カスタマーサポート ---」から「--- サポートチーム ---」に変更することになりました。流れ（あいさつ → 本文 → 署名）は1か所にまとめて、メールごとに違う本文だけを書く形にしてください。",
    expect: "次の9行を出力してください（田中さん / 鈴木さん / 佐藤さんの順。署名はすべて「--- サポートチーム ---」）",
    expected: "こんにちは、田中さん\nご購入ありがとうございます。\n--- サポートチーム ---\nこんにちは、鈴木さん\n商品を発送しました。\n--- サポートチーム ---\nこんにちは、佐藤さん\nご注文をキャンセルしました。\n--- サポートチーム ---",
    rule: `if count_str("こんにちは、") > 1 or count_str("--- サポートチーム ---") > 1:
    print("あいさつや署名が、まだ複数の場所に書かれています。流れ（あいさつ → 本文 → 署名）を1か所にまとめましょう。")
`,
    hints: ["流れ（あいさつ → 本文 → 署名）は、全部のメールで同じです。違うのは本文だけ。流れを親クラスに書き、本文は子クラスに書かせましょう。", `class Mail:
    def __init__(self, name):
        self.name = name

    def send(self):
        print("こんにちは、" + self.name + "さん")
        ____   # 本文（子クラスが書く部分）
        print("--- サポートチーム ---")`],
    answerCode: `class Mail:
    def __init__(self, name):
        self.name = name

    def body(self):
        raise NotImplementedError

    def send(self):
        print("こんにちは、" + self.name + "さん")
        self.body()
        print("--- サポートチーム ---")

class ThanksMail(Mail):
    def body(self):
        print("ご購入ありがとうございます。")

class ShippedMail(Mail):
    def body(self):
        print("商品を発送しました。")

class CancelMail(Mail):
    def body(self):
        print("ご注文をキャンセルしました。")

ThanksMail("田中").send()
ShippedMail("鈴木").send()
CancelMail("佐藤").send()
`,
  },
};

LEARN.command = {
  terms: [["履歴（history）", "実行した操作を、順に並べて覚えておくリストです。取り消すときは、最後のものから取り出します。"], ["append / pop", "append はリストの最後に足す、pop はリストの最後を取り出して返す操作です。"], ["execute / undo", "操作の「やる」と「取り消す」の名前です。名前はこの2つにそろえておくと、呼ぶ側が楽になります。"]],
  hints: ["「文字を書く」という操作を、1つのオブジェクトにできないか考えてみましょう。「やること」と「取り消し方」をセットで持たせます。", "Write クラスに execute(ed) と undo(ed) を作ります。Editor は、実行した操作を history リストに積みます。undo では、最後の操作を取り出して、その undo を呼びます。", `class Write:
    def __init__(self, s):
        self.s = s

    def execute(self, ed):
        ed.text += self.s

    def undo(self, ed):
        ____   # 足した文字を取り除く

class Editor:
    def run(self, cmd):
        cmd.execute(self)
        ____   # history に cmd を積む`],
  recipe: ["変わるところを探す：操作の種類（書く・消す・貼り付ける…が増える）", "切り出す：操作を「execute（やる）と undo（取り消す）を持つクラス」にする", "残すところ：Editor は、操作を実行して履歴に積むだけ。undo は履歴の最後に任せる"],
  fixRule: `cmds = [c for c in ast.walk(tree) if isinstance(c, ast.ClassDef) and c.name != "Editor" and {"execute", "undo"} <= {m.name for m in c.body if isinstance(m, ast.FunctionDef)}]
if not cmds:
    print("execute と undo の両方を持つ「操作のクラス」がありません。「文字を書く」操作をクラスにしてみましょう。")
`,
  principle: { i: 2, text: "Editor は、操作の中身を知りません。「execute と undo を呼べる」という約束だけを知っています。だから、新しい操作を足しても Editor は変わりません。" },
  shapes: [
    { title: "あとで実行するジョブキュー", story: "「メール送信」「レポート作成」のような処理を、今すぐではなく、あとでまとめて実行したい場面です。",
      before: `print("メール送信")
print("レポート作成")
# すぐに実行されてしまう。
# あとで、順番を決めて実行したい…`,
      after: `queue = []
queue.append(lambda: print("メール送信"))
queue.append(lambda: print("レポート作成"))

for job in queue:     # あとで、好きなタイミングで実行
    job()`,
      same: "「処理」を、すぐ実行せず、持ち回れる部品にしています。これが、コマンドの考え方です。" },
    { title: "操作の記録と再生", story: "ゲームでキャラを動かした操作を記録して、リプレイとして再生したい場面です。",
      before: `def play():
    move("up")
    move("up")
    move("left")
# 操作が実行されるだけで、記録が残らない`,
      after: `class Move:
    def __init__(self, d):
        self.d = d

    def execute(self):
        move(self.d)

recorded = [Move("up"), Move("up"), Move("left")]
for cmd in recorded:     # 保存した操作を、あとで再生できる
    cmd.execute()`,
      same: "操作がオブジェクトになっているので、保存・並べ替え・再生ができます。" }],
  demo: { intro: "Python の functools.partial は、「関数と引数」をセットにして、あとで実行できる形にします。小さなコマンドです。",
    code: `from functools import partial

def greet(name, mark):
    print("こんにちは、" + name + mark)

queue = [partial(greet, "田中", "！"), partial(greet, "鈴木", "。")]

print("--- まだ実行していない ---")
for job in queue:
    job()`,
    notes: ["partial(greet, \"田中\", \"！\") は、まだ実行されず、「あとで実行する操作」として queue に入ります。", "for の中の job() で、初めて実行されます。「いつ実行するか」を、呼ぶ側が決められます。"] },
  skip: { code: `def save():
    print("保存しました")

save()`, text: "取り消しも、あとで実行も、記録も要らないなら、普通に関数を呼べば十分です。「取り消したい」「記録したい」「あとで実行したい」のどれかが出てきたときが出番です。" },
  judge: [
    { code: `class Editor:
    def write(self, s): ...
    def delete(self, n): ...
    def paste(self, s): ...
# どの操作も「元に戻す」に対応したい。
# 操作は今後も増える予定`, q: "すべての操作を取り消せるようにしたいです。どうしますか？", options: ["各操作を「やる・取り消す」を持つクラスにして、履歴に積む", "各メソッドの最後に、取り消し用の処理をそれぞれ書く", "取り消しは、あきらめる"], answer: 0, why: "操作をオブジェクトにして履歴に積めば、増えても同じ方法で取り消せます。" },
    { code: `def save():
    print("保存しました")`, q: "取り消しも、あとで実行も、記録も要りません。コマンドは必要ですか？", options: ["必要。念のため操作のクラスを作る", "不要。直接呼べばよい", "必要。履歴だけ作る"], answer: 1, why: "取り消しや記録の必要が無いなら、普通の関数呼び出しで十分です。" }],
  reads: [
    { code: `class AddItem:
    def __init__(self, item):
        self.item = item

    def execute(self, cart):
        cart.append(self.item)

    def undo(self, cart):
        cart.remove(self.item)

cart = []
history = []
for item in ["りんご", "みかん"]:
    cmd = AddItem(item)
    cmd.execute(cart)
    history.append(cmd)

history.pop().undo(cart)
print(cart)`, q: "実行すると、何が表示されますか？", options: ["['りんご']", "['りんご', 'みかん']", "['みかん']"], answer: 0, why: "2つ追加したあと、history の最後（みかん）を取り出して undo しているので、りんごだけが残ります。" },
    { code: `class AddItem:
    def __init__(self, item):
        self.item = item

    def execute(self, cart):
        cart.append(self.item)

    def undo(self, cart):
        cart.remove(self.item)`, q: "「取り消し方」を知っているのは、どれですか？", options: ["AddItem のオブジェクト", "cart（リスト）", "for 文"], answer: 0, why: "undo のやり方を持っているのは操作（AddItem）自身です。呼ぶ側は、undo を呼ぶだけです。" }],
  transfer: {
    title: "ロボットの移動を、元に戻したい",
    brief: "ここまでの学びを、別の場面で、自力で使ってみましょう。",
    code: `class Robot:
    def __init__(self):
        self.x = 0

    def move(self, dx):
        self.x += dx

    def show(self):
        print("位置:", self.x)

robot = Robot()
robot.move(3)
robot.move(2)
robot.show()
robot.undo()   # ← まだ無い
robot.show()
`,
    request: "ロボットに「元に戻す（undo）」を追加します。来月は「回転」「ジャンプ」も増える予定です。移動を「execute と undo を持つクラス」にして、履歴に積む形に作り替えてください。（操作のクラス名は自由。メソッド名は execute と undo にしてください）",
    expect: "次の2行を出力してください（2回動かした位置 / 1つ戻した位置）",
    expected: "位置: 5\n位置: 3",
    rule: `cmds = [c for c in ast.walk(tree) if isinstance(c, ast.ClassDef) and c.name != "Robot" and {"execute", "undo"} <= {m.name for m in c.body if isinstance(m, ast.FunctionDef)}]
if not cmds:
    print("execute と undo の両方を持つ「操作のクラス」がありません。「移動」の操作をクラスにしてみましょう。")
`,
    hints: ["「移動する」という操作を、1つのオブジェクトにしてみましょう。やること（位置を足す）と、取り消し方（位置を引く）をセットで持たせます。", `class Move:
    def __init__(self, dx):
        self.dx = dx

    def execute(self, robot):
        robot.x += self.dx

    def undo(self, robot):
        ____   # 足した分を戻す`],
    answerCode: `class Robot:
    def __init__(self):
        self.x = 0
        self.history = []

    def run(self, cmd):
        cmd.execute(self)
        self.history.append(cmd)

    def undo(self):
        if self.history:
            self.history.pop().undo(self)

    def show(self):
        print("位置:", self.x)

class Move:
    def __init__(self, dx):
        self.dx = dx

    def execute(self, robot):
        robot.x += self.dx

    def undo(self, robot):
        robot.x -= self.dx

robot = Robot()
robot.run(Move(3))
robot.run(Move(2))
robot.show()
robot.undo()
robot.show()
`,
  },
};

LEARN.adapter = {
  terms: [["外部ライブラリ", "他の人が作って公開しているコードです。自分では書き換えられない（書き換えたくない）ことがほとんどです。"], ["呼び方の約束", "「get_celsius() で呼べる」のような、名前と使い方の約束です。同じ約束を守っていれば、中身は違っても同じように使えます。"], ["華氏と摂氏", "温度の単位です。摂氏 = (華氏 − 32) × 5 ÷ 9 で変換できます。"]],
  hints: ["OldSensor も show_temp も書き換えずに、「get_celsius() という呼び方」に変換してくれる「間の役」を作れないか考えてみましょう。", "間の役のクラスが OldSensor を中に持ち、get_celsius() の中で read_f() を呼んで、摂氏に変換して返します。", `class OldSensorAdapter:
    def __init__(self, old):
        self.old = old

    def get_celsius(self):
        f = ____   # old の read_f() を呼ぶ
        return (f - 32) * 5 / 9`],
  recipe: ["変わるところを探す：相手の呼び方（自分のコードと合わない部分）", "切り出す：呼び方を変換する「間の役」を作る。自分のコードの約束（get_celsius）に合わせる", "残すところ：自分のコード（show_temp）も外部のコード（OldSensor）も、書き換えない"],
  fixRule: `fs = func("show_temp")
os_ = klass("OldSensor")
adapters = [c for c in ast.walk(tree) if isinstance(c, ast.ClassDef) and c.name not in ("OldSensor", "NewSensor") and any(isinstance(n, ast.Attribute) and n.attr == "read_f" for n in ast.walk(c)) and any(isinstance(m, ast.FunctionDef) and m.name == "get_celsius" for m in c.body)]
touched = any(isinstance(n, ast.Attribute) and n.attr == "read_f" for f in fs for n in ast.walk(f))
old_changed = any(m.name == "get_celsius" for c in os_ for m in c.body if isinstance(m, ast.FunctionDef))
if not fs or not os_:
    print("show_temp と OldSensor は、そのまま残しましょう。")
elif touched or old_changed:
    print("show_temp と OldSensor は書き換えず、間に変換役のクラスを作りましょう。")
elif not adapters:
    print("get_celsius() を持ち、中で read_f() を呼ぶ「変換役のクラス」がありません。")
`,
  principle: { i: 2, text: "show_temp は、get_celsius() という約束だけを知っています。約束と合わない相手は、変換役が約束に合わせるので、自分のコードは変わりません。" },
  shapes: [
    { title: "決済サービスの違い", story: "A社は pay(金額)、B社は charge(円) という名前で決済します。自分のコードのあちこちで、どちらかを見分けて呼んでいます。",
      before: `def checkout(service, amount):
    if service == "a":
        a_client.pay(amount)
    elif service == "b":
        b_client.charge(amount)
# 決済を呼ぶ場所すべてに、同じ if が必要`,
      after: `class BAdapter:
    def __init__(self, client):
        self.client = client

    def pay(self, amount):
        self.client.charge(amount)

def checkout(service, amount):
    service.pay(amount)    # A社もBアダプターも pay で呼べる`,
      same: "「約束の名前（pay）」に合わせる変換役を置くと、呼ぶ側は相手を区別しなくて済みます。" },
    { title: "ログ出力ライブラリの乗り換え", story: "自分のコードは logger.info(メッセージ) で書かれています。新しいライブラリは write(レベル, メッセージ) という形です。",
      before: `# 自分のコード（100か所）
logger.info("起動しました")

# 新ライブラリ
lib.write("INFO", "起動しました")
# 100か所すべてを書き換えるのは大変…`,
      after: `class LogAdapter:
    def __init__(self, lib):
        self.lib = lib

    def info(self, msg):
        self.lib.write("INFO", msg)

logger = LogAdapter(lib)   # 差し替えるのは、ここ1か所
logger.info("起動しました")`,
      same: "自分のコードの呼び方（info）を変えず、乗り換え先に合わせる変換役を置きます。" }],
  demo: { intro: "Python の io.StringIO は、「文字列」を「ファイルのように」見せかける変換役です。ファイルを読む形のコードに、文字列をそのまま渡せます。",
    code: `import io

text = "りんご\\nみかん\\nぶどう"
f = io.StringIO(text)     # 文字列を、ファイルの形に見せる

for line in f:            # ファイルを1行ずつ読む書き方
    print("読み込み:", line.strip())`,
    notes: ["本物のファイルではなく文字列ですが、「ファイルの呼び方」で読めています。", "ファイルを読む処理に、文字列を渡してテストしたいときによく使われます。"] },
  skip: { code: `def get_temp():
    return 25.0

print(get_temp())`, text: "メソッド名が合わないだけで、自分で書き換えられるコードなら、アダプターを作らず、直接直すのが一番早いです。アダプターは、「書き換えられないもの」を自分のコードにつなぐ道具です。" },
  judge: [
    { code: `# 外部ライブラリ（書き換え不可）
class LineClient:
    def push_message(self, msg): ...

# 自分のコード（10か所で使っている）
def notify(channel, text):
    channel.send(text)`, q: "外部の LineClient を、notify で使いたいです。どうしますか？", options: ["send() に合わせる変換役（アダプター）を間に置く", "自分のコード10か所を、push_message に書き換える", "LineClient のコードを書き換える"], answer: 0, why: "書き換えられないものは、変換役でつなぎます。自分のコードの呼び方は変わりません。" },
    { code: `# 自分で作ったクラス
class Sensor:
    def get_temp(self):
        return 25.0
# get_celsius という名前に統一したいだけ`, q: "自分で作ったクラスの名前を変えたいだけです。アダプターは必要ですか？", options: ["不要。名前を直接直せばよい", "必要。アダプターを作る", "必要。ファクトリーを作る"], answer: 0, why: "自分で書き換えられるなら、直接直すのが一番簡単です。" }],
  reads: [
    { code: `class EuroShop:
    def price_eur(self):
        return 10

class EuroToYenAdapter:
    def __init__(self, shop):
        self.shop = shop

    def price_yen(self):
        return self.shop.price_eur() * 160

def show(item):
    print(item.price_yen(), "円")

show(EuroToYenAdapter(EuroShop()))`, q: "実行すると、何が表示されますか？", options: ["10 円", "1600 円", "160 円"], answer: 1, why: "EuroShop の10ユーロを、変換役が160倍して、1600円として返します。" },
    { code: `class EuroShop:
    def price_eur(self):
        return 10

class EuroToYenAdapter:
    def __init__(self, shop):
        self.shop = shop

    def price_yen(self):
        return self.shop.price_eur() * 160`, q: "このコードで「変換役」にあたるクラスはどれですか？", options: ["EuroShop", "EuroToYenAdapter", "price_eur"], answer: 1, why: "EuroToYenAdapter が、ユーロの値段を円の呼び方に変換しています。" }],
  transfer: {
    title: "外部の通知ライブラリがつながらない",
    brief: "ここまでの学びを、別の場面で、自力で使ってみましょう。",
    code: `class MailClient:
    def send(self, text):
        print("メール:", text)

class LineClient:          # 外部ライブラリ（書き換えられない）
    def push_message(self, msg):
        print("LINE:", msg)

def notify(channel, text):   # 自分のコード（他の10か所でも使っている）
    channel.send(text)

notify(MailClient(), "予約完了")
notify(LineClient(), "予約完了")   # ← エラーになる
`,
    request: "LINE通知（外部ライブラリの LineClient）を使うことになりました。LineClient は書き換えられず、send() ではなく push_message() という名前です。notify は他の10か所でも使っているので、書き換えたくありません。LineClient も notify も書き換えずに、notify で LINE に送れる形にしてください。",
    expect: "次の2行を出力してください",
    expected: "メール: 予約完了\nLINE: 予約完了",
    rule: `fs = func("notify")
ls = klass("LineClient")
adapters = [c for c in ast.walk(tree) if isinstance(c, ast.ClassDef) and c.name not in ("MailClient", "LineClient") and any(isinstance(n, ast.Attribute) and n.attr == "push_message" for n in ast.walk(c)) and any(isinstance(m, ast.FunctionDef) and m.name == "send" for m in c.body)]
touched = any(isinstance(n, ast.Attribute) and n.attr == "push_message" for f in fs for n in ast.walk(f))
line_changed = any(m.name == "send" for c in ls for m in c.body if isinstance(m, ast.FunctionDef))
if not fs or not ls:
    print("notify と LineClient は、そのまま残しましょう。")
elif touched or line_changed:
    print("notify と LineClient は書き換えず、間に変換役のクラスを作りましょう。")
elif not adapters:
    print("send() を持ち、中で push_message() を呼ぶ「変換役のクラス」がありません。")
`,
    hints: ["LineClient も notify も書き換えずに、「send() という呼び方」に変換してくれる間の役を作ってみましょう。", `class LineAdapter:
    def __init__(self, client):
        self.client = client

    def send(self, text):
        ____   # client の push_message を呼ぶ`],
    answerCode: `class MailClient:
    def send(self, text):
        print("メール:", text)

class LineClient:
    def push_message(self, msg):
        print("LINE:", msg)

class LineAdapter:
    def __init__(self, client):
        self.client = client

    def send(self, text):
        self.client.push_message(text)

def notify(channel, text):
    channel.send(text)

notify(MailClient(), "予約完了")
notify(LineAdapter(LineClient()), "予約完了")
`,
  },
};

// ---- 既存5講座：この講座が体現している「考え方」（ideas.js の番号）----
LEARN.strategy.principle = { i: 0, text: "変わるのは「割引のやり方」。変わらないのは「種類を選んで計算する流れ」。変わるやり方だけを関数に取り出し、辞書で選ぶ形にしました。" };
LEARN.observer.principle = { i: 2, text: "温度計は、通知先が何をするかを知りません。「登録された関数を呼ぶ」という約束だけを知っています。だから、通知先を足しても温度計は変わりません。" };
LEARN.decorator.principle = { i: 1, text: "継承でクラスを増やす代わりに、「中身を持って包む」形にしました。トッピングの組み合わせは、使う側が自由に決められます。" };
LEARN["factory-method"].principle = { i: 3, text: "種類が増えても、直す場所は create_sender と辞書だけです。送る側のコードは書き換えません。「足すだけで済む」形です。" };
LEARN.state.principle = { i: 0, text: "変わるのは「状態ごとの動き」。変わらないのは「操作を受け付ける窓口」。動きを状態の部品に取り出し、本体は今の状態に任せるだけにしました。" };
