const test = require("node:test");
const assert = require("node:assert/strict");
global.window = global;
require("../interpreter.js");

function run(source) {
  const output = [];
  const interpreter = new global.SunInterpreter(value => output.push(value));
  const result = interpreter.run(source);
  return { result, output };
}

test("prints and calculates arithmetic", () => {
  const { result, output } = run('local x = 4 + 3 * 2\nfale x');
  assert.equal(result.success, true);
  assert.deepEqual(output, ["10"]);
});

test("runs if and else", () => {
  const { result, output } = run('local n = 2\nse n > 3 é legítimo:\n    fale "yes"\nsenao:\n    fale "no"');
  assert.equal(result.success, true);
  assert.deepEqual(output, ["no"]);
});

test("repeats commands and updates variables", () => {
  const { result, output } = run('local n = 0\nrepita 3 vezes:\n    mude n = n + 1\nfale n');
  assert.equal(result.success, true);
  assert.deepEqual(output, ["3"]);
});

test("supports functions, parameters and returns", () => {
  const { result, output } = run('funcao somar(a, b):\n    retorne a + b\nfale somar(8, 9)');
  assert.equal(result.success, true);
  assert.deepEqual(output, ["17"]);
});

test("supports lists, indexing and built-ins", () => {
  const { result, output } = run('local itens = ["chave", "mapa"]\nadicionar(itens, "moeda")\nmude itens[0] = "espada"\nfale itens[0]\nfale tamanho(itens)\nfale contem(itens, "moeda")\nremover(itens, 1)\nfale tamanho(itens)');
  assert.equal(result.success, true);
  assert.deepEqual(output, ["espada", "3", "true", "2"]);
});

test("reports division by zero", () => {
  const { result, output } = run('fale 5 / 0');
  assert.equal(result.success, false);
  assert.match(output[0], /dividir por zero/);
});
