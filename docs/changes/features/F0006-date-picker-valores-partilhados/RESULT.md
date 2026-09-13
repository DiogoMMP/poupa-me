# F0006 — RESULT

| | |
| :--- | :--- |
| **Tipo** | Feature |
| **Branch** | `feature/date-picker-valores-partilhados` (base: `develop`) |
| **Estado** | Implementado |
| **Build** | `cd frontend && npm run build` — verde; bundle inicial 435.58 kB (baseline pós-F0004/F0005: 434.01 kB — aumento esperado pelos 3 componentes novos, dentro do orçamento) |
| **Testes** | `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8/8 SUCCESS (baseline igual; não há specs para os formulários migrados, ver §4) |
| **Commits** | Ainda não committado |

## 1. O que foi fechado

- **A. `shared/components/date-picker/date-picker.component.{ts,html,css}`** — `DatePickerComponent`,
  calendário 100% customizado (sem `<input type="date">` nativo por trás), `ControlValueAccessor`
  completo, valor em string ISO `yyyy-MM-dd`. Reaproveita o `SelectRegistryService` já existente da
  F0004 (sem alterações nele — já era genérico o suficiente) para fechar automaticamente qualquer
  outro `app-select`/`app-date-picker` aberto na página. Grelha de 42 células (6 semanas), semana a
  começar à segunda-feira, navegação por teclado (setas movem o dia ativo, `Enter` seleciona,
  `Escape` fecha), mês construído com aritmética de `Date` nativa (sem biblioteca nova). Substitui os
  13 `<input type="date">` em 10 ficheiros.
- **B. `shared/components/money-input/money-input.component.{ts,html,css}`** — `MoneyInputComponent`,
  `ControlValueAccessor`, `<input type="number">` interno com sufixo visual "€" embutido. Substitui os
  11 `<input type="number">` do campo `valor` em 8 ficheiros, e remove o `<input formControlName="moeda">`
  que os acompanhava em cada um — o `FormControl` `moeda` continua a existir no `FormGroup` de cada
  consumidor, só deixou de ter um input visível, mantendo o valor fixo `'EUR'` que já tinha por
  omissão. **Zero mudanças em view-models/mappers** — confirmado por grep
  (`formControlName="moeda"` → 0 resultados em `frontend/src/app`).
- **C. `shared/components/integer-input/integer-input.component.{ts,html,css}`** —
  `IntegerInputComponent`, `ControlValueAccessor`, `<input type="number">` interno sem setas nativas
  do browser. Substitui os 4 `<input type="number">` de `diaDoMes`/`mes` em
  `despesas-recorrentes/components/{nova-regra,editar-regra}`.
- **D. Fix do input de emoji** — `.emoji-input-group input[readonly] { cursor: default; pointer-events:
  none; }` em `frontend/src/styles/_forms.css`, scoped ao grupo do emoji (não à regra genérica
  `.form-input[readonly]`) — cobre os 10 ficheiros que usam esse padrão sem lhes tocar
  individualmente. Só o `.emoji-btn` continua a abrir o popup do Picmo.

**Confirmação final por grep:** `grep -rn 'type="date"\|type="number"' frontend/src/app` só devolve
resultados dentro dos próprios `date-picker`/`money-input`/`integer-input` (e um comentário
desatualizado em `cartoes-credito-pagar.view-model.ts` que já não corresponde a nenhum `<input>` real
— ver §3).

## 2. Pontos que precisam de decisão

- Nenhum.

## 3. Desvios face ao plano aprovado

- **Bug de layout encontrado e corrigido, não previsto no plano:** as regras CSS existentes que davam
  divisão de espaço 50/50 aos pares "Início"/"Fim" (`.form-field[formGroupName="periodo"] .row-controls
  .form-input { flex: 1 1 0 }`) e o `.form-input:first-child`/`:last-child` correspondente só se
  aplicam a elementos com a classe `.form-input` — que `<app-date-picker>` nunca teve (é um
  componente, não um `<input>`). Sem correção, os dois calendários dos pares de datas
  (`cartoes-credito` criar/editar/pagar) ficariam com larguras desiguais dentro de `.row-controls`.
  Corrigido com uma nova regra `.form-field .row-controls app-date-picker { flex: 1 1 0; min-width: 0
  }` em `_forms.css`, que reproduz o mesmo comportamento sem herdar o estilo visual (fundo/borda/
  padding) da classe `.form-input` — evitaria um "caixa dentro de caixa" se a classe tivesse sido
  aplicada diretamente ao componente.
- **Comentário desatualizado deixado por corrigir num ficheiro fora do âmbito da migração:**
  `cartoes-credito-pagar.view-model.ts:64` ainda refere `<input type="date">` num comentário
  JSDoc, mas essa função só calcula strings ISO (`computeDefaultPeriodoISO`) — não continha nenhum
  `<input>` real, por isso não fazia parte do inventário de migração. Não corrigido nesta sessão por
  ser puramente cosmético (comentário, sem impacto funcional) e fora do âmbito declarado no
  `README.md`; fica assinalado aqui para uma limpeza futura.
- **Largura do popup do calendário ajustada por feedback visual em direto do utilizador** (a correr
  `ng serve` em paralelo), em 3 iterações: (1) largura fixa `280px` inicial (plano original) deixava
  os campos "Valor"/"Categoria" por baixo parcialmente visíveis ao lado do popup, com aspeto
  "cortado"; (2) tentativa de largura 100% do campo (`left:0;right:0`, sem largura máxima, imitando o
  `app-select-list`) — rejeitada pelo utilizador por ficar "muito grande"; (3) valor final:
  `width:100%; max-width:248px` (responsivo em ecrãs estreitos, mas contido a um tamanho de popup de
  calendário convencional em ecrãs largos).
- **Bug de overflow da grelha de dias encontrado e corrigido, não previsto no plano:** com a grelha
  CSS (`grid-template-columns: repeat(7, 1fr)`), os `<button>` de cada dia não tinham `min-width:0`
  nem `box-sizing:border-box` — o valor por omissão do browser para itens de grid (`min-width:auto`,
  baseado no conteúdo/padding nativo do `<button>`) impedia-os de encolher para caber na coluna
  calculada, fazendo a última coluna (Sáb/Dom) sair visualmente para fora do popup. Corrigido com
  `grid-template-columns: repeat(7, minmax(0,1fr))` + `box-sizing:border-box; width:100%; min-width:0;
  padding:0` em `.app-date-picker-day`.
- Sem outros desvios — a estrutura dos 3 componentes, o contrato de valor (ISO para datas, `number`
  para dinheiro/inteiro) e a decisão de manter `moeda` "fantasma" no `FormGroup` seguiram exatamente o
  que o `README.md` especificava.

## 4. Não verificado nesta sessão

- **Submissão real de cada um dos 12 formulários migrados** (valor enviado à API, seleção de data no
  calendário num browser real, navegação por teclado no calendário) — não disponível nesta sessão,
  sem browser interativo.
- **Confirmação visual do layout dos pares de datas** (`cartoes-credito` criar/editar/pagar) após o
  fix de CSS do §3 — a correção foi feita por inspeção do código-fonte das regras CSS existentes, não
  por captura de ecrã.
- **Confirmação visual de que o input de emoji deixou de parecer clicável** nos 10 ficheiros
  afetados.
- **`npm run storybook`** não corrido para verificar se algum `.stories.ts` existente é afetado.
- **`npm run test:ci` (Cypress e2e)** não corrido.

## 5. Como correr a verificação

- `cd frontend && npm run build` — confirma compilação sem erros (verde, 435.58 kB inicial).
- `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8/8 specs (sem cobertura
  direta dos formulários/componentes migrados).
- Inspeção manual: `cd frontend && npm start`, percorrer os 12 formulários listados no `README.md`
  §1 — testar seleção de data no calendário (incluindo navegação de mês e teclado), submissão do
  valor monetário (confirmar que o `€` aparece e que o payload enviado à API continua com
  `moeda: 'EUR'`), os 2 campos `diaDoMes`/`mes`, o layout dos pares "Início"/"Fim", e o input de
  emoji nos ecrãs de `bancos`/`contas`/`categorias`/`cartoes-credito` (criar/editar).

## 6. Inventário de alterações

**Novo:**
- `frontend/src/app/shared/components/date-picker/date-picker.component.{ts,html,css}`.
- `frontend/src/app/shared/components/money-input/money-input.component.{ts,html,css}`.
- `frontend/src/app/shared/components/integer-input/integer-input.component.{ts,html,css}`.
- `docs/changes/features/F0006-date-picker-valores-partilhados/README.md`, `RESULT.md`.

**Alterado:**
- `frontend/src/styles/_forms.css` — fix do input de emoji (§1.D) + fix de layout dos pares de data
  (§3).
- `frontend/src/app/features/transacoes/components/{criar-entradas,criar-saidas,criar-credito,
  criar-reembolso,editar}/*.{ts,html}` — datas e valores migrados.
- `frontend/src/app/features/despesas-recorrentes/components/{gerar-transacao,editar-transacao}/*.{ts,html}`
  — datas e valores migrados.
- `frontend/src/app/features/despesas-recorrentes/components/{nova-regra,editar-regra}/*.{ts,html}` —
  valores e os 2 campos inteiros (`diaDoMes`, `mes`) migrados.
- `frontend/src/app/features/cartoes-credito/components/{criar,editar}/*.{ts,html}` — datas e valores
  migrados.
- `frontend/src/app/features/cartoes-credito/components/pagar/*.{ts,html}` — datas migradas.
- `frontend/src/app/features/contas/components/criar/*.{ts,html}` — valor migrado.
