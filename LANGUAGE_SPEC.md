# Especificação da linguagem Sun — versão 0.1

Este documento define a sintaxe que o interpretador atual implementa. Recursos futuros não são considerados parte da linguagem até serem implementados e testados.

## 1. Arquivos

- Extensão: `.sun`
- Codificação recomendada: UTF-8
- Um programa é executado de cima para baixo.
- Espaços no início da linha definem blocos. Use 4 espaços por nível.

## 2. Comentários

Linhas iniciadas por `#` são ignoradas.

```sun
# Isto é um comentário
fale "Olá!"
```

## 3. Mostrar texto e valores

Use `fale` para enviar um valor ao console.

```sun
fale "Olá, mundo!"
fale 2 + 3
```

Aliases disponíveis: `say` e `decir`.

## 4. Variáveis

Use `local` para criar uma variável e `mude` para alterar uma variável existente.

```sun
local pontos = 10
mude pontos = pontos + 5
fale pontos
```

Aliases: `let` para criar; `set` e `cambiar` para alterar.

## 5. Valores e expressões

Tipos básicos atualmente suportados:
- Números inteiros e decimais.
- Textos entre aspas simples ou duplas.
- Valores booleanos: `verdadeiro` e `falso` (também `true` e `false`).

Operadores aritméticos: `+`, `-`, `*`, `/`.
Operadores de comparação: `>`, `<`, `>=`, `<=`, `==`, `!=`.
Parênteses podem agrupar expressões. O operador `+` também junta textos.

## 6. Condições

```sun
local moedas = 12
se moedas >= 10 é legítimo:
    fale "Você tem moedas suficientes."
senao:
    fale "Ainda faltam moedas."
```

O bloco alternativo `senao` é opcional. A condição também pode ser escrita sem o sufixo `é legítimo`.

Aliases: `if`/`si` e `else`/`sino`.

## 7. Repetição

```sun
repita 3 vezes:
    fale "Olá!"
```

A quantidade deve ser um número inteiro de 0 a 1000. Aliases: `repeat`/`repetir` e `times`/`veces`.

## 8. Funções, parâmetros e retornos

Declare uma função com `funcao`, informe os parâmetros entre parênteses e use `retorne` para devolver um valor.

```sun
funcao somar(a, b):
    retorne a + b

local resultado = somar(5, 7)
fale resultado
```

Uma função pode receber zero ou mais parâmetros e pode chamar outras funções já declaradas. Os parâmetros e variáveis locais da função têm escopo próprio. Uma função sem `retorne` devolve `nulo` (valor nulo). O número de argumentos precisa corresponder ao número de parâmetros.

Aliases: `function`/`funcion` e `return`/`retornar`.

## 9. Listas e coleções

Crie listas usando colchetes. Os índices começam em zero.

```sun
local inventario = ["chave", "mapa"]
fale inventario[0]
mude inventario[1] = "espada"
adicionar(inventario, "poção")
fale tamanho(inventario)
```

Funções disponíveis:
- `tamanho(lista_ou_texto)` / `length(list_or_text)`: retorna a quantidade de itens ou caracteres.
- `adicionar(lista, valor)` / `add(list, value)`: adiciona um item ao final.
- `remover(lista, índice)` / `remove(list, index)`: remove e devolve o item na posição indicada.
- `contem(lista, valor)` / `contains(list, value)`: verifica se a lista contém o valor.
- `numero(valor)` / `number(value)`: converte para número.
- `texto(valor)` / `string(value)`: converte para texto.

## 10. Fim de bloco

A indentação encerra os blocos automaticamente. A palavra `fim` também pode ser usada para encerrar explicitamente um bloco.

## 11. Limites de segurança do interpretador

- No máximo 10.000 comandos executados por programa.
- No máximo 1.000 repetições em um único comando `repita`.
- Divisão por zero gera uma mensagem de erro.
- Variáveis não declaradas geram uma mensagem de erro.

## 12. Recursos ainda não implementados

Objetos, módulos, entrada do teclado, gráficos, áudio, eventos de jogo e operações lógicas compostas ainda não fazem parte desta versão. Não use esses recursos esperando que o interpretador atual os execute.

## 13. Próxima evolução

O projeto agora inclui testes automatizados executados pelo GitHub Actions. As próximas versões devem adicionar entrada do usuário e bibliotecas para jogos, mantendo compatibilidade com esta especificação.
