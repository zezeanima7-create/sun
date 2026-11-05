(() => {
  const area = document.getElementById("visual-blocks");
  const code = document.getElementById("code");
  const blocks = [];
  const t = key => (window.SUN_LANGUAGES[document.getElementById("language").value] || window.SUN_LANGUAGES.pt).commands[key];
  const ui = key => (window.SUN_LANGUAGES[document.getElementById("language").value] || window.SUN_LANGUAGES.pt).ui[key];
  function field(value, placeholder, label, onInput) {
    const input=document.createElement("input");
    input.value=value; input.placeholder=placeholder; input.setAttribute("aria-label",label);
    input.addEventListener("input",()=>onInput(input.value));
    return input;
  }
  function render() {
    area.innerHTML = "";
    if (!blocks.length) {
      const empty = document.createElement("div");
      empty.className = "empty-blocks";
      empty.textContent = ui("empty-blocks");
      area.append(empty); return;
    }
    blocks.forEach((block,index) => {
      const row = document.createElement("div");
      row.className = "visual-block " + block.type;
      const label = document.createElement("strong");
      label.textContent = block.type === "say" ? ui("say") : block.type === "variable" ? ui("variable") : block.type === "if" ? ui("if-block") : block.type === "while" ? ui("while") : ui("repeat");
      row.append(label);
      if(block.type==="say") row.append(field(block.a,"Olá!","Texto a mostrar",v=>{block.a=v;sync();}));
      if(block.type==="variable") {
        row.append(field(block.a,"pontos","Nome da variável",v=>{block.a=v;sync();}));
        row.append(field(block.b,"10","Valor da variável",v=>{block.b=v;sync();}));
      }
      if(block.type==="repeat") row.append(field(block.a,"3","Número de repetições",v=>{block.a=v;sync();}));
      if(block.type==="while") row.append(field(block.a,"contador < 3","Condição para continuar",v=>{block.a=v;sync();}));
      if(block.type==="if") {
        row.append(field(block.a,"pontos > 5","Condição",v=>{block.a=v;sync();}));
        row.append(field(block.b,"Você conseguiu!","Texto se verdadeiro",v=>{block.b=v;sync();}));
      }
      const remove=document.createElement("button"); remove.textContent="×"; remove.title="Remover bloco";
      remove.addEventListener("click",()=>{blocks.splice(index,1);render();sync();});
      row.append(remove); area.append(row);
    });
  }
  function quote(value){return '"'+String(value).replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'"';}
  function sync() {
    const lines=blocks.map(b=>{
      if(b.type==="say") return t("say")+" "+quote(b.a);
      if(b.type==="variable") return t("let")+" "+(b.a||"valor")+" = "+(b.b||"0");
      if(b.type==="if") return t("if")+" "+(b.a||"verdadeiro")+" "+t("true")+":\n    "+t("say")+" "+quote(b.b)+"\n"+t("else")+":\n    "+t("say")+" "+quote("Tente novamente.")+"\n"+t("end");
      if(b.type==="while") return "local contador = 0\nenquanto "+(b.a||"contador < 3")+":\n    "+t("say")+" "+quote("Repetindo...")+"\n    mude contador = contador + 1\n"+t("end");
      return t("repeat")+" "+(Number(b.a)||1)+" "+t("times")+":\n    "+t("say")+" "+quote("Olá!")+"\n"+t("end");
    });
    if(blocks.length){code.value=lines.join("\n");code.dispatchEvent(new Event("input"));}
  }
  document.querySelectorAll("[data-block]").forEach(button=>button.addEventListener("click",()=>{
    const type=button.dataset.block;
    blocks.push(type==="say"?{type,a:"Olá!"}:type==="variable"?{type,a:"pontos",b:"10"}:type==="if"?{type,a:"pontos > 5",b:"Você conseguiu!"}:type==="while"?{type,a:"contador < 3"}:{type,a:"3"});
    render();sync();
  }));
  document.getElementById("language").addEventListener("change",()=>{if(blocks.length){render();sync();}});
  window.SunBlocks={clear(){blocks.splice(0);render();},render};
  render();
})();