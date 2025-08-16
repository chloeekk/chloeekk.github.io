// cpa-calculator.js

let ROWS = []; // normalized data cache

const unique = (arr) => [...new Set(arr)];

// Normalize raw JSON into rows array
function toRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.rows)) return raw.rows;
    if (Array.isArray(raw.items)) return raw.items;
    return Object.values(raw);
  }
  return [];
}

// Read CPA from row
function readCPA(row) {
  if (!row) return NaN;
  if (row.metrics && typeof row.metrics.cpa === "number") {
    return row.metrics.cpa;
  }
  return NaN;
}

function findRowForCPA(platform, industry) {
  const candidates = ROWS.filter(
    (r) => r.platform === platform && r.industry === industry && !isNaN(readCPA(r))
  );
  return candidates[0] || null;
}

export function initCalculator(container, data) {
  if (!container) {
    console.error("⚠️ Container for CPA calculator not found");
    return;
  }

  ROWS = toRows(data);

  if (!ROWS.length) {
    container.innerHTML = "<p>❌ No CPA benchmark data available.</p>";
    return;
  }

  const platforms = unique(ROWS.map((r) => r.platform).filter(Boolean));

  container.innerHTML = `
    <div class="calculator-panel">

      <div class="input-group">
        <label for="platform-select">Ad Platform:</label>
        <select id="platform-select">
          ${platforms.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>
      </div>

      <div class="input-group">
        <label for="industry-select">Industry:</label>
        <select id="industry-select"></select>
      </div>

      <div class="input-group">
        <label for="cost">Total Cost ($):</label>
        <input type="number" id="cost" min="0" placeholder="e.g. 500" />
      </div>

      <div class="input-group">
        <label for="conversions">Conversions:</label>
        <input type="number" id="conversions" min="0" placeholder="e.g. 20" />
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
  document.getElementById("cost").addEventListener("input", () => calculateAndDisplay());
  document.getElementById("conversions").addEventListener("input", () => calculateAndDisplay());
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
    ROWS.filter(r => r.platform === platform && !isNaN(readCPA(r))).map(r => r.industry)
  );
  industrySelect.innerHTML = industries.map(ind => `<option value="${ind}">${ind}</option>`).join("");
}

function calculateAndDisplay() {
  const platform = document.getElementById("platform-select").value;
  const industry = document.getElementById("industry-select").value;
  const cost = parseFloat(document.getElementById("cost").value);
  const conversions = parseFloat(document.getElementById("conversions").value);
  const resultDiv = document.getElementById("result-display");
  const suggestionsDiv = document.getElementById("suggestions");

  if (!industry || !cost || !conversions || cost <= 0 || conversions <= 0) {
    resultDiv.innerHTML = "<p>Please fill in all fields with valid values.</p>";
    suggestionsDiv.innerHTML = "";
    return;
  }

  const row = findRowForCPA(platform, industry);
  if (!row) {
    resultDiv.innerHTML = `<p>Benchmark data unavailable for "${platform}" / "${industry}".</p>`;
    suggestionsDiv.innerHTML = "";
    return;
  }

  const benchmarkCPA = readCPA(row);
  const userCPA = cost / conversions;
  const diff = benchmarkCPA - userCPA;

  let statusText = "", color = "";
  if (diff > 0) {
    statusText = "Below Benchmark (Great!)";
    color = "green";
  } else if (diff < 0) {
    statusText = "Above Benchmark (Needs Improvement)";
    color = "red";
  } else {
    statusText = "At Benchmark";
    color = "gray";
  }

  resultDiv.innerHTML = `
    <p><strong>Your CPA:</strong> $${userCPA.toFixed(2)}</p>
    <p><strong>Industry Benchmark (${industry}):</strong> $${benchmarkCPA.toFixed(2)}</p>
    <p style="color: ${color}; font-weight: bold;">${statusText}</p>
  `;

  suggestionsDiv.innerHTML = generateSuggestions(diff);
}

function resetCalculator() {
  document.getElementById("platform-select").selectedIndex = 0;
  updateIndustryOptions();
  document.getElementById("cost").value = "";
  document.getElementById("conversions").value = "";
  document.getElementById("result-display").innerHTML = "";
  document.getElementById("suggestions").innerHTML = "";
}

function generateSuggestions(diff) {
  if (diff > 0) {
    return `
      <ul>
        <li>Great job! Your CPA is better than industry standards.</li>
        <li>Consider scaling up your campaigns while maintaining quality.</li>
      </ul>
    `;
  } else if (diff < 0) {
    return `
      <ul>
        <li>Your CPA is higher than benchmark. Review ad spend efficiency.</li>
        <li>Optimize your conversion funnel or landing page experience.</li>
      </ul>
    `;
  } else {
    return `<p>Your CPA matches the industry benchmark. Maintain performance and look for incremental gains.</p>`;
  }
}
