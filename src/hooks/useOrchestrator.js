import { useState } from 'react'
import { useBollettaContext, useBollettaDispatch } from '../context/BollettaContext.jsx'
import { orchestratore } from '../agents/orchestratore.js'
import { reclamoAgent } from '../agents/reclamo-agent.js'

export function useOrchestrator() {
  const stato = useBollettaContext()
  const dispatch = useBollettaDispatch()
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState(null)

  async function esegui(evento, statoOverride) {
    setLoading(true)
    setErrore(null)
    try {
      await orchestratore(evento, statoOverride ?? stato, dispatch)
    } catch {
      setErrore('Qualcosa non ha funzionato. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  async function caricaBolletta(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1]
        dispatch({ type: 'SET_BOLLETTA_RAW', payload: base64 })
        // Passa il base64 direttamente nello stato perché il dispatch React
        // non è sincrono e stato.bolletta.raw sarebbe ancora null
        setLoading(true)
        setErrore(null)
        try {
          await orchestratore(
            'BOLLETTA_CARICATA',
            { ...stato, bolletta: { ...stato.bolletta, raw: base64 } },
            dispatch
          )
          resolve()
        } catch {
          setErrore('Qualcosa non ha funzionato. Riprova.')
          reject()
        } finally {
          setLoading(false)
        }
      }
      reader.onerror = () => {
        setErrore('Non riesco a leggere il file. Riprova.')
        reject(new Error('Errore lettura file'))
      }
      reader.readAsDataURL(file)
    })
  }

  async function avviaReclamo() {
    await esegui('RECLAMO_AVVIATO')
  }

  async function chiediSoccorso() {
    await esegui('UTENTE_BLOCCATO')
  }

  async function completaForm() {
    await esegui('FORM_COMPLETATO')
  }

  async function generaReclamo() {
    setLoading(true)
    setErrore(null)
    try {
      const testo = await reclamoAgent(stato.form.campi, stato.bolletta.estratta)
      dispatch({ type: 'SET_RECLAMO', payload: testo })
    } catch {
      setErrore('Qualcosa non ha funzionato. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return {
    caricaBolletta,
    avviaReclamo,
    chiediSoccorso,
    completaForm,
    generaReclamo,
    loading,
    errore,
  }
}
