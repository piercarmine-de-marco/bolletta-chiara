import { useBollettaContext, useBollettaDispatch } from '../context/BollettaContext.jsx'
import { useOrchestrator } from '../hooks/useOrchestrator.js'
import { campiForm } from '../data/campi-form.js'
import GuidaCampoManuale from './GuidaCampoManuale.jsx'

export default function FormAutocompilato() {
  const { form } = useBollettaContext()
  const dispatch = useBollettaDispatch()
  const { inviaReclamo, loading, errore } = useOrchestrator()

  const campi = form.campi
  const formCompleto = !!campi.motivo_reclamo?.trim()

  function onCampoChange(campo, valore) {
    dispatch({ type: 'SET_CAMPO_MANUALE', payload: { campo, valore } })
  }

  const sottotitolo = formCompleto
    ? 'Ottimo! Puoi aggiungere note, poi premi "Invia il reclamo".'
    : 'I campi azzurri sono stati compilati automaticamente. Ora scegli il motivo nel pannello a destra.'

  return (
    <div className="schermata">
      <h1 className="schermata-titolo">Modulo di reclamo</h1>
      <p className="schermata-sottotitolo">{sottotitolo}</p>

      <div className="form-layout">
        {/* Colonna sinistra: form */}
        <div className="card">
          {campiForm.map(({ id, label, automatico }) => {
            if (id === 'note_aggiuntive') return null
            const valore = campi[id] ?? ''
            const isPrefilled = automatico
            const isMotivo = id === 'motivo_reclamo'

            return (
              <div key={id} className="campo-gruppo">
                <label className="campo-label" htmlFor={id}>
                  {label}
                  {isPrefilled && <span className="campo-badge">compilato automaticamente</span>}
                </label>
                <input
                  id={id}
                  className={`campo-input ${isPrefilled ? 'campo-input--prefilled' : 'campo-input--vuoto'}`}
                  type="text"
                  value={valore}
                  readOnly={!isMotivo}
                  aria-readonly={!isMotivo}
                  placeholder={isMotivo ? 'Scegli un\'opzione a destra oppure scrivi qui il motivo…' : undefined}
                  onChange={isMotivo ? (e) => onCampoChange('motivo_reclamo', e.target.value) : undefined}
                />
              </div>
            )
          })}

          {/* Note aggiuntive — mostrate solo quando motivo è compilato */}
          {formCompleto && (
            <div className="campo-gruppo">
              <label className="campo-label" htmlFor="note_aggiuntive">
                Note aggiuntive{' '}
                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(facoltativo)</span>
              </label>
              <textarea
                id="note_aggiuntive"
                className="campo-textarea"
                value={campi.note_aggiuntive ?? ''}
                onChange={(e) => onCampoChange('note_aggiuntive', e.target.value)}
                placeholder="Scrivi qui eventuali dettagli in più che vuoi aggiungere…"
              />
            </div>
          )}

          {/* Bottone invia */}
          {formCompleto && (
            loading ? (
              <div className="messaggio-loading">
                <div className="spinner" />
                Sto preparando l&apos;email di reclamo…
              </div>
            ) : (
              <button
                className="btn btn-primary btn-lg btn-full"
                style={{ marginTop: '0.5rem' }}
                onClick={inviaReclamo}
              >
                Invia il reclamo
              </button>
            )
          )}

          {errore && <p className="messaggio-errore">{errore}</p>}
        </div>

        {/* Colonna destra: tool panel */}
        <GuidaCampoManuale />
      </div>
    </div>
  )
}
