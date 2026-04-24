import { card, kv } from "../components/ui.js";

export function renderReference(){
  const root = document.getElementById("p-ref");
  root.innerHTML = card("Reference", `
    ${kv("Base meal target", "7,800 meals")}
    ${kv("Max serving weight", "200 g")}
    <div class="hr"></div>
    <div class="small">Use this area for fixed operating references and local rules.</div>
  `);
}
