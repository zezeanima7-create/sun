(() => {
  const ALIASES = {
    say:["fale","say","decir"], let:["local","let"], set:["mude","set","cambiar"],
    se:["se","if","si"], senao:["senao","else","sino"],
    repita:["repita","repeat","repetir"], times:["vezes","times","veces"], fim:["fim","end","fin"]
  };
  const MAX_STEPS = 10000;

  class ExpressionParser {
    constructor(source, variables) {
      this.variables=variables;
      this.tokens=[];
      const pattern=/\s*(?:(\d+(?:\.\d+)?)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([\p{L}_][\p{L}\p{N}_]*)|(>=|<=|==|!=|[+*/()<>-]))/uy;
      let pos=0;
      while(pos<source.length){
        pattern.lastIndex=pos;
        const match=pattern.exec(source);
        if(!match) throw new Error("Não entendi esta expressão perto de: "+source.slice(pos));
        this.tokens.push(match[1]!==undefined?{type:"number",value:Number(match[1])}:match[2]!==undefined?{type:"string",value:match[2].slice(1,-1).replace(/\\(["'\\])/g,"$1")}:match[3]!==undefined?{type:"name",value:match[3]}:{type:"op",value:match[4]});
        pos=pattern.lastIndex;
      }
      this.pos=0;
    }
    peek(){return this.tokens[this.pos];}
    take(value){const t=this.peek();if(t&&t.value===value){this.pos++;return true;}return false;}
    parse(){const v=this.compare();if(this.pos<this.tokens.length)throw new Error("Há algo sobrando na expressão.");return v;}
    compare(){
      let a=this.add();
      while(this.peek()&&[">","<",">=","<=","==","!="].includes(this.peek().value)){
        const op=this.tokens[this.pos++].value,b=this.add();
        if(op===">")a=a>b;else if(op==="<")a=a<b;else if(op===">=")a=a>=b;else if(op==="<=")a=a<=b;else if(op==="==")a=a===b;else a=a!==b;
      } return a;
    }
    add(){let a=this.multiply();while(this.peek()&&["+","-"].includes(this.peek().value)){const op=this.tokens[this.pos++].value,b=this.multiply();a=op==="+"?(typeof a==="string"||typeof b==="string"?String(a)+String(b):Number(a)+Number(b)):Number(a)-Number(b);}return a;}
    multiply(){let a=this.atom();while(this.peek()&&["*","/"].includes(this.peek().value)){const op=this.tokens[this.pos++].value,b=this.atom();if(op==="/"&&Number(b)===0)throw new Error("Não é possível dividir por zero.");a=op==="*"?Number(a)*Number(b):Number(a)/Number(b);}return a;}
    atom(){
      const t=this.peek();if(!t)throw new Error("Faltou um valor na expressão.");
      if(this.take("(")){const v=this.compare();if(!this.take(")"))throw new Error("Está faltando fechar um parêntese.");return v;}
      this.pos++;
      if(t.type==="number"||t.type==="string")return t.value;
      if(t.type==="name"){if(t.value==="verdadeiro"||t.value==="true")return true;if(t.value==="falso"||t.value==="false")return false;if(Object.prototype.hasOwnProperty.call(this.variables,t.value))return this.variables[t.value];throw new Error("A variável '"+t.value+"' não existe.");}
      if(t.value==="-")return -Number(this.atom());
      throw new Error("Valor inesperado: "+t.value);
    }
  }

  class SunInterpreter {
    constructor(onOutput){this.variables={};this.onOutput=onOutput||(()=>{});this.steps=0;}
    expression(source){return new ExpressionParser(source,this.variables).parse();}
    output(value){this.onOutput(String(value));}
    canonical(line){
      let text=line.trim();
      const first=text.match(/^([\p{L}_][\p{L}\p{N}_]*)/u);
      if(!first)return text;
      const word=first[1];
      for(const [canonical,aliases] of Object.entries(ALIASES))if(aliases.includes(word))return canonical+text.slice(word.length);
      return text;
    }
    run(source){
      this.variables={};this.steps=0;
      const lines=source.replace(/\r/g,"").split("\n").map((raw,index)=>({raw,text:this.canonical(raw.trim()),indent:(raw.match(/^\s*/)||[""])[0].replace(/\t/g,"    ").length,line:index+1}));
      let cursor=0;
      const skip=()=>{while(cursor<lines.length&&(!lines[cursor].text||lines[cursor].text.startsWith("#")))cursor++;};
      const nested=(parentIndent)=>{
        skip();if(cursor>=lines.length||lines[cursor].indent<=parentIndent)return [];
        return executeBlock(lines[cursor].indent);
      };
      const executeBlock=(indent)=>{
        while(cursor<lines.length){
          skip();if(cursor>=lines.length)break;
          const item=lines[cursor];
          if(item.indent<indent)break;
          if(item.indent>indent)throw new Error("Linha "+item.line+": ajuste os espaços antes do comando.");
          const text=item.text;
          if(text==="fim"){cursor++;break;}
          if(text==="senao:")break;
          this.steps++;if(this.steps>MAX_STEPS)throw new Error("O programa passou do limite de comandos.");
          let match;
          if((match=text.match(/^local\s+([\p{L}_][\p{L}\p{N}_]*)\s*=\s*(.+)$/u))){
            this.variables[match[1]]=this.expression(match[2]);cursor++;continue;
          }
          if((match=text.match(/^mude\s+([\p{L}_][\p{L}\p{N}_]*)\s*=\s*(.+)$/u))){
            if(!Object.prototype.hasOwnProperty.call(this.variables,match[1]))throw new Error("Linha "+item.line+": a variável '"+match[1]+"' ainda não existe.");
            this.variables[match[1]]=this.expression(match[2]);cursor++;continue;
          }
          if(text.startsWith("fale ")){this.output(this.expression(text.slice(5)));cursor++;continue;}
          if((match=text.match(/^se\s+(.+?)(?:\s+é legítimo|\s+is true|\s+es verdadero)?\s*:\s*$/u))){
            const condition=Boolean(this.expression(match[1]));cursor++;
            if(condition){nested(item.indent);skip();if(cursor<lines.length&&lines[cursor].indent===item.indent&&lines[cursor].text==="senao:"){cursor++;nested(item.indent);if(cursor<lines.length&&lines[cursor].indent===item.indent&&lines[cursor].text==="fim")cursor++;}else if(cursor<lines.length&&lines[cursor].indent===item.indent&&lines[cursor].text==="fim")cursor++;}
            else{nested(item.indent);skip();if(cursor<lines.length&&lines[cursor].indent===item.indent&&lines[cursor].text==="senao:"){cursor++;nested(item.indent);if(cursor<lines.length&&lines[cursor].indent===item.indent&&lines[cursor].text==="fim")cursor++;}else if(cursor<lines.length&&lines[cursor].indent===item.indent&&lines[cursor].text==="fim")cursor++;}
            continue;
          }
          if((match=text.match(/^repita\s+(.+?)\s+(?:vezes|times|veces)\s*:\s*$/u))){
            const count=Number(this.expression(match[1]));if(!Number.isInteger(count)||count<0||count>1000)throw new Error("Linha "+item.line+": repita aceita um número inteiro de 0 a 1000.");
            cursor++;const bodyStart=cursor;const childIndent=(()=>{let i=bodyStart;while(i<lines.length&&(!lines[i].text||lines[i].text==="fim"))i++;return i<lines.length&&lines[i].indent>item.indent?lines[i].indent:null;})();
            if(childIndent===null)continue;
            const bodyEnd=(()=>{let i=bodyStart;while(i<lines.length){if(lines[i].text&&lines[i].indent<=item.indent)break;i++;}return i;})();
            for(let n=0;n<count;n++){cursor=bodyStart;executeBlock(childIndent);}
            cursor=bodyEnd;if(cursor<lines.length&&lines[cursor].indent===item.indent&&lines[cursor].text==="fim")cursor++;
            continue;
          }
          throw new Error("Linha "+item.line+": não conheço o comando '"+text+"'.");
        }
      };
      try{executeBlock(0);return {success:true,variables:this.variables};}
      catch(error){this.output("Erro Sun: "+error.message);return {success:false,error:error.message,variables:this.variables};}
    }
  }
  window.SunInterpreter=SunInterpreter;
})();