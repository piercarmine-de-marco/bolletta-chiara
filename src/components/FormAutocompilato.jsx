import { useBollettaContext, useBollettaDispatch } from '../context/BollettaContext.jsx'
import { useOrchestrator } from '../hooks/useOrchestrator.js'
import { campiForm } from '../data/campi-form.js'
import GuidaCampoManuale from './GuidaCampoManuale.jsx'

export default function FormAutocompilato() {
  const { form } = useBollettaContext()
  const dispatch = useBollettaDispatch()
  const { completaForm, loading, errore } = useOrchestrator()

  const campi = form.campi
  const formCompleto = campi.motivo_reclamo !== null

  function onNoteChange(e) {
    dispatch({ type: 'SET_CAMPO_MANUALE', payload: { campo: 'note_aggiuntive', valore: e.target.value } })
  }

  return (
    <div className="schermata">
      <h1 className="schermata-titolo">Modulo di reclamo</h1>
      <p className="schermata-sottotitolo">
        I campi azzurri sono stati compilati automaticamente. Scegli il motivo nel pannello a destra.
      </p>

      <div className="form-layout">
        {/* Colonna sinistra: form */}
        <div className="card">
          {campiForm.map(({ id, label, automatico, opzionale }) => {
            if (id === 'note_aggiuntive') return null // gestito separatamente sotto
            const valore = campi[id] ?? ''
            const isPrefilled = automatico

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
                  readOnly
                  aria-readonly="true"
                />
              </div>
            )
          })}

          {/* Note aggiuntive — mostrate solo quando motivo è selezionato */}
          {formCompleto && (
            <div className="campo-gruppo">
              <label className="campo-label" htmlFor="note_aggiuntive">
                Note aggiuntive <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(facoltativo)</span>
              </label>
              <textarea
                id="note_aggiuntive"
                className="campo-textarea"
                value={campi.note_aggiuntive ?? ''}
                onChange={onNoteChange}
                placeholder="Scrivi qui eventuali dettagli in più che vuoi aggiungere…"
              />
            </div>
          )}

          {/* Bottone invia */}
          {formCompleto && (
            loading ? (
              <div className="messaggio-loading">
                <div className="spinner" />
                Sto registrando il reclamo…
              </div>
            ) : (
              <button
                className="btn btn-primary btn-lg btn-full"
                style={{ marginTop: '0.5rem' }}
                onClick={completaForm}
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
