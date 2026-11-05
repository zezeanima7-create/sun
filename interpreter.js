(() => {
  const ALIASES = {
    fale:["fale","say","decir"], local:["local","let"], mude:["mude","set","cambiar"],
    se:["se","if","si"], senao:["senao","else","sino"],
    repita:["repita","repeat","repetir"], times:["vezes","times","veces"],
    funcao:["funcao","function","funcion"], retorne:["retorne","return","retornar"],
    fim:["fim","end","fin"]
  };
  const MAX_STEPS=10000, MAX_RECURSION=100;

  class ExpressionParser {
    constructor(source,variables,callFunction){
      this.variables=variables;this.callFunction=callFunction;this.tokens=[];
      const pattern=/\s*(?:(\d+(?:\.\d+)?)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([\p{L}_][\p{L}\p{N}_]*)|(>=|<=|==|!=|[+*/(),\[\]<>-]))/uy;
      let pos=0;
      while(pos<source.length){
        pattern.lastIndex=pos;const m=pattern.exec(source);
        if(!m)throw new Error("Não entendi esta expressão perto de: "+source.slice(pos));
        this.tokens.push(m[1]!==undefined?{type:"number",value:Number(m[1])}:m[2]!==undefined?{type:"string",value:m[2].slice(1,-1).replace(/\\(["'\\])/g,"$1")}:m[3]!==undefined?{type:"name",value:m[3]}:{type:"op",value:m[4]});
        pos=pattern.lastIndex;
      }this.pos=0;
    }
    peek(){return this.tokens[this.pos];}
    take(v){if(this.peek()&&this.peek().value===v){this.pos++;return true;}return false;}
    parse(){const v=this.compare();if(this.pos<this.tokens.length)throw new Error("Há algo sobrando na expressão.");return v;}
    compare(){let a=this.add();while(this.peek()&&[">","<",">=","<=","==","!="].includes(this.peek().value)){const op=this.tokens[this.pos++].value,b=this.add();a=op===">"?a>b:op==="<"?a<b:op===">="?a>=b:op==="<="?a<=b:op==="=="?a===b:a!==b;}return a;}
    add(){let a=this.multiply();while(this.peek()&&["+","-"].includes(this.peek().value)){const op=this.tokens[this.pos++].value,b=this.multiply();a=op==="+"?(typeof a==="string"||typeof b==="string"?String(a)+String(b):Number(a)+Number(b)):Number(a)-Number(b);}return a;}
    multiply(){let a=this.atom();while(this.peek()&&["*","/"].includes(this.peek().value)){const op=this.tokens[this.pos++].value,b=this.atom();if(op==="/"&&Number(b)===0)throw new Error("Não é possível dividir por zero.");a=op==="*"?Number(a)*Number(b):Number(a)/Number(b);}return a;}
    atom(){
      const t=this.peek();if(!t)throw new Error("Faltou um valor na expressão.");
      let value;
      if(this.take("(")){value=this.compare();if(!this.take(")"))throw new Error("Está faltando fechar um parêntese.");}
      else if(this.take("[")){
        value=[];
        if(!this.take("]")){do{value.push(this.compare());}while(this.take(","));if(!this.take("]"))throw new Error("Está faltando fechar a lista.");}
      }
      else if(t.type==="number"||t.type==="string"){this.pos++;value=t.value;}
      else if(t.type==="name"){
        this.pos++;
        if(t.value==="verdadeiro"||t.value==="true")value=true;
        else if(t.value==="falso"||t.value==="false")value=false;
        else if(this.take("(")){
          const args=[];
          if(!this.take(")")){do{args.push(this.compare());}while(this.take(","));if(!this.take(")"))throw new Error("Está faltando fechar os parênteses da função.");}
          value=this.callFunction(t.value,args);
        } else if(t.value in this.variables)value=this.variables[t.value];
        else throw new Error("A variável '"+t.value+"' não existe.");
      } else {this.pos++;if(t.value==="-")return -Number(this.atom());throw new Error("Valor inesperado: "+t.value);}
      while(this.take("[")){
        const index=this.compare();if(!this.take("]"))throw new Error("Está faltando fechar o índice.");
        if(!Array.isArray(value)&&typeof value!=="string")throw new Error("Só é possível acessar uma posição de uma lista ou texto.");
        if(!Number.isInteger(Number(index))||Number(index)<0)throw new Error("O índice precisa ser um inteiro não negativo.");
        value=value[Number(index)];
        if(value===undefined)throw new Error("Esse índice não existe.");
      }
      return value;
    }
  }

  class SunInterpreter {
    constructor(onOutput){this.variables={};this.functions={};this.onOutput=onOutput||(()=>{});this.steps=0;this.depth=0;}
    output(v){this.onOutput(String(v));}
    canonical(line){
      const m=line.match(/^([\p{L}_][\p{L}\p{N}_]*)/u);if(!m)return line;
      for(const [key,aliases] of Object.entries(ALIASES))if(aliases.includes(m[1]))return key+line.slice(m[1].length);
      return line;
    }
    expression(source,scope){return new ExpressionParser(source,scope,(name,args)=>this.callFunction(name,args,scope)).parse();}
    parse(source){
      const lines=source.replace(/\r/g,"").split("\n").map((raw,i)=>({text:this.canonical(raw.trim()),indent:(raw.match(/^\s*/)||[""])[0].replace(/\t/g,"    ").length,line:i+1})).filter(x=>x.text&&!x.text.startsWith("#"));
      const nextNonBlank=(i)=>i;
      const parseBlock=(start,indent)=>{
        const nodes=[];let i=start;
        while(i<lines.length){
          const item=lines[i];if(item.indent<indent)break;
          if(item.indent>indent)throw new Error("Linha "+item.line+": ajuste os espaços antes do comando.");
          const text=item.text;let m;
          if(text==="fim"){return {nodes,next:i+1,ended:true};}
          if(text==="senao:")break;
          if((m=text.match(/^funcao\s+([\p{L}_][\p{L}\p{N}_]*)\s*\((.*?)\)\s*:\s*$/u))){
            const params=m[2].trim()?m[2].split(",").map(x=>x.trim()):[];
            if(params.some(p=>! /^[\p{L}_][\p{L}\p{N}_]*$/u.test(p))||new Set(params).size!==params.length)throw new Error("Linha "+item.line+": confira os nomes dos parâmetros.");
            const childIndent=lines[i+1]&&lines[i+1].indent>indent?lines[i+1].indent:null;
            if(childIndent===null)throw new Error("Linha "+item.line+": a função precisa ter um bloco indentado.");
            const child=parseBlock(i+1,childIndent);nodes.push({type:"function",name:m[1],params,body:child.nodes,line:item.line});i=child.next;
            if(lines[i]&&lines[i].indent===indent&&lines[i].text==="fim")i++;
            continue;
          }
          if((m=text.match(/^se\s+(.+?)(?:\s+é legítimo|\s+is true|\s+es verdadero)?\s*:\s*$/u))){
            const childIndent=lines[i+1]&&lines[i+1].indent>indent?lines[i+1].indent:null;
            if(childIndent===null)throw new Error("Linha "+item.line+": a condição precisa ter um bloco indentado.");
            const yes=parseBlock(i+1,childIndent);i=yes.next;let no=[];
            if(lines[i]&&lines[i].indent===indent&&lines[i].text==="senao:"){
              const elseIndent=lines[i+1]&&lines[i+1].indent>indent?lines[i+1].indent:null;
              if(elseIndent===null)throw new Error("Linha "+lines[i].line+": o senao precisa ter um bloco indentado.");
              const other=parseBlock(i+1,elseIndent);no=other.nodes;i=other.next;
            }
            if(lines[i]&&lines[i].indent===indent&&lines[i].text==="fim")i++;
            nodes.push({type:"if",condition:m[1],yes:yes.nodes,no,line:item.line});continue;
          }
          if((m=text.match(/^repita\s+(.+?)\s+(?:vezes|times|veces)\s*:\s*$/u))){
            const childIndent=lines[i+1]&&lines[i+1].indent>indent?lines[i+1].indent:null;
            if(childIndent===null)throw new Error("Linha "+item.line+": repita precisa ter um bloco indentado.");
            const child=parseBlock(i+1,childIndent);nodes.push({type:"repeat",count:m[1],body:child.nodes,line:item.line});i=child.next;
            if(lines[i]&&lines[i].indent===indent&&lines[i].text==="fim")i++;
            continue;
          }
          if((m=text.match(/^local\s+([\p{L}_][\p{L}\p{N}_]*)\s*=\s*(.+)$/u))){nodes.push({type:"local",name:m[1],value:m[2],line:item.line});i++;continue;}
          if((m=text.match(/^mude\s+([\p{L}_][\p{L}\p{N}_]*)\s*\[\s*(.+?)\s*\]\s*=\s*(.+)$/u))){nodes.push({type:"indexSet",name:m[1],index:m[2],value:m[3],line:item.line});i++;continue;}
          if((m=text.match(/^mude\s+([\p{L}_][\p{L}\p{N}_]*)\s*=\s*(.+)$/u))){nodes.push({type:"set",name:m[1],value:m[2],line:item.line});i++;continue;}
          if(text.startsWith("fale ")){nodes.push({type:"print",value:text.slice(5),line:item.line});i++;continue;}
          if(text.startsWith("retorne ")){nodes.push({type:"return",value:text.slice(8),line:item.line});i++;continue;}
          throw new Error("Linha "+item.line+": não conheço o comando '"+text+"'.");
        }
        return {nodes,next:i,ended:false};
      };
      return parseBlock(0,0).nodes;
    }
    findScope(scope,name){let current=scope;while(current){if(Object.prototype.hasOwnProperty.call(current,name))return current;current=Object.getPrototypeOf(current);}return null;}
    callFunction(name,args,parentScope){
      const builtins={
        tamanho:()=>{if(args.length!==1)throw new Error("tamanho recebe 1 argumento.");const v=args[0];if(Array.isArray(v)||typeof v==="string")return v.length;throw new Error("tamanho espera uma lista ou texto.");},
        length:()=>{if(args.length!==1)throw new Error("length expects 1 argument.");const v=args[0];if(Array.isArray(v)||typeof v==="string")return v.length;throw new Error("length expects a list or text.");},
        adicionar:()=>{if(args.length!==2||!Array.isArray(args[0]))throw new Error("adicionar(lista, valor) precisa de uma lista e um valor.");args[0].push(args[1]);return args[0].length;},
        add:()=>{if(args.length!==2||!Array.isArray(args[0]))throw new Error("add(list, value) expects a list and a value.");args[0].push(args[1]);return args[0].length;},
        remover:()=>{if(args.length!==2||!Array.isArray(args[0]))throw new Error("remover(lista, índice) precisa de uma lista e um índice.");const i=Number(args[1]);if(!Number.isInteger(i)||i<0||i>=args[0].length)throw new Error("Índice inválido para remover.");return args[0].splice(i,1)[0];},
        remove:()=>{if(args.length!==2||!Array.isArray(args[0]))throw new Error("remove(list, index) expects a list and an index.");const i=Number(args[1]);if(!Number.isInteger(i)||i<0||i>=args[0].length)throw new Error("Invalid remove index.");return args[0].splice(i,1)[0];},
        contem:()=>{if(args.length!==2||!Array.isArray(args[0]))throw new Error("contem(lista, valor) precisa de uma lista e um valor.");return args[0].includes(args[1]);},
        contains:()=>{if(args.length!==2||!Array.isArray(args[0]))throw new Error("contains(list, value) expects a list and a value.");return args[0].includes(args[1]);},
        numero:()=>{if(args.length!==1)throw new Error("numero recebe 1 argumento.");const n=Number(args[0]);if(Number.isNaN(n))throw new Error("Não foi possível converter para número.");return n;},
        number:()=>{if(args.length!==1)throw new Error("number expects 1 argument.");const n=Number(args[0]);if(Number.isNaN(n))throw new Error("Could not convert to number.");return n;},
        texto:()=>{if(args.length!==1)throw new Error("texto recebe 1 argumento.");return String(args[0]);},
        string:()=>{if(args.length!==1)throw new Error("string expects 1 argument.");return String(args[0]);}
      };
      if(Object.prototype.hasOwnProperty.call(builtins,name))return builtins[name]();
      const fn=this.functions[name];if(!fn)throw new Error("A função '"+name+"' não existe.");
      if(args.length!==fn.params.length)throw new Error("A função '"+name+"' espera "+fn.params.length+" parâmetro(s), mas recebeu "+args.length+".");
      if(this.depth>=MAX_RECURSION)throw new Error("Limite de chamadas de função atingido.");
      const scope=Object.create(parentScope||this.variables);fn.params.forEach((p,i)=>scope[p]=args[i]);
      this.depth++;let result;
      try{result=this.execute(fn.body,scope,true);}finally{this.depth--;}
      return result&&result.returned?result.value:null;
    }
    execute(nodes,scope,inFunction=false){
      for(const node of nodes){
        this.steps++;if(this.steps>MAX_STEPS)throw new Error("O programa passou do limite de comandos.");
        let value;
        if(node.type==="function"){this.functions[node.name]=node;continue;}
        if(node.type==="local"){scope[node.name]=this.expression(node.value,scope);continue;}
        if(node.type==="set"){
          const owner=this.findScope(scope,node.name);if(!owner)throw new Error("Linha "+node.line+": a variável '"+node.name+"' ainda não existe.");
          owner[node.name]=this.expression(node.value,scope);continue;
        }
        if(node.type==="indexSet"){
          const owner=this.findScope(scope,node.name);if(!owner)throw new Error("Linha "+node.line+": a variável '"+node.name+"' ainda não existe.");
          const list=owner[node.name],index=this.expression(node.index,scope);
          if(!Array.isArray(list))throw new Error("Linha "+node.line+": essa variável não é uma lista.");
          if(!Number.isInteger(Number(index))||Number(index)<0||Number(index)>=list.length)throw new Error("Linha "+node.line+": índice inválido.");
          list[Number(index)]=this.expression(node.value,scope);continue;
        }
        if(node.type==="print"){this.output(this.expression(node.value,scope));continue;}
        if(node.type==="return"){
          if(!inFunction)throw new Error("Linha "+node.line+": retorne só pode ser usado dentro de uma função.");
          return {returned:true,value:this.expression(node.value,scope)};
        }
        if(node.type==="if"){
          value=Boolean(this.expression(node.condition,scope));
          const result=this.execute(value?node.yes:node.no,scope,inFunction);if(result&&result.returned)return result;
          continue;
        }
        if(node.type==="repeat"){
          const count=Number(this.expression(node.count,scope));
          if(!Number.isInteger(count)||count<0||count>1000)throw new Error("Linha "+node.line+": repita aceita um número inteiro de 0 a 1000.");
          for(let i=0;i<count;i++){const result=this.execute(node.body,scope,inFunction);if(result&&result.returned)return result;}
        }
      }
      return {returned:false};
    }
    run(source){
      this.variables={};this.functions={};this.steps=0;this.depth=0;
      try{const program=this.parse(source);this.execute(program,this.variables,false);return {success:true,variables:this.variables};}
      catch(error){this.output("Erro Sun: "+error.message);return {success:false,error:error.message,variables:this.variables};}
    }
  }
  window.SunInterpreter=SunInterpreter;
})();