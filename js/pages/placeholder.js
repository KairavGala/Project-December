window.PD = window.PD || {};
PD.Pages = window.PD.Pages || {};

// One honest "not built yet" renderer shared by every unbuilt route, instead
// of six near-identical page files. No fake data, no fake progress bars.
PD.Pages.renderPlaceholder = function (container, meta) {
  var wrap = PD.Utils.createEl("div", { class: "page placeholder-page" });
  wrap.appendChild(PD.Utils.createEl("div", { class: "placeholder-phase", text: meta.phase }));
  wrap.appendChild(PD.Utils.createEl("h1", { class: "page-title", text: meta.title }));
  wrap.appendChild(PD.Utils.createEl("p", { class: "page-subtitle", text: meta.description }));
  container.appendChild(wrap);
};
