// cvr-calculator.js

export function initCalculator(container, data) {
  if (!container) {
    console.error("⚠️ Container for CVR calculator not found");
    return;
  }

  // Store data globally for use in reset
  window.industryCVRData = data;

  const platforms = Object.keys(data);

  // Render calculator HTML
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
        <button id="feedback-yes" class="feedback-btn" type="button">Yes</button>
        <button id="feedback-no" class="feedback-btn" type="button">No</button>
      </div>
    </div>
  `;

  updateIndustryOptions(data);

  // Attach input event listeners
  document.getElementById("platform-select").addEventListener("change", () => {
    updateIndustryOptions(data);
    calculateAndDisplay(data);
  });
  document.getElementById("industry-select").addEventListener("change", () => calculateAndDisplay(data));
  document.getElementById("clicks").addEventListener("input", () => calculateAndDisplay(data));
  document.getElementById("conversions").addEventListener("input", () => calculateAndDisplay(data));

  // Reset button handler
  document.getElementById("reload-btn").addEventListener("click", () => {
    resetCalculator();
    calculateAndDisplay(data);
  });

  // Feedback handlers
  document.getElementById("feedback-yes").addEventListener("click", () => alert("Thanks for your feedback!"));
  document.getElementById("feedback-no").addEventListener("click", () => alert("Sorry to hear that. We will improve!"));

  // Initial render
  calculateAndDisplay(data);
}

// Populate industry options based on selected platform
function updateIndustryOptions(data) {
  const platform = document.getElementById("platform-select").value;
  const industries = Object.keys(data[platform]);
  const industrySelect = document.getElementById("industry-select");

  industrySelect.innerHTML = industries.map(ind => `<option value="${ind}">${ind}</option>`).join('');
}

// Calculate and update CVR results
function calculateAndDisplay(data) {
  const platform = document.getElementById("platform-select").value;
  const industry = document.getElementById("industry-select").value;
  const clicks = parseFloat(document.getElementById("clicks").value);
  const conversions = parseFloat(document.getElementById("conversions").value);
  const resultDiv = document.getElementById("result-display");
  const suggestionsDiv = document.getElementById("suggestions");

  if (!clicks || clicks <= 0 || !conversions || conversions < 0 || !industry) {
    resultDiv.innerHTML = "<p>Please fill in all fields with valid values.</p>";
    suggestionsDiv.innerHTML = "";
    return;
  }

  const benchmarkCVR = data[platform][industry];
  if (typeof benchmarkCVR !== "number") {
    resultDiv.innerHTML = `<p>Benchmark data unavailable for industry "${industry}".</p>`;
    suggestionsDiv.innerHTML = "";
    return;
  }

  const userCVR = ((conversions / clicks) * 100).toFixed(2);
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
    <p><strong>Your CVR:</strong> ${userCVR}%</p>
    <p><strong>Industry Benchmark (${industry}):</strong> ${benchmarkCVR.toFixed(2)}%</p>
    <p style="color: ${color}; font-weight: bold;">${statusText}</p>
  `;

  suggestionsDiv.innerHTML = generateSuggestions(diff);
}

// Reset the calculator UI
function resetCalculator() {
  document.getElementById("platform-select").selectedIndex = 0;
  updateIndustryOptions(window.industryCVRData);
  document.getElementById("clicks").value = "";
  document.getElementById("conversions").value = "";
  document.getElementById("result-display").innerHTML = "";
  document.getElementById("suggestions").innerHTML = "";
}

// Suggest actions based on performance
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
