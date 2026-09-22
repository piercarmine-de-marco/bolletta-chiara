import { BollettaProvider, useBollettaContext } from './context/BollettaContext.jsx'
import Benvenuto from './components/Benvenuto.jsx'
import RiepilogoBolletta from './components/RiepilogoBolletta.jsx'
import FormAutocompilato from './components/FormAutocompilato.jsx'
import BozzaReclamo from './components/BozzaReclamo.jsx'

const ETICHETTE_STEP = ['Carica', 'Controlla', 'Compila', 'Inviato!']

function StepIndicator({ step, totale }) {
  const larghezza = Math.round((step / totale) * 100)
  return (
    <div className="step-wrapper">
      <span className="step-testo">Passo <strong>{step}</strong> di {totale}</span>
      <div className="step-barra">
        <div className="step-barra-fill" style={{ width: `${larghezza}%` }} />
      </div>
      <span className="step-etichetta">{ETICHETTE_STEP[step - 1]}</span>
    </div>
  )
}

function useCurrentStep() {
  const { bolletta, form } = useBollettaContext()
  if (!bolletta.riepilogo)            return 1
  if (!form.campiAutomaticiCompilati) return 2
  if (!form.completato)               return 3
  return 4
}

function Router() {
  const { bolletta, form } = useBollettaContext()

  if (!bolletta.riepilogo)              return <Benvenuto />
  if (!form.campiAutomaticiCompilati)   return <RiepilogoBolletta />
  if (!form.completato)                 return <FormAutocompilato />
  return <BozzaReclamo />
}

function AppInterna() {
  const step = useCurrentStep()
  return (
    <>
      <header className="app-header">BollettaChiara</header>
      <StepIndicator step={step} totale={4} />
      <Router />
    </>
  )
}

export default function App() {
  return (
    <BollettaProvider>
      <AppInterna />
    </BollettaProvider>
  )
}
