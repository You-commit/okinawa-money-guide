import { Link } from 'react-router-dom'
import { routes } from '../app/routes'
import SiteLayout from '../layouts/SiteLayout'

function AboutPage() {
  return (
    <SiteLayout className="dedicated-page info-page info-page--about">
      <main id="main-content">
        <section className="info-hero about-hero"><div className="info-hero__inner about-hero__inner"><div className="about-hero__copy">
          <p className="info-eyebrow">About Okinawa Money Guide</p>
          <h1>沖縄のお金の判断を、<br />落ち着いて整理できる場所へ</h1>
          <p className="info-hero__lead">複雑な制度や数字を、生活者の目線で理解しやすく整え、次の判断へ進むための情報サイトです。</p>
          <div className="about-principles"><span>理解する</span><i aria-hidden="true" /><span>比べる</span><i aria-hidden="true" /><span>自分で判断する</span></div>
        </div></div></section>

        <div className="info-main"><div className="info-shell info-shell--about">
          <section className="mission-grid info-section">
            <article className="mission-story"><p className="info-eyebrow">STORY &amp; MISSION</p><h2>知識の量ではなく、<br />自分で判断できる状態をつくる。</h2><p>お金の制度や商品は、言葉が難しく、比較する条件も多くあります。沖縄マネーガイドは、複雑な情報をそのまま並べるのではなく、「何を確認し、どの数字を見て、次に何をするか」が分かる順序で整理します。</p><p>沖縄で暮らす人の住まい、資産形成、軍用地、保険や家計に関する判断を、全国共通の制度と地域の事情を混同せず考えられることを目指します。</p></article>
            <aside className="audience-card"><p className="info-eyebrow">FOR WHOM</p><h2>こんな方のためのサイトです</h2><ul className="check-list"><li>何から調べればよいか分からない</li><li>制度の説明を自分の数字に置き換えたい</li><li>沖縄に関わるお金のテーマを整理したい</li><li>相談や契約の前に、判断軸を持ちたい</li><li>公的な一次資料も確認しながら考えたい</li></ul></aside>
          </section>

          <section className="info-section"><div className="info-section-heading"><div><p className="info-eyebrow">WHY OKINAWA</p><h2>沖縄の金融意思決定を支える理由</h2></div><p>全国共通の制度だけでは捉えにくい暮らしの条件を、誇張せず、分けて考えられるようにします。</p></div>
            <div className="about-reasons">{[
              ['01', 'LOCAL CONTEXT', '地域の文脈', '軍用地、車中心の生活、住まいの維持など、沖縄で判断材料になりやすいテーマを整理します。'],
              ['02', 'COMMON STANDARD', '全国基準との区別', '税制や金融制度の全国共通ルールと、地域固有の事情を混同しない情報設計にします。'],
              ['03', 'NEXT STEP', '次の一歩', '読むだけで終わらず、試算・一次資料・専門家への確認へ進める道筋を示します。'],
            ].map(([number, eyebrow, title, body]) => <article key={number}><span>{number}</span><div><p className="info-eyebrow">{eyebrow}</p><h3>{title}</h3><p>{body}</p></div></article>)}</div>
          </section>

          <section className="info-section"><div className="info-section-heading"><div><p className="info-eyebrow">SCOPE</p><h2>できること・できないこと</h2></div><p>情報サイトとシミュレーターの役割を明確にし、利用者へ過度な期待を持たせません。</p></div>
            <div className="scope-grid"><article className="scope-card info-surface"><h3><span className="info-tag">できること</span> 判断材料を整理する</h3><ul><li>制度や用語を生活者向けに整理する</li><li>条件を入力して概算の目安を確認する</li><li>比較するときの観点と注意点を示す</li><li>一次資料や正式手続の確認先を案内する</li></ul></article><article className="scope-card scope-card--cannot info-surface"><h3><span className="preparing">できないこと</span> 正式判断を代行しない</h3><ul><li>契約、投資、借入の推奨や勧誘</li><li>税額、審査、受給額などの正式確定</li><li>個別事情を踏まえた法律・税務・金融助言</li><li>将来の運用成果や制度継続の保証</li></ul></article></div>
          </section>

          <section className="info-section"><div className="info-section-heading"><div><p className="info-eyebrow">HOW TO READ</p><h2>情報とシミュレーターの読み方</h2></div><p>結果の数字だけを結論にせず、条件・内訳・一次資料まで順に確認します。</p></div>
            <div className="reading-steps">{[
              ['STEP 01', '目的を決める', '何を判断したいかを先に言葉にします。'],
              ['STEP 02', '前提を読む', '対象年、対象範囲、含まれない条件を確認します。'],
              ['STEP 03', '数字を試す', 'シミュレーターで自分の条件に置き換えます。'],
              ['STEP 04', '正式情報へ進む', '重要な判断は一次資料や専門窓口で確認します。'],
            ].map(([step, title, body]) => <article key={step}><b>{step}</b><h3>{title}</h3><p>{body}</p></article>)}</div>
          </section>

          <section className="info-section"><div className="page-links"><Link className="page-link info-surface" to={routes.trust}><span><strong>信頼情報を見る</strong><span>情報源・更新・データ・広告方針</span></span><span aria-hidden="true">→</span></Link><div className="page-link info-surface"><span><strong>運営・編集方針</strong><span>公開準備中です</span></span><span className="preparing">準備中</span></div></div></section>
        </div></div>
      </main>
    </SiteLayout>
  )
}

export default AboutPage
