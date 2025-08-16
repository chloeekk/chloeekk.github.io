// ctr-calculator.js

let ROWS = []; // cache normalized rows

const unique = (arr) => [...new Set(arr)];

// Normalize raw data to rows
function toRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.rows)) return raw.rows;
    if (Array.isArray(raw.items)) return raw.items;
    return Object.values(raw); // {0:{},1:{}} fallback
  }
  return [];
}

// Parse % string or number to percentage value (e.g. "3.45%" → 3.45)
function parsePercent(val) {
  if (typeof val === "number") return val * 100; // assume metric is 0.0345 = 3.45%
  if (typeof val === "string") {
    const n = Number(val.replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? NaN : n;
  }
  return NaN;
}

// Read CTR value
function readCTR(row) {
  if (!row) return NaN;
  if (row.metrics && typeof row.metrics.ctr === "number") {
    return row.metrics.ctr * 100; // e.g. 0.0345 → 3.45%
  }
  return parsePercent(row.average_ctr);
}

// Objective preference per platform (可调整)
const OBJECTIVE_PREF = {
  Google: ["Search"],
  Meta: ["Traffic", "Leads"],
  Bing: []
};

function findRowForCTR(platform, industry) {
  const candidates = ROWS.filter(
    (r) => r.platform === platform && r.industry === industry && !isNaN(readCTR(r))
  );
  if (!candidates.length) return null;
  const pref = OBJECTIVE_PREF[platform] || [];
  for (const wanted of pref) {
    const hit = candidates.find((r) => (r.campaign_objective || "").trim() === wanted);
    if (hit) return hit;
  }
  return candidates[0];
}

export function initCalculator(container, data) {
  if (!container) {
    console.error("⚠️ Container for CTR calculator not found");
    return;
  }

  ROWS = toRows(data);
  if (!ROWS.length) {
    container.innerHTML = "<p>❌ No CTR benchmark data available.</p>";
    return;
  }

  const platforms = unique(
    ROWS.map((r) => (r && typeof r.platform === "string" ? r.platform : null)).filter(Boolean)
  );

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
        <label for="impressions">Impressions:</label>
        <input type="number" id="impressions" min="0" placeholder="e.g. 10000" />
      </div>

      <div class="input-group">
        <label for="clicks">Clicks:</label>
        <input type="number" id="clicks" min="0" placeholder="e.g. 250" />
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

  updateIndustryOptions();

  document.getElementById("platform-select").addEventListener("change", () => {
    updateIndustryOptions();
    calculateAndDisplay();
  });
  document.getElementById("industry-select").addEventListener("change", () => calculateAndDisplay());
  document.getElementById("impressions").addEventListener("input", () => calculateAndDisplay());
  document.getElementById("clicks").addEventListener("input", () => calculateAndDisplay());
  document.getElementById("reload-btn").addEventListener("click", () => {
    resetCalculator();
    calculateAndDisplay();
  });

  document.getElementById("feedback-yes").addEventListener("click", () => alert("Thanks for your feedback!"));
  document.getElementById("feedback-no").addEventListener("click", () => alert("Sorry to hear that. We will improve!"));

  calculateAndDisplay();
}

function updateIndustryOptions() {
  const platform = document.getElementById("platform-select").value;
  const industrySelect = document.getElementById("industry-select");
  const industries = unique(
    ROWS.filter((r) => r.platform === platform && !isNaN(readCTR(r))).map((r) => r.industry)
  );
  industrySelect.innerHTML = industries.map((ind) => `<option value="${ind}">${ind}</option>`).join("");
}

function calculateAndDisplay() {
  const platform = document.getElementById("platform-select").value;
  const industry = document.getElementById("industry-select").value;
  const impressions = parseFloat(document.getElementById("impressions").value);
  const clicks = parseFloat(document.getElementById("clicks").value);
  const resultDiv = document.getElementById("result-display");
  const suggestionsDiv = document.getElementById("suggestions");

  if (!(impressions > 0) || !(clicks >= 0) || !industry) {
    resultDiv.innerHTML = "<p>Please fill in all fields with valid values.</p>";
    suggestionsDiv.innerHTML = "";
    return;
  }

  const row = findRowForCTR(platform, industry);
  if (!row) {
    resultDiv.innerHTML = `<p>Benchmark data unavailable for "${platform}" / "${industry}".</p>`;
    suggestionsDiv.innerHTML = "";
    return;
  }

  const benchmarkCTR = readCTR(row);
  if (isNaN(benchmarkCTR)) {
    resultDiv.innerHTML = `<p>CTR benchmark missing for "${platform}" / "${industry}".</p>`;
    suggestionsDiv.innerHTML = "";
    return;
  }

  const userCTR = (clicks / impressions) * 100;
  const diff = userCTR - benchmarkCTR;
  let statusText = "";
  let color = "";

  if (diff > 0) {
    statusText = "Above Benchmark";
    color = "green";
  } else if (diff < 0) {
    statusText = "Below Benchmark";
    color = "red";
  } else {
    statusText = "At Benchmark";
    color = "gray";
  }

  resultDiv.innerHTML = `
    <p><strong>Your CTR:</strong> ${userCTR.toFixed(2)}%</p>
    <p><strong>Industry Benchmark (${industry}${row.campaign_objective ? ` • ${row.campaign_objective}` : ""}):</strong> ${benchmarkCTR.toFixed(2)}%</p>
    <p style="color: ${color}; font-weight: bold;">${statusText}</p>
  `;

  suggestionsDiv.innerHTML = generateSuggestions(diff);
}

function resetCalculator() {
  const platformSelect = document.getElementById("platform-select");
  platformSelect.selectedIndex = 0;
  updateIndustryOptions();
  const industrySelect = document.getElementById("industry-select");
  industrySelect.selectedIndex = 0;
  document.getElementById("impressions").value = "";
  document.getElementById("clicks").value = "";
  document.getElementById("result-display").innerHTML = "";
  document.getElementById("suggestions").innerHTML = "";
}

function generateSuggestions(diff) {
  if (diff > 0) {
    return `
      <ul>
        <li>Excellent! Your CTR is higher than the industry average.</li>
        <li>Consider expanding your audience or increasing bids.</li>
      </ul>
    `;
  } else if (diff < 0) {
    return `
      <ul>
        <li>Your CTR is below the benchmark. Try improving ad creatives.</li>
        <li>Refine your targeting or test A/B variants.</li>
      </ul>
    `;
  } else {
    return `<p>Your CTR is on par with the industry benchmark. Keep monitoring performance.</p>`;
  }
}
