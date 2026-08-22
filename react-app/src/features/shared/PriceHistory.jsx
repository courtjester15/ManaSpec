import { useEffect, useMemo, useRef, useState } from "react";
import { Chart, Filler, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip } from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Legend, Tooltip);
import { formatMoney } from "../../domain/portfolio.js";
import { calculatePriceHistoryMetrics, choosePriceHistoryRange, filterPriceHistoryRange, getPriceHistoryCoverage, getPriceHistoryRangeState, normalizePriceHistory } from "../../domain/priceHistory.js";

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function moneyOrDash(value) {
  return positiveNumber(value) === null ? "-" : formatMoney(value);
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function signedChange(value, suffix = "") {
  if (!Number.isFinite(value)) return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(suffix ? 1 : 2)}${suffix}`;
}

function identity(item) {
  const finish = item?.finish === "etched" ? "Etched" : item?.foil || item?.finish === "foil" ? "Foil" : "Nonfoil";
  return [item?.name, String(item?.set_code || item?.set || "").toUpperCase(), item?.collector_number ? `#${item.collector_number}` : "", finish]
    .filter(Boolean)
    .join(" · ");
}

function PriceHistoryChart({ points, references, label }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || points.length < 2) return undefined;
    const firstTime = points[0].timestamp;
    const lastTime = points.at(-1).timestamp;
    const datasets = [{
      label: "Recorded Scryfall observations",
      data: points.map((observation, index) => ({
        x: observation.timestamp,
        y: observation.price,
        date: observation.date,
        previousChange: index ? ((observation.price - points[index - 1].price) / points[index - 1].price) * 100 : null,
      })),
      borderColor: "#a78bfa",
      backgroundColor: "rgba(167, 139, 250, 0.13)",
      borderWidth: 2,
      fill: true,
      tension: 0,
      spanGaps: false,
      pointRadius: points.length > 45 ? 1.5 : 3,
      pointHoverRadius: 5,
      pointHitRadius: 5,
    }, ...references.map(reference => ({
      label: reference.label,
      data: [{ x: firstTime, y: reference.value }, { x: lastTime, y: reference.value }],
      borderColor: reference.color,
      borderDash: [6, 5],
      borderWidth: 1,
      fill: false,
      pointRadius: 0,
      pointHitRadius: 0,
    }))];
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: { datasets },
      options: {
        animation: false,
        maintainAspectRatio: false,
        parsing: false,
        responsive: true,
        interaction: { intersect: true, mode: "nearest" },
        plugins: {
          legend: { display: references.length > 0, labels: { color: "#cbd5e1", boxHeight: 2, boxWidth: 12 } },
          tooltip: {
            filter: context => context.datasetIndex === 0,
            callbacks: {
              title: contexts => formatDate(contexts[0]?.raw?.date),
              label: context => moneyOrDash(context.raw?.y),
              afterLabel: context => Number.isFinite(context.raw?.previousChange)
                ? `${signedChange(context.raw.previousChange, "%")} from previous recorded observation`
                : "First recorded observation in range",
            },
          },
        },
        scales: {
          x: {
            type: "linear",
            min: firstTime,
            max: lastTime,
            grid: { color: "rgba(148, 163, 184, 0.08)" },
            ticks: {
              color: "#94a3b8",
              maxTicksLimit: 8,
              callback: value => new Date(Number(value)).toLocaleDateString(undefined, { timeZone: "UTC", month: "short", day: "numeric" }),
            },
          },
          y: {
            grid: { color: "rgba(148, 163, 184, 0.12)" },
            ticks: { color: "#94a3b8", callback: value => `$${Number(value).toFixed(0)}` },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [label, points, references]);
  return <div className="price-history-chart-wrap"><canvas ref={canvasRef} role="img" aria-label={label} /></div>;
}

export function PriceHistory({ rows = [], item, references = [] }) {
  const history = useMemo(() => normalizePriceHistory(rows), [rows]);
  const defaultRange = useMemo(() => choosePriceHistoryRange(history), [history]);
  const [range, setRange] = useState(defaultRange);
  useEffect(() => setRange(defaultRange), [defaultRange, item?.id]);
  const points = useMemo(() => filterPriceHistoryRange(history, range), [history, range]);
  const metrics = useMemo(() => calculatePriceHistoryMetrics(points), [points]);
  const coverage = useMemo(() => getPriceHistoryCoverage(history), [history]);
  const ranges = useMemo(() => getPriceHistoryRangeState(history), [history]);
  const validReferences = useMemo(() => references
    .map(reference => ({ ...reference, value: positiveNumber(reference.value) }))
    .filter(reference => reference.value !== null), [references]);
  const currentPrice = positiveNumber(item?.currentPrice);
  const observedSpan = coverage.observationCount
    ? `${formatDate(coverage.oldest)}–${formatDate(coverage.newest)}`
    : "No recorded range";
  const changeTone = metrics.changeAmount > 0 ? "positive" : metrics.changeAmount < 0 ? "negative" : "";
  const chartLabel = `${identity(item)} price history with ${metrics.observationCount} recorded observations from ${formatDate(metrics.oldest)} to ${formatDate(metrics.newest)}. No missing dates are interpolated.`;

  return <section className="react-price-history">
    <header className="react-price-history-identity">
      <div><strong>{identity(item)}</strong><span>{coverage.observationCount} recorded daily {coverage.observationCount === 1 ? "observation" : "observations"}</span></div>
      <span>{observedSpan}</span>
    </header>
    <nav className="price-history-ranges" aria-label="Price history date range">
      {ranges.map(option => <button type="button" key={option.key} className={range === option.key ? "active" : ""} disabled={!option.enabled} aria-pressed={range === option.key} title={option.enabled ? `${option.observationCount} recorded observations` : "Fewer than two recorded observations in this range"} onClick={() => setRange(option.key)}>{option.label}</button>)}
    </nav>
    {points.length >= 2
      ? <PriceHistoryChart points={points} references={validReferences} label={chartLabel} />
      : <div className={`price-history-empty${points.length === 1 ? " price-history-empty--limited" : ""}`}>
        <strong>{points.length === 1 ? "1 daily observation saved." : "No price history saved yet."}</strong>
        <span>{points.length === 1 ? "At least two recorded observations are needed to show price movement." : "History begins after a successful price refresh saves this exact printing and finish."}</span>
        {points[0] && <small>{formatDate(points[0].date)} · {formatMoney(points[0].price)} · Source: Scryfall</small>}
      </div>}
    <div className="price-history-metrics react-price-history-metrics">
      <div><span>Current Price</span><strong>{moneyOrDash(currentPrice)}</strong></div>
      <div><span>Latest Observed</span><strong>{moneyOrDash(metrics.latest?.price)}</strong><small>{formatDate(metrics.latest?.date)}</small></div>
      <div><span>Previous Observed</span><strong>{moneyOrDash(metrics.prior?.price)}</strong><small>{formatDate(metrics.prior?.date)}</small></div>
      <div><span>Observed Change</span><strong className={changeTone}>{metrics.changeAmount === null ? "-" : `${signedChange(metrics.changeAmount)} · ${signedChange(metrics.changePercent, "%")}`}</strong></div>
      <div><span>Range High</span><strong>{moneyOrDash(metrics.high)}</strong></div>
      <div><span>Range Low</span><strong>{moneyOrDash(metrics.low)}</strong></div>
    </div>
    {validReferences.length > 0 && <div className="price-history-references">{validReferences.map(reference => <span key={reference.label}><i style={{ "--reference-color": reference.color }} />{reference.label} <strong>{formatMoney(reference.value)}</strong></span>)}</div>}
    <footer className="price-history-footer">{metrics.observationCount} recorded {metrics.observationCount === 1 ? "observation" : "observations"} in range · {metrics.observationCount ? `${formatDate(metrics.oldest)}–${formatDate(metrics.newest)}` : "No dates recorded"} · Source: Scryfall · Missing dates are not interpolated</footer>
  </section>;
}
