import { useState } from 'react'
import { useBollettaContext } from '../context/BollettaContext.jsx'

function apriEmail(testo, nomeCognome, emailFornitore) {
  const oggetto = `Reclamo bolletta – ${nomeCognome ?? ''}`
  const to = emailFornitore ?? ''
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testo)}`
}

export default function BozzaReclamo() {
  const { output, form, bolletta } = useBollettaContext()
  const [copiato, setCopiato] = useState(false)

  const testo = output.bozzaReclamo ?? ''
  const nomeCognome = form.campi.nome_cognome ?? ''
  const emailFornitore = bolletta.estratta?.email_fornitore ?? ''

  function copiaTesto() {
    navigator.clipboard.writeText(testo).then(() => {
      setCopiato(true)
      setTimeout(() => setCopiato(false), 3000)
    })
  }

  return (
    <div className="schermata">
      <p className="schermata-sottotitolo">
        L&apos;email di reclamo dovrebbe essersi aperta sul tuo dispositivo.
      </p>

      <div className="azioni" style={{ marginBottom: '2rem' }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => apriEmail(testo, nomeCognome, emailFornitore)}
        >
          Riapri nell&apos;email
        </button>
        <a className="btn btn-ghost btn-lg" href="/">
          Ricomincia da capo
        </a>
      </div>

      <p style={{ fontSize: 'var(--f-base)', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Se l&apos;email non si è aperta, copia il testo qui sotto e incollalo nella tua email:
      </p>

      <div className="card">
        <textarea
          className="bozza-testo"
          value={testo}
          readOnly
          aria-label="Testo della lettera di reclamo"
        />

        <div className="azioni" style={{ marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={copiaTesto}>
            {copiato ? '✔ Copiato!' : 'Copia il testo'}
          </button>
        </div>

        {copiato && (
          <p className="messaggio-successo">
            Testo copiato! Ora puoi incollarlo nella tua email.
          </p>
        )}
      </div>
    </div>
  )
}
