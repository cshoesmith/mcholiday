# MCHoliday

`MCHoliday` is a holiday recommendation app that uses the price of a Big Mac as a playful proxy for local currency strength and travel affordability.

## What it does

- covers every sovereign country in the included dataset (UN members plus Palestine, Vatican City, and Kosovo)
- estimates a Big Mac price in USD for each destination
- scores countries for three travel modes:
  - value hunter
  - balanced explorer
  - comfort seeker
- lets you search and filter countries by region
- highlights top recommendations and shows the full ranked table

## Data note

Not every country has a McDonald's, so a literal official Big Mac price is impossible worldwide. This app handles that by combining:

- market-tuned prices for many major countries
- modeled estimates for the rest based on regional pricing patterns

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
