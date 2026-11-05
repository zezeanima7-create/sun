# Sun ☀️

**Sun** é uma linguagem de programação experimental criada para tornar a programação acessível a iniciantes. Seu objetivo é oferecer comandos simples, editor visual e suporte a vários idiomas.

## Sun Studio 0.2

O primeiro protótipo funciona no navegador e inclui:
- Editor de código para programas `.sun`.
- Interpretador inicial em JavaScript.
- Console de saída e mensagens de erro simples.
- Blocos visuais para mostrar texto, criar variáveis, repetir e testar condições.
- Interface em português, inglês e espanhol.
- Download de arquivos `.sun`.
- Salvamento automático local do código no navegador.

## Exemplo

```sun
local nome = "Mundo"
fale "Olá, " + nome

local moedas = 10
se moedas > 5 é legítimo:
    fale "Você conseguiu!"
senao:
    fale "Continue tentando."
```

## Como usar

1. Abra o [Sun Studio](https://zezeanima7-create.github.io/sun/).
2. Escreva ou carregue o exemplo no editor.
3. Clique em **Executar programa**.
4. Veja o resultado no console.
5. Use **Baixar .sun** para salvar seu programa.

## Estado do projeto

Esta é uma versão inicial experimental. A sintaxe, o interpretador e os blocos ainda estão em desenvolvimento. O suporte a todos os idiomas é uma meta de longo prazo; atualmente há uma interface inicial em português, inglês e espanhol e aliases básicos de comandos.

## Próximas etapas

- Adicionar funções, parâmetros e retornos ao interpretador.
- Melhorar a validação de sintaxe e as mensagens de erro.
- Adicionar edição visual de condições, funções e eventos.
- Ampliar os idiomas e permitir escolher os comandos independentemente do idioma da interface.
- Criar bibliotecas para jogos e gráficos.
- Adicionar importação de arquivos e projetos.

## Suporte de editor e GitHub

O repositório inclui uma gramática TextMate para realce de sintaxe Sun, configuração de linguagem e metadados de extensão compatíveis com VS Code. Esses arquivos permitem preparar o suporte em editores que carregam extensões de linguagem.

**Limitação do GitHub:** o arquivo `.gitattributes` não registra sozinho uma linguagem nova no GitHub Linguist. Para o GitHub reconhecer oficialmente Sun nas estatísticas do repositório e aplicar o realce nativo, ainda é necessário propor a linguagem ao projeto [github-linguist/linguist](https://github.com/github-linguist/linguist), incluindo sua definição e amostras de código.

## Licença

MIT
