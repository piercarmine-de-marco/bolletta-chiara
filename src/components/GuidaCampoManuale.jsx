import { useBollettaContext, useBollettaDispatch } from '../context/BollettaContext.jsx'
import { useOrchestrator } from '../hooks/useOrchestrator.js'

export default function GuidaCampoManuale() {
  const { form, sessione } = useBollettaContext()
  const dispatch = useBollettaDispatch()
  const { chiediSoccorso, loading } = useOrchestrator()

  const opzioniPronti = form.campoManualeAttivo !== null
  const opzioni = form.opzioniCampoAttivo ?? []
  const selezionata = form.campi.motivo_reclamo
  const ultimoSuggerimento = sessione.ultimoBloco

  function selezionaOpzione(opzione) {
    dispatch({ type: 'SET_CAMPO_MANUALE', payload: { campo: 'motivo_reclamo', valore: opzione } })
  }

  const panelClass = `tool-panel${selezionata ? ' tool-panel--ok' : ''}`
  const titoloClass = `tool-panel-titolo${selezionata ? ' tool-panel-titolo--ok' : ''}`

  /* --- Stato 1: opzioni ancora in caricamento --- */
  if (!opzioniPronti) {
    return (
      <div className="tool-panel">
        <p className="tool-panel-titolo">✅ Ho compilato 5 campi per te.</p>
        <div className="messaggio-loading">
          <div className="spinner" />
          Sto preparando i suggerimenti per il motivo…
        </div>
      </div>
    )
  }

  /* --- Stato 2 & 3: opzioni pronte --- */
  return (
    <div className={panelClass}>
      <p className={titoloClass}>
        {selezionata
          ? '✅ Hai scelto il motivo!'
          : '✅ Ho compilato 5 campi per te. Ora scegli il motivo:'}
      </p>

      {selezionata && (
        <p style={{ fontSize: 'var(--f-base)', color: 'var(--success)', marginBottom: '1rem' }}>
          Puoi aggiungere note e poi premere &quot;Invia il reclamo&quot;.
        </p>
      )}

      {opzioni.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
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
        </div>
      )}

      {/* Soccorso — visibile solo se l'utente è bloccato nonostante le opzioni */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        {loading ? (
          <div className="messaggio-loading">
            <div className="spinner" />
            Un momento…
          </div>
        ) : (
          <button className="btn btn-ghost btn-full" onClick={chiediSoccorso}>
            {opzioni.length > 0 ? 'Le opzioni non mi aiutano' : 'Non so cosa fare'}
          </button>
        )}
      </div>

      {ultimoSuggerimento && (
        <div className="soccorso-risposta">{ultimoSuggerimento}</div>
      )}
    </div>
  )
}
