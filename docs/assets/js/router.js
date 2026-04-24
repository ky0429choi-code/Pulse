export function initTabs() {
  const tabs = document.getElementById("tabs");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });
}
export function switchTab(tabId){
  document.querySelectorAll(".tab").forEach(b=>b.classList.remove("on"));
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("on"));
  document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add("on");
  document.getElementById(`p-${tabId}`)?.classList.add("on");
}
