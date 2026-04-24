import { card } from "../components/ui.js";

export function renderCalculators(){
  const root = document.getElementById("p-calc");
  root.innerHTML = card("Calculators", `
    <div class="small">Calculator tools are reserved for the next iteration.</div>
    <div class="hr"></div>
    <div class="small">For now, check KPI and comparison metrics in Dashboard.</div>
  `);
}
