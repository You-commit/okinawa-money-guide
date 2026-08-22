import { useNavigate, useSearchParams } from 'react-router-dom'
import TaxableIncomeCalculator from '../TaxableIncomeCalculator'
import { routes } from '../app/routes'
import SimulatorPageShell from '../components/simulator/SimulatorPageShell'

function TaxableIncomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shouldReturnToIdeco = searchParams.get('return') === 'ideco'

  const applyRate = (rate: number) => {
    const destination = `${routes.ideco}?incomeTaxRate=${encodeURIComponent(String(rate))}`
    navigate(destination)
  }

  return (
    <SimulatorPageShell
      theme="taxable"
      eyebrow="TAXABLE INCOME CALCULATOR"
      title="課税所得・所得税率シミュレーター"
      description="給与収入と所得控除から、2026年分の課税所得・所得税率・所得税額を概算します。"
      benefits={[
        { title: '対象年', description: '2026年分の所得税' },
        { title: '対象税目', description: '給与所得にかかる所得税' },
        { title: '対象外', description: '税額控除・給与以外の所得' },
      ]}
      notes={
        <>
          <article className="simulator-note-card simulator-note-card--warning">
            <h2>正式税額を確定するものではありません</h2>
            <p>住宅ローン控除などの税額控除、所得金額調整控除、給与以外の所得、個別の事情は含みません。</p>
          </article>
          <article className="simulator-note-card simulator-note-card--blue">
            <h2>住民税の参考</h2>
            <p>住民税は所得税と控除・税率・計算方法が異なります。標準税率10%は目安であり、正式額は自治体の案内をご確認ください。</p>
          </article>
          <article className="simulator-note-card simulator-note-card--next">
            <h2>一次資料</h2>
            <p>国税庁の給与所得控除・基礎控除・所得税率の2026年分ルールを基準にしています。</p>
          </article>
        </>
      }
    >
      {shouldReturnToIdeco ? <p className="tax-return-context">計算した所得税率だけをiDeCoへ反映できます。給与収入や控除額はURLへ保存しません。</p> : null}
      <TaxableIncomeCalculator onApplyIncomeTaxRate={applyRate} />
    </SimulatorPageShell>
  )
}

export default TaxableIncomePage
