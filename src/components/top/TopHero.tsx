import {
  ArrowRightIcon,
  CalculatorIcon,
  ChevronRightIcon,
  PlayCircleIcon,
  StepCalculatorIcon,
  StepInputIcon,
  StepResultsIcon,
} from './TopIcons'

function StepIcon({ step }: { step: 1 | 2 | 3 }) {
  if (step === 1) {
    return <StepInputIcon />
  }

  if (step === 2) {
    return <StepCalculatorIcon />
  }

  return <StepResultsIcon />
}

function HeroFlowLines() {
  return (
    <svg
      className="top-option02__hero-flow"
      viewBox="0 0 1440 500"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="option02-flow-white" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.72" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.48" />
        </linearGradient>
        <linearGradient id="option02-flow-mint" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#87e1c1" stopOpacity="0.48" />
          <stop offset="0.48" stopColor="#c9f4e5" stopOpacity="0.56" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id="option02-flow-blue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="0.5" stopColor="#9edaf9" stopOpacity="0.34" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <path
        className="top-option02__hero-flow-band top-option02__hero-flow-band--blue"
        fill="url(#option02-flow-blue)"
        d="M-100 335C120 278 294 390 502 330c181-52 288-184 498-173 182 10 312 109 540 67v116c-218 39-351-27-516-18-221 12-319 122-520 132-219 10-390-106-604-36Z"
      />
      <path
        className="top-option02__hero-flow-band top-option02__hero-flow-band--white"
        fill="url(#option02-flow-white)"
        d="M-90 282C104 354 264 287 430 297c206 12 284 120 470 131 196 11 343-83 632-68v101c-257-10-431 77-632 58-197-19-306-117-484-119-170-2-306 76-506 4Z"
      />
      <path
        className="top-option02__hero-flow-band top-option02__hero-flow-band--mint"
        fill="url(#option02-flow-mint)"
        d="M-112 371c214-41 349 92 565 70 203-20 311-112 501-99 193 13 333 101 586 59v93H-112Z"
      />
      <g className="top-option02__hero-hairlines">
        <path d="M-20 350c196-70 318 31 492 8 211-27 304-138 501-128 187 10 313 92 482 41" />
        <path d="M-10 382c181-46 319 52 494 28 204-28 298-126 487-114 186 12 309 87 487 43" />
        <path d="M2 415c171-27 313 68 490 41 196-30 296-109 480-97 176 11 296 70 464 45" />
      </g>
      <g className="top-option02__hero-network">
        <path d="M588 160 680 108l76 91 84-68 79 89" />
        <path d="m680 108 14 128 62-37 84 49 79-28" />
        <circle cx="588" cy="160" r="4" />
        <circle cx="680" cy="108" r="4" />
        <circle cx="694" cy="236" r="3" />
        <circle cx="756" cy="199" r="4" />
        <circle cx="840" cy="131" r="3" />
        <circle cx="840" cy="248" r="4" />
        <circle cx="919" cy="220" r="3" />
      </g>
    </svg>
  )
}

function TopHero() {
  return (
    <section className="top-option02__hero" aria-labelledby="top-option02-title">
      <div className="top-option02__hero-photo" aria-hidden="true" />
      <HeroFlowLines />
      <div className="top-option02__hero-inner">
        <div className="top-option02__hero-copy">
          <p className="top-option02__hero-kicker">シミュレーションで未来を描く</p>
          <h1 id="top-option02-title">
            <span>沖縄で暮らす人の</span>
            <span>お金の判断を、</span>
            <span>もっと分かりやすく。</span>
          </h1>
          <p className="top-option02__hero-description">
            軍用地や住宅ローン、NISA・iDeCo・保険まで、
            <br />
            試算と解説で落ち着いて整理できます。
          </p>
          <div className="top-option02__hero-actions">
            <a className="top-option02__button top-option02__button--primary" href="#popular-simulators">
              <CalculatorIcon className="top-option02__button-icon" />
              シミュレーターを始める
              <ArrowRightIcon className="top-option02__button-arrow" />
            </a>
            <a className="top-option02__button top-option02__button--secondary" href="#categories">
              <PlayCircleIcon className="top-option02__play" />
              使い方や学び方を見る
              <ArrowRightIcon className="top-option02__button-arrow" />
            </a>
          </div>
        </div>

        <aside className="top-option02__steps" aria-labelledby="top-option02-steps-title">
          <h2 id="top-option02-steps-title">かんたん3ステップで未来をシミュレーション</h2>
          <ol>
            <li className="top-option02__step top-option02__step--one">
              <span className="top-option02__step-icon"><StepIcon step={1} /></span>
              <span className="top-option02__step-content">
                <strong><b>1</b> 条件を入力</strong>
                <small>あなたの状況や希望条件を入力します</small>
              </span>
            </li>
            <li className="top-option02__step top-option02__step--two">
              <span className="top-option02__step-icon"><StepIcon step={2} /></span>
              <span className="top-option02__step-content">
                <strong><b>2</b> シミュレーション</strong>
                <small>条件をもとに将来の見通しを計算します</small>
              </span>
            </li>
            <li className="top-option02__step top-option02__step--three">
              <span className="top-option02__step-icon"><StepIcon step={3} /></span>
              <span className="top-option02__step-content">
                <strong><b>3</b> 結果をチェック</strong>
                <small>グラフや表で分かりやすく確認できます</small>
              </span>
            </li>
          </ol>
          <a className="top-option02__steps-cta" href="#popular-simulators">
            今すぐシミュレーションを始める
            <ChevronRightIcon className="top-option02__steps-arrow" />
          </a>
        </aside>
      </div>
    </section>
  )
}

export default TopHero
