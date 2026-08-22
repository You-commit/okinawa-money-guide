import SiteLayout from '../layouts/SiteLayout'

const policies = [
  { id: 'sources', number: '01', title: '情報源と制度・税制の基準時点', english: 'Source & Reference Date', tag: '一次資料優先', body: '国税庁、総務省、金融庁、厚生労働省、自治体等の公的資料を優先します。ページや計算機ごとに対象年・制度の基準時点を表示し、将来変更される可能性を明記します。', items: ['制度説明は参照元と確認日を記載', '二次情報だけで重要な結論を断定しない', '正式手続は公的窓口・一次資料での再確認を案内'] },
  { id: 'updates', number: '02', title: '更新・訂正方針', english: 'Update & Correction', tag: '変更履歴', body: '制度変更、参照資料の更新、計算ロジックの修正が必要な場合は内容を確認し、重要な変更は更新理由とともに示します。誤りが判明した場合は速やかに訂正し、判断への影響が大きいものは訂正内容を残します。' },
  { id: 'simulators', number: '03', title: '計算ロジックとシミュレーターの位置づけ', english: 'Simulation Policy', tag: '目安', body: 'シミュレーター結果は、入力条件と所定の計算式にもとづく概算です。審査結果、契約条件、正式税額、将来の運用成果を確定・保証するものではありません。', items: ['対象範囲と含まれない条件を表示', '計算結果だけで重要な判断を完結させない', '必要に応じて金融機関、公的窓口、専門家への確認を案内'] },
  { id: 'ads', number: '05', title: '広告・提携と利益相反への考え方', english: 'Advertising & Partnership', tag: '判断優先', body: '広告や提携の有無が、情報の結論や掲載順位を決めないことを原則とします。提携がある場合も、その関係を明示し、安全情報や判断材料を広告より後回しにしません。' },
] as const

function TrustPage() {
  return (
    <SiteLayout className="dedicated-page info-page info-page--trust">
      <main id="main-content">
        <section className="info-hero trust-hero"><div className="info-hero__inner trust-hero__inner">
          <div><p className="info-eyebrow">Trust &amp; Transparency</p><h1>判断材料を届けるための、<br />情報と運営の方針</h1><p className="info-hero__lead">情報源、基準時点、計算結果、データ、広告・提携について、利用前に確認できる形で明示します。</p></div>
          <div className="trust-console" aria-label="信頼方針の概要"><div><span>TRUST CENTER</span><strong>06</strong></div><div className="trust-console__grid"><span>一次資料</span><span>更新・訂正</span><span>計算方針</span><span>データ保護</span><span>広告・提携</span><span>問い合わせ</span></div><p><span aria-hidden="true" />基準時点：2026年8月</p></div>
        </div></section>

        <div className="info-main"><div className="info-shell">
          <section className="trust-summary info-section">{[
            ['源', '根拠を示す', '制度・税制は公的機関の一次資料を優先し、基準時点を明記します。'],
            ['更', '更新を伝える', '更新日、見直し理由、訂正内容を利用者が確認できる運用を目指します。'],
            ['守', '判断を守る', '広告や提携より前に、安全情報と意思決定に必要な材料を配置します。'],
          ].map(([mark, title, body]) => <article className="info-surface" key={mark}><span className="info-icon-box" aria-hidden="true">{mark}</span><h2>{title}</h2><p>{body}</p></article>)}</section>

          <section className="info-section"><div className="trust-layout">
            <nav className="trust-nav info-surface" aria-label="信頼情報の目次"><strong>このページの内容</strong><a href="#sources">情報源と基準時点</a><a href="#updates">更新・訂正方針</a><a href="#simulators">シミュレーター</a><a href="#privacy">データ方針</a><a href="#ads">広告・提携方針</a><a href="#contact">問い合わせ窓口</a></nav>
            <div className="policy-stack">
              {policies.slice(0, 3).map((policy) => <article className="policy-card info-surface" id={policy.id} key={policy.id}><div className="policy-heading"><span className="policy-number">{policy.number}</span><div><h2>{policy.title}</h2><p>{policy.english}</p></div><span className="info-tag">{policy.tag}</span></div><div className="policy-body"><p>{policy.body}</p>{'items' in policy && policy.items ? <ul>{policy.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div></article>)}
              <article className="data-pledge info-surface" id="privacy"><p className="info-eyebrow">DATA PROMISE</p><h2>金融入力値と計算結果を、広告利用のために外部送信しない。</h2><p>利用者が安心して試算できることを優先し、入力した金額や計算結果を広告主・ASPへ送る設計にはしません。取得する情報がある場合は、目的と範囲を分かりやすく示します。</p><div><span>入力値を広告主へ送らない</span><span>計算結果をASPへ送らない</span><span>必要以上の個人情報を求めない</span></div></article>
              {policies.slice(3).map((policy) => <article className="policy-card info-surface" id={policy.id} key={policy.id}><div className="policy-heading"><span className="policy-number">{policy.number}</span><div><h2>{policy.title}</h2><p>{policy.english}</p></div><span className="info-tag">{policy.tag}</span></div><div className="policy-body"><p>{policy.body}</p></div></article>)}
              <article className="policy-card info-surface" id="contact"><div className="policy-heading"><span className="policy-number">06</span><div><h2>問い合わせ・訂正窓口</h2><p>Contact &amp; Feedback</p></div><span className="preparing">準備中</span></div><div className="policy-body"><p>情報の誤りや更新が必要な箇所を受け付ける窓口を準備しています。公開までは、利用可能な窓口であるかのようなリンクを設置しません。</p></div></article>
            </div>
          </div></section>

          <section className="info-section"><div className="info-section-heading"><div><p className="info-eyebrow">MONETIZATION PRINCIPLES</p><h2>収益化より先に守る5つの原則</h2></div><p>提携先が0社でも、利用者が必要な情報を得て判断できる状態を維持します。</p></div><div className="principles">{[
            ['FREE CORE', '無料の中核情報を削らない'], ['NO PAY-TO-RANK', '支払いによる順位操作をしない'], ['NO SPONSOR RANK', 'スポンサーを順位化しない'], ['SAFETY FIRST', '広告より先に安全情報を置く'], ['STAND ALONE', '提携先なしでも判断体験を成立させる'],
          ].map(([title, body]) => <article key={title}><b>{title}</b><p>{body}</p></article>)}</div></section>
        </div></div>
      </main>
    </SiteLayout>
  )
}

export default TrustPage
