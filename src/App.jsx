import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const starter = {
  ingredients: [
    { id: 1, name: "Almonds", rate: 1360, purchaseUnit: "kg", useUnit: "g" },
    { id: 2, name: "Cashews", rate: 1490, purchaseUnit: "kg", useUnit: "g" },
    { id: 3, name: "Walnuts", rate: 2300, purchaseUnit: "kg", useUnit: "g" },
    { id: 4, name: "Pistachios", rate: 3800, purchaseUnit: "kg", useUnit: "g" },
    { id: 5, name: "Honey", rate: 800, purchaseUnit: "kg", useUnit: "g" },
    { id: 6, name: "Cranberries", rate: 990, purchaseUnit: "kg", useUnit: "g" },
    { id: 7, name: "Blueberries", rate: 2350, purchaseUnit: "kg", useUnit: "g" },
    { id: 8, name: "Packaging jar", rate: 50, purchaseUnit: "piece", useUnit: "piece" }
  ],
  overheads: [
    { id: 1, name: "Label & printing", amount: 8, basis: "per item" },
    { id: 2, name: "Logistics", amount: 500, basis: "per batch" },
    { id: 3, name: "Labour", amount: 350, basis: "per batch" }
  ],
  batchSize: 20,
  margin: 25,
  rounding: 10,
  products: [
    { id: 1, name: "Almond Nector Crunch", sku: "NN-001", lines: [{ ingredientId: 1, qty: 200, unit: "g" }, { ingredientId: 5, qty: 63, unit: "g" }, { ingredientId: 8, qty: 1, unit: "piece" }] },
    { id: 2, name: "Cashew Nector Crunch", sku: "NN-002", lines: [{ ingredientId: 2, qty: 200, unit: "g" }, { ingredientId: 5, qty: 63, unit: "g" }, { ingredientId: 8, qty: 1, unit: "piece" }] }
  ]
};
const uid = () => Date.now() + Math.floor(Math.random() * 1000);
const money = n => "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const unitCost = (item, qty) => {
  const divisor = item.purchaseUnit === "kg" || item.purchaseUnit === "litre" ? 1000 : 1;
  return (Number(item.rate) || 0) * (Number(qty) || 0) / divisor;
};
function App() {
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nector-onestop-v1")) || starter; } catch { return starter; }
  });
  const [tab, setTab] = useState("calculator");
  const [newIngredient, setNewIngredient] = useState({ name: "", rate: "", purchaseUnit: "kg", useUnit: "g" });
  const [newProduct, setNewProduct] = useState("");
  useEffect(() => { localStorage.setItem("nector-onestop-v1", JSON.stringify(data)); }, [data]);
  const update = fn => setData(old => fn(structuredClone(old)));
  const ingredient = id => data.ingredients.find(x => x.id === Number(id));
  const costs = useMemo(() => data.products.map(p => {
    const ingredientTotal = p.lines.reduce((sum, l) => {
      const item = data.ingredients.find(x => x.id === Number(l.ingredientId));
      return sum + (item ? unitCost(item, l.qty) : 0);
    }, 0);
    const overheadPerItem = data.overheads.reduce((sum, h) => sum + (Number(h.amount) || 0) / (h.basis === "per batch" ? Math.max(1, Number(data.batchSize) || 1) : 1), 0);
    const total = ingredientTotal + overheadPerItem;
    const margin = Math.min(95, Math.max(0, Number(data.margin) || 0));
    const exact = total / (1 - margin / 100);
    const rounded = Math.ceil(exact / Math.max(1, Number(data.rounding) || 1)) * Math.max(1, Number(data.rounding) || 1);
    return { ingredientTotal, overheadPerItem, total, exact, rounded, grossProfit: rounded - total, actualMargin: rounded ? (rounded - total) / rounded * 100 : 0 };
  }), [data]);
  const changeProduct = (id, key, value) => update(d => { const p=d.products.find(x=>x.id===id); p[key]=value; return d; });
  const changeLine = (pid, idx, key, value) => update(d => { const p=d.products.find(x=>x.id===pid); p.lines[idx][key]=key==="qty" ? (value === "" ? "" : Number(value)) : Number(value); return d; });
  const addLine = pid => update(d => { const p=d.products.find(x=>x.id===pid); p.lines.push({ ingredientId:d.ingredients[0]?.id || 0, qty:0, unit:d.ingredients[0]?.useUnit || "g" }); return d; });
  const removeLine = (pid, idx) => update(d => { d.products.find(x=>x.id===pid).lines.splice(idx,1); return d; });
  const addProduct = () => { if (!newProduct.trim()) return; update(d => { d.products.push({ id:uid(), name:newProduct.trim(), sku:"", lines:[] }); return d; }); setNewProduct(""); };
  const addIngredient = () => { if (!newIngredient.name.trim() || newIngredient.rate === "") return; update(d => { d.ingredients.push({ id:uid(), ...newIngredient, rate:Number(newIngredient.rate) }); return d; }); setNewIngredient({ name:"", rate:"", purchaseUnit:"kg", useUnit:"g" }); };
  const updateIngredient = (id,key,value) => update(d => { const x=d.ingredients.find(i=>i.id===id); x[key]=key==="rate" ? Number(value)||0 : value; return d; });
  const addOverhead = () => update(d => { d.overheads.push({ id:uid(), name:"New overhead", amount:0, basis:"per item" }); return d; });
  const updateOverhead = (id,key,value) => update(d => { const x=d.overheads.find(i=>i.id===id); x[key]=key==="amount" ? Number(value)||0 : value; return d; });
  const exportCsv = () => {
    const rows = [["Product","Ingredient cost","Overhead per item","Total unit cost","Target margin %","Suggested selling price","Rounded gross margin %"]];
    data.products.forEach((p,i)=>rows.push([p.name,costs[i].ingredientTotal.toFixed(2),costs[i].overheadPerItem.toFixed(2),costs[i].total.toFixed(2),data.margin,costs[i].rounded.toFixed(2),costs[i].actualMargin.toFixed(2)]));
    const csv = rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="nector-pricing-summary.csv"; a.click(); URL.revokeObjectURL(a.href);
  };
  const reset = () => { if (window.confirm("Restore the starter data? Your current browser data will be replaced.")) setData(structuredClone(starter)); };
  return <div className="shell">
    <header className="topbar"><div className="logo">N<span>✦</span></div><div><div className="brand">NECTOR ONESTOP</div><div className="tagline">GROCERY • RECIPE • COST • PRICE</div></div><span className="private">PRIVATE BUSINESS TOOL</span></header>
    <main>
      <section className="hero"><div className="eyebrow">YOUR EVERYDAY COSTING COUNTER</div><h1>Know your cost.<br/><em>Set your price.</em></h1><p>Add any product, enter the ingredients and quantities, update supplier rates and overheads. Your unit cost and selling price recalculate instantly.</p><div className="chips"><span>Live calculator</span><span>Editable grocery list</span><span>Auto-saved on this device</span></div></section>
      <nav className="tabs">{[["calculator","Product calculator"],["ingredients","Grocery / ingredients"],["overheads","Overheads & margin"]].map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</nav>
      {tab==="calculator" && <section>
        <div className="section-title"><div><div className="eyebrow">PRODUCT WORKSHEET</div><h2>Cost & selling price</h2></div><button className="gold-btn" onClick={addProduct}>＋ Add product</button></div>
        <div className="new-product"><input value={newProduct} onChange={e=>setNewProduct(e.target.value)} placeholder="Enter a new product name"/><button onClick={addProduct}>Create</button></div>
        <div className="summary-strip"><div><small>Products</small><b>{data.products.length}</b></div><div><small>Target gross margin</small><b>{data.margin}%</b></div><div><small>Batch size</small><b>{data.batchSize} units</b></div></div>
        {data.products.map((p,i)=>{const c=costs[i];return <article className="product" key={p.id}>
          <div className="product-top"><div className="product-title"><span className="sku">{p.sku || "NEW ITEM"}</span><input value={p.name} onChange={e=>changeProduct(p.id,"name",e.target.value)} aria-label="Product name"/></div><div className="price"><small>SELLING PRICE</small><strong>{money(c.rounded)}</strong></div></div>
          <div className="line-heading"><span>GROCERY ITEM</span><span>QTY</span><span>UNIT</span><span>LINE COST</span><span></span></div>
          {p.lines.map((l,j)=>{const item=ingredient(l.ingredientId);return <div className="line" key={j}>
            <select value={l.ingredientId} onChange={e=>changeLine(p.id,j,"ingredientId",e.target.value)}>{data.ingredients.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <input type="number" min="0" step="any" value={l.qty} onChange={e=>changeLine(p.id,j,"qty",e.target.value)}/>
            <span className="unit">{item?.useUnit || "—"}</span><b>{money(item?unitCost(item,l.qty):0)}</b><button className="remove" onClick={()=>removeLine(p.id,j)}>×</button>
          </div>;})}
          <div className="product-actions"><button onClick={()=>addLine(p.id)}>＋ Add grocery item</button><button className="delete" onClick={()=>update(d=>{d.products=d.products.filter(x=>x.id!==p.id);return d;})}>Remove product</button></div>
          <div className="totals"><div><small>Ingredient cost</small><b>{money(c.ingredientTotal)}</b></div><div><small>Overhead / unit</small><b>{money(c.overheadPerItem)}</b></div><div><small>Full unit cost</small><b>{money(c.total)}</b></div><div className="highlight"><small>Gross profit / unit</small><b>{money(c.grossProfit)}</b></div></div>
          <div className="bottom-price"><span>Target margin {data.margin}% · Rounded to nearest ₹{data.rounding} upward</span><strong>Recommended price {money(c.rounded)}</strong><small>Actual margin after rounding: {c.actualMargin.toFixed(1)}%</small></div>
        </article>;})}
        <div className="actions"><button className="gold-btn" onClick={exportCsv}>Export price summary (CSV)</button><button className="plain" onClick={()=>window.print()}>Print</button></div>
      </section>}
      {tab==="ingredients" && <section className="panel"><div className="eyebrow">GROCERY MASTER</div><h2>Items & purchase rates</h2><p className="muted">Maintain your grocery list here. Rates are entered per kg, litre or piece; recipe quantities use g, ml or piece.</p>
        <div className="ingredient-table"><div className="table-head"><span>ITEM</span><span>PURCHASE RATE (₹)</span><span>BUY UNIT</span><span>RECIPE UNIT</span></div>
          {data.ingredients.map(x=><div className="ingredient-row" key={x.id}><input value={x.name} onChange={e=>updateIngredient(x.id,"name",e.target.value)}/><input type="number" min="0" value={x.rate} onChange={e=>updateIngredient(x.id,"rate",e.target.value)}/><select value={x.purchaseUnit} onChange={e=>updateIngredient(x.id,"purchaseUnit",e.target.value)}><option value="kg">per kg</option><option value="litre">per litre</option><option value="piece">per piece</option></select><select value={x.useUnit} onChange={e=>updateIngredient(x.id,"useUnit",e.target.value)}><option value="g">g</option><option value="ml">ml</option><option value="piece">piece</option></select></div>)}
        </div>
        <div className="add-ingredient"><h3>Add a grocery item</h3><div className="add-grid"><input placeholder="Item name" value={newIngredient.name} onChange={e=>setNewIngredient({...newIngredient,name:e.target.value})}/><input type="number" placeholder="Purchase rate ₹" value={newIngredient.rate} onChange={e=>setNewIngredient({...newIngredient,rate:e.target.value})}/><select value={newIngredient.purchaseUnit} onChange={e=>setNewIngredient({...newIngredient,purchaseUnit:e.target.value,useUnit:e.target.value==="kg"?"g":e.target.value==="litre"?"ml":"piece"})}><option value="kg">per kg</option><option value="litre">per litre</option><option value="piece">per piece</option></select><button onClick={addIngredient}>＋ Add item</button></div></div>
      </section>}
      {tab==="overheads" && <section className="panel"><div className="eyebrow">BUSINESS COST SETTINGS</div><h2>Overheads & margin</h2><p className="muted">Add packaging, labour, transport, utilities, platform fees or any other cost. Choose whether the amount applies per item or per production batch.</p>
        <label className="setting"><span>Units produced in one batch</span><input type="number" min="1" value={data.batchSize} onChange={e=>update(d=>{d.batchSize=Math.max(1,Number(e.target.value)||1);return d;})}/></label>
        <label className="setting"><span>Target gross margin (%)</span><input type="number" min="0" max="95" value={data.margin} onChange={e=>update(d=>{d.margin=Math.min(95,Math.max(0,Number(e.target.value)||0));return d;})}/></label>
        <label className="setting"><span>Price rounding (₹)</span><select value={data.rounding} onChange={e=>update(d=>{d.rounding=Number(e.target.value);return d;})}><option value="1">₹1</option><option value="5">₹5</option><option value="10">₹10</option><option value="50">₹50</option></select></label>
        <div className="overhead-list">{data.overheads.map(h=><div className="overhead-row" key={h.id}><input value={h.name} onChange={e=>updateOverhead(h.id,"name",e.target.value)}/><span>₹</span><input type="number" min="0" value={h.amount} onChange={e=>updateOverhead(h.id,"amount",e.target.value)}/><select value={h.basis} onChange={e=>updateOverhead(h.id,"basis",e.target.value)}><option value="per item">per item</option><option value="per batch">per batch</option></select><button className="remove" onClick={()=>update(d=>{d.overheads=d.overheads.filter(x=>x.id!==h.id);return d;})}>×</button></div>)}</div>
        <button className="gold-btn" onClick={addOverhead}>＋ Add overhead</button>
        <div className="formula"><b>Pricing formula</b><p>Selling price = (ingredient cost + overhead per unit) ÷ (1 − target gross margin)</p><small>Gross margin is calculated on selling price, not as a markup on cost.</small></div>
      </section>}
      <footer><div className="brand">NECTOR ONESTOP</div><p>Grocery-to-selling-price calculator · Private workspace</p><p className="tiny">Your edits are saved in this browser on this device. This version does not sync across devices or users. For liquids, use a matching purchase and recipe unit (litre → ml); do not mix incompatible units. Review supplier rates and actual production costs before finalising prices.</p><button className="plain" onClick={reset}>Reset starter data</button></footer>
    </main>
  </div>;
}
export default App;
