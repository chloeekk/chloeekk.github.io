document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("ctr-calculator");

  if (!container) {
    console.error("⚠️ Container for CTR calculator not found");
    return;
  }

  // 加载行业基准数据
  fetch("/data/industry-ctr.json")
    .then(res => res.json())
    .then(data => {
      window.industryCTRData = data;
      initCalculator(container, data);
    })
    .catch(err => {
      container.innerHTML = "<p>Error loading benchmark data.</p>";
      console.error("Error loading data:", err);
    });
});

function initCalculator(container, data) {
  const platforms = Object.keys(data);

  container.innerHTML = `
    <div class="calculator-panel">
      <div class="input-group">
        <label for="platform-select">Ad Platform:</label>
        <select id="platform-select">
          ${platforms.map(p => `<option value="${p}">${p}</option>`).join('')}
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
        <button id="feedback-yes" class="feedback-btn" type="button">Yes</button>
        <button id="feedback-no" class="feedback-btn" type="button">No</button>
      </div>
    </div>
  `;

  // 事件绑定
  const platformSelect = document.getElementById("platform-select");
  const industrySelect = document.getElementById("industry-select");
  const impressionsInput = document.getElementById("impressions");
  const clicksInput = document.getElementById("clicks");
  const reloadBtn = document.getElementById("reload-btn");

  platformSelect.addEventListener("change", () => {
    updateIndustryOptions(data);
    calculateAndDisplay(data);
  });

  industrySelect.addEventListener("change", () => calculateAndDisplay(data));
  impressionsInput.addEventListener("input", () => calculateAndDisplay(data));
  clicksInput.addEventListener("input", () => calculateAndDisplay(data));

  reloadBtn.addEventListener("click", () => {
    resetCalculator();
    calculateAndDisplay(data);
  });

  document.getElementById("feedback-yes").addEventListener("click", () => alert("Thanks for your feedback!"));
  document.getElementById("feedback-no").addEventListener("click", () => alert("Sorry to hear that. We will improve!"));

  // 初始化
  updateIndustryOptions(data);
  calculateAndDisplay(data);
}

function updateIndustryOptions(data) {
  const platform = document.getElementById("platform-select").value;
  const industrySelect = document.getElementById("industry-select");

  const industries = Object.keys(data[platform]);
  industrySelect.innerHTML = industries.map(ind => `<option value="${ind}">${ind}</option>`).join('');
}

function calculateAndDisplay(data) {
  const platform = document.getElementById("platform-select").value;
  const industry = document.getElementById("industry-select").value;
  const impressions = parseFloat(document.getElementById("impressions").value);
  const clicks = parseFloat(document.getElementById("clicks").value);
  const resultDiv = document.getElementById("result-display");
  const suggestionsDiv = document.getElementById("suggestions");

  if (!impressions || impressions <= 0 || !clicks || !industry) {
    resultDiv.innerHTML = "<p>Please fill in all fields with valid values.</p>";
    suggestionsDiv.innerHTML = "";
    return;
  }

  const benchmarkCTR = data[platform][industry];
  if (typeof benchmarkCTR !== "number") {
    resultDiv.innerHTML = `<p>Benchmark data unavailable for industry "${industry}".</p>`;
    suggestionsDiv.innerHTML = "";
    return;
  }

  const userCTR = ((clicks / impressions) * 100).toFixed(2);
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
    <p><strong>Your CTR:</strong> ${userCTR}%</p>
    <p><strong>Industry Benchmark (${industry}):</strong> ${benchmarkCTR.toFixed(2)}%</p>
    <p style="color: ${color}; font-weight: bold;">${statusText}</p>
  `;

  suggestionsDiv.innerHTML = generateSuggestions(diff);
}

function resetCalculator() {
  document.getElementById("platform-select").selectedIndex = 0;
  updateIndustryOptions(window.industryCTRData);
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
