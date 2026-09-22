import { useBollettaContext } from '../context/BollettaContext.jsx'
import { useOrchestrator } from '../hooks/useOrchestrator.js'

const ETICHETTE = {
  intestatario: 'Intestatario',
  periodo:      'Periodo',
  consumi:      'Consumi',
  importo:      'Importo da pagare',
  scadenza:     'Scadenza',
}

export default function RiepilogoBolletta() {
  const { bolletta } = useBollettaContext()
  const { avviaReclamo, chiediSoccorso, loading, errore } = useOrchestrator()
  const riepilogo = bolletta.riepilogo ?? {}

  return (
    <div className="schermata">
      <h1 className="schermata-titolo">Ecco cosa dice la tua bolletta</h1>
      <p className="schermata-sottotitolo">
        Controlla che i dati siano giusti, poi scegli cosa fare.
      </p>

      <div className="riepilogo-griglia">
        {Object.entries(ETICHETTE).map(([chiave, etichetta]) => (
          <div key={chiave} className="riepilogo-campo">
            <div className="riepilogo-campo-etichetta">{etichetta}</div>
            <div className="riepilogo-campo-valore">{riepilogo[chiave] ?? '—'}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="messaggio-loading">
          <div className="spinner" />
          Sto preparando il modulo di reclamo…
        </div>
      ) : (
        <div className="azioni">
          <button className="btn btn-primary btn-lg" onClick={avviaReclamo}>
            Procedi con il reclamo
          </button>
          <button className="btn btn-ghost" onClick={chiediSoccorso}>
            Ho solo una domanda
          </button>
        </div>
      )}

      {errore && <p className="messaggio-errore">{errore}</p>}
    </div>
  )
}
