# BollettaChiara — CLAUDE.md

## Cos'è questo progetto

BollettaChiara è un tool di accessibilità digitale costruito per un hackathon.
Aiuta persone anziane con bassa alfabetizzazione digitale a compilare un modulo
di reclamo per una bolletta elettrica.

L'utente tipo è **Maria, 68 anni**: sa usare WhatsApp ma si blocca davanti a form burocratici.

---

## Il prodotto in una frase

Un copilota che legge la bolletta di Maria, autocompila automaticamente i campi
del form di reclamo, e la guida solo sui campi che richiedono una sua scelta.

---

## Le due parti del prodotto

### Il form
Modulo di reclamo isolato e realistico, come se fosse il sito di un operatore
elettrico. Ha 7 campi. Maria lo compila.

### Il tool
Sta accanto al form. Non interpreta, non giudica, non fa considerazioni.
Mostra fatti e lascia decidere a Maria.

---

## Il flusso completo

```
1. Maria carica la bolletta PDF
2. EstrattoAgent legge il PDF → restituisce JSON strutturato
3. RiepilogoAgent mostra i dati essenziali in linguaggio semplice (schermata 2)
4. Maria sceglie di procedere con il reclamo
5. AutocompilaAgent compila automaticamente 5 campi del form ← momento wow
6. GuidaFormAgent mostra 3 opzioni per il motivo del reclamo
7. Maria sceglie un'opzione → form completo → Maria preme Invia
8. Opzionale: ReclamoAgent genera testo email da copiare
```

---

## Le schermate

```
Schermata 1 — Benvenuto
"Carica la tua bolletta e compilo il modulo di reclamo per te."
[ Carica bolletta ]

Schermata 2 — Riepilogo bolletta
Campi essenziali mostrati in modo neutro, nessuna interpretazione.
[ Procedi con il reclamo ] [ Ho solo una domanda ]

Schermata 3 — Form autocompilato ← momento wow della demo
Form isolato con 5 campi già compilati.
Tool a lato: "Ho compilato 5 campi per te. Manca solo il motivo del reclamo."
[ Non so cosa fare ]

Schermata 4 — Campo manuale guidato
Tool mostra 3 opzioni per il motivo del reclamo.
Maria sceglie. Il campo si compila. Form completo. Maria preme Invia.

Schermata 5 — Opzionale
"Vuoi anche il testo da mandare via email?"
[ Sì, generalo ] [ No, ho finito ]

Schermata 6 — Lettera (solo se richiesta)
Testo copiabile pronto da incollare.
```

---

## I campi del form

### Automatici — compilati dal tool senza intervento di Maria
| Campo | Fonte nella bolletta |
|---|---|
| Nome e cognome | intestatario |
| Codice cliente | codice_cliente |
| Codice POD | codice_pod |
| Periodo contestato | periodo_fatturazione |
| Importo contestato | importo_totale |

### Manuali — richiedono una scelta di Maria
| Campo | Come viene guidato |
|---|---|
| Motivo del reclamo | tool mostra 3 opzioni selezionabili |
| Note aggiuntive | campo libero, opzionale |

---

## Il JSON della bolletta fittizia

**Questo è il contratto tra tutti gli agenti. Non si cambia mai durante lo sviluppo.**

```json
{
  "codice_pod": "IT001E12345678",
  "codice_cliente": "7890123",
  "intestatario": "Maria Rossi",
  "indirizzo_fornitura": "Via Roma 14, Milano",
  "periodo_fatturazione": "01/03/2025 - 31/05/2025",
  "importo_totale": 487.32,
  "importo_periodo_precedente": 142.10,
  "consumi_kwh": 1240,
  "scadenza_pagamento": "15/07/2025"
}
```

---

## Il context condiviso

Tutti gli agenti leggono e scrivono su questo stato. Non aggiungere campi
senza aggiornare anche il reducer in BollettaContext.jsx.

```json
{
  "bolletta": {
    "raw": null,
    "estratta": null
  },
  "form": {
    "campi": {
      "nome_cognome": null,
      "codice_cliente": null,
      "codice_pod": null,
      "periodo_contestato": null,
      "importo_contestato": null,
      "motivo_reclamo": null,
      "note_aggiuntive": null
    },
    "campiAutomaticiCompilati": false,
    "campoManualeAttivo": null,
    "completato": false
  },
  "sessione": {
    "storicoInterazioni": [],
    "ultimoBloco": null
  },
  "output": {
    "bozzaReclamo": null
  }
}
```

---

## Gli agenti

### Architettura

```
ORCHESTRATORE
Riceve eventi, chiama il subagente giusto, aggiorna il context
        │
        ├── EstrattoAgent       INPUT: PDF base64 → OUTPUT: JSON bolletta
        ├── RiepilogoAgent      INPUT: JSON bolletta → OUTPUT: campi semplificati
        ├── AutocompilaAgent    INPUT: JSON bolletta + campi form → OUTPUT: mappa campo→valore
        ├── GuidaFormAgent      INPUT: JSON bolletta → OUTPUT: { opzioni: [...] }
        ├── SoccorsoAgent       INPUT: stato form + storico → OUTPUT: prossimo passo (2 frasi)
        └── ReclamoAgent        INPUT: form compilato + JSON bolletta → OUTPUT: testo email
```

### Eventi dell'orchestratore

| Evento | Agenti chiamati |
|---|---|
| BOLLETTA_CARICATA | EstrattoAgent → RiepilogoAgent |
| RECLAMO_AVVIATO | AutocompilaAgent → GuidaFormAgent |
| UTENTE_BLOCCATO | SoccorsoAgent |
| FORM_COMPLETATO | (opzionale) ReclamoAgent |

### Dispatch actions del context

| Action | Quando |
|---|---|
| SET_BOLLETTA_RAW | Maria carica il file |
| SET_BOLLETTA_ESTRATTA | EstrattoAgent completa |
| SET_CAMPI_AUTOMATICI | AutocompilaAgent completa |
| SET_CAMPO_MANUALE | Maria seleziona un'opzione |
| SET_CAMPO_MANUALE_ATTIVO | GuidaFormAgent restituisce le opzioni |
| ADD_INTERAZIONE | SoccorsoAgent risponde |
| SET_RECLAMO | ReclamoAgent completa |
| SET_COMPLETATO | Form inviato |

---

## Stack

- **Framework:** React + Vite
- **AI:** Claude API — model `claude-sonnet-4-6`
- **Styling:** CSS vanilla, nessuna libreria UI esterna
- **Architettura:** tutto client-side, nessun backend
- **PDF parsing:** bolletta passata a Claude come documento base64

---

## Struttura delle cartelle

```
/src
  /agents
    orchestratore.js          — riceve eventi, chiama subagenti, aggiorna context
    estratto-agent.js         — legge PDF, restituisce JSON bolletta
    riepilogo-agent.js        — semplifica JSON bolletta per schermata 2
    autocompila-agent.js      — mappa campi bolletta → campi form
    guida-form-agent.js       — genera 3 opzioni per il campo manuale
    soccorso-agent.js         — suggerisce prossimo passo quando Maria si blocca
    reclamo-agent.js          — genera testo email (opzionale)
  /components
    Benvenuto.jsx             — schermata 1: upload bolletta
    RiepilogoBolletta.jsx     — schermata 2: dati essenziali + scelta
    FormAutocompilato.jsx     — schermata 3+4: form + tool affiancati ← cuore del prodotto
    BozzaReclamo.jsx          — schermata 6: testo email copiabile (opzionale)
  /context
    BollettaContext.jsx       — stato condiviso tra tutti gli agenti
  /hooks
    useOrchestrator.js        — hook che espone i metodi ai componenti
  /data
    bolletta-esempio.json     — JSON della bolletta fittizia
    campi-form.js             — definizione struttura campi del form
  /prompts
    estratto.js
    riepilogo.js
    autocompila.js
    guida-form.js
    soccorso.js
    reclamo.js
App.jsx
main.jsx
```

---

## Regole di sviluppo

### Priorità assoluta
- **Un problema alla volta.** Mai chiedere più cose in un unico prompt.
- **Costruisci verticalmente.** Fai funzionare il flusso end-to-end con un campo
  solo prima di espandere. Una demo incompleta funzionante vale più di
  un'interfaccia perfetta che si blocca.
- **Testa ogni agente in isolamento** prima di collegarlo all'orchestratore.
- **Il context è sacro.** Se qualcosa non funziona, logga il context in console
  come prima cosa.

### UI — regole per Maria
- Font size minimo **18px** ovunque
- Bottoni alti almeno **48px**
- Colori ad alto contrasto
- Ogni schermata ha un **titolo** che dice dove si trova Maria
- Messaggi di loading chiari: *"Sto leggendo la tua bolletta, un momento..."*
- Errori in linguaggio semplice: *"Qualcosa non ha funzionato. Riprova."*
- Nessun elemento decorativo inutile
- I campi pre-compilati hanno sfondo **#f0f7ff** per distinguerli dai vuoti

### Il tool non deve mai
- Fare considerazioni sull'importo o sui consumi
- Suggerire se la bolletta è giusta o sbagliata
- Consigliare quale opzione scegliere tra le 3
- Usare termini tecnici senza spiegarli

---

## Must have / Nice to have

```
MUST HAVE — senza questo non c'è demo
□ Upload PDF → estrazione JSON
□ Schermata 2 — riepilogo neutro in linguaggio semplice
□ Form con 5 campi autocompilati ← momento wow
□ Campo manuale con 3 opzioni guidate
□ Form completabile

NICE TO HAVE — se avanza tempo
□ Bottone "Non so cosa fare" (SoccorsoAgent)
□ Campo note aggiuntive
□ Generazione testo email (ReclamoAgent)
□ Indicatore step "Passo X di Y"

TAGLIA SUBITO SE IL TEMPO STRINGE
□ ReclamoAgent
□ Animazioni
□ Gestione errori elegante
□ Mobile responsive
```

---

## Come usare questo file con Claude Code

All'inizio di ogni sessione di sviluppo:

1. Incolla l'intero contenuto di questo file come contesto
2. Aggiungi in fondo la fase specifica su cui stai lavorando

**Esempio:**
```
[contenuto CLAUDE.md]

---

Lavoriamo sulla Fase 5a: implementa estratto-agent.js.
Scrivi anche una funzione di test commentata con // TEST
che chiama l'agente con la bolletta demo e logga il risultato.
```

---

## Fasi di sviluppo in ordine

```
Fase 0 — Su carta: disegna schermate, definisci JSON, dividi il lavoro
Fase 1 — Scaffold: struttura cartelle, file vuoti con commenti
Fase 2 — Bolletta fittizia: HTML → PDF stampabile
Fase 3 — Context: BollettaContext.jsx con reducer e actions
Fase 4 — Prompt: scrivi e testa tutti i prompt in isolamento
Fase 5 — Agenti: uno alla volta, testa ognuno prima del successivo
          5a. EstrattoAgent
          5b. RiepilogoAgent
          5c. AutocompilaAgent
          5d. GuidaFormAgent
          5e. SoccorsoAgent
          5f. ReclamoAgent (opzionale)
Fase 6 — Orchestratore + useOrchestrator hook
Fase 7 — Componenti: uno alla volta nell'ordine del flusso
          7a. Benvenuto
          7b. RiepilogoBolletta
          7c. FormAutocompilato ← il più importante
          7d. BozzaReclamo (opzionale)
Fase 8 — Polish UI per Maria
Fase 9 — Demo + fix critici + pitch
```

---

## Flusso verticale minimo (costruiscilo per primo)

Prima di completare tutti i componenti, verifica che questo funzioni end-to-end:

```
Upload PDF
→ EstrattoAgent restituisce JSON corretto ✓
→ RiepilogoAgent restituisce campi semplici ✓
→ AutocompilaAgent compila i 5 campi ✓
→ GuidaFormAgent restituisce 3 opzioni ✓
→ Maria seleziona un'opzione ✓
→ Form segnato come completato ✓
```

Se questo funziona, hai già la demo.
