import { useBollettaContext, useBollettaDispatch } from '../context/BollettaContext.jsx'
import { useOrchestrator } from '../hooks/useOrchestrator.js'

export default function GuidaCampoManuale() {
  const { form, sessione } = useBollettaContext()
  const dispatch = useBollettaDispatch()
  const { chiediSoccorso, loading } = useOrchestrator()

  const opzioni = form.opzioniCampoAttivo ?? []
  const selezionata = form.campi.motivo_reclamo
  const ultimoSuggerimento = sessione.ultimoBloco

  function selezionaOpzione(opzione) {
    dispatch({ type: 'SET_CAMPO_MANUALE', payload: { campo: 'motivo_reclamo', valore: opzione } })
  }

  return (
    <div className="tool-panel">
      <p className="tool-panel-titolo">
        ✅ Ho compilato 5 campi per te.<br />
        Manca solo il motivo del reclamo.
      </p>

      {opzioni.length > 0 && (
        <>
          <p style={{ marginBottom: '0.75rem', fontSize: '18px' }}>Scegli il motivo:</p>
          {opzioni.map((opzione, i) => (
            <button
              key={i}
              className={`opzione-btn${selezionata === opzione ? ' opzione-btn--selezionata' : ''}`}
              onClick={() => selezionaOpzione(opzione)}
              aria-pressed={selezionata === opzione}
            >
              {selezionata === opzione ? '✔ ' : ''}{opzione}
            </button>
          ))}
        </>
      )}

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <div className="messaggio-loading">
            <div className="spinner" />
            Un momento…
          </div>
        ) : (
          <button className="btn btn-ghost btn-full" onClick={chiediSoccorso}>
            Non so cosa fare
          </button>
        )}
      </div>

      {ultimoSuggerimento && (
        <div className="soccorso-risposta">{ultimoSuggerimento}</div>
      )}
    </div>
  )
}
