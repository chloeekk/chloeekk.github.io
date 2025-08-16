// cvr-calculator.js 

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

// Parse % string or number to percentage value (e.g. "4.5%" → 4.5)
function parsePercent(val) {
  if (typeof val === "number") return val * 100; // e.g. 0.045 → 4.5%
  if (typeof val === "string") {
    const n = Number(val.replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? NaN : n;
  }
  return NaN;
}

// Read CVR value from row
function readCVR(row) {
  if (!row) return NaN;
  if (row.metrics && typeof row.metrics.cvr === "number") return row.metrics.cvr * 100;
  return parsePercent(row.average_cvr);
}

// Objective preference per platform (optional)
const OBJECTIVE_PREF = {
  Google: ["Search"],
  Meta: ["Leads", "Conversions"],
  Bing: []
};

function findRowForCVR(platform, industry) {
  const candidates = ROWS.filter(
    (r) => r.platform === platform && r.industry === industry && !isNaN(readCVR(r))
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
    console.error("⚠️ Container for CVR calculator not found");
    return;
  }

  ROWS = toRows(data);
  if (!ROWS.length) {
    container.innerHTML = "<p>❌ No CVR benchmark data available.</p>";
    return;
  }

  const platforms = unique(ROWS.map((r) => r.platform).filter(Boolean));

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

      <div class="input-group" id="objective-group" style="display:none;">
        <label for="objective-select">Campaign Objective:</label>
        <select id="objective-select"></select>
      </div>

      <div class="input-group">
        <label for="clicks">Clicks:</label>
        <input type="number" id="clicks" min="0" placeholder="e.g. 1000" />
      </div>

      <div class="input-group">
        <label for="conversions">Conversions:</label>
        <input type="number" id="conversions" min="0" placeholder="e.g. 50" />
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
  updateObjectiveOptions(); // new

  document.getElementById("platform-select").addEventListener("change", () => {
    updateIndustryOptions();
    updateObjectiveOptions();
    calculateAndDisplay();
  });
  document.getElementById("industry-select").addEventListener("change", () => {
    updateObjectiveOptions();
    calculateAndDisplay();
  });
  document.getElementById("objective-select").addEventListener("change", () => calculateAndDisplay());
  document.getElementById("clicks").addEventListener("input", () => calculateAndDisplay());
  document.getElementById("conversions").addEventListener("input", () => calculateAndDisplay());
  document.getElementById("reload-btn").addEventListener("click", () => {
    resetCalculator();
    calculateAndDisplay();
  });

  document.getElementById("feedback-yes").addEventListener("click", () => alert("Thanks for your feedback!"));
  document.getElementById("feedback-no").addEventListener("click", () => alert("Sorry to hear that. We will improve!"));

  calculateAndDisplay();
}

// Update industry options
function updateIndustryOptions() {
  const platform = document.getElementById("platform-select").value;
  const industrySelect = document.getElementById("industry-select");
  const industries = unique(
    ROWS.filter((r) => r.platform === platform && !isNaN(readCVR(r))).map((r) => r.industry)
  );
  industrySelect.innerHTML = industries.map((ind) => `<option value="${ind}">${ind}</option>`).join("");
}

// Update objective options (only show for Meta)
function updateObjectiveOptions() {
  const platform = document.getElementById("platform-select").value;
  const industry = document.getElementById("industry-select").value;
  const objectiveGroup = document.getElementById("objective-group");
  const objectiveSelect = document.getElementById("objective-select");

  if (platform === "Meta") {
    const objectives = unique(
      ROWS.filter((r) => r.platform === platform && r.industry === industry && r.campaign_objective)
          .map((r) => r.campaign_objective)
    );
    if (objectives.length > 0) {
      objectiveGroup.style.display = "block";
      objectiveSelect.innerHTML = objectives.map((o) => `<option value="${o}">${o}</option>`).join("");
      return;
    }
  }
  objectiveGroup.style.display = "none";
  objectiveSelect.innerHTML = "";
}

// Calculate and display CVR vs benchmark
function calculateAndDisplay() {
  const platform = document.getElementById("platform-select").value;
  const industry = document.getElementById("industry-select").value;
  const objectiveSelect = document.getElementById("objective-select");
  const objective = objectiveSelect?.value || null;
  const clicks = parseFloat(document.getElementById("clicks").value);
  const conversions = parseFloat(document.getElementById("conversions").value);
  const resultDiv = document.getElementById("result-display");
  const suggestionsDiv = document.getElementById("suggestions");

  if (!(clicks > 0) || !(conversions >= 0) || !industry) {
    resultDiv.innerHTML = "<p>Please fill in all fields with valid values.</p>";
    suggestionsDiv.innerHTML = "";
    return;
  }

  let row;
  if (platform === "Meta" && objective) {
    row = ROWS.find(
      (r) =>
        r.platform === platform &&
        r.industry === industry &&
        (r.campaign_objective || "") === objective
    );
  } else {
    row = findRowForCVR(platform, industry);
  }

  if (!row) {
    resultDiv.innerHTML = `<p>Benchmark data unavailable for "${platform}" / "${industry}"${objective ? ` / "${objective}"` : ""}.</p>`;
    suggestionsDiv.innerHTML = "";
    return;
  }

  const benchmarkCVR = readCVR(row);
  if (isNaN(benchmarkCVR)) {
    resultDiv.innerHTML = `<p>CVR benchmark missing for "${platform}" / "${industry}"${objective ? ` / "${objective}"` : ""}.</p>`;
    suggestionsDiv.innerHTML = "";
    return;
  }

  const userCVR = (conversions / clicks) * 100;
  const diff = userCVR - benchmarkCVR;
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
    <p><strong>Your CVR:</strong> ${userCVR.toFixed(2)}%</p>
    <p><strong>Industry Benchmark (${industry}${row.campaign_objective ? ` • ${row.campaign_objective}` : ""}):</strong> ${benchmarkCVR.toFixed(2)}%</p>
    <p style="color: ${color}; font-weight: bold;">${statusText}</p>
  `;

  suggestionsDiv.innerHTML = generateSuggestions(diff);
}

function resetCalculator() {
  const platformSelect = document.getElementById("platform-select");
  platformSelect.selectedIndex = 0;
  updateIndustryOptions();
  updateObjectiveOptions();
  document.getElementById("industry-select").selectedIndex = 0;
  document.getElementById("clicks").value = "";
  document.getElementById("conversions").value = "";
  document.getElementById("result-display").innerHTML = "";
  document.getElementById("suggestions").innerHTML = "";
}

function generateSuggestions(diff) {
  if (diff > 0) {
    return `
      <ul>
        <li>Excellent! Your CVR is higher than the industry average.</li>
        <li>Consider scaling your campaigns and replicating successful strategies.</li>
      </ul>
    `;
  } else if (diff < 0) {
    return `
      <ul>
        <li>Your CVR is below the benchmark. Optimize landing pages and funnel steps.</li>
        <li>Check user intent alignment and test different CTAs.</li>
      </ul>
    `;
  } else {
    return `<p>Your CVR is on par with the industry benchmark. Maintain consistency and monitor trends.</p>`;
  }
}
