document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("cpc-calculator");

  if (!container) {
    console.error("⚠️ Container for CPC calculator not found");
    return;
  }

  // Load industry benchmark data JSON
  fetch("/data/industry-cpc.json")
    .then((res) => res.json())
    .then((data) => {
      // Store data globally for reset function
      window.industryCPCData = data;
      initCalculator(container, data);
    })
    .catch((err) => {
      container.innerHTML = "<p>Error loading benchmark data.</p>";
      console.error("Error loading data:", err);
    });
});

// Initialize calculator UI and event listeners
function initCalculator(container, data) {
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

  updateIndustryOptions(data);

  // Event listeners for inputs and buttons
  document.getElementById("platform-select").addEventListener("change", () => {
    updateIndustryOptions(data);
    calculateAndDisplay(data);
  });
  document.getElementById("industry-select").addEventListener("change", () => calculateAndDisplay(data));
  document.getElementById("ad-spend").addEventListener("input", () => calculateAndDisplay(data));
  document.getElementById("clicks").addEventListener("input", () => calculateAndDisplay(data));

  document.getElementById("reload-btn").addEventListener("click", () => {
    resetCalculator();
    calculateAndDisplay(data);
  });

  document.getElementById("feedback-yes").addEventListener("click", () => alert("Thanks for your feedback!"));
  document.getElementById("feedback-no").addEventListener("click", () => alert("Sorry to hear that. We will improve!"));

  // Initial calculation on load
  calculateAndDisplay(data);
}

// Update industry dropdown options based on selected platform
function updateIndustryOptions(data) {
  const platform = document.getElementById("platform-select").value;
  const industries = Object.keys(data[platform]);
  const industrySelect = document.getElementById("industry-select");

  industrySelect.innerHTML = industries.map(ind => `<option value="${ind}">${ind}</option>`).join('');
}

// Calculate CPC, compare with benchmark, display result and suggestions
function calculateAndDisplay(data) {
  const platform = document.getElementById("platform-select").value;
  const industry = document.getElementById("industry-select").value;
  const adSpend = parseFloat(document.getElementById("ad-spend").value);
  const clicks = parseFloat(document.getElementById("clicks").value);
  const resultDiv = document.getElementById("result-display");
  const suggestionsDiv = document.getElementById("suggestions");

  // Validate inputs
  if (!adSpend || !clicks || clicks === 0 || !industry) {
    resultDiv.innerHTML = "<p>Please fill in all fields with valid values.</p>";
    suggestionsDiv.innerHTML = "";
    return;
  }

  const userCPC = (adSpend / clicks).toFixed(2);
  const benchmarkCPC = data[platform][industry];

  if (typeof benchmarkCPC !== "number") {
    resultDiv.innerHTML = "<p>Benchmark data unavailable for this industry.</p>";
    suggestionsDiv.innerHTML = "";
    return;
  }

  const diff = userCPC - benchmarkCPC;
  let statusText = "";
  let color = "";

  // Set status text and color based on CPC comparison
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

  // Display results
  resultDiv.innerHTML = `
    <p><strong>Your CPC:</strong> $${userCPC}</p>
    <p><strong>Industry Benchmark (${industry}):</strong> $${benchmarkCPC.toFixed(2)}</p>
    <p style="color: ${color}; font-weight: bold;">${statusText}</p>
  `;

  // Display suggestions based on difference
  suggestionsDiv.innerHTML = generateSuggestions(diff, platform, industry);
}

// Reset all inputs and results to initial state
function resetCalculator() {
  document.getElementById("platform-select").selectedIndex = 0;
  updateIndustryOptions(window.industryCPCData);
  document.getElementById("ad-spend").value = "";
  document.getElementById("clicks").value = "";
  document.getElementById("result-display").innerHTML = "";
  document.getElementById("suggestions").innerHTML = "";
}

// Generate optimization suggestions based on CPC difference
function generateSuggestions(diff, platform, industry) {
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
