/* I 5 grafici Chart.js.
   Se questo file non gira i canvas restano vuoti, ma ogni grafico ha già in
   index.html un aria-label e una tabella con gli stessi dati.

   I numeri sono scritti qui a mano, identici a data/report.json: fetch() su
   un file aperto con doppio click (file://) viene bloccato dal browser per
   CORS, e il sito deve funzionare anche così. */

(function () {
  "use strict";

  // Se Chart.js non si è caricato esco senza errori, altrimenti si romperebbe
  // anche app.js
  if (typeof Chart === "undefined") return;

  var root = getComputedStyle(document.documentElement);
  // Legge un colore da tokens.css: i grafici seguono il tema chiaro/scuro
  // senza avere colori scritti qui dentro
  function token(name) {
    return root.getPropertyValue(name).trim();
  }

  var palette = [
    token("--chart-color-1"),
    token("--chart-color-2"),
    token("--chart-color-3"),
    token("--chart-color-4"),
    token("--chart-color-5"),
    token("--chart-color-6"),
  ];
  var gridColor = token("--chart-grid");
  var textColor = token("--chart-text");

  // Chart.js anima di default: se l'utente ha chiesto meno animazioni la
  // disattivo qui, il CSS da solo non arriverebbe al canvas
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = gridColor;
  if (reducedMotion) Chart.defaults.animation = false;

  // Assi comuni ai grafici cartesiani
  function baseScales(extra) {
    return Object.assign(
      {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true },
      },
      extra || {}
    );
  }

  function initChart(id, config) {
    var el = document.getElementById(id);
    if (!el) return;
    new Chart(el.getContext("2d"), config);
  }

  // ---- Emissioni Scope 1 + 2 (t CO2 eq, 2022-2024) ----
  initChart("chart-emissioni", {
    type: "line",
    data: {
      labels: ["2022", "2023", "2024"],
      datasets: [
        {
          label: "Scope 1",
          data: [42892, 44602, 46435],
          borderColor: palette[0],
          backgroundColor: palette[0],
          tension: 0.25,
        },
        {
          label: "Scope 2 (location-based)",
          data: [79528, 82413, 84861],
          borderColor: palette[1],
          backgroundColor: palette[1],
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: baseScales(),
    },
  });

  // ---- Mix energetico 2024 (MWh) ----
  initChart("chart-energia", {
    type: "doughnut",
    data: {
      labels: ["Fonti fossili", "Fonti rinnovabili", "Fonti nucleari"],
      datasets: [
        {
          data: [385072.4, 42981.7, 190.7],
          backgroundColor: [palette[3], palette[0], palette[4]],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });

  // ---- CO2 risparmiata per progetto ----
  initChart("chart-packaging", {
    type: "bar",
    data: {
      labels: ["Riduzione plastica", "Piano anti-spreco"],
      datasets: [
        { label: "Raggiunto", data: [5600, 19000], backgroundColor: palette[0] },
        { label: "Target successivo", data: [1000, 12000], backgroundColor: palette[4] },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: baseScales({
        x: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true },
      }),
    },
  });

  // ---- Matrice di doppia materialità ----
  // Il report non pubblica le coordinate numeriche: le ho lette dal grafico
  // a pag. 44, con un margine di circa ±0.1 per asse.
  var materialityPoints = [
    { label: "G1 — Condotta delle imprese", x: 3.7, y: 3.8 },
    { label: "S3 — Comunità interessate", x: 3.05, y: 3.65 },
    { label: "E5 — Economia circolare", x: 3.2, y: 3.6 },
    { label: "E1 — Cambiamenti climatici", x: 3.4, y: 3.5 },
    { label: "S4 — Consumatori e utilizzatori finali", x: 3.05, y: 3.5 },
    { label: "S2 — Lavoratori nella catena del valore", x: 2.8, y: 3.45 },
    { label: "E3 — Acqua e risorse marine", x: 3.15, y: 3.3 },
    { label: "S1 — Forza lavoro propria", x: 3.0, y: 3.3 },
    { label: "E4 — Biodiversità ed ecosistemi", x: 2.6, y: 3.15 },
    { label: "E2 — Inquinamento", x: 3.1, y: 3.0 },
  ];
  initChart("chart-materialita", {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Temi ESRS",
          data: materialityPoints.map(function (p) {
            return { x: p.x, y: p.y };
          }),
          backgroundColor: palette[0],
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            // Nel tooltip il nome del tema, non le coordinate
            label: function (ctx) {
              return materialityPoints[ctx.dataIndex].label;
            },
          },
        },
      },
      scales: {
        x: {
          min: 2.5,
          max: 5,
          title: { display: true, text: "Financial materiality", color: textColor },
          grid: { color: gridColor },
          ticks: { color: textColor },
        },
        y: {
          min: 2.5,
          max: 5,
          title: { display: true, text: "Impact materiality", color: textColor },
          grid: { color: gridColor },
          ticks: { color: textColor },
        },
      },
    },
  });

  // ---- Ore di formazione per genere, 2024 ----
  initChart("chart-formazione", {
    type: "bar",
    data: {
      labels: ["Uomini", "Donne"],
      datasets: [
        {
          label: "Ore di formazione 2024",
          data: [4550, 16207],
          backgroundColor: [palette[2], palette[0]],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: baseScales(),
    },
  });
})();
