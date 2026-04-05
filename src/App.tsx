import { useMemo, useState } from 'react'
import './App.css'
import {
  GLOBAL_BIG_MAC_BENCHMARK,
  countryRatings,
  getAffordabilityIndex,
  inferCountryCodeFromLocale,
  scoreCountryForStyle,
  travelStyles,
  type TravelStyle,
} from './data/bigMacScores'

function getInitialHomeCountryCode() {
  const localePool =
    typeof navigator !== 'undefined'
      ? [...(navigator.languages ?? []), navigator.language]
      : []
  const inferred = inferCountryCodeFromLocale(localePool)

  if (inferred && countryRatings.some((country) => country.code === inferred)) {
    return inferred
  }

  return 'US'
}

function App() {
  const [style, setStyle] = useState<TravelStyle>('value')
  const [region, setRegion] = useState('All regions')
  const [search, setSearch] = useState('')
  const [homeCountryCode, setHomeCountryCode] = useState(getInitialHomeCountryCode)

  const homeCountry = useMemo(
    () =>
      countryRatings.find((country) => country.code === homeCountryCode) ??
      countryRatings.find((country) => country.code === 'US') ??
      countryRatings[0],
    [homeCountryCode],
  )

  const regions = useMemo(
    () => ['All regions', ...new Set(countryRatings.map((country) => country.region))],
    [],
  )

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase()

    return countryRatings
      .filter((country) => region === 'All regions' || country.region === region)
      .filter((country) => {
        if (!query) {
          return true
        }

        return [country.name, country.capital, country.currencyName, country.currencyCode]
          .join(' ')
          .toLowerCase()
          .includes(query)
      })
      .map((country) => ({
        ...country,
        affordabilityIndex: getAffordabilityIndex(
          homeCountry.bigMacPriceUsd,
          country.bigMacPriceUsd,
        ),
      }))
      .map((country) => {
        const styleScore = scoreCountryForStyle(country, style)
        const affordabilityLift = country.affordabilityIndex - 100
        const personalizedScore =
          style === 'value'
            ? styleScore + affordabilityLift * 0.35
            : style === 'premium'
              ? styleScore - affordabilityLift * 0.15
              : styleScore + affordabilityLift * 0.2

        return {
          ...country,
          tripScore: Math.max(1, Math.min(100, Math.round(personalizedScore))),
        }
      })
      .sort((left, right) => {
        if (right.tripScore !== left.tripScore) {
          return right.tripScore - left.tripScore
        }

        return left.name.localeCompare(right.name)
      })
  }, [homeCountry.bigMacPriceUsd, region, search, style])

  const topThree = filteredCountries.slice(0, 3)
  const lowestBurgerPrice = [...countryRatings].sort(
    (left, right) => left.bigMacPriceUsd - right.bigMacPriceUsd,
  )[0]
  const priciestBurger = [...countryRatings].sort(
    (left, right) => right.bigMacPriceUsd - left.bigMacPriceUsd,
  )[0]
  const medianBurgerPrice = [...countryRatings]
    .map((country) => country.bigMacPriceUsd)
    .sort((left, right) => left - right)[Math.floor(countryRatings.length / 2)]

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="eyebrow">The Burger Passport Index</div>
        <div className="hero-copy">
          <div>
            <h1>Pick your next holiday by following the Big Mac.</h1>
            <p className="lead">
              This app scores countries by an estimated Big Mac price in USD to surface
              destinations where your money could feel mighty, middling, or magnificently
              bougie.
            </p>
          </div>
          <div className="hero-note">
            <p>
              Official Big Mac prices do not exist for every sovereign state because not every
              country has McDonald&apos;s. To keep the map global, the app blends market-tuned
              prices for major countries with modeled estimates elsewhere.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <article className="stat-card accent-card">
            <span className="stat-label">Countries covered</span>
            <strong>{countryRatings.length}</strong>
            <p>UN members plus Palestine, Vatican City, and Kosovo.</p>
          </article>
          <article className="stat-card">
            <span className="stat-label">Global benchmark</span>
            <strong>{currencyFormatter.format(GLOBAL_BIG_MAC_BENCHMARK)}</strong>
            <p>The reference price used to infer currency stretch.</p>
          </article>
          <article className="stat-card">
            <span className="stat-label">Best burger bargain</span>
            <strong>
              {lowestBurgerPrice.flag} {lowestBurgerPrice.name}
            </strong>
            <p>{currencyFormatter.format(lowestBurgerPrice.bigMacPriceUsd)} estimated.</p>
          </article>
          <article className="stat-card">
            <span className="stat-label">Luxury warning</span>
            <strong>
              {priciestBurger.flag} {priciestBurger.name}
            </strong>
            <p>{currencyFormatter.format(priciestBurger.bigMacPriceUsd)} for the premium set.</p>
          </article>
        </div>
      </section>

      <section className="control-panel">
        <div className="control-group style-pills" role="tablist" aria-label="Travel style">
          {Object.entries(travelStyles).map(([key, config]) => (
            <button
              key={key}
              type="button"
              className={key === style ? 'pill active' : 'pill'}
              onClick={() => setStyle(key as TravelStyle)}
            >
              <span>{config.label}</span>
              <small>{config.blurb}</small>
            </button>
          ))}
        </div>

        <div className="filters-row filters-row--sticky">
          <label className="field field-select">
            <span>Home country baseline</span>
            <select
              value={homeCountryCode}
              onChange={(event) => setHomeCountryCode(event.target.value)}
            >
              {countryRatings.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Search country, capital, or currency</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try Japan, peso, or Nairobi"
            />
          </label>

          <label className="field field-select">
            <span>Region</span>
            <select value={region} onChange={(event) => setRegion(event.target.value)}>
              {regions.map((regionOption) => (
                <option key={regionOption} value={regionOption}>
                  {regionOption}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filters-row filters-row--insights">
          <article className="field insight-box">
            <span>Home burger baseline</span>
            <strong>
              {homeCountry.flag} {currencyFormatter.format(homeCountry.bigMacPriceUsd)}
            </strong>
            <p>
              Affordability index is anchored to this price. Score 100 means equal cost,
              above 100 means cheaper than home.
            </p>
          </article>

          <article className="field insight-box">
            <span>Median burger price</span>
            <strong>{currencyFormatter.format(medianBurgerPrice)}</strong>
            <p>Countries below this line usually feel kinder on a holiday wallet.</p>
          </article>
        </div>
      </section>

      <section className="results-panel">
        <div className="section-heading">
          <div>
            <h2>Recommended right now</h2>
            <p>
              Ranked for the <strong>{travelStyles[style].label.toLowerCase()}</strong> profile.
            </p>
          </div>
          <div className="results-meta">
            <span>{filteredCountries.length} matches</span>
          </div>
        </div>

        <div className="featured-grid">
          {topThree.map((country, index) => (
            <article key={country.code} className="featured-card">
              <div className="featured-rank">#{index + 1}</div>
              <div className="featured-header">
                <div>
                  <h3>
                    <span aria-hidden="true">{country.flag}</span> {country.name}
                  </h3>
                  <p>
                    {country.capital} · {country.region}
                  </p>
                </div>
                <span className="chip">{country.priceBand}</span>
              </div>

              <div className="score-row">
                <div>
                  <span className="metric-label">Trip fit</span>
                  <strong>{country.tripScore}/100</strong>
                </div>
                <div>
                  <span className="metric-label">Big Mac price</span>
                  <strong>{currencyFormatter.format(country.bigMacPriceUsd)}</strong>
                </div>
                <div>
                  <span className="metric-label">Affordability index</span>
                  <strong>{country.affordabilityIndex}</strong>
                </div>
              </div>

              <p className="card-copy">{country.summary}</p>

              <div className="tag-row">
                <span className="tag">{country.currencySignal}</span>
                <span className="tag">{country.currencyCode}</span>
                <span className="tag">
                  {country.affordabilityIndex >= 100
                    ? `${country.affordabilityIndex - 100}% cheaper`
                    : `${100 - country.affordabilityIndex}% pricier`}
                </span>
                <span className="tag muted">{country.estimateType}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Capital</th>
                <th>Region</th>
                <th>Big Mac (USD)</th>
                <th>Affordability</th>
                <th>Trip fit</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {filteredCountries.map((country) => (
                <tr key={country.code}>
                  <td data-label="Country">
                    <div className="country-cell">
                      <span className="flag" aria-hidden="true">
                        {country.flag}
                      </span>
                      <div>
                        <strong>{country.name}</strong>
                        <small>{country.currencyName}</small>
                      </div>
                    </div>
                  </td>
                  <td data-label="Capital">{country.capital}</td>
                  <td data-label="Region">
                    {country.region}
                    <small className="subregion">{country.subregion}</small>
                  </td>
                  <td data-label="Big Mac (USD)">{currencyFormatter.format(country.bigMacPriceUsd)}</td>
                  <td data-label="Affordability">
                    {country.affordabilityIndex}
                    <small className="subregion">
                      {country.affordabilityIndex >= 100
                        ? `${country.affordabilityIndex - 100}% cheaper than ${homeCountry.name}`
                        : `${100 - country.affordabilityIndex}% pricier than ${homeCountry.name}`}
                    </small>
                  </td>
                  <td data-label="Trip fit">{country.tripScore}/100</td>
                  <td data-label="Signal">
                    <div className="signal-cell">
                      <span className="chip soft">{country.currencySignal}</span>
                      <small>{country.estimateType}</small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCountries.length === 0 ? (
            <div className="empty-state">
              <h3>No burger-powered matches found.</h3>
              <p>Try clearing the search or switching regions to widen the net.</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default App
