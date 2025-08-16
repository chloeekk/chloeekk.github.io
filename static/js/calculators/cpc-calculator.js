// cpc-calculator.js — compatible with unified platform_industry_benchmark.json
// It tolerates different raw shapes: Array, {data:[...]}, {rows:[...]}, or numeric-key objects.
// It also supports metrics.cpc (number) and legacy average_cpc ("$3.49").

// Module-level cache of normalized rows
let ROWS = [];

// Unique helper (preserve order)
const unique = (arr) => [...new Set(arr)];

// Normalize raw data to an array of row objects
function toRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.rows)) return raw.rows;
    if (Array.isArray(raw.items)) return raw.items;
    // Fallback: use object values (covers {"0":{...},"1":{...}})
    return Object.values(raw);
  }
  return [];
}

// Parse currency like "$3.49" or "3.49" to number; return NaN if invalid
function parseCurrency(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val.replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? NaN : n;
  }
  return NaN;
}

// Read CPC value from a row (prefer metrics.cpc, fallback to average_cpc)
function readCPC(row) {
  if (!row) return NaN;
  const fromMetrics = row.metrics && typeof row.metrics.cpc === "number" ? row.metrics.cpc : NaN;
  if (!isNaN(fromMetrics)) return fromMetrics;
  return parseCurrency(row.average_cpc);
}

// Preference for objectives when multiple rows exist for the same (platform, industry)
const OBJECTIVE_PREF = {
  Google: ["Search"],
  Meta: ["Traffic", "Leads"],
  Bing: [] // no specific preference
};

// Find the best row for (platform, industry) that has a CPC metric
function findRowForCPC(platform, industry) {
  const candidates = ROWS.filter(
    (r) => r && r.platform === platform && r.industry === industry && !isNaN(readCPC(r))
  );
  if (candidates.length === 0) return null;

  const pref = OBJECTIVE_PREF[platform] || [];
  for (const wanted of pref) {
    const hit = candidates.find((r) => (r.campaign_objective || "").trim() === wanted);
    if (hit) return hit;
  }
  // Fallback: first candidate with CPC
  return candidates[0];
}

export function initCalculator(container, data) {
  if (!container) {
    console.error("⚠️ Container for CPC calculator not found");
    return;
  }

  // Normalize and cache
  ROWS = toRows(data);
  if (!ROWS.length) {
    container.innerHTML = "<p>❌ No benchmark data available.</p>";
    console.error("Benchmark dataset is empty or malformed:", data);
    return;
  }

  // Derive platform list from rows (strings only)
  const platforms = unique(
    ROWS.map((r) => (r && typeof r.platform === "string" ? r.platform : null)).filter(Boolean)
  );

  // Render UI
  container.innerHTML = `
    <div class="calculator-panel">

      <div class="input-group">
        <label for="platform-select">Ad Platform:</label>
        <select id="platform-select">
          ${platforms.map((p) => `<option value="${p}">${p}</option>`).join("")}
        </select>
      </div>

      <div class="input-group">
        <label for="industry-select">Industry:</label>
        <select id="industry-select"></select>
      </div>

      <div class="input-group">
        <label for="ad-spend">Ad Spend (USD):</label>
        <input type="number" id="ad-spend" min="0" placeholder="e.g. 1000" />
      </div>

      <div class="input-group">
        <label for="clicks">Clicks:</label>
        <input type="number" id="clicks" min="0" placeholder="e.g. 500" />
      </div>

      <button id="reload-btn" type="button">Reload Calculator</button>

      <div id="result-display" class="result"></div>
      <div id="suggestions" class="suggestions"></div>

      <div class="feedback">
        <p>Did we solve your problem today?</p>
        <button id="feedback-yes" type="button" class="feedback-btn">Yes</button>
        <button id="feedback-no" type="button" class="feedback-btn">No</button>
      </div>
    </div>
  `;

  // Initial industry options
  updateIndustryOptions();

  // Events
  document.getElementById("platform-select").addEventListener("change", () => {
    updateIndustryOptions();
    calculateAndDisplay();
  });
  document.getElementById("industry-select").addEventListener("change", () => calculateAndDisplay());
  document.getElementById("ad-spend").addEventListener("input", () => calculateAndDisplay());
  document.getElementById("clicks").addEventListener("input", () => calculateAndDisplay());
  document.getElementById("reload-btn").addEventListener("click", () => {
    resetCalculator();
    calculateAndDisplay();
  });
  document.getElementById("feedback-yes").addEventListener("click", () => alert("Thanks for your feedback!"));
  document.getElementById("feedback-no").addEventListener("click", () => alert("Sorry to hear that. We will improve!"));

  // First render
  calculateAndDisplay();
}

// Populate industries for the selected platform (only rows that have CPC)
function updateIndustryOptions() {
  const platform = document.getElementById("platform-select").value;
  const industrySelect = document.getElementById("industry-select");

  const industries = unique(
    ROWS.filter((r) => r.platform === platform && !isNaN(readCPC(r))).map((r) => r.industry)
  );

  industrySelect.innerHTML = industries.map((ind) => `<option value="${ind}">${ind}</option>`).join("");
}

// Compute and render CPC comparison
function calculateAndDisplay() {
  const platform = document.getElementById("platform-select").value;
  const industry = document.getElementById("industry-select").value;
  const adSpend = parseFloat(document.getElementById("ad-spend").value);
  const clicks = parseFloat(document.getElementById("clicks").value);
  const resultDiv = document.getElementById("result-display");
  const suggestionsDiv = document.getElementById("suggestions");

  if (!platform || !industry) {
    resultDiv.innerHTML = "<p>Please select a platform and industry.</p>";
    suggestionsDiv.innerHTML = "";
    return;
  }
  if (!(adSpend > 0) || !(clicks > 0)) {
    resultDiv.innerHTML = "<p>Please fill in all fields with valid values.</p>";
    suggestionsDiv.innerHTML = "";
    return;
  }

  const row = findRowForCPC(platform, industry);
  if (!row) {
    resultDiv.innerHTML = `<p>Benchmark data unavailable for "${platform}" / "${industry}".</p>`;
    suggestionsDiv.innerHTML = "";
    return;
  }

  const benchmarkCPC = readCPC(row);
  if (isNaN(benchmarkCPC)) {
    resultDiv.innerHTML = `<p>Benchmark CPC is missing for "${platform}" / "${industry}".</p>`;
    suggestionsDiv.innerHTML = "";
    return;
  }

  const userCPC = adSpend / clicks;
  const diff = userCPC - benchmarkCPC;

  let statusText = "";
  let color = "";
  if (diff < 0) {
    statusText = "Below Benchmark";
    color = "green";
  } else if (diff > 0) {
    statusText = "Above Benchmark";
    color = "red";
  } else {
    statusText = "At Benchmark";
    color = "gray";
  }

  resultDiv.innerHTML = `
    <p><strong>Your CPC:</strong> $${userCPC.toFixed(2)}</p>
    <p><strong>Industry Benchmark (${industry}${row.campaign_objective ? ` • ${row.campaign_objective}` : ""}):</strong> $${benchmarkCPC.toFixed(2)}</p>
    <p style="color: ${color}; font-weight: bold;">${statusText}</p>
  `;

  suggestionsDiv.innerHTML = generateSuggestions(diff);
}

// Reset inputs and selections
function resetCalculator() {
  const platformSelect = document.getElementById("platform-select");
  platformSelect.selectedIndex = 0;
  updateIndustryOptions();
  const industrySelect = document.getElementById("industry-select");
  industrySelect.selectedIndex = 0;

  document.getElementById("ad-spend").value = "";
  document.getElementById("clicks").value = "";
  document.getElementById("result-display").innerHTML = "";
  document.getElementById("suggestions").innerHTML = "";
}

// Simple suggestions
function generateSuggestions(diff) {
  if (diff < 0) {
    return `
      <ul>
        <li>Great! Your CPC is better than the benchmark.</li>
        <li>Consider scaling your budget to get more conversions.</li>
      </ul>
    `;
  } else if (diff > 0) {
    return `
      <ul>
        <li>Your CPC is higher than average. Review your ad targeting.</li>
        <li>Optimize your ad creatives and keywords.</li>
        <li>Check competitor bids and adjust your budget.</li>
      </ul>
    `;
  } else {
    return `<p>Your CPC matches the industry benchmark. Keep monitoring your campaigns.</p>`;
  }
}
