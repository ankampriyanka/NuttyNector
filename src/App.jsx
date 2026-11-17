import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const initialRates = {
  Almonds: 1360, Cashews: 1490, Walnuts: 2300, Pistachios: 3800,
  "Pumpkin seeds": 990, "Sunflower seeds": 680, Cranberries: 990,
  Blueberries: 2350, Honey: 800
};
const line = (ingredient, qty, unit = "g") => ({ ingredient, qty, unit });
const initialProducts = [
  { id: 1, name: "Almond Nector Crunch", collection: "Golden Collection", method: "Honey roasted & tossed", note: "200 g almonds + 3 tbsp honey (assumed 45 ml)", lines: [line("Almonds",200), line("Honey",45,"ml")] },
  { id: 2, name: "Cashew Nector Crunch", collection: "Golden Collection", method: "Honey roasted & tossed", note: "200 g cashews + 3 tbsp honey (assumed 45 ml)", lines: [line("Cashews",200), line("Honey",45,"ml")] },
  { id: 3, name: "Walnut Nector Crunch", collection: "Golden Collection", method: "Honey roasted & tossed", note: "200 g walnuts + 3 tbsp honey (assumed 45 ml)", lines: [line("Walnuts",200), line("Honey",45,"ml")] },
  { id: 4, name: "Nector Medley Jar", collection: "Golden Collection", method: "Honey blend", note: "Honey is specified as 80 ml; nut and seed quantities are not yet supplied.", lines: [line("Almonds",0), line("Cashews",0), line("Pumpkin seeds",0), line("Sunflower seeds",0), line("Honey",80,"ml")] },
  { id: 5, name: "Golden Bliss Jar – Almond", collection: "Golden Collection", method: "Honey immersed", note: "40 g almonds + 170 g honey", lines: [line("Almonds",40), line("Honey",170)] },
  { id: 6, name: "Golden Bliss Jar – Cashew", collection: "Golden Collection", method: "Honey immersed", note: "40 g cashews + 170 g honey", lines: [line("Cashews",40), line("Honey",170)] },
  { id: 7, name: "Golden Bliss Jar – Walnut", collection: "Golden Collection", method: "Honey immersed", note: "Your table says 40 g cashew although the product is named Walnut. Confirm before treating this as final.", lines: [line("Cashews",40), line("Honey",170)] },
  { id: 8, name: "Nector Premium", collection: "Golden Collection", method: "Honey immersed", note: "50 g almonds + 50 g walnuts + 50 g cranberries + 50 ml honey", lines: [line("Almonds",50), line("Walnuts",50), line("Cranberries",50), line("Honey",50,"ml")] },
  { id: 9, name: "Nector Royal", collection: "Golden Collection", method: "Honey immersed", note: "Ingredients and quantities conflict: listed ingredients include pista and blueberry, while quantities specify walnut and omit both.", lines: [line("Almonds",50), line("Walnuts",50), line("Cranberries",50), line("Pistachios",0), line("Blueberries",0), line("Honey",50,"ml")] }
];
const defaults = {
  rates: initialRates, products: initialProducts,
  overhead: { jar: 50, label: 8, logisticsBatch: 500, batchSize: 20, labourHour: 350, labourHours: 1, margin: 40, honeyDensity: 1.4 }
};
const money = n => "₹" + (Number.isFinite(n) ? n.toFixed(2) : "0.00");
function App() {
  const [data, setData] = useState(() => {
    try { const saved = localStorage.getItem("nutty-nectar-pricing-v1"); return saved ? JSON.parse(saved) : defaults; }
    catch { return defaults; }
  });
  const [tab, setTab] = useState("products");
  useEffect(() => { localStorage.setItem("nutty-nectar-pricing-v1", JSON.stringify(data)); }, [data]);
  const update = (fn) => setData(old => fn(structuredClone(old)));
  const costs = useMemo(() => data.products.map(p => {
    let ingredientCost = 0, missing = [];
    p.lines.forEach(x => {
      const qty = Number(x.qty) || 0;
      if (!qty) { if (x.ingredient !== "Honey" || p.id === 4 || p.id === 9) missing.push(x.ingredient); return; }
      const grams = x.unit === "ml" ? qty * Number(data.overhead.honeyDensity) : qty;
      ingredientCost += grams * (Number(data.rates[x.ingredient]) || 0) / 1000;
    });
    const overhead = Number(data.overhead.jar) + Number(data.overhead.label) +
      (Number(data.overhead.logisticsBatch) / Math.max(1, Number(data.overhead.batchSize))) +
      (Number(data.overhead.labourHour) * Number(data.overhead.labourHours) / Math.max(1, Number(data.overhead.batchSize)));
    const total = ingredientCost + overhead;
    const margin = Math.min(95, Math.max(0, Number(data.overhead.margin) || 0));
    const price = total / (1 - margin / 100);
    return { id:p.id, ingredientCost, overhead, total, price, suggested: Math.ceil(price/10)*10, missing };
  }), [data]);
  const changeProduct = (id, key, value) => update(d => { const p=d.products.find(x=>x.id===id); p[key]=value; return d; });
  const changeLine = (id, idx, key, value) => update(d => { const p=d.products.find(x=>x.id===id); p.lines[idx][key]=key==="qty" ? (value==="" ? "" : Number(value)) : value; return d; });
  const changeRate = (name, value) => update(d => { d.rates[name]=Number(value)||0; return d; });
  const changeOverhead = (name, value) => update(d => { d.overhead[name]=Number(value)||0; return d; });
  const reset = () => { if (confirm("Reset all prices, recipes and assumptions to the original Nutty Nectar starting values?")) setData(defaults); };
  return <div className="app-shell">
    <header className="topbar"><div className="brand-mark">N<span>✦</span></div><div><div className="brand">NUTTY NECTAR</div><div className="tagline">SWEET. SPICY. CRUNCHY. YOURS.</div></div><div className="top-note">OWNER PRICING TOOL</div></header>
    <main>
      <section className="hero"><p className="eyebrow">SMALL BUSINESS CONTROL CENTRE</p><h1>Your recipes.<br/><em>Your prices.</em></h1><p>Update ingredient rates and recipe quantities to instantly recalculate your jar cost and suggested selling price.</p><div className="hero-chips"><span>● Live costing</span><span>● Mobile friendly</span><span>● Auto-saved on this device</span></div></section>
      <nav className="tabs"><button className={tab==="products"?"active":""} onClick={()=>setTab("products")}>Products & prices</button><button className={tab==="rates"?"active":""} onClick={()=>setTab("rates")}>Ingredient rates</button><button className={tab==="overhead"?"active":""} onClick={()=>setTab("overhead")}>Business costs</button></nav>
      {tab==="products" && <section className="product-list">
        <div className="section-head"><div><p className="eyebrow">NINE VARIETIES</p><h2>Product costing</h2></div><span className="hint">Tap any quantity to edit</span></div>
        {data.products.map((p,i) => { const c=costs[i]; return <article className="product-card" key={p.id}>
          <div className="product-head"><div><span className="product-index">0{p.id}</span><div className="product-name">{p.name}</div><div className="product-method">{p.method}</div></div><div className="price-pill"><small>Suggested price</small><strong>{money(c.suggested)}</strong></div></div>
          <label className="field-label">Product name</label><input className="name-input" value={p.name} onChange={e=>changeProduct(p.id,"name",e.target.value)}/>
          <div className="recipe-head"><span>INGREDIENT</span><span>QUANTITY</span><span>UNIT</span><span>COST</span></div>
          {p.lines.map((x,j)=> { const grams=x.unit==="ml" ? (Number(x.qty)||0)*Number(data.overhead.honeyDensity) : Number(x.qty)||0; const cost=grams*(Number(data.rates[x.ingredient])||0)/1000; return <div className="recipe-row" key={j}>
            <select value={x.ingredient} onChange={e=>changeLine(p.id,j,"ingredient",e.target.value)}>{Object.keys(data.rates).map(k=><option key={k}>{k}</option>)}</select>
            <input type="number" min="0" step="1" value={x.qty} onChange={e=>changeLine(p.id,j,"qty",e.target.value)} />
            <select value={x.unit} onChange={e=>changeLine(p.id,j,"unit",e.target.value)}><option value="g">g</option><option value="ml">ml</option></select>
            <span className="line-cost">{money(cost)}</span>
          </div>; })}
          <div className="cost-summary"><div><small>Ingredients</small><b>{money(c.ingredientCost)}</b></div><div><small>Overheads</small><b>{money(c.overhead)}</b></div><div><small>Full unit cost</small><b>{money(c.total)}</b></div></div>
          <div className="price-footer"><span>Target margin {data.overhead.margin}%</span><strong>Suggested MRP {money(c.suggested)}</strong></div>
          {p.note && <p className="note">{p.note}</p>}
        </article>; })}
      </section>}
      {tab==="rates" && <section className="panel"><p className="eyebrow">PURCHASE INPUTS</p><h2>Ingredient master</h2><p className="muted">Change a supplier rate per kilogram. Every product cost and suggested price updates immediately.</p><div className="rate-grid">{Object.entries(data.rates).map(([name,rate])=><label className="rate-row" key={name}><span>{name}</span><div><span>₹</span><input type="number" min="0" value={rate} onChange={e=>changeRate(name,e.target.value)}/><small>/ kg</small></div></label>)}</div></section>}
      {tab==="overhead" && <section className="panel"><p className="eyebrow">RUNNING THE BUSINESS</p><h2>Unit cost assumptions</h2><p className="muted">These are editable starting assumptions from your earlier costing sheet. Replace them with actual supplier and production costs.</p><div className="rate-grid">
        {[["jar","Jar / bottle cost (₹)"],["label","Label & printing per jar (₹)"],["logisticsBatch","Logistics per batch (₹)"],["batchSize","Jars produced per batch"],["labourHour","Labour cost per hour (₹)"],["labourHours","Labour hours per batch"],["margin","Target gross margin (%)"],["honeyDensity","Honey density (g/ml)"]].map(([key,label])=><label className="rate-row" key={key}><span>{label}</span><input type="number" min="0" step="0.1" value={data.overhead[key]} onChange={e=>changeOverhead(key,e.target.value)}/></label>)}
      </div><div className="assumption-warning">Current defaults: ₹50 jar + ₹8 label, ₹500 logistics / 20 jars, 1 labour hour at ₹350, 40% gross margin. These assumptions may not match your final bottle or production setup.</div></section>}
      <section className="actions"><button className="secondary" onClick={()=>window.print()}>Print price summary</button><button className="text-button" onClick={reset}>Reset starting data</button></section>
      <footer><div className="brand">NUTTY NECTAR</div><p>Private business calculator · Your edits stay in this browser on this device.</p><p className="tiny">Important: 120 ml is a volume measurement, not a net weight. Confirm each filled recipe physically before fixing label weights or publishing prices. Honey density is an estimate for costing only.</p></footer>
    </main>
  </div>;
}
export default App;
