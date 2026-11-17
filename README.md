# Nector OneStop — Grocery & Product Costing Tool

A mobile-friendly React + Vite calculator for small businesses. Add grocery/ingredient items, maintain purchase rates, build product recipes, enter overheads and calculate unit cost, gross profit and recommended selling price.

## Run locally
```bash
npm install
npm run dev
```

## Deploy on Vercel
1. Import this repository into Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy. Pushes to the connected branch can trigger future deployments.

## How pricing works
- Ingredient cost is calculated from the purchase rate and recipe quantity.
- Overheads can be entered per item or per batch; batch costs are divided by batch size.
- Selling price = total unit cost ÷ (1 − gross margin %).
- The recommended price is rounded upward using the selected rounding increment.

## Data storage
This version saves data in the browser's local storage on the current device/browser. It does not provide account login, cloud backup or multi-device synchronization. A database and authentication can be added if shared access is needed.

## Units
Purchase and recipe units should match by type: kg → g, litre → ml, piece → piece. This is a simple conversion calculator and does not infer density or convert between mass and volume.
