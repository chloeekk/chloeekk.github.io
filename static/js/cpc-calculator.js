document.addEventListener("DOMContentLoaded", function () {
  const industrySelect = document.getElementById("industry");
  const channelSelect = document.getElementById("channel");
  const adSpendInput = document.getElementById("adSpend");
  const clicksInput = document.getElementById("clicks");

  const cpcResult = document.getElementById("cpcResult");
  const benchmarkValue = document.getElementById("benchmarkValue");
  const comparisonResult = document.getElementById("comparisonResult");
  const optimizationTips = document.getElementById("optimizationTips");

  function populateIndustries() {
    industrySelect.innerHTML = "";
    const channel = channelSelect.value;
    const industries = Object.keys(window.benchmarkData[channel]);
    industries.forEach(ind => {
      const opt = document.createElement("option");
      opt.value = ind;
      opt.textContent = ind.replace(/_/g, " ");
      industrySelect.appendChild(opt);
    });
  }

  function calculateCPC() {
    const channel = channelSelect.value;
    const industry = industrySelect.value;
    const spend = parseFloat(adSpendInput.value);
    const clicks = parseInt(clicksInput.value);

    if (!channel || !industry || isNaN(spend) || isNaN(clicks) || clicks <= 0) {
      cpcResult.textContent = "-";
      benchmarkValue.textContent = "-";
      comparisonResult.textContent = "";
      optimizationTips.innerHTML = "";
      return;
    }

    const cpc = spend / clicks;
    const benchmark = window.benchmarkData[channel][industry];

    cpcResult.textContent = cpc.toFixed(2);
    benchmarkValue.textContent = benchmark.toFixed(2);

    if (cpc > benchmark) {
      comparisonResult.textContent = "Above Benchmark";
      comparisonResult.className = "above";
      optimizationTips.innerHTML = `
        <li>优化广告定向</li>
        <li>改进广告创意素材</li>
        <li>使用 A/B 测试提高点击率</li>
      `;
    } else {
      comparisonResult.textContent = "Below Benchmark";
      comparisonResult.className = "below";
      optimizationTips.innerHTML = `
        <li>表现良好，继续保持！</li>
        <li>考虑增加预算获取更多点击</li>
      `;
    }
  }

  channelSelect.addEventListener("change", () => {
    populateIndustries();
    calculateCPC();
  });

  industrySelect.addEventListener("change", calculateCPC);
  adSpendInput.addEventListener("input", calculateCPC);
  clicksInput.addEventListener("input", calculateCPC);

  document.getElementById("resetBtn").addEventListener("click", () => {
    adSpendInput.value = "";
    clicksInput.value = "";
    comparisonResult.textContent = "";
    cpcResult.textContent = "-";
    benchmarkValue.textContent = "-";
    optimizationTips.innerHTML = "";
  });

  populateIndustries(); // 初始加载
});
