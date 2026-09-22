import { useState } from 'react'
import { useBollettaContext } from '../context/BollettaContext.jsx'

export default function BozzaReclamo() {
  const { output } = useBollettaContext()
  const [copiato, setCopiato] = useState(false)

  const testo = output.bozzaReclamo ?? ''

  function copiaTesto() {
    navigator.clipboard.writeText(testo).then(() => {
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2500)
    })
  }

  return (
    <div className="schermata">
      <h1 className="schermata-titolo">Testo per l'email di reclamo</h1>
      <p className="schermata-sottotitolo">
        Copia questo testo e incollalo nella tua email al fornitore.
      </p>

      <div className="card">
        <textarea
          className="bozza-testo"
          value={testo}
          readOnly
          aria-label="Testo della lettera di reclamo"
        />

        <div className="azioni" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary btn-lg" onClick={copiaTesto}>
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
