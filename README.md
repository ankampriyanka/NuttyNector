# Nutty Nectar Pricing Tool

A mobile-friendly React + Vite unit-cost calculator for the Nutty Nectar product range.

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Vercel
1. Import this GitHub repository into Vercel.
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy. Future pushes to `main` trigger redeployments.

## Data behaviour
- Ingredient rates, recipe quantities, overheads and margin are editable.
- Changes are saved in local browser storage on the device/browser where they were entered.
- This first version does not sync edits between devices or users. Do not clear browser data if you want to retain local edits.
- Add a database/auth layer later if cross-device sync is required.

## Important recipe notes
Several source recipe quantities require confirmation:
- Nector Medley: nut/seed quantities missing.
- Golden Bliss Walnut: source row says 40 g cashew although product name says walnut.
- Nector Royal: ingredient list and quantities disagree; pista/blueberry amounts are missing.
- 120 ml is jar volume, not net weight. Validate physical fill before printing labels.
