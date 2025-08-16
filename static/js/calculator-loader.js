console.log("📦 Calculator loader loaded.");

document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("calculator-app");
  const calcIdMeta = document.querySelector('meta[name="calculator_id"]');
  const calcId = calcIdMeta ? calcIdMeta.getAttribute('content') : null;
  console.log("Calculator container:", app);
  console.log("Calculator ID from meta:", calcId);

  if (!app || !calcId) {
    console.error("Calculator container or ID missing.");
    return;
  }

  // Dynamically import calculator module
  import(`/js/calculators/${calcId}-calculator.js`)
    .then(module => {
      console.log("Calculator module loaded:", module);

      // ✅ Always load the same benchmark dataset
      fetch(`/data/platform_industry_benchmark.json`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log("📊 Benchmark data loaded:", data);

          // Attach to global scope if needed
          window.platformIndustryBenchmark = data;

          if (module.initCalculator) {
            console.log("Calling initCalculator...");
            // Pass the entire dataset into calculator
            module.initCalculator(app, data);
          } else {
            console.error("initCalculator function not found in module.");
          }
        })
        .catch(err => {
          app.innerHTML = `<p>❌ Failed to load benchmark data: ${err.message}</p>`;
          console.error("Failed to load data:", err);
        });
    })
    .catch(err => {
      app.innerHTML = `<p>❌ Failed to load calculator module: ${err.message}</p>`;
      console.error("Failed to import calculator module:", err);
    });
});
