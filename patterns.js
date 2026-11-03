// 23パターンのデータ。lesson があるものは「完成講座」、無いものは「準備中」（場面クイズには使える）。
// 新しい講座を足すときは、下の PATTERNS の該当項目に lesson を書き足すだけでOK。
const CATS = [
  { id: "create", name: "生成のパターン", note: "オブジェクトの作り方" },
  { id: "struct", name: "構造のパターン", note: "部品の組み合わせ方" },
  { id: "behave", name: "振る舞いのパターン", note: "役割分担ややりとり" },
];

const PATTERNS = [
  // ---- 生成 ----
  { id: "singleton", ja: "シングルトン", en: "Singleton", cat: "create",
    scene: "設定やログ管理のオブジェクトがあちこちで別々に作られ、内容がバラバラになってしまう。",
    idea: "インスタンスを世の中に1つだけにして、全員がそれを共有する。" },
  { id: "factory-method", ja: "ファクトリーメソッド", en: "Factory Method", cat: "create",
    scene: "注文の種類ごとに、呼び出し側が if で分岐して別々のクラスを作っている。種類が増えるたび呼び出し側を直している。",
    lesson: {
      title: "通知の送り方が増えていく予約アプリ",
      intro: "予約アプリの通知コードです。予約完了とキャンセルのとき、メールまたはSMSでお客さんに知らせます。まず実行して、動きを確認しましょう。",
      code: `class EmailSender:
    def send(self, msg):
        print("メールで送信:", msg)

class SmsSender:
    def send(self, msg):
        print("SMSで送信:", msg)

def booking_done(kind):
    if kind == "email":
        sender = EmailSender()
    elif kind == "sms":
        sender = SmsSender()
    else:
        raise ValueError("unknown: " + kind)
    sender.send("予約が完了しました")

def booking_cancel(kind):
    if kind == "email":
        sender = EmailSender()
    elif kind == "sms":
        sender = SmsSender()
    else:
        raise ValueError("unknown: " + kind)
    sender.send("予約がキャンセルされました")

booking_done("email")
booking_cancel("sms")
booking_done("push")   # ← まだ対応していない
`,
      request: "新しく「プッシュ通知」を追加します（出力は「プッシュ通知で送信: ○○」）。いまは「送る役を作る if」が2か所にコピーされていて、このままだと両方を直すことになります。来月はLINE通知も入る予定です。作る判断を1か所に集めて、足すだけで済む形にしてください。",
      expect: "次の3行を出力してください",
      expected: "メールで送信: 予約が完了しました\nSMSで送信: 予約がキャンセルされました\nプッシュ通知で送信: 予約が完了しました",
      answerName: ["ファクトリーメソッド（ファクトリ）", "Factory Method"],
      answerCode: `class EmailSender:
    def send(self, msg):
        print("メールで送信:", msg)

class SmsSender:
    def send(self, msg):
        print("SMSで送信:", msg)

class PushSender:
    def send(self, msg):
        print("プッシュ通知で送信:", msg)

SENDERS = {
    "email": EmailSender,
    "sms": SmsSender,
    "push": PushSender,
}

def create_sender(kind):
    if kind not in SENDERS:
        raise ValueError("unknown: " + kind)
    return SENDERS[kind]()

def booking_done(kind):
    create_sender(kind).send("予約が完了しました")

def booking_cancel(kind):
    create_sender(kind).send("予約がキャンセルされました")

booking_done("email")
booking_cancel("sms")
booking_done("push")
`,
      explain: [
        "「どの役を作るか」の判断が、create_sender() の1か所だけになりました。",
        "通知の種類を足すときは、クラスを1つ書いて、SENDERS に1行足すだけです。",
        "送る側（booking_done など）は、中身のクラス名を知らなくて済みます。",
        "本来のファクトリーメソッドは「子クラスが作るものを決める」形ですが、Python では、このように関数や辞書で作る形が一般的です。",
        "Strategy は「やり方の差し替え」、Factory は「何を作るかの判断を1か所に集める」点が違います。",
      ],
      quiz: { q: "「どのクラスを作るか」の if が、あちこちに同じ形で書かれて困っています。一番近い解決は？",
        options: ["作る判断を1か所に集める", "通知先を登録式にして、本体を触らず増やす", "機能を包んで、後から足していく", "状態ごとにクラスを分ける"],
        answer: 0, why: "作る判断を1か所に集めれば、種類が増えても直すのはそこだけで済みます。" } } },
  { id: "abstract-factory", ja: "アブストラクトファクトリー", en: "Abstract Factory", cat: "create",
    scene: "ライト/ダークのテーマごとに、ボタン・入力欄・ダイアログを必ず同じ系統のセットで切り替えたい。",
    idea: "関連する部品をまとめて作る工場ごと差し替える。" },
  { id: "builder", ja: "ビルダー", en: "Builder", cat: "create",
    scene: "引数が10個もあるコンストラクタで、どれが何の値か分からず、渡し間違いが起きる。",
    idea: "組み立て手順を分けて、1つずつ設定しながら最後に完成品を作る。" },
  { id: "prototype", ja: "プロトタイプ", en: "Prototype", cat: "create",
    scene: "作るのに時間がかかるオブジェクトを、少しだけ変えたものを何個も用意したい。",
    idea: "既存のオブジェクトをコピーして、必要な部分だけ変える。" },
  // ---- 構造 ----
  { id: "adapter", ja: "アダプター", en: "Adapter", cat: "struct",
    scene: "外部ライブラリのメソッド名や形式が自分のコードと合わず、変換処理があちこちに散らばっている。",
    lesson: {
      title: "形が合わない外部センサー",
      intro: "気温を表示するコードです。自分のコードの show_temp は、センサーに get_celsius()（摂氏を返す）を呼ぶ前提で作られています。まず実行して、動きを確認しましょう。",
      code: `class NewSensor:
    def get_celsius(self):
        return 25.0

class OldSensor:         # 外部ライブラリ（書き換えられない）
    def read_f(self):
        return 98.6      # 華氏

def show_temp(sensor):   # 自分のコード（他の10か所でも使っている）
    print("温度:", round(sensor.get_celsius(), 1), "度")

show_temp(NewSensor())
show_temp(OldSensor())   # ← エラーになる
`,
      request: "古いセンサー OldSensor も使うことになりました。ただし OldSensor は外部ライブラリで書き換えられず、華氏を返す read_f() しかありません。show_temp は他の10か所でも使っているので、書き換えたくありません。OldSensor も show_temp も書き換えずに、show_temp で使える形にしてください。（変換：摂氏 = (華氏 − 32) × 5 ÷ 9）",
      expect: "次の2行を出力してください",
      expected: "温度: 25.0 度\n温度: 37.0 度",
      answerName: ["アダプター", "Adapter"],
      answerCode: `class NewSensor:
    def get_celsius(self):
        return 25.0

class OldSensor:
    def read_f(self):
        return 98.6

class OldSensorAdapter:
    def __init__(self, old):
        self.old = old

    def get_celsius(self):
        return (self.old.read_f() - 32) * 5 / 9

def show_temp(sensor):
    print("温度:", round(sensor.get_celsius(), 1), "度")

show_temp(NewSensor())
show_temp(OldSensorAdapter(OldSensor()))
`,
      explain: [
        "OldSensorAdapter が「変換役」です。中に OldSensor を持ち、get_celsius() で呼ばれたら、read_f() を呼んで摂氏に直します。",
        "show_temp は、相手が新旧どちらのセンサーでも、get_celsius() を呼ぶだけです。書き換えは不要です。",
        "外部ライブラリのように「自分では書き換えられないもの」を、自分のコードに合わせてつなぐ形です。",
        "自分で書き換えられるコードなら、アダプターを作らず、直接直すのが一番早いです。",
      ] } },
  { id: "bridge", ja: "ブリッジ", en: "Bridge", cat: "struct",
    scene: "図形の種類（丸・四角）×描画方法（画面・PDF）の組み合わせごとにクラスを作り、数が爆発している。",
    idea: "「種類」と「実現方法」を別の軸に分け、組み合わせは後から選ぶ。" },
  { id: "composite", ja: "コンポジット", en: "Composite", cat: "struct",
    scene: "ファイルとフォルダを同じように扱って、フォルダ全体の合計サイズを出したい。",
    idea: "個と集まりを同じ窓口（同じメソッド）で扱えるようにする。" },
  { id: "decorator", ja: "デコレータ", en: "Decorator", cat: "struct",
    scene: "コーヒーのトッピング（ミルク・砂糖・ホイップ）の組み合わせごとにクラスを作り、数が増え続けている。",
    lesson: {
      title: "トッピングが増えるコーヒー屋",
      intro: "コーヒー屋のレジのコードです。トッピングの組み合わせごとにクラスを作っています。まず実行して、動くことを確かめましょう。",
      code: `class Coffee:
    def cost(self):
        return 300

class CoffeeMilk:
    def cost(self):
        return 350

class CoffeeSugar:
    def cost(self):
        return 320

class CoffeeMilkSugar:
    def cost(self):
        return 370

print(Coffee().cost())
print(CoffeeMilkSugar().cost())
# 新: ホイップ入りも出したい → CoffeeMilkSugarWhip? CoffeeMilkWhip? ...
`,
      request: "新メニュー「ホイップ（+60円）」を追加します。ホイップ単体、ミルク+ホイップ、砂糖+ホイップ、全部のせ…と組み合わせは増える一方です。クラスを増やさずに、トッピングを自由に重ねられる形にしてください。",
      expect: "次の3行を出力してください（コーヒー / ミルク+砂糖 / ミルク+砂糖+ホイップ）",
      expected: "300\n370\n430",
      answerName: ["デコレータ", "Decorator"],
      answerCode: `class Coffee:
    def cost(self):
        return 300

class Milk:
    def __init__(self, base):
        self.base = base
    def cost(self):
        return self.base.cost() + 50

class Sugar:
    def __init__(self, base):
        self.base = base
    def cost(self):
        return self.base.cost() + 20

class Whip:
    def __init__(self, base):
        self.base = base
    def cost(self):
        return self.base.cost() + 60

print(Coffee().cost())
print(Sugar(Milk(Coffee())).cost())
print(Whip(Sugar(Milk(Coffee()))).cost())
`,
      explain: [
        "トッピングが「中身を包む1枚の皮」になっています。包むほど値段が足されます。",
        "新しいトッピングは、クラスを1つ足すだけ。既存のクラスは1行も変えません。",
        "組み合わせ（Whip(Sugar(Milk(Coffee()))) のような重ね方）は、使う側が自由に決められます。",
        "Python の @decorator 構文とは別物ですが、「包んで機能を足す」考え方は同じです。",
      ],
      quiz: { q: "次のうち、デコレータが一番効く場面はどれ？",
        options: ["オブジェクトを世の中に1つだけにしたい", "機能の組み合わせごとにクラスが増えて困っている", "状態の変化を複数の画面に伝えたい", "処理のやり方を実行時に差し替えたい"],
        answer: 1, why: "機能を「重ねて足す」ことで、組み合わせ分のクラスを作らずに済みます。" } } },
  { id: "facade", ja: "ファサード", en: "Facade", cat: "struct",
    scene: "動画変換のために5つのクラスを決まった順で呼ぶ手順を、毎回あちこちで書かされている。",
    idea: "複雑な手順を1つの簡単な窓口にまとめる。" },
  { id: "flyweight", ja: "フライウェイト", en: "Flyweight", cat: "struct",
    scene: "ゲームで同じ見た目の木を100万本描画していて、メモリが足りなくなる。",
    idea: "共通で同じ部分は1つを使い回し、本数ごとに違う部分（位置など）だけ別に持つ。" },
  { id: "proxy", ja: "プロキシ", en: "Proxy", cat: "struct",
    scene: "重い画像の読み込みを、実際に表示するときまで遅らせたい。アクセス権の確認も挟みたい。",
    idea: "本物と同じ見た目の代理人を置き、必要になるまで本物を呼ばない。" },
  // ---- 振る舞い ----
  { id: "chain-of-responsibility", ja: "責任の連鎖", en: "Chain of Responsibility", cat: "behave",
    scene: "問い合わせを担当者→課長→部長と、金額や権限に応じて順にたらい回しにしたい。",
    idea: "処理できる人が出てくるまで、鎖のように次へ渡していく。" },
  { id: "command", ja: "コマンド", en: "Command", cat: "behave",
    scene: "エディタの操作を記録して、取り消し（Undo）や再実行ができるようにしたい。",
    lesson: {
      title: "取り消しができないメモ帳",
      intro: "メモ帳のコードです。文字を書き足して、表示できます。まず実行して、動きを確認しましょう。",
      code: `class Editor:
    def __init__(self):
        self.text = ""

    def write(self, s):
        self.text += s

    def show(self):
        print(self.text)

ed = Editor()
ed.write("Hello")
ed.write(" World")
ed.show()
ed.undo()   # ← まだ無い
ed.show()
`,
      request: "「元に戻す（undo）」を追加します。来月は「削除」「貼り付け」も増える予定で、どの操作も取り消せるようにしたいです。操作ごとに「やる（execute）」と「取り消す（undo）」をセットで持つクラスにして、履歴に積む形に作り替えてください。（操作のクラス名は自由ですが、メソッド名は execute と undo にしてください）",
      expect: "次の2行を出力してください（書き足した結果 / 1つ元に戻した結果）",
      expected: "Hello World\nHello",
      answerName: ["コマンド", "Command"],
      answerCode: `class Editor:
    def __init__(self):
        self.text = ""
        self.history = []

    def run(self, cmd):
        cmd.execute(self)
        self.history.append(cmd)

    def undo(self):
        if self.history:
            self.history.pop().undo(self)

    def show(self):
        print(self.text)

class Write:
    def __init__(self, s):
        self.s = s

    def execute(self, ed):
        ed.text += self.s

    def undo(self, ed):
        ed.text = ed.text[:-len(self.s)]

ed = Editor()
ed.run(Write("Hello"))
ed.run(Write(" World"))
ed.show()
ed.undo()
ed.show()
`,
      explain: [
        "「文字を書く」という操作が、Write というオブジェクトになりました。やり方（execute）と、取り消し方（undo）をセットで持っています。",
        "Editor は、実行した操作を history に積むだけです。操作の中身は知りません。",
        "undo() は、history の最後の操作を取り出して、その undo を呼ぶだけです。",
        "削除・貼り付けも、同じ形のクラスを足すだけで、取り消せるようになります。",
      ] } },
  { id: "interpreter", ja: "インタープリタ", en: "Interpreter", cat: "behave",
    scene: "「前進 3、右回転」のような簡単な命令文を、自作のルールで解釈して実行したい。",
    idea: "文法の規則ひとつひとつをクラスにして、文を実行できる木にする。" },
  { id: "iterator", ja: "イテレータ", en: "Iterator", cat: "behave",
    scene: "リストでも木構造でも、中身の作りを知らずに1つずつ順に取り出したい。",
    idea: "取り出し方を専用の窓口に任せる（Python では for 文と __iter__ がまさにこれ）。" },
  { id: "mediator", ja: "メディエータ", en: "Mediator", cat: "behave",
    scene: "画面の部品どうしが互いを直接参照し合って、からまった糸のようになっている。",
    idea: "やりとりを仲介役に集め、部品は仲介役だけを知っていればよくする。" },
  { id: "memento", ja: "メメント", en: "Memento", cat: "behave",
    scene: "内部の作りを公開せずに、ある時点の状態を保存して、あとで元に戻したい。",
    idea: "状態のスナップショットを専用の入れ物に保管する。" },
  { id: "observer", ja: "オブザーバー", en: "Observer", cat: "behave",
    scene: "温度が変わるたびに、画面・ログ・警報など複数の場所を更新したい。通知先は増え続ける。",
    lesson: {
      title: "通知先が増えていく温度計",
      intro: "温度計のコードです。温度を設定すると、画面表示とログ保存が行われます。まず実行して動きを確認しましょう。",
      code: `class Thermometer:
    def __init__(self):
        self.temp = 20

    def set(self, t):
        self.temp = t
        print("画面:", t)
        print("ログ保存:", t)

th = Thermometer()
th.set(25)
th.set(35)
`,
      request: "「30度を超えたら警報を出す」機能を追加します。さらに来月はメール通知とスマホ通知も入る予定です。そのたびに Thermometer を書き換えるのは避けたい。温度計側を触らずに通知先を増やせる形にしてください。",
      expect: "次の5行を出力してください（警報は30度を超えたときだけ）",
      expected: "画面: 25\nログ保存: 25\n画面: 35\nログ保存: 35\n警報: 35度!",
      answerName: ["オブザーバー", "Observer"],
      answerCode: `class Thermometer:
    def __init__(self):
        self.temp = 20
        self.listeners = []

    def subscribe(self, fn):
        self.listeners.append(fn)

    def set(self, t):
        self.temp = t
        for fn in self.listeners:
            fn(t)

def screen(t):
    print("画面:", t)

def log(t):
    print("ログ保存:", t)

def alarm(t):
    if t > 30:
        print("警報:", str(t) + "度!")

th = Thermometer()
th.subscribe(screen)
th.subscribe(log)
th.subscribe(alarm)
th.set(25)
th.set(35)
`,
      explain: [
        "温度計は「誰が聞いているか」を知りません。登録された関数に、変化を知らせるだけです。",
        "メール通知を足すときも、関数を1つ作って subscribe するだけ。Thermometer は変更不要です。",
        "「変化を知らせる側」と「受け取って動く側」が切り離されています。",
        "Python では関数もそのまま登録できるので、専用のクラスは必須ではありません。",
      ],
      quiz: { q: "Observer を使う一番の利点は？",
        options: ["オブジェクトの数を1つに制限できる", "通知先を増やしても、通知する側のコードを変えずに済む", "処理を後から取り消せる", "オブジェクトの作り方を隠せる"],
        answer: 1, why: "通知する側は「登録された相手に知らせる」だけなので、受け手の追加で書き換えが起きません。" } } },
  { id: "state", ja: "ステート", en: "State", cat: "behave",
    scene: "注文の状態（受付・発送・完了）によって動作が変わり、あらゆるメソッドが if だらけになっている。",
    lesson: {
      title: "売り切れが加わる自動販売機",
      intro: "自動販売機のコードです。お金を入れてボタンを押すとジュースが出ます。状態（待機中・お金あり）によって、同じ操作でも反応が変わります。まず実行して、動きを確認しましょう。",
      code: `class VendingMachine:
    def __init__(self, stock):
        self.stock = stock
        self.state = "idle"   # idle=待機中 / has_coin=お金あり

    def insert_coin(self):
        if self.state == "idle":
            self.state = "has_coin"
            print("お金を受け取りました")
        elif self.state == "has_coin":
            print("すでにお金が入っています")

    def push_button(self):
        if self.state == "idle":
            print("先にお金を入れてください")
        elif self.state == "has_coin":
            self.stock -= 1
            self.state = "idle"
            print("ジュースを出しました")

vm = VendingMachine(1)
vm.push_button()
vm.insert_coin()
vm.push_button()
vm.insert_coin()   # ← 在庫0なのに受け付けてしまう
vm.push_button()
`,
      request: "新しく「売り切れ」の状態を追加します。在庫が0になったら、お金もボタンも受け付けず、どちらも「売り切れです」と表示します。いまのコードでは、全メソッドの if に売り切れの分岐を足すことになります。来月は「故障中」「メンテナンス中」も入る予定です。状態を足しても、他のメソッドに手を入れずに済む形にしてください。",
      expect: "次の5行を出力してください",
      expected: "先にお金を入れてください\nお金を受け取りました\nジュースを出しました\n売り切れです\n売り切れです",
      answerName: ["ステート", "State"],
      answerCode: `class Idle:
    def insert_coin(self, vm):
        vm.state = HasCoin()
        print("お金を受け取りました")

    def push_button(self, vm):
        print("先にお金を入れてください")

class HasCoin:
    def insert_coin(self, vm):
        print("すでにお金が入っています")

    def push_button(self, vm):
        vm.stock -= 1
        print("ジュースを出しました")
        vm.state = Idle() if vm.stock > 0 else SoldOut()

class SoldOut:
    def insert_coin(self, vm):
        print("売り切れです")

    def push_button(self, vm):
        print("売り切れです")

class VendingMachine:
    def __init__(self, stock):
        self.stock = stock
        self.state = Idle() if stock > 0 else SoldOut()

    def insert_coin(self):
        self.state.insert_coin(self)

    def push_button(self):
        self.state.push_button(self)

vm = VendingMachine(1)
vm.push_button()
vm.insert_coin()
vm.push_button()
vm.insert_coin()
vm.push_button()
`,
      explain: [
        "「状態ごとの動き」が、状態クラスの中にまとまりました。if で状態を見分ける必要がありません。",
        "新しい状態（故障中など）は、クラスを1つ足すだけ。VendingMachine や他の状態は触りません。",
        "状態の切り替えは、vm.state に新しい状態を入れるだけです。",
        "状態が2〜3個で単純なら、if のままで十分です。状態が増えて、全メソッドが if だらけになったら出番です。",
      ],
      quiz: { q: "状態の種類によって、ほぼ全メソッドに同じ if が散らばっています。一番近い解決は？",
        options: ["通知先を登録式にする", "機能を重ねて足していく", "状態ごとにクラスを分けて、動きを任せる", "作る判断を1か所に集める"],
        answer: 2, why: "状態ごとにクラスを分ければ、新しい状態を足しても他の部分に手を入れずに済みます。" } } },
  { id: "strategy", ja: "ストラテジー", en: "Strategy", cat: "behave",
    scene: "割引や並べ替えのように、やり方を状況に応じて入れ替えたい。ルールは増え続ける。",
    lesson: {
      title: "割引ルールが増え続けるレジ",
      intro: "お店のレジの割引計算コードです。お客さんの種類によって割引が変わります。まず実行して、動きを確認しましょう。",
      code: `def calc(kind, price):
    if kind == "normal":
        return price
    elif kind == "student":
        return price * 0.8
    elif kind == "senior":
        return price * 0.7
    else:
        raise ValueError("unknown: " + kind)

print(calc("normal", 1000))
print(calc("student", 1000))
print(calc("member", 1000))   # ← まだ対応していない
`,
      request: "新しく「会員」は10%引きにします。来月から他の割引（誕生日・クーポン・法人…）も10種類ほど増える予定です。毎回 if を足し続ける形ではなく、ルールを足すだけで済む形にしてください。",
      expect: "次の3行を出力してください",
      expected: "1000\n800.0\n900.0",
      answerName: ["ストラテジー", "Strategy"],
      answerCode: `DISCOUNTS = {
    "normal": lambda p: p,
    "student": lambda p: p * 0.8,
    "senior": lambda p: p * 0.7,
    "member": lambda p: p * 0.9,
}

def calc(kind, price):
    return DISCOUNTS[kind](price)

print(calc("normal", 1000))
print(calc("student", 1000))
print(calc("member", 1000))
`,
      explain: [
        "「割引のやり方」を1つずつの関数に切り出し、辞書で名前に結びつけました。",
        "新しい割引は、辞書に1行足すだけ。calc 本体は二度と変えません。",
        "このように「やり方を部品として差し替える」考え方がストラテジーです。",
        "Python では関数がそのまま部品になるので、クラスを作らなくても書けます。",
      ],
      quiz: { q: "if/elif が増え続けて困る、という痛みに一番近い解決は？",
        options: ["シングルトンで1つにまとめる", "ストラテジーでやり方を部品に分ける", "プロキシで本物の呼び出しを遅らせる", "メメントで状態を保存する"],
        answer: 1, why: "分岐ごとの処理を部品にして、選ぶだけの形にできます。" } } },
  { id: "template-method", ja: "テンプレートメソッド", en: "Template Method", cat: "behave",
    scene: "処理の流れ（読み込み→加工→保存）は同じで、一部の手順だけ違う処理が何個もコピペされている。",
    lesson: {
      title: "コピペだらけのレポート表示",
      intro: "社内レポートを表示するコードです。売上レポートと在庫レポートを、それぞれ関数で書いています。まず実行して、動きを確認しましょう。",
      code: `def sales_report():
    print("=== レポート ===")
    print("売上: 120万円")
    print("=== 以上 ===")

def stock_report():
    print("=== レポート ===")
    print("在庫: 340個")
    print("=== 以上 ===")

sales_report()
stock_report()
# 新: 来客数レポートも増える。締めの文言を変えるときは？
`,
      request: "新しく「来客数レポート」（本文は「来客数: 85人」）を追加します。さらに、すべてのレポートの締めの文言を「=== 以上 ===」から「=== 終わり ===」に変更することになりました。いまのコードでは、同じ流れ（見出し→本文→締め）をコピペして、全部を書き換えることになります。流れは1か所にまとめて、レポートごとに違う本文だけを書く形にしてください。",
      expect: "次の9行を出力してください（売上 / 在庫 / 来客数の順。締めはすべて「=== 終わり ===」）",
      expected: "=== レポート ===\n売上: 120万円\n=== 終わり ===\n=== レポート ===\n在庫: 340個\n=== 終わり ===\n=== レポート ===\n来客数: 85人\n=== 終わり ===",
      answerName: ["テンプレートメソッド", "Template Method"],
      answerCode: `class Report:
    def body(self):
        raise NotImplementedError

    def show(self):
        print("=== レポート ===")
        self.body()
        print("=== 終わり ===")

class SalesReport(Report):
    def body(self):
        print("売上: 120万円")

class StockReport(Report):
    def body(self):
        print("在庫: 340個")

class VisitorReport(Report):
    def body(self):
        print("来客数: 85人")

SalesReport().show()
StockReport().show()
VisitorReport().show()
`,
      explain: [
        "「見出し → 本文 → 締め」という流れは、親クラスの show() に1回だけ書かれています。",
        "レポートごとに違う本文だけを、子クラスが body() で書きます。",
        "締めの文言を変えるときは、show() の1行を直すだけで、全レポートに反映されます。",
        "ここで使う「継承」は、「流れは固定で、一部だけ差し替えたい」ときに向いています。",
      ] } },
  { id: "visitor", ja: "ビジター", en: "Visitor", cat: "behave",
    scene: "クラスの中身を変えずに、構造全体に対して新しい処理（集計・書き出し）を後から追加したい。",
    idea: "処理を別の「訪問者」に切り出し、各要素が訪問者を受け入れる。" },
];
