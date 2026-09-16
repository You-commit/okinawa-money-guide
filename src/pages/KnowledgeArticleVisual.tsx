type ArticleVisualProps = {
  slug: string
}

function NisaVisual() {
  const metrics = [
    ['120万円', 'つみたて投資枠 / 年'],
    ['240万円', '成長投資枠 / 年'],
    ['360万円', '2つの枠を併用 / 年'],
    ['1,800万円', '非課税保有限度額'],
  ]

  return (
    <section className="knowledge-visual knowledge-visual--nisa" aria-labelledby="nisa-visual-title">
      <div className="knowledge-visual__topline">
        <div>
          <p className="knowledge-visual__eyebrow">VISUAL GUIDE</p>
          <h2 id="nisa-visual-title">NISAを3ステップでつかむ</h2>
        </div>
        <span className="knowledge-visual__asof">2026年9月時点</span>
      </div>

      <div className="knowledge-visual__flow" aria-label="NISAの基本的な流れ">
        <div className="knowledge-visual__flow-card">
          <span className="knowledge-visual__step">01</span>
          <strong>投資する</strong>
          <small>NISA口座で対象商品を選ぶ</small>
        </div>
        <span className="knowledge-visual__arrow" aria-hidden="true">→</span>
        <div className="knowledge-visual__flow-card">
          <span className="knowledge-visual__step">02</span>
          <strong>運用する</strong>
          <small>値上がり益・配当等が生じることがある</small>
        </div>
        <span className="knowledge-visual__arrow" aria-hidden="true">→</span>
        <div className="knowledge-visual__flow-card knowledge-visual__flow-card--accent">
          <span className="knowledge-visual__step">03</span>
          <strong>制度の範囲で非課税</strong>
          <small>通常の課税口座との違いを理解する</small>
        </div>
      </div>

      <div className="knowledge-visual__metrics" aria-label="NISAの主な制度上限">
        {metrics.map(([value, label]) => (
          <div className="knowledge-visual__metric" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="knowledge-visual__risk">
        <span className="knowledge-visual__risk-mark" aria-hidden="true">!</span>
        <div>
          <strong>非課税でも、元本保証ではありません</strong>
          <p>制度のメリットと、投資商品の価格変動リスクは分けて考えます。</p>
        </div>
      </div>
    </section>
  )
}

function RepaymentMiniChart({ declining = false }: { declining?: boolean }) {
  const heights = declining
    ? [92, 84, 76, 68, 60, 52, 44]
    : [68, 68, 68, 68, 68, 68, 68]

  return (
    <div className="repayment-mini-chart" aria-hidden="true">
      {heights.map((height, index) => (
        <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
      ))}
    </div>
  )
}

function MortgageVisual() {
  return (
    <section className="knowledge-visual knowledge-visual--mortgage" aria-labelledby="mortgage-visual-title">
      <div className="knowledge-visual__topline">
        <div>
          <p className="knowledge-visual__eyebrow">COMPARE AT A GLANCE</p>
          <h2 id="mortgage-visual-title">2つの返済方法をひと目で比較</h2>
        </div>
        <span className="knowledge-visual__asof">返済額の動きはイメージ</span>
      </div>

      <div className="mortgage-compare">
        <article className="mortgage-compare__card">
          <div className="mortgage-compare__heading">
            <span>TYPE A</span>
            <h3>元利均等返済</h3>
          </div>
          <RepaymentMiniChart />
          <dl>
            <div><dt>毎月返済額</dt><dd>一定にしやすい</dd></div>
            <div><dt>返済初期</dt><dd>元金の減りは比較的ゆるやか</dd></div>
            <div><dt>家計管理</dt><dd>見通しを立てやすい</dd></div>
          </dl>
        </article>

        <div className="mortgage-compare__vs" aria-hidden="true">VS</div>

        <article className="mortgage-compare__card mortgage-compare__card--accent">
          <div className="mortgage-compare__heading">
            <span>TYPE B</span>
            <h3>元金均等返済</h3>
          </div>
          <RepaymentMiniChart declining />
          <dl>
            <div><dt>毎月返済額</dt><dd>当初大きく、徐々に低下</dd></div>
            <div><dt>返済初期</dt><dd>元金の減りが早い</dd></div>
            <div><dt>利息負担</dt><dd>同条件なら抑えやすい</dd></div>
          </dl>
        </article>
      </div>

      <div className="knowledge-visual__decision-line">
        <span>毎月返済額</span><i aria-hidden="true" />
        <span>総返済額</span><i aria-hidden="true" />
        <span>諸費用・団信</span><i aria-hidden="true" />
        <strong>同じ条件で比較</strong>
      </div>
    </section>
  )
}

function KnowledgeArticleVisual({ slug }: ArticleVisualProps) {
  if (slug === 'nisa-basics') return <NisaVisual />
  if (slug === 'mortgage-repayment-methods') return <MortgageVisual />
  return null
}

export default KnowledgeArticleVisual
