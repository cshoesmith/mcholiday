import rawCountries, { type Country } from 'world-countries'

export const GLOBAL_BIG_MAC_BENCHMARK = 5.79

const SPECIAL_SOVEREIGN_CODES = new Set(['PS', 'VA', 'XK'])

const REGION_BASE_PRICE: Record<string, number> = {
  Africa: 3.65,
  Americas: 5.15,
  Asia: 4.25,
  Europe: 5.8,
  Oceania: 6.2,
  Antarctic: 5.1,
}

const SUBREGION_OFFSETS: Record<string, number> = {
  'Northern Africa': -0.35,
  'Sub-Saharan Africa': -0.55,
  'Western Asia': 0.25,
  'Central Asia': -0.7,
  'Southern Asia': -0.95,
  'South-Eastern Asia': -0.45,
  'Eastern Asia': -0.05,
  'Northern Europe': 0.55,
  'Western Europe': 0.65,
  'Southern Europe': -0.1,
  'Eastern Europe': -0.55,
  'North America': 0.55,
  'Central America': -0.45,
  Caribbean: -0.05,
  'South America': -0.35,
  Australia: 0.15,
  'Melanesia': -0.1,
  'Micronesia': 0.05,
  Polynesia: 0.2,
}

const MARKET_PRICE_OVERRIDES: Record<string, number> = {
  AE: 4.9,
  AR: 6.05,
  AT: 5.95,
  AU: 6.15,
  BE: 5.95,
  BG: 4.3,
  BR: 4.55,
  CA: 5.95,
  CH: 8.1,
  CL: 5.15,
  CN: 3.55,
  CO: 4.15,
  CR: 4.9,
  CY: 5.2,
  CZ: 4.8,
  DE: 6.2,
  DK: 6.65,
  DO: 4.65,
  EC: 4.7,
  EE: 5.2,
  EG: 3.0,
  ES: 5.3,
  FI: 6.3,
  FR: 6.35,
  GB: 5.75,
  GE: 3.95,
  GR: 5.05,
  GT: 4.55,
  HK: 3.75,
  HR: 4.8,
  HU: 4.25,
  ID: 3.45,
  IE: 6.45,
  IL: 5.45,
  IN: 2.85,
  IS: 7.1,
  IT: 5.65,
  JO: 4.45,
  JP: 3.2,
  KR: 4.2,
  KW: 4.85,
  LB: 4.35,
  LK: 3.2,
  LT: 4.95,
  LU: 6.25,
  LV: 4.95,
  MA: 3.65,
  MD: 3.6,
  MT: 5.2,
  MX: 4.95,
  MY: 4.05,
  NG: 3.25,
  NL: 6.1,
  NO: 7.2,
  NZ: 6.2,
  OM: 4.75,
  PE: 4.05,
  PH: 3.55,
  PK: 2.75,
  PL: 4.45,
  PT: 4.9,
  QA: 5.15,
  RO: 4.0,
  RS: 4.15,
  SA: 4.85,
  SE: 6.15,
  SG: 5.5,
  SI: 5.05,
  SK: 4.7,
  TH: 4.0,
  TR: 3.85,
  TW: 4.15,
  UA: 3.15,
  US: 5.69,
  UY: 5.45,
  VN: 3.25,
  ZA: 3.35,
}

const PREMIUM_MARKETS = new Set([
 'AD',
  'AT',
  'AU',
  'BE',
  'BN',
  'CH',
  'DE',
  'DK',
  'FI',
  'IE',
  'IS',
  'LU',
  'MC',
  'NL',
  'NO',
  'NZ',
  'QA',
  'SE',
  'SG',
  'US',
])

const VALUE_MARKETS = new Set([
  'AL',
  'AM',
  'BD',
  'BJ',
  'BO',
  'BT',
  'ET',
  'GH',
  'IN',
  'KE',
  'KG',
  'KH',
  'LA',
  'LK',
  'MD',
  'MN',
  'NP',
  'PK',
  'SN',
  'TJ',
  'TZ',
  'UG',
  'VN',
  'ZM',
])

const MIN_PRICE = 2.6
const MAX_PRICE = 8.4

export const travelStyles = {
  value: {
    label: 'Value hunter',
    targetPrice: 3.7,
    softness: 2.8,
    blurb: 'Prioritises destinations where your travel budget stretches furthest.',
  },
  balanced: {
    label: 'Balanced explorer',
    targetPrice: 5.05,
    softness: 2.1,
    blurb: 'Looks for a sweet spot between affordability and familiarity.',
  },
  premium: {
    label: 'Comfort seeker',
    targetPrice: 6.3,
    softness: 2.5,
    blurb: 'Leans toward stronger-currency destinations and higher-comfort markets.',
  },
} as const

export type TravelStyle = keyof typeof travelStyles

export interface CountryRating {
  code: string
  name: string
  officialName: string
  flag: string
  capital: string
  region: string
  subregion: string
  currencyCode: string
  currencyName: string
  bigMacPriceUsd: number
  valueScore: number
  currencySignal: string
  priceBand: 'Bargain' | 'Smart pick' | 'Comfort zone' | 'Premium splurge'
  estimateType: 'market-tuned' | 'modeled'
  summary: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function getFirstCurrency(country: Country) {
  const [currencyCode, currency] = Object.entries(country.currencies ?? {})[0] ?? ['—', { name: 'Unknown currency', symbol: '' }]

  return {
    currencyCode,
    currencyName: currency?.name ?? 'Unknown currency',
  }
}

function getEstimatedBigMacPrice(country: Country) {
  const override = MARKET_PRICE_OVERRIDES[country.cca2]

  if (override) {
    return {
      price: override,
      estimateType: 'market-tuned' as const,
    }
  }

  const regionalBase = REGION_BASE_PRICE[country.region] ?? GLOBAL_BIG_MAC_BENCHMARK
  const subregionOffset = SUBREGION_OFFSETS[country.subregion] ?? 0
  const marketAdjustment = PREMIUM_MARKETS.has(country.cca2)
    ? 0.75
    : VALUE_MARKETS.has(country.cca2)
      ? -0.7
      : 0
  const landlockedAdjustment = country.landlocked ? -0.08 : 0.06
  const microstateAdjustment = country.area < 2_500 ? 0.15 : 0
  const estimatedPrice = clamp(
    regionalBase +
      subregionOffset +
      marketAdjustment +
      landlockedAdjustment +
      microstateAdjustment,
    MIN_PRICE,
    MAX_PRICE,
  )

  return {
    price: roundCurrency(estimatedPrice),
    estimateType: 'modeled' as const,
  }
}

function getPriceBand(price: number): CountryRating['priceBand'] {
  if (price < 4) {
    return 'Bargain'
  }

  if (price < 5.15) {
    return 'Smart pick'
  }

  if (price < 6.35) {
    return 'Comfort zone'
  }

  return 'Premium splurge'
}

function getCurrencySignal(price: number) {
  if (price <= GLOBAL_BIG_MAC_BENCHMARK * 0.88) {
    return 'Undervalued for visitors'
  }

  if (price >= GLOBAL_BIG_MAC_BENCHMARK * 1.12) {
    return 'Strong premium currency'
  }

  return 'Near the global burger norm'
}

function getValueScore(price: number) {
  const normalized = (MAX_PRICE - price) / (MAX_PRICE - MIN_PRICE)
  return Math.round(clamp(normalized * 100, 1, 100))
}

function buildSummary(country: Country, price: number) {
  const signal = getCurrencySignal(price).toLowerCase()
  const band = getPriceBand(price).toLowerCase()
  return `${country.name.common} lands in the ${band} range with an estimated Big Mac price of $${price.toFixed(2)}, signalling a ${signal}.`
}

function isIncludedCountry(country: Country) {
  return country.unMember || SPECIAL_SOVEREIGN_CODES.has(country.cca2)
}

export const countryRatings: CountryRating[] = rawCountries
  .filter(isIncludedCountry)
  .map((country) => {
    const { price, estimateType } = getEstimatedBigMacPrice(country)
    const { currencyCode, currencyName } = getFirstCurrency(country)

    return {
      code: country.cca2,
      name: country.name.common,
      officialName: country.name.official,
      flag: country.flag,
      capital: country.capital?.[0] ?? '—',
      region: country.region,
      subregion: country.subregion || 'Other',
      currencyCode,
      currencyName,
      bigMacPriceUsd: price,
      valueScore: getValueScore(price),
      currencySignal: getCurrencySignal(price),
      priceBand: getPriceBand(price),
      estimateType,
      summary: buildSummary(country, price),
    }
  })
  .sort((left, right) => left.name.localeCompare(right.name))

export function scoreCountryForStyle(country: CountryRating, style: TravelStyle) {
  const { targetPrice, softness } = travelStyles[style]
  const distance = Math.abs(country.bigMacPriceUsd - targetPrice)
  const fit = clamp(100 - (distance / softness) * 100, 0, 100)

  if (style === 'value') {
    return Math.round(fit * 0.35 + country.valueScore * 0.65)
  }

  if (style === 'premium') {
    const premiumAffinity = 100 - country.valueScore
    return Math.round(fit * 0.6 + premiumAffinity * 0.4)
  }

  const balanceAffinity = 100 - Math.abs(country.valueScore - 55)
  return Math.round(fit * 0.55 + balanceAffinity * 0.45)
}

export function getAffordabilityIndex(homePrice: number, destinationPrice: number) {
  if (homePrice <= 0 || destinationPrice <= 0) {
    return 100
  }

  const ratio = (homePrice / destinationPrice) * 100
  return Math.round(clamp(ratio, 20, 250))
}

export function inferCountryCodeFromLocale(locales: readonly string[]) {
  for (const locale of locales) {
    if (!locale) {
      continue
    }

    try {
      const intlLocale = new Intl.Locale(locale)
      if (intlLocale.region && /^[A-Z]{2}$/.test(intlLocale.region)) {
        return intlLocale.region
      }
    } catch {
      // Ignore malformed locale and try fallback parsing below.
    }

    const fallbackMatch = locale.match(/[-_]([a-z]{2})\b/i)
    if (fallbackMatch?.[1]) {
      return fallbackMatch[1].toUpperCase()
    }
  }

  return null
}
