import { createContext, useContext, useReducer } from 'react'

const initialState = {
  bolletta: {
    raw: null,
    estratta: null,
    riepilogo: null,
  },
  form: {
    campi: {
      nome_cognome: null,
      codice_cliente: null,
      codice_pod: null,
      periodo_contestato: null,
      importo_contestato: null,
      motivo_reclamo: null,
      note_aggiuntive: null,
    },
    campiAutomaticiCompilati: false,
    campoManualeAttivo: null,
    opzioniCampoAttivo: [],
    completato: false,
  },
  sessione: {
    storicoInterazioni: [],
    ultimoBloco: null,
  },
  output: {
    bozzaReclamo: null,
  },
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_BOLLETTA_RAW':
      return {
        ...state,
        bolletta: { ...state.bolletta, raw: action.payload },
      }

    case 'SET_BOLLETTA_ESTRATTA':
      return {
        ...state,
        bolletta: { ...state.bolletta, estratta: action.payload },
      }

    // payload: { intestatario, periodo, consumi, importo, scadenza }
    case 'SET_RIEPILOGO':
      return {
        ...state,
        bolletta: { ...state.bolletta, riepilogo: action.payload },
      }

    // payload: { nome_cognome, codice_cliente, codice_pod, periodo_contestato, importo_contestato }
    case 'SET_CAMPI_AUTOMATICI':
      return {
        ...state,
        form: {
          ...state.form,
          campi: { ...state.form.campi, ...action.payload },
          campiAutomaticiCompilati: true,
        },
      }

    // payload: { campo: string, valore: string }
    case 'SET_CAMPO_MANUALE':
      return {
        ...state,
        form: {
          ...state.form,
          campi: { ...state.form.campi, [action.payload.campo]: action.payload.valore },
        },
      }

    // payload: { campo: string, opzioni: string[] }
    case 'SET_CAMPO_MANUALE_ATTIVO':
      return {
        ...state,
        form: {
          ...state.form,
          campoManualeAttivo: action.payload.campo,
          opzioniCampoAttivo: action.payload.opzioni ?? [],
        },
      }

    // payload: { ruolo: 'utente'|'agente', testo: string }
    case 'ADD_INTERAZIONE':
      return {
        ...state,
        sessione: {
          ...state.sessione,
          storicoInterazioni: [...state.sessione.storicoInterazioni, action.payload],
          ultimoBloco: action.payload.testo,
        },
      }

    // payload: string — testo della bozza di reclamo
    case 'SET_RECLAMO':
      return {
        ...state,
        output: { bozzaReclamo: action.payload },
      }

    case 'SET_COMPLETATO':
      return {
        ...state,
        form: { ...state.form, completato: true },
      }

    default:
      throw new Error(`Action non gestita: ${action.type}`)
  }
}

const StateContext = createContext(null)
const DispatchContext = createContext(null)

export function BollettaProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useBollettaContext() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useBollettaContext deve essere usato dentro BollettaProvider')
  return ctx
}

export function useBollettaDispatch() {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useBollettaDispatch deve essere usato dentro BollettaProvider')
  return ctx
}
