import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Plus, Star, Trophy, MapPin, RefreshCw, PencilLine } from "lucide-react";
import "./styles.css";

const DEFAULT_BAKERIES = [
  {
    id: "capriccio-san-vito",
    name: "Pasticceria Capriccio",
    city: "San Vito Lo Capo",
    address: "Via Pier Santi Mattarella, 106",
    notes: "Cannolo classico e versione al pistacchio, anche senza glutine.",
    stop_order: 1
  },
  {
    id: "maria-grammatico-erice",
    name: "Maria Grammatico",
    city: "Erice",
    address: "Via Vittorio Emanuele, 14",
    notes: "Storica pasticceria nell’ex monastero. Cannolo + genovesi.",
    stop_order: 2
  },
  {
    id: "la-rinascente-trapani",
    name: "La Rinascente",
    city: "Trapani",
    address: "Via Gatti, 3",
    notes: "Cialda sottile, ricotta cremosa e mandorle pralinate.",
    stop_order: 3
  },
  {
    id: "colicchia-trapani",
    name: "Colicchia “Il re dei cannoli”",
    city: "Trapani",
    address: "Via delle Arti, 6/8",
    notes: "Tappa extra trapanese della Via dei Cannoli.",
    stop_order: 4
  },
  {
    id: "pasticceria-fc-favignana",
    name: "Pasticceria FC",
    city: "Favignana",
    address: "Via Giuseppe Garibaldi, 28",
    notes: "Cannoli giganti alla ricotta, anche senza glutine.",
    stop_order: 5
  },
  {
    id: "costa-palermo",
    name: "Pasticceria Costa / Spinnato",
    city: "Palermo",
    address: "Quattro Canti o zona Politeama",
    notes: "Tappa palermitana prima del gran finale.",
    stop_order: 6
  },
  {
    id: "cappello-santa-caterina",
    name: "Pasticceria Cappello / I Segreti del Chiostro",
    city: "Palermo",
    address: "Monastero di Santa Caterina",
    notes: "Gran finale: cannolo farcito al momento nel chiostro.",
    stop_order: 7
  }
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

function average(review) {
  return Number(((review.shell + review.ricotta + review.pistachio + review.freshness + review.wow) / 5).toFixed(2));
}

function bakeryAverage(bakeryId, reviews) {
  const list = reviews.filter((r) => r.bakery_id === bakeryId);
  if (!list.length) return null;
  return Number((list.reduce((sum, r) => sum + average(r), 0) / list.length).toFixed(2));
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9àèéìòù]+/gi, "-").replace(/^-|-$/g, "");
}

function App() {
  const [bakeries, setBakeries] = useState(() => storage.get("bakeries", DEFAULT_BAKERIES));
  const [reviews, setReviews] = useState(() => storage.get("reviews", []));
  const [activeBakery, setActiveBakery] = useState(null);
  const [showAddBakery, setShowAddBakery] = useState(false);
  const [syncStatus, setSyncStatus] = useState(supabase ? "sync pronto" : "solo locale");

  async function loadRemote() {
    if (!supabase) return;
    setSyncStatus("aggiornamento...");
    const [{ data: remoteBakeries, error: bErr }, { data: remoteReviews, error: rErr }] = await Promise.all([
      supabase.from("bakeries").select("*").order("stop_order", { ascending: true }),
      supabase.from("reviews").select("*").order("created_at", { ascending: false })
    ]);

    if (bErr || rErr) {
      setSyncStatus("sync non riuscito");
      return;
    }

    const mergedBakeries = remoteBakeries?.length ? remoteBakeries : DEFAULT_BAKERIES;
    setBakeries(mergedBakeries);
    setReviews(remoteReviews ?? []);
    storage.set("bakeries", mergedBakeries);
    storage.set("reviews", remoteReviews ?? []);
    setSyncStatus("aggiornato");
  }

  useEffect(() => {
    loadRemote();

    if (!supabase) return;
    const channel = supabase
      .channel("cannoli-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, loadRemote)
      .on("postgres_changes", { event: "*", schema: "public", table: "bakeries" }, loadRemote)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => storage.set("bakeries", bakeries), [bakeries]);
  useEffect(() => storage.set("reviews", reviews), [reviews]);

  const leaderboard = useMemo(() => {
    return bakeries
      .map((b) => ({ ...b, avg: bakeryAverage(b.id, reviews), count: reviews.filter((r) => r.bakery_id === b.id).length }))
      .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  }, [bakeries, reviews]);

  const bestBy = (field) => {
    const scored = bakeries.map((b) => {
      const list = reviews.filter((r) => r.bakery_id === b.id);
      if (!list.length) return null;
      return { bakery: b, score: Number((list.reduce((s, r) => s + r[field], 0) / list.length).toFixed(2)) };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    return scored[0];
  };

  async function addBakery(payload) {
    const bakery = {
      id: `${slugify(payload.name)}-${Date.now()}`,
      name: payload.name,
      city: payload.city,
      address: payload.address,
      notes: payload.notes,
      stop_order: bakeries.length + 1
    };

    if (supabase) {
      const { error } = await supabase.from("bakeries").insert(bakery);
      if (error) {
        alert("Non sono riuscita a salvare la pasticceria online. La salvo in locale.");
      }
    }

    setBakeries((current) => [...current, bakery]);
    setShowAddBakery(false);
  }

  async function addReview(payload) {
    const review = {
      bakery_id: payload.bakery_id,
      reviewer: payload.reviewer,
      shell: Number(payload.shell),
      ricotta: Number(payload.ricotta),
      pistachio: Number(payload.pistachio),
      freshness: Number(payload.freshness),
      wow: Number(payload.wow),
      notes: payload.notes,
      photo_url: payload.photo_url || null,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase.from("reviews").insert(review).select().single();
      if (!error && data) {
        setReviews((current) => [data, ...current]);
      } else {
        alert("Non sono riuscita a salvare online. Salvo in locale.");
        setReviews((current) => [{ ...review, id: crypto.randomUUID() }, ...current]);
      }
    } else {
      setReviews((current) => [{ ...review, id: crypto.randomUUID() }, ...current]);
    }

    setActiveBakery(null);
  }

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">Sicilia 2026</p>
          <h1>La Via dei Cannoli</h1>
          <p>Vota crosta, ricotta, pistacchio, freschezza ed effetto wow. Aggiungi nuove pasticcerie quando ne scoprite una.</p>
        </div>
        <button className="sync" onClick={loadRemote}>
          <RefreshCw size={16} /> {syncStatus}
        </button>
      </header>

      <section className="panel winner">
        <Trophy />
        <div>
          <span>Classifica provvisoria</span>
          <strong>{leaderboard[0]?.avg ? `${leaderboard[0].name} · ${leaderboard[0].avg}/10` : "Ancora nessun voto"}</strong>
        </div>
      </section>

      <section className="grid stats">
        <MiniStat title="Miglior crosta" item={bestBy("shell")} />
        <MiniStat title="Miglior ricotta" item={bestBy("ricotta")} />
        <MiniStat title="Miglior wow" item={bestBy("wow")} />
      </section>

      <div className="section-title">
        <h2>Tappe e pasticcerie</h2>
        <button onClick={() => setShowAddBakery(true)}><Plus size={16} /> Aggiungi</button>
      </div>

      <section className="cards">
        {leaderboard.map((b, index) => {
          const score = bakeryAverage(b.id, reviews);
          return (
            <article className="card" key={b.id}>
              <div className="rank">#{index + 1}</div>
              <div className="card-content">
                <h3>{b.name}</h3>
                <p className="place"><MapPin size={14} /> {b.city}{b.address ? ` · ${b.address}` : ""}</p>
                <p>{b.notes}</p>
                <div className="meta">
                  <span><Star size={14} /> {score ? `${score}/10` : "non votato"}</span>
                  <span>{b.count} recensioni</span>
                </div>
              </div>
              <button onClick={() => setActiveBakery(b)}><PencilLine size={16} /> Vota</button>
            </article>
          );
        })}
      </section>

      <section className="panel">
        <h2>Ultime recensioni</h2>
        {reviews.length === 0 && <p>Nessuna recensione ancora. Primo cannolo, primo voto.</p>}
        {reviews.slice(0, 8).map((r) => {
          const bakery = bakeries.find((b) => b.id === r.bakery_id);
          return (
            <div className="review" key={r.id}>
              <strong>{bakery?.name ?? "Pasticceria"} · {average(r)}/10</strong>
              <span>{r.reviewer}</span>
              {r.notes && <p>{r.notes}</p>}
            </div>
          );
        })}
      </section>

      {activeBakery && <ReviewModal bakery={activeBakery} onClose={() => setActiveBakery(null)} onSave={addReview} />}
      {showAddBakery && <BakeryModal onClose={() => setShowAddBakery(false)} onSave={addBakery} />}
    </main>
  );
}

function MiniStat({ title, item }) {
  return (
    <div className="panel mini">
      <span>{title}</span>
      <strong>{item ? `${item.bakery.name} · ${item.score}` : "—"}</strong>
    </div>
  );
}

function RatingInput({ label, name, value, onChange }) {
  return (
    <label className="rating">
      <span>{label}</span>
      <input type="range" min="1" max="10" name={name} value={value} onChange={onChange} />
      <b>{value}</b>
    </label>
  );
}

function ReviewModal({ bakery, onClose, onSave }) {
  const [form, setForm] = useState({
    reviewer: "",
    shell: 8,
    ricotta: 8,
    pistachio: 8,
    freshness: 8,
    wow: 8,
    notes: "",
    photo_url: ""
  });

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="modal">
      <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, bakery_id: bakery.id }); }}>
        <h2>Vota {bakery.name}</h2>
        <input required name="reviewer" placeholder="Nome di chi vota" value={form.reviewer} onChange={update} />
        <RatingInput label="Crosta" name="shell" value={form.shell} onChange={update} />
        <RatingInput label="Ricotta" name="ricotta" value={form.ricotta} onChange={update} />
        <RatingInput label="Pistacchio/topping" name="pistachio" value={form.pistachio} onChange={update} />
        <RatingInput label="Freschezza" name="freshness" value={form.freshness} onChange={update} />
        <RatingInput label="Effetto wow" name="wow" value={form.wow} onChange={update} />
        <textarea name="notes" placeholder="Note: troppo dolce, ricotta spettacolare, cialda moscia..." value={form.notes} onChange={update} />
        <input name="photo_url" placeholder="URL foto opzionale" value={form.photo_url} onChange={update} />
        <div className="actions">
          <button type="button" className="secondary" onClick={onClose}>Annulla</button>
          <button>Salva voto</button>
        </div>
      </form>
    </div>
  );
}

function BakeryModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", city: "", address: "", notes: "" });
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="modal">
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <h2>Aggiungi pasticceria</h2>
        <input required name="name" placeholder="Nome pasticceria" value={form.name} onChange={update} />
        <input required name="city" placeholder="Città" value={form.city} onChange={update} />
        <input name="address" placeholder="Indirizzo" value={form.address} onChange={update} />
        <textarea name="notes" placeholder="Cosa provare / note" value={form.notes} onChange={update} />
        <div className="actions">
          <button type="button" className="secondary" onClick={onClose}>Annulla</button>
          <button>Aggiungi</button>
        </div>
      </form>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
