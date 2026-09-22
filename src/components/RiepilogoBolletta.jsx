import { useBollettaContext } from '../context/BollettaContext.jsx'
import { useOrchestrator } from '../hooks/useOrchestrator.js'

const ETICHETTE = {
  intestatario: 'Intestatario',
  periodo:      'Periodo',
  consumi:      'Consumi',
  importo:      'Importo da pagare',
  scadenza:     'Scadenza',
}

const ICONE_FORNITURA = {
  'Elettricità': '⚡',
  'Gas':         '🔥',
  'Luce e Gas':  '⚡🔥',
}

function inferTipoFornitura(estratta) {
  if (estratta.tipo_fornitura) return estratta.tipo_fornitura
  // Fallback: codice POD italiano per elettricità è "IT" + 3 char zona + "E" + cifre
  const pod = estratta.codice_pod ?? ''
  if (/^IT[A-Z0-9]{3}E/i.test(pod)) return 'Elettricità'
  if (estratta.codice_pdr) return 'Gas'
  if (typeof estratta.consumi_kwh === 'number') return 'Elettricità'
  return null
}

export default function RiepilogoBolletta() {
  const { bolletta } = useBollettaContext()
  const { avviaReclamo, loading, errore } = useOrchestrator()
  const riepilogo = bolletta.riepilogo ?? {}
  const estratta = bolletta.estratta ?? {}

  const tipoFornitura = inferTipoFornitura(estratta)
  const icona = tipoFornitura ? (ICONE_FORNITURA[tipoFornitura] ?? '📄') : null

  return (
    <div className="schermata">
      <h1 className="schermata-titolo">Ecco cosa dice la tua bolletta</h1>
      <p className="schermata-sottotitolo">
        Controlla che i dati siano giusti, poi procedi con il reclamo.
      </p>

      {/* Tipologia bolletta */}
      {tipoFornitura && (
        <div style={{
          background: 'var(--accent)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '0.85rem 1.1rem',
          marginBottom: '1.25rem',
          fontSize: 'var(--f-base)',
        }}>
          <span style={{ fontWeight: 700 }}>Tipologia bolletta:</span>{' '}
          {icona && <span aria-hidden="true">{icona}</span>}{' '}
          {tipoFornitura}
        </div>
      )}

      <div className="riepilogo-griglia">
        {Object.entries(ETICHETTE).map(([chiave, etichetta]) => (
          <div key={chiave} className="riepilogo-campo">
            <div className="riepilogo-campo-etichetta">{etichetta}</div>
            <div className="riepilogo-campo-valore">{riepilogo[chiave] ?? '—'}</div>
          </div>
        ))}
        <div className="riepilogo-campo">
          <div className="riepilogo-campo-etichetta">Codice cliente</div>
          <div className="riepilogo-campo-valore">{estratta.codice_cliente ?? '—'}</div>
        </div>
        <div className="riepilogo-campo">
          <div className="riepilogo-campo-etichetta">Codice POD</div>
          <div className="riepilogo-campo-valore">{estratta.codice_pod ?? '—'}</div>
        </div>
      </div>

      {loading ? (
        <div className="messaggio-loading">
          <div className="spinner" />
          Sto preparando il modulo di reclamo…
        </div>
      ) : (
        <div className="azioni">
          <button className="btn btn-primary btn-lg" onClick={avviaReclamo}>
            Inizia reclamo
          </button>
          <a className="btn btn-ghost btn-lg" href="/">
            Torna indietro
          </a>
        </div>
      )}

      {errore && <p className="messaggio-errore">{errore}</p>}
    </div>
  )
}
