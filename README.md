# La Via dei Cannoli

Web app installabile su cellulare per votare e recensire i cannoli del viaggio.

## Avvio locale

```bash
npm install
npm run dev
```

Apri l'indirizzo mostrato da Vite sul telefono o sul computer.

## Uso senza backend

Senza Supabase, l'app funziona in locale con `localStorage`: voti, pasticcerie aggiunte e recensioni restano sul dispositivo.

## Sync automatico tra telefoni con Supabase

1. Crea un progetto su Supabase.
2. Crea le tabelle usando `supabase/schema.sql`.
3. Copia `.env.example` in `.env`.
4. Inserisci `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Riavvia `npm run dev`.

Con Supabase configurato, l'app:
- salva voti e nuove pasticcerie nel database;
- aggiorna automaticamente classifica e recensioni sugli altri telefoni;
- permette di aggiungere nuove pasticcerie durante il viaggio.

## Installazione su iPhone/Android

Apri la web app nel browser, poi:
- iPhone: Condividi → Aggiungi alla schermata Home.
- Android: Menu browser → Installa app / Aggiungi a schermata Home.

## Schermata iniziale

La home mostra:
- il migliore complessivo, calcolato come media di tutti i criteri e di tutti i votanti;
- il migliore per ciascuna voce: crosta, ricotta, pistacchio/topping, freschezza, effetto wow;
- per ogni vincitore di categoria viene indicata la media e il numero di votanti.

## Due pagine/classifiche

La home ha due viste:

- **Classifica gruppo**: usa tutti i voti salvati nel database.
- **Miei voti**: usa solo i voti inseriti con il nome votante salvato sul dispositivo.

Ogni vista mostra:
- migliore complessivo;
- migliore per crosta;
- migliore per ricotta;
- migliore per pistacchio/topping;
- migliore per freschezza;
- migliore per effetto wow.

## Collegamento a Supabase

Per attivare il database condiviso:

1. Crea un progetto Supabase.
2. Vai su **SQL Editor**.
3. Incolla ed esegui il contenuto di `supabase/schema.sql`.
4. Vai su **Project Settings → API**.
5. Copia:
   - Project URL
   - anon public key
6. Su Vercel, nel progetto, vai in **Settings → Environment Variables** e aggiungi:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Fai un nuovo deploy.

Senza queste variabili, l'app continua a funzionare in locale, ma ogni telefono vede solo i propri dati.
