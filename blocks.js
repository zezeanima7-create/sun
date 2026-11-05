(() => {
  const area = document.getElementById("visual-blocks");
  const code = document.getElementById("code");
  const blocks = [];
  const t = key => (window.SUN_LANGUAGES[document.getElementById("language").value] || window.SUN_LANGUAGES.pt).commands[key];
  function render() {
    area.innerHTML = "";
    if (!blocks.length) {
      const empty = document.createElement("div");
      empty.className = "empty-blocks";
      empty.textContent = (window.SUN_LANGUAGES[document.getElementById("language").value] || window.SUN_LANGUAGES.pt).ui["empty-blocks"];
      area.append(empty); return;
    }
    blocks.forEach((block,index) => {
      const row = document.createElement("div");
      row.className = "visual-block " + block.type;
      const label = document.createElement("strong");
      label.textContent = block.type === "say" ? t("say") : block.type === "variable" ? t("let") : t("repeat");
      const first = document.createElement("input");
      first.value = block.a;
      first.setAttribute("aria-label", "Conteúdo do bloco");
      first.addEventListener("input", () => { block.a = first.value; sync(); });
      row.append(label,first);
      if (block.type === "variable") {
        const second = document.createElement("input"); second.value=block.b; second.placeholder="valor";
        second.setAttribute("aria-label","Valor da variável");
        second.addEventListener("input",()=>{block.b=second.value;sync();}); row.append(second);
      }
      const remove = document.createElement("button"); remove.textContent="×"; remove.title="Remover bloco";
      remove.addEventListener("click",()=>{blocks.splice(index,1);render();sync();}); row.append(remove);
      area.append(row);
    });
  }
  function sync() {
    const lines = blocks.map(b => {
      if (b.type === "say") return t("say") + ' "' + b.a.replace(/"/g,'\\"') + '"';
      if (b.type === "variable") return t("let") + " " + b.a + " = " + b.b;
      return t("repeat") + " " + (Number(b.a)||1) + " " + t("times") + ":\n    " + t("say") + ' "Olá!"\n' + t("end");
    });
    if (blocks.length) { code.value=lines.join("\n"); code.dispatchEvent(new Event("input")); }
  }
  document.querySelectorAll("[data-block]").forEach(button => button.addEventListener("click",()=>{
    const type=button.dataset.block;
    blocks.push(type==="say"?{type,a:"Olá!"}:type==="variable"?{type,a:"pontos",b:"10"}:{type,a:"3"});
    render();sync();
  }));
  document.getElementById("language").addEventListener("change",()=>{if(blocks.length){render();sync();}});
  window.SunBlocks = {clear(){blocks.splice(0);render();},render};
  render();
})();