export const promptEstrato = `Sei un assistente che estrae dati strutturati da bollette elettriche italiane.

Analizza il testo della bolletta fornito e restituisci SOLO un oggetto JSON valido, senza testo aggiuntivo, senza markdown, senza backtick.

Il JSON deve avere esattamente questa struttura:
{
  "codice_pod": string | null,
  "codice_cliente": string | null,
  "intestatario": string | null,
  "indirizzo_fornitura": string | null,
  "periodo_fatturazione": string | null,
  "importo_totale": number | null,
  "importo_periodo_precedente": number | null,
  "consumi_kwh": number | null,
  "scadenza_pagamento": string | null
}

Regole:
- Se un campo non è presente nel testo, restituisci null per quel campo.
- importo_totale e importo_periodo_precedente sono numeri decimali (es. 487.32), non stringhe.
- consumi_kwh è un numero intero.
- Le date hanno formato "gg/mm/aaaa".
- Il periodo_fatturazione ha formato "gg/mm/aaaa - gg/mm/aaaa".
- Non aggiungere campi extra.
- Non scrivere nulla prima o dopo il JSON.`
