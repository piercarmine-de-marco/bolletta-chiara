import { useRef, useState } from 'react'
import { useOrchestrator } from '../hooks/useOrchestrator.js'

export default function Benvenuto() {
  const { caricaBolletta, loading, errore } = useOrchestrator()
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)

  function handleFile(file) {
    if (!file || file.type !== 'application/pdf') return
    caricaBolletta(file)
  }

  function onInputChange(e) {
    handleFile(e.target.files?.[0])
  }

  function onDrop(e) {
    e.preventDefault()
    setDrag(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="schermata">
      <h1 className="schermata-titolo">BollettaChiara</h1>
      <p className="schermata-sottotitolo">
        Carica la tua bolletta e compilo il modulo di reclamo per te.
      </p>

      {loading ? (
        <div className="messaggio-loading">
          <div className="spinner" />
          Sto leggendo la tua bolletta, un momento…
        </div>
      ) : (
        <div
          className={`upload-area${drag ? ' upload-area--drag' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          role="button"
          aria-label="Clicca per caricare la bolletta PDF"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click() }}
        >
          <span className="upload-icona" aria-hidden="true">📄</span>
          <p className="upload-testo-principale">Clicca qui per caricare la bolletta</p>
          <p className="upload-testo-secondario">oppure trascina il file PDF in questo riquadro</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={onInputChange}
            tabIndex={-1}
          />
        </div>
      )}

      {errore && <p className="messaggio-errore">{errore}</p>}
    </div>
  )
}
