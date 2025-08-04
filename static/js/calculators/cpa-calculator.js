// cpa-calculator.js

export function initCalculator(container, data) {
  if (!container) {
    console.error("⚠️ Container for CPA calculator not found");
    return;
  }

  // Store data to global variable for reuse in reset
  window.industryCPAData = data;

  const platforms = Object.keys(data);

  // Render HTML structure inside container
  container.innerHTML = `
    <div class="calculator-panel">

      <div class="input-group">
        <label for="platform-select">Ad Platform:</label>
        <select id="platform-select">${platforms.map(p => `<option value="${p}">${p}</option>`).join('')}</select>
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
        <button id="feedback-yes" class="feedback-btn" type="button">Yes</button>
        <button id="feedback-no" class="feedback-btn" type="button">No</button>
      </div>
    </div>
  `;

  updateIndustryOptions(data);

  // Bind input event listeners
  document.getElementById("platform-select").addEventListener("change", () => {
    updateIndustryOptions(data);
    calculateAndDisplay(data);
  });
  document.getElementById("industry-select").addEventListener("change", () => calculateAndDisplay(data));
  document.getElementById("cost").addEventListener("input", () => calculateAndDisplay(data));
  document.getElementById("conversions").addEventListener("input", () => calculateAndDisplay(data));

  // Reload/reset
  document.getElementById("reload-btn").addEventListener("click", () => {
    resetCalculator();
    calculateAndDisplay(data);
  });

  // Feedback
  document.getElementById("feedback-yes").addEventListener("click", () => alert("Thanks for your feedback!"));
  document.getElementById("feedback-no").addEventListener("click", () => alert("Sorry to hear that. We will improve!"));

  // Initial run
  calculateAndDisplay(data);
}

// Update industry dropdown based on selected platform
function updateIndustryOptions(data) {
  const platform = document.getElementById("platform-select").value;
  const industries = Object.keys(data[platform]);
  const industrySelect = document.getElementById("industry-select");

  industrySelect.innerHTML = industries.map(ind => `<option value="${ind}">${ind}</option>`).join('');
}

// Perform CPA calculation and update UI
function calculateAndDisplay(data) {
  const platform = document.getElementById("platform-select").value;
  const industry = document.getElementById("industry-select").value;
  const cost = parseFloat(document.getElementById("cost").value);
  const conversions = parseFloat(document.getElementById("conversions").value);
  const resultDiv = document.getElementById("result-display");
  const suggestionsDiv = document.getElementById("suggestions");

  if (!cost || cost <= 0 || !conversions || conversions <= 0 || !industry) {
    resultDiv.innerHTML = "<p>Please fill in all fields with valid values.</p>";
    suggestionsDiv.innerHTML = "";
    return;
  }

  const benchmarkCPA = data[platform][industry];
  if (typeof benchmarkCPA !== "number") {
    resultDiv.innerHTML = `<p>Benchmark data unavailable for industry "${industry}".</p>`;
    suggestionsDiv.innerHTML = "";
    return;
  }

  const userCPA = (cost / conversions).toFixed(2);
  const diff = benchmarkCPA - userCPA;
  let statusText = "";
  let color = "";

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
    <p><strong>Your CPA:</strong> $${userCPA}</p>
    <p><strong>Industry Benchmark (${industry}):</strong> $${benchmarkCPA.toFixed(2)}</p>
    <p style="color: ${color}; font-weight: bold;">${statusText}</p>
  `;

  suggestionsDiv.innerHTML = generateSuggestions(diff);
}

// Reset all fields
function resetCalculator() {
  document.getElementById("platform-select").selectedIndex = 0;
  updateIndustryOptions(window.industryCPAData);
  document.getElementById("cost").value = "";
  document.getElementById("conversions").value = "";
  document.getElementById("result-display").innerHTML = "";
  document.getElementById("suggestions").innerHTML = "";
}

// Generate suggestions based on CPA comparison
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
