# F0006 — Substitui `<input type="date">` e `<input type="number">` nativos por três componentes partilhados

| | |
| :--- | :--- |
| **Tipo** | Feature (continuação da unificação de sistema de formulários iniciada na F0004) |
| **Branch** | `feature/date-picker-valores-partilhados` (base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | Frontend: três novos componentes em `shared/components/` (`app-date-picker`, `app-money-input`, `app-integer-input`), migração de todos os `<input type="date">`/`<input type="number">` de formulário em 13 ficheiros, e um fix CSS no input de emoji |
| **Verificação** | `cd frontend && npm run build` + `npm test`; inspeção visual manual (sem Cypress a correr nesta sessão) |

## 1. Situação

Depois da F0004 ter eliminado todos os `<select>` nativos, os formulários de produção ainda usam
`<input type="date">` e `<input type="number">` nativos, com o estilo global consistente definido em
[`frontend/src/styles/_forms.css`](../../../../frontend/src/styles/_forms.css) (secção `input[type="number"]`
nas linhas 86-125; não há estilo dedicado para `type="date"`, que herda o *date picker* do sistema
operativo/browser).

**Evidência (inventário completo por grep `type="date"` / `type="number"`):**

| Ficheiro | `type="date"` | `type="number"` (`valor`) | `type="number"` (inteiro) |
| :--- | :---: | :---: | :---: |
| `contas/components/criar` | — | 1 (`saldo.valor`) | — |
| `transacoes/components/criar-entradas` | 1 (`data`) | 1 (`valor.valor`) | — |
| `transacoes/components/criar-saidas` | 1 (`data`) | 1 (`valor.valor`) | — |
| `transacoes/components/criar-credito` | 1 (`data`) | 1 (`valor.valor`) | — |
| `transacoes/components/criar-reembolso` | 1 (`data`) | 1 (`valor.valor`) | — |
| `transacoes/components/editar` | 1 (`data`) | 1 (`valor.valor`) | — |
| `despesas-recorrentes/components/gerar-transacao` | 1 (`data`) | 1 (`valor.valor`) | — |
| `despesas-recorrentes/components/editar-transacao` (`transacoes-editar`) | 1 (`data`) | 1 (`valor.valor`) | — |
| `despesas-recorrentes/components/nova-regra` | — | 1 (`valor.valor`, opcional) | 2 (`diaDoMes`, `mes`) |
| `despesas-recorrentes/components/editar-regra` | — | 1 (`valor.valor`, opcional) | 2 (`diaDoMes`, `mes`) |
| `cartoes-credito/components/criar` | 2 (`dataInicio`/`dataFim`) | 2 (`limiteCredito.valor`, `saldoUtilizado.valor`) | — |
| `cartoes-credito/components/editar` | 2 (`dataInicio`/`dataFim`) | 1 (`limiteCredito.valor`) | — |
| `cartoes-credito/components/pagar` | 2 (`dataInicio`/`dataFim`) | — | — |

**Inventário (superfícies afetadas):**

- **A. Novo `shared/components/date-picker/` (`DatePickerComponent`, `ControlValueAccessor`)** —
  substitui os 13 `<input type="date">` em 10 ficheiros.
- **B. Novo `shared/components/money-input/` (`MoneyInputComponent`, `ControlValueAccessor`)** —
  substitui os 13 `<input type="number">` do campo monetário `valor` (sempre hoje acompanhado de um
  `<input formControlName="moeda">` separado) em 12 ficheiros.
- **C. Novo `shared/components/integer-input/` (`IntegerInputComponent`, `ControlValueAccessor`)** —
  substitui os 4 `<input type="number">` de `diaDoMes`/`mes` (valores inteiros, não monetários) em
  `despesas-recorrentes/components/{nova-regra,editar-regra}`.
- **D. Fix do input de emoji** — `.emoji-input-group input[readonly]` em `_forms.css`, usado em 10
  ficheiros (`bancos`, `contas`, `categorias`, `cartoes-credito` × criar/editar), hoje com
  `cursor: pointer` e realce ao passar o rato apesar de não ter nenhum `(click)` associado — dá a
  ilusão de ser clicável quando só o `.emoji-btn` ao lado deve abrir o *popup* do Picmo.

**Escala:** 3 componentes novos, 30 substituições de `<input>` nativo em 13 formulários reais de
produção, 1 fix CSS que cobre 10 ficheiros sem os alterar individualmente.

## 2. Resultado pretendido

Três componentes `<app-date-picker>`, `<app-money-input>` e `<app-integer-input>`, todos
`ControlValueAccessor` (compatíveis com `formControlName`), com o mesmo mecanismo de interação já
validado na F0004 (`app-select`): abrir/fechar via signals, `SelectRegistryService`-like fecho ao
clicar fora, navegação por teclado, sem depender de nenhum controlo nativo do browser por trás.

**Decisões:**

- **`app-date-picker` é um calendário 100% customizado**, sem `<input type="date">` nativo por trás —
  o mesmo nível de substituição que a F0004 aplicou ao `<select>`. Gatilho: um `<button>` com a data
  formatada `dd/mm/aaaa` (ou placeholder) + `app-icon` `Calendar`. Ao abrir, mostra uma grelha do mês
  atual (ou do mês do valor selecionado) com setas para navegar entre meses, dias clicáveis, e o dia de
  hoje visualmente assinalado. Semana começa à segunda-feira (convenção PT-PT). Reaproveita o
  `SelectRegistryService` existente (renomeado ou generalizado — ver Implementação) para fechar
  automaticamente qualquer outro `app-select`/`app-date-picker` aberto na página.
- **Contrato de valor do `app-date-picker`: string ISO `yyyy-MM-dd`**, exatamente o que
  `<input type="date">` já produzia e o que todos os view-models já esperam (confirmado em
  `transacoes-criar-saidas.view-model.ts:50` e `transacoes-editar.component.ts:52-53`) — **zero
  mudanças nos view-models/mappers**, só o template muda, tal como na F0004.
- **`app-money-input` mostra "€" embutido no próprio componente e elimina o campo `moeda` visível.**
  O `FormGroup` de cada consumidor mantém o `FormControl` `moeda` (ex.: `valor: fb.group({ valor,
  moeda: ['EUR', ...] })`), mas deixa de ter um `<input formControlName="moeda">` no template — o
  controlo fica só com o valor por omissão `'EUR'`, nunca editável. Como toda a construção de payload
  já lê `formData.valor.moeda`/`raw.valor.moeda` (nunca de um valor "vivo" do input, já que a app não
  suporta outra moeda), **nenhum view-model precisa de mudar** — só o template.
  **Alternativa rejeitada:** remover também o `FormControl` `moeda` e passar `'EUR'` a codificar diretamente
  em cada `submit()`/`update()` do view-model — mais mudanças (8 ficheiros `.ts`) para o mesmo
  resultado; manter o controlo "fantasma" no `FormGroup` é a alteração mínima.
- **Contrato de valor do `app-money-input`: `number` (ou `null` quando vazio)**, igual ao que
  `<input type="number">` já produzia (com coerção `+valor` feita hoje em vários `submit()`) — sem
  mudanças de tipo a jusante.
- **`app-money-input` não reformata a entrada para vírgula decimal PT-PT.** Mantém a digitação livre
  de números com ponto decimal (`45.50`), tal como hoje — só adiciona o afixo visual "€" e remove o
  campo `moeda`. Formatação PT-PT completa (vírgula decimal, separador de milhares) fica fora de
  âmbito (ver §7) para não aumentar o risco desta mudança com parsing adicional.
- **`app-integer-input` é a substituição mais simples**: um `<input type="number">` interno,
  sem setas nativas do browser (`-webkit-appearance: none` / `appearance: textfield`), com os mesmos
  `@Input() min`/`max`/`placeholder` que os `diaDoMes`/`mes` já usam. Sem *steppers* customizados (só
  2 campos, 1-31 e 1-12, não justificam esse investimento).
- **Fix do input de emoji: só CSS, scoped a `.emoji-input-group`.** Adiciona
  `.emoji-input-group input[readonly] { cursor: default; pointer-events: none; }` e remove o
  destaque de `:hover` desse contexto específico — sem tocar em nenhum dos 10 ficheiros de template
  (o `readonly` e a estrutura já lá estão). A regra genérica `.form-input[readonly]` em `_forms.css`
  fica intocada para não afetar outros usos futuros de "campo só de leitura clicável" que não sejam o
  emoji.

## 3. Implementação

1. **Base partilhada de dropdown** — generalizar `SelectRegistryService`
   (`shared/components/select/select-registry.service.ts`) para um serviço aceite por qualquer
   componente com o mesmo contrato `register()`/`unregister()` (já é genérico o suficiente, só
   confirmar o tipo do parâmetro); usado pelo `app-date-picker` para fechar ao abrir outro
   dropdown/calendário na página.

2. **`shared/components/date-picker/date-picker.component.{ts,html,css}`** — `DatePickerComponent`,
   standalone, `OnPush`, `NG_VALUE_ACCESSOR`. Grelha de mês construída a partir de `Date` nativo
   (sem biblioteca nova), value em string ISO. Inputs: `placeholder`. Reaproveita o padrão de
   `showMenu`/`activeIndex` e `@HostListener('document:click')` do `SelectComponent`.

3. **`shared/components/money-input/money-input.component.{ts,html,css}`** — `MoneyInputComponent`,
   `NG_VALUE_ACCESSOR`, `<input type="number">` interno com sufixo visual "€", value `number|null`.
   Inputs: `placeholder`, `min` (default `0`), `step` (default `0.01`).

4. **`shared/components/integer-input/integer-input.component.{ts,html,css}`** —
   `IntegerInputComponent`, `NG_VALUE_ACCESSOR`, `<input type="number">` interno sem setas nativas.
   Inputs: `placeholder`, `min`, `max`.

5. **Fix do emoji** — nova regra em `frontend/src/styles/_forms.css`, junto à secção
   `.emoji-input-group` já existente (linhas 144-152).

6. **Migração — datas** (10 ficheiros, `<input type="date" formControlName="X">` →
   `<app-date-picker formControlName="X">`): `transacoes/components/{criar-entradas,criar-saidas,
   criar-credito,criar-reembolso,editar}`, `despesas-recorrentes/components/{gerar-transacao,
   editar-transacao}`, `cartoes-credito/components/{criar,editar,pagar}`.

7. **Migração — dinheiro** (12 ficheiros): remove o `<input formControlName="moeda">` de cada
   `form-field`/`row-controls` e troca o `<input type="number" formControlName="valor">` por
   `<app-money-input formControlName="valor">`: `contas/components/criar`,
   `despesas-recorrentes/components/{nova-regra,editar-regra,gerar-transacao,editar-transacao}`,
   `cartoes-credito/components/{criar,editar}`, `transacoes/components/{criar-entradas,criar-saidas,
   criar-credito,criar-reembolso,editar}`.

8. **Migração — inteiros** (2 ficheiros): `despesas-recorrentes/components/{nova-regra,editar-regra}`
   — `diaDoMes` (`min="1" max="31"`) e `mes` (`min="1" max="12"`) trocam para `<app-integer-input>`.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros pré-existente.
- `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — baseline atual 8/8; sem
  specs a cobrir os formulários migrados, não há regressão detetável por teste automático.
- **Não verificável nesta sessão:** submissão real de cada um dos 13 formulários (valor enviado à
  API, seleção de data/valor no calendário/inputs num browser real), e confirmação visual de que o
  input de emoji deixou de parecer clicável. Ver `RESULT.md` §4.

## 5. Riscos

- **Risco principal: o formato de data devolvido pelo calendário custom não bater certo com o que os
  view-models esperam** (string ISO `yyyy-MM-dd`, sem hora/fuso-horário). **Mitigação:** construir a
  string ISO manualmente a partir de ano/mês/dia (`padStart`), nunca via `Date.toISOString()`
  (que aplica UTC e pode desviar um dia consoante o fuso horário do browser) — o mesmo cuidado que
  `transacoes-editar.component.ts:53` já tem ao reconstruir a data a partir de `{dia,mes,ano}`.
- **Risco: esquecer que o `FormControl` `moeda` continua a existir mas escondido**, e algum
  formulário ficar sem o valor por omissão `'EUR'` se a definição do `FormGroup` for tocada por
  engano. **Mitigação:** não alterar nenhuma definição de `FormGroup`/`.ts` nesta migração — só os
  templates; grep final `grep -rn "formControlName=\"moeda\"" frontend/src/app` deve devolver zero
  resultados.
- **Risco: o fix CSS do emoji ser demasiado amplo e afetar outro `readonly` que ainda não existe.**
  **Mitigação:** regra scoped só a `.emoji-input-group input[readonly]`, não ao seletor genérico
  `.form-input[readonly]`.
- **Risco: volume de ficheiros (13) tornar fácil deixar um `<input type="date">`/`type="number"`
  esquecido.** **Mitigação:** grep final `grep -rln 'type="date"\|type="number"' frontend/src/app`
  deve só devolver `date-picker`/`money-input`/`integer-input` (os `<input>` internos dos próprios
  componentes novos).

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | `app-date-picker` | `shared/components/date-picker/*.{ts,html,css}` | A |
| 2 | `app-money-input` | `shared/components/money-input/*.{ts,html,css}` | B |
| 3 | `app-integer-input` | `shared/components/integer-input/*.{ts,html,css}` | C |
| 4 | Fix do input de emoji | `frontend/src/styles/_forms.css` | D |
| 5 | Migração — transações | `transacoes/components/{criar-entradas,criar-saidas,criar-credito,criar-reembolso,editar}` | A, B |
| 6 | Migração — despesas recorrentes | `despesas-recorrentes/components/{nova-regra,editar-regra,gerar-transacao,editar-transacao}` | A, B, C |
| 7 | Migração — cartões e contas | `cartoes-credito/components/{criar,editar,pagar}`, `contas/components/criar` | A, B |

## 7. Fora de âmbito / handoff

- **Formatação PT-PT completa do valor monetário** (vírgula decimal, separador de milhares) — não
  pedido explicitamente; o `app-money-input` só adiciona o "€" e remove o campo `moeda`.
- **Suporte a outra moeda além de EUR** — a app não suporta hoje; o `FormControl` `moeda` fica
  hard-coded a `'EUR'` em todo o lado, como já estava.
- **Storybook para os 3 componentes novos** — mesma decisão da F0004; pode ser adicionado depois.
- **Verificação funcional real de cada formulário submetido** — não disponível nesta sessão; ver
  `RESULT.md` §4.
