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
