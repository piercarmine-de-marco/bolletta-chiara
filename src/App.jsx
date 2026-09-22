import { BollettaProvider, useBollettaContext, useBollettaDispatch } from './context/BollettaContext.jsx'
import { useOrchestrator } from './hooks/useOrchestrator.js'
import Benvenuto from './components/Benvenuto.jsx'
import RiepilogoBolletta from './components/RiepilogoBolletta.jsx'
import FormAutocompilato from './components/FormAutocompilato.jsx'
import BozzaReclamo from './components/BozzaReclamo.jsx'

function ChiediEmail() {
  const { generaReclamo, loading, errore } = useOrchestrator()

  return (
    <div className="schermata">
      <h1 className="schermata-titolo">Reclamo inviato!</h1>
      <p className="schermata-sottotitolo">
        Vuoi anche il testo da mandare via email al fornitore?
      </p>

      {loading ? (
        <div className="messaggio-loading">
          <div className="spinner" />
          Sto scrivendo la lettera…
        </div>
      ) : (
        <div className="azioni">
          <button className="btn btn-primary btn-lg" onClick={generaReclamo}>
            Sì, generalo
          </button>
          <a className="btn btn-ghost btn-lg" href="/">
            No, ho finito
          </a>
        </div>
      )}

      {errore && <p className="messaggio-errore">{errore}</p>}
    </div>
  )
}

function Router() {
  const stato = useBollettaContext()
  const { bolletta, form, output } = stato

  if (!bolletta.riepilogo)              return <Benvenuto />
  if (!form.campiAutomaticiCompilati)   return <RiepilogoBolletta />
  if (!form.completato)                 return <FormAutocompilato />
  if (!output.bozzaReclamo)             return <ChiediEmail />
  return <BozzaReclamo />
}

export default function App() {
  return (
    <BollettaProvider>
      <header className="app-header">BollettaChiara</header>
      <Router />
    </BollettaProvider>
  )
}
