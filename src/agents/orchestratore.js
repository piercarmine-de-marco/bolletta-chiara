import { estrattoAgent } from './estratto-agent.js'
import { riepilogoAgent } from './riepilogo-agent.js'
import { autocompilaAgent } from './autocompila-agent.js'
import { guidaFormAgent } from './guida-form-agent.js'
import { soccorsoAgent } from './soccorso-agent.js'
import { reclamoAgent } from './reclamo-agent.js'

function log(evento, agente, esito) {
  console.log(`[Orchestratore] evento: ${evento} → agente: ${agente} → risultato: ${esito}`)
}

export async function orchestratore(evento, stato, dispatch) {
  switch (evento) {
    case 'BOLLETTA_CARICATA': {
      let bolletta
      try {
        bolletta = await estrattoAgent(stato.bolletta.raw)
        dispatch({ type: 'SET_BOLLETTA_ESTRATTA', payload: bolletta })
        log(evento, 'EstrattoAgent', 'OK')
      } catch (err) {
        log(evento, 'EstrattoAgent', 'ERRORE')
        throw err
      }

      try {
        const riepilogo = await riepilogoAgent(bolletta)
        dispatch({ type: 'SET_RIEPILOGO', payload: riepilogo })
        log(evento, 'RiepilogoAgent', 'OK')
      } catch (err) {
        log(evento, 'RiepilogoAgent', 'ERRORE')
        throw err
      }
      break
    }

    case 'RECLAMO_AVVIATO': {
      let campi
      try {
        campi = await autocompilaAgent(stato.bolletta.estratta)
        dispatch({ type: 'SET_CAMPI_AUTOMATICI', payload: campi })
        log(evento, 'AutocompilaAgent', 'OK')
      } catch (err) {
        log(evento, 'AutocompilaAgent', 'ERRORE')
        throw err
      }

      try {
        const guida = await guidaFormAgent('motivo_reclamo', stato.bolletta.estratta)
        dispatch({ type: 'SET_CAMPO_MANUALE_ATTIVO', payload: { campo: 'motivo_reclamo', opzioni: guida.opzioni } })
        log(evento, 'GuidaFormAgent', 'OK')
      } catch (err) {
        log(evento, 'GuidaFormAgent', 'ERRORE')
        throw err
      }
      break
    }

    case 'UTENTE_BLOCCATO': {
      try {
        const testo = await soccorsoAgent(
          stato.form,
          stato.bolletta.estratta,
          stato.sessione.storicoInterazioni.map(i => i.testo)
        )
        dispatch({ type: 'ADD_INTERAZIONE', payload: { ruolo: 'agente', testo } })
        log(evento, 'SoccorsoAgent', 'OK')
      } catch (err) {
        log(evento, 'SoccorsoAgent', 'ERRORE')
        throw err
      }
      break
    }

    case 'FORM_COMPLETATO': {
      dispatch({ type: 'SET_COMPLETATO' })
      log(evento, '—', 'OK')
      break
    }

    default:
      throw new Error(`Evento non gestito: ${evento}`)
  }
}

export { reclamoAgent }
