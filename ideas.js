// 「考え方」ページ：デザインパターンの根っこにある6つの考え方
const IDEAS = [
  { id: "vary", title: "変わるところと、変わらないところを分ける",
    lead: "デザインパターンのほとんどは、この1つの考え方から生まれています。",
    body: ["コードの中には、「よく変わる部分」と「ほとんど変わらない部分」が混ざっています。変わる部分だけを別の部品に切り出すと、変更のたびに触る場所が1か所で済みます。", "パターンを書くときは、まず「何が増える？何が変わる？」と自分に問いかけます。答えが、切り出す場所です。"],
    sign: "同じ形の if / elif が、種類の数だけ伸びていく。同じ流れのコピペが増えていく。",
    before: `def calc(kind, price):
    if kind == "student":
        return price * 0.8
    elif kind == "member":
        return price * 0.9
    # 割引が増えるたびに elif を足す`,
    after: `DISCOUNTS = {          # 変わる部分（やり方）だけを切り出す
    "student": lambda p: p * 0.8,
    "member": lambda p: p * 0.9,
}

def calc(kind, price):  # 変わらない部分（選んで呼ぶ）
    return DISCOUNTS[kind](price)`,
    patterns: ["strategy", "observer", "factory-method", "state", "template-method"] },
  { id: "has", title: "継承より、「持たせる・包む・任せる」",
    lead: "機能を増やすとき、クラスを継ぎ足すより、部品を持たせるほうが、組み合わせに強いです。",
    body: ["「A」と「A+B」と「A+B+C」…とクラスを作ると、組み合わせの数だけクラスが増えます。部品を持たせる、包む、任せる形にすると、組み合わせは使う側が自由に選べます。", "ただし、継承が悪いわけではありません。「流れは固定で、一部だけ差し替えたい」ときは、継承（テンプレートメソッド）が向いています。"],
    sign: "「〇〇つき△△」「〇〇と□□つき△△」のように、組み合わせごとにクラスが増えていく。",
    before: `class CoffeeMilk:        # 組み合わせごとにクラス
    def cost(self): return 350
class CoffeeMilkSugar:
    def cost(self): return 370`,
    after: `class Coffee:
    def cost(self): return 300

class Milk:               # 中身を持って、包む
    def __init__(self, base): self.base = base
    def cost(self): return self.base.cost() + 50

print(Milk(Coffee()).cost())`,
    patterns: ["decorator", "strategy", "state", "bridge"] },
  { id: "promise", title: "「何をするか」だけを約束して、「どうやるか」は知らない",
    lead: "呼ぶ側は、相手の中身を知らず、「この名前で呼べる」という約束だけを知っていればいい。",
    body: ["同じ名前のメソッドを持っていれば、中身が違っても、同じように呼べます（Python では、これで約束が成り立ちます）。", "呼ぶ側が相手の種類を見分ける if を持たなくて済むので、相手が増えても、呼ぶ側は変わりません。"],
    sign: "呼ぶ側に、相手の種類を見分ける if や isinstance がある。外部のコードの名前が、自分のコードと合わない。",
    before: `def talk(animal):
    if animal.kind == "dog":
        print("ワン")
    elif animal.kind == "cat":
        print("ニャー")`,
    after: `class Dog:
    def speak(self): print("ワン")

class Cat:
    def speak(self): print("ニャー")

def talk(animal):
    animal.speak()    # speak という約束だけを知っている`,
    patterns: ["adapter", "observer", "factory-method", "command", "state"] },
  { id: "add", title: "足すときに、既存のコードを書き換えない",
    lead: "要求が増えたとき、すでに動いているコードを直さず、新しいコードを足すだけで済む形が理想です。",
    body: ["動いているコードを書き換えるほど、壊す危険が増えます。テスト済みの部分に触らずに済めば、変更は安全で、速くなります。", "「足すだけで済む」形になっているかは、「新しい要求が来たら、どこを触る？」と考えると確かめられます。"],
    sign: "機能を追加するたびに、同じ関数を開いて if を足している。",
    before: `class Thermometer:
    def set(self, t):
        print("画面:", t)
        print("ログ:", t)
        # 通知先が増えるたびに、ここを書き換える`,
    after: `class Thermometer:
    def __init__(self):
        self.listeners = []
    def subscribe(self, fn):
        self.listeners.append(fn)    # 足すだけ
    def set(self, t):
        for fn in self.listeners:
            fn(t)                    # 書き換えない`,
    patterns: ["strategy", "observer", "decorator", "command"] },
  { id: "dont", title: "使わない勇気：まだ困っていないなら、if のままでよい",
    lead: "パターンは「困ったときの道具」です。使うこと自体が目的になってはいけません。",
    body: ["パターンを入れると、部品と間接層が増えて、読むのが大変になります。増える予感がないものに入れると、損をします。", "目安：「同じ形の if が3つ以上に増えそう」「同じ変更が何度も来そう」「同じ if が2か所以上にある」。当てはまらなければ、そのまま書きます。"],
    sign: "「将来のために」「念のため」と言いながら、増える予定のないものに仕組みを入れている。",
    before: `# 言語は日本語と英語の2つだけ、増える予定もない
def greet(lang):
    if lang == "ja":
        return "こんにちは"
    return "Hello"`,
    after: `# 無理にパターンにすると、かえって読みにくい
class JaGreeter:
    def greet(self): return "こんにちは"
class EnGreeter:
    def greet(self): return "Hello"
GREETERS = {"ja": JaGreeter, "en": EnGreeter}`,
    patterns: [] },
  { id: "name", title: "名前は、会話の道具",
    lead: "パターンの名前は、設計の意図を短く伝えるための、共通の言葉です。",
    body: ["「ここは Observer にしよう」と言えば、「通知先を登録式にして、増えても本体を変えない」という意図まで、一言で伝わります。", "名前を覚える目的は、暗記ではありません。コードレビューやチームの会話で、意図を短く伝え、短く理解するためです。"],
    sign: "設計の意図を説明するのに、毎回、長い文章が必要になっている。",
    before: `# 説明が長い
# 「通知先をリストに入れておいて、変化したら全員を呼ぶ形にして…」`,
    after: `# 名前を使うと短い
# 「ここは Observer にしよう」`,
    patterns: [] },
];
