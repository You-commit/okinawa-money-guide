import { routes } from '../app/routes'

export type KnowledgeArticleSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export type KnowledgeArticle = {
  slug: string
  path: string
  category: 'borrow' | 'grow'
  categoryLabel: string
  title: string
  description: string
  summary: string
  publishedAt: string
  updatedAt: string
  sections: KnowledgeArticleSection[]
  simulator: { path: string; label: string; description: string }
  sources: Array<{ title: string; url: string }>
}

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    slug: 'nisa-basics',
    path: '/knowledge/nisa-basics',
    category: 'grow',
    categoryLabel: '増やす・NISA',
    title: 'NISAの基本｜非課税枠と始める前に確認したいこと',
    description:
      'NISAのつみたて投資枠・成長投資枠・非課税保有限度額の基本と、積立額や金融機関を決める前に確認したいポイントを整理します。',
    summary:
      'NISAは投資商品そのものではなく、一定の投資から得られる利益を非課税で保有できる制度です。制度の枠、投資商品のリスク、無理のない積立額を分けて考えることが大切です。',
    publishedAt: '2026-09-16',
    updatedAt: '2026-09-16',
    sections: [
      {
        heading: 'NISAは「商品」ではなく非課税制度',
        paragraphs: [
          'NISA口座では、制度上の対象となる株式や投資信託などから得た利益を一定の範囲で非課税にできます。ただし、NISAを使えば投資元本が保証されるわけではありません。',
          '金融庁のNISA特設サイトでは、2024年からの制度について、非課税保有期間の無期限化、制度の恒久化、つみたて投資枠と成長投資枠の併用などが案内されています。',
        ],
      },
      {
        heading: '2026年9月時点の主な投資枠',
        paragraphs: [
          '成人向けの現行制度では、つみたて投資枠は年間120万円、成長投資枠は年間240万円で、併用すると年間最大360万円まで投資できます。非課税保有限度額は合計1,800万円で、そのうち成長投資枠は1,200万円が上限です。',
          '制度改正が公表された場合は適用時期を確認する必要があります。OMGでは記事の基準日を明示し、将来の制度変更を現在の制度として混同しません。',
        ],
        bullets: [
          'つみたて投資枠：年間120万円',
          '成長投資枠：年間240万円',
          '年間投資枠：併用で最大360万円',
          '非課税保有限度額：合計1,800万円',
          '成長投資枠の非課税保有限度額：1,200万円（内数）',
        ],
      },
      {
        heading: '積立額は「上限まで使う」ではなく家計から決める',
        paragraphs: [
          '投資枠は利用できる上限であり、上限まで投資することが適切とは限りません。生活防衛資金、近い将来に使う予定のお金、毎月の家計余力を確認したうえで積立額を決めます。',
          '将来額の試算では、想定利回りを1つだけに固定せず、低いケース・標準ケース・高いケースなど複数条件で確認すると、期待と現実の幅を把握しやすくなります。',
        ],
      },
      {
        heading: '金融機関を選ぶときに確認したいこと',
        paragraphs: [
          'NISA口座は1人1口座が基本で、つみたて投資枠と成長投資枠を別々の金融機関で利用することはできません。金融機関の変更は年単位で可能です。',
          '口座を選ぶときは、取扱商品、手数料、積立設定、入出金方法、サポート体制などを確認します。沖縄県内の店舗で相談したいのか、オンライン中心で利用したいのかも、自分に必要な使い方として整理すると比較しやすくなります。',
        ],
      },
      {
        heading: 'NISAでも元本割れの可能性はある',
        paragraphs: [
          'NISAは税制上の非課税制度であり、投資商品の価格変動リスクをなくす制度ではありません。株式や投資信託は値下がりする可能性があります。',
          '商品を選ぶ際は、値動きだけでなく、信託報酬などの費用、投資対象、分散状況、リスクを公式資料で確認してください。',
        ],
      },
      {
        heading: '沖縄で利用してもNISA制度そのものは全国共通',
        paragraphs: [
          'NISAの税制上の基本ルールは全国共通です。沖縄独自のNISA制度があるわけではありません。OMGでは、制度の全国共通部分と、県内で利用できる金融機関や相談手段などの地域情報を分けて扱います。',
        ],
      },
    ],
    simulator: {
      path: routes.nisa,
      label: 'NISAシミュレーターで試算する',
      description:
        '毎月の積立額、想定利回り、期間を変えて、将来額とNISA制度枠の目安を確認できます。',
    },
    sources: [
      {
        title: '金融庁「NISAを知る」',
        url: 'https://www.fsa.go.jp/policy/nisa2/know/',
      },
      {
        title: '金融庁「よくある質問：NISA特設ウェブサイト」',
        url: 'https://www.fsa.go.jp/policy/nisa2/question/',
      },
      {
        title: '金融庁「つみたて投資枠対象商品」',
        url: 'https://www.fsa.go.jp/policy/nisa2/products/',
      },
    ],
  },
  {
    slug: 'mortgage-repayment-methods',
    path: '/knowledge/mortgage-repayment-methods',
    category: 'borrow',
    categoryLabel: '借りる・住宅ローン',
    title: '元利均等返済と元金均等返済の違い｜住宅ローンの返済方法を比較',
    description:
      '住宅ローンの元利均等返済と元金均等返済の違いを、毎月返済額・元金の減り方・総返済額の観点から整理します。',
    summary:
      '住宅ローンは同じ借入額・金利・返済期間でも、返済方法によって毎月の負担や元金の減り方が変わります。返済開始時の負担と総返済額を同じ条件で比較することが重要です。',
    publishedAt: '2026-09-16',
    updatedAt: '2026-09-16',
    sections: [
      {
        heading: '住宅ローンの代表的な2つの返済方法',
        paragraphs: [
          '住宅ローンの代表的な返済方法には、元利均等返済と元金均等返済があります。全国銀行協会も、住宅ローンの2つの返済方法としてこの2方式を説明しています。',
          'どちらが適切かは、返済開始時の家計余力、返済期間、金利、将来の収支などによって変わります。返済方法だけで住宅ローン商品全体の有利・不利を決めないことが重要です。',
        ],
      },
      {
        heading: '元利均等返済は毎回の返済額を一定にしやすい',
        paragraphs: [
          '元利均等返済は、元金と利息を合わせた毎回の返済額を一定にする返済方法です。固定金利など前提条件が変わらない場合、毎月の支出を見通しやすいことが特徴です。',
          '返済初期は返済額に占める利息の割合が大きく、元金均等返済と比べると元金の減り方が遅くなります。同じ借入額・金利・期間なら、元金均等返済より総返済額が多くなるのが一般的です。',
        ],
      },
      {
        heading: '元金均等返済は元金の減りが早い',
        paragraphs: [
          '元金均等返済は、毎回返済する元金部分を一定にし、その時点の残高に応じた利息を加える方法です。返済開始時の返済額は大きくなりますが、返済が進むにつれて利息が減り、毎回の返済額も下がっていきます。',
          '同じ借入額・金利・返済期間で比較すると、元利均等返済より元金の減りが早く、利息の総支払額を抑えやすい特徴があります。ただし、金融機関や商品によっては元金均等返済を取り扱っていない場合があります。',
        ],
      },
      {
        heading: '毎月返済額だけで決めない',
        paragraphs: [
          '住宅ローンを比較するときは、当初の毎月返済額だけでなく、総返済額、利息、完済時年齢、家計の余力を一緒に確認します。返済期間を長くすると月々の負担は下がりやすい一方、同じ金利なら利息負担が増える場合があります。',
          'OMGの住宅ローンシミュレーターでは、元利均等返済と元金均等返済を同じ条件で並べ、毎月返済額や総返済額の差を確認できます。',
        ],
      },
      {
        heading: '実際の商品では金利以外の条件も確認',
        paragraphs: [
          '実際の住宅ローンでは、保証料、融資手数料、団体信用生命保険、繰上返済手数料、金利見直しのルールなどが金融機関・商品ごとに異なります。',
          '全国銀行協会のシミュレーション案内でも、実際の契約では手数料や保証料等が必要になる場合があり、実際の返済額は銀行によって異なることが案内されています。',
        ],
      },
      {
        heading: '沖縄県内で比較するときも条件をそろえる',
        paragraphs: [
          '沖縄銀行、琉球銀行、沖縄海邦銀行、沖縄県労働金庫、JAおきなわ等を比較するときも、表示金利だけを並べるのではなく、同じ借入額・期間・返済方法を前提にし、諸費用や団信を含めて確認する必要があります。',
          '金利や商品条件は変更されるため、個別金融機関を比較する記事では必ず基準日と一次情報を示します。',
        ],
      },
    ],
    simulator: {
      path: routes.mortgage,
      label: '住宅ローンシミュレーターで比較する',
      description:
        '借入額・金利・返済期間を同じ条件にして、元利均等返済と元金均等返済を比較できます。',
    },
    sources: [
      {
        title: '全国銀行協会「住宅ローンの仕組みと返済方法」',
        url: 'https://www.zenginkyo.or.jp/article/tag-d/5215/',
      },
      {
        title: '全国銀行協会「住宅ローン新規借入れ返済シミュレーション」',
        url: 'https://www.zenginkyo.or.jp/article/simulation/loan-new/',
      },
      {
        title: '住宅金融支援機構「返済方法の変更を希望するとき」',
        url: 'https://www.jhf.go.jp/hensai/hensai/kibou.html',
      },
    ],
  },
]

export const knowledgeArticleBySlug = new Map(
  knowledgeArticles.map((article) => [article.slug, article]),
)

export const knowledgeArticleByPath = new Map(
  knowledgeArticles.map((article) => [article.path, article]),
)
