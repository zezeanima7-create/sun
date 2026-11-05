(() => {
  const code=document.getElementById("code");
  const output=document.getElementById("output");
  const language=document.getElementById("language");
  const lines=document.getElementById("line-numbers");
  const sample='local nome = "Mundo"\nfale "Olá, " + nome\nlocal moedas = 10\nse moedas > 5 é legítimo:\n    fale "Você conseguiu!"\nsenao:\n    fale "Continue tentando."';
  const translations=()=>window.SUN_LANGUAGES[language.value]||window.SUN_LANGUAGES.pt;
  function updateLines(){const count=code.value.split("\n").length;lines.textContent=Array.from({length:count},(_,i)=>i+1).join("\n");}
  function showOutput(messages,failed=false){
    output.textContent="";
    if(!messages.length){const span=document.createElement("span");span.className="muted";span.textContent=translations().ui["console-ready"];output.append(span);return;}
    messages.forEach((message,index)=>{if(index)output.append(document.createTextNode("\n"));const span=document.createElement("span");if(String(message).startsWith("Erro Sun:"))span.className="error";span.textContent=message;output.append(span);});
  }
  function run(){const messages=[];const interpreter=new window.SunInterpreter(value=>messages.push(value));const result=interpreter.run(code.value);showOutput(messages,!result.success);}
  function download(){
    const blob=new Blob([code.value],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="meu-programa.sun";a.click();URL.revokeObjectURL(url);
  }
  function applyLanguage(){
    const ui=translations().ui;
    document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(ui[key])el.textContent=ui[key];});
    document.documentElement.lang=language.value==="pt"?"pt-BR":language.value;
    updateLines();
  }
  code.addEventListener("input",()=>{updateLines();try{localStorage.setItem("sun-studio-code",code.value);}catch(e){}});
  code.addEventListener("scroll",()=>{lines.scrollTop=code.scrollTop;});
  code.addEventListener("keydown",event=>{
    if(event.key==="Tab"){event.preventDefault();const start=code.selectionStart,end=code.selectionEnd;code.setRangeText("    ",start,end,"end");code.dispatchEvent(new Event("input"));}
    if((event.ctrlKey||event.metaKey)&&event.key==="Enter"){event.preventDefault();run();}
  });
  document.getElementById("run-btn").addEventListener("click",run);
  document.getElementById("download-btn").addEventListener("click",download);
  document.getElementById("example-btn").addEventListener("click",()=>{code.value=sample;code.dispatchEvent(new Event("input"));});
  document.getElementById("clear-btn").addEventListener("click",()=>{code.value="";code.dispatchEvent(new Event("input"));window.SunBlocks.clear();});
  document.getElementById("console-clear").addEventListener("click",()=>showOutput([]));
  language.addEventListener("change",applyLanguage);
  try{const saved=localStorage.getItem("sun-studio-code");if(saved)code.value=saved;}catch(e){}
  applyLanguage();updateLines();
})();