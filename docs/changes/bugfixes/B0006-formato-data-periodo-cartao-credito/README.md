# B0006 — Datas mostradas com timezone/hora em vez de dd/MM/yyyy

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/formato-data-periodo-cartao-credito` (base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | 1 mapper + 1 view-model de listagem + 1 view-model de pagamento (todos em `cartoes-credito`) + 1 componente em `despesas-recorrentes` |
| **Verificação** | `npm run build` (frontend) + `npm test` (frontend) |

## 1. Situação

No formulário "Editar Cartão de Crédito" os campos "Início:"/"Fim:" do Período mostram uma string ISO
completa com timezone (ex.: `2026-09-30T23:0...`, truncada no input) em vez de uma data simples no
formato `dd/MM/yyyy` — reportado pelo utilizador com screenshot. Ao investigar, confirmámos que o
padrão de causa (construir uma data com `new Date(ano, mes-1, dia).toISOString()`, ou ler uma data
com getters **locais** depois de a interpretar como UTC) se repete em mais 3 sítios — 2 no mesmo
feature, 1 noutro feature completamente diferente.

**Evidência:**

**A. Causa raiz — `CartoesCreditoMapper.dataPropsToISOString`**
([`cartoes-credito.mapper.ts:71-78`](../../../../frontend/src/app/features/cartoes-credito/mappers/cartoes-credito.mapper.ts)),
usada por `toModel()` sempre que um cartão é carregado (Editar, Listar, Pagar, Dashboard):

```ts
private static dataPropsToISOString(data: { dia: number; mes: number; ano: number }): string {
  if (!data || !data.dia || !data.mes || !data.ano) return '';
  const date = new Date(data.ano, data.mes - 1, data.dia);
  return date.toISOString();
}
```

`new Date(ano, mes-1, dia)` cria a data à meia-noite **local**; `.toISOString()` converte-a para UTC,
deslocando-a pelo offset do browser — em Portugal, com DST ativo (UTC+1) em setembro, `30/09/2026`
local vira `2026-09-30T23:00:00.000Z`. É exatamente a string vista no screenshot.

O componente partilhado `app-date-picker`
([`date-picker.component.ts:26-30`](../../../../frontend/src/app/shared/components/date-picker/date-picker.component.ts))
só aceita uma string estrita `yyyy-MM-dd`; quando o parse falha, `formatDisplay`
([`date-picker.component.ts:135-139`](../../../../frontend/src/app/shared/components/date-picker/date-picker.component.ts))
cai no fallback de devolver a própria string em bruto — por isso o formulário de Editar, que usa
`app-date-picker`, mostra o ISO completo em vez de uma data.

**B. `CartoesCreditoListViewModel.formatDate`**
([`cartoes-credito-listar.view-model.ts:168-188`](../../../../frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.view-model.ts)),
usada em [`cartoes-credito-listar.component.html:44`](../../../../frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.component.html)
para mostrar "Período: dd/MM/yyyy - dd/MM/yyyy" nos cards da listagem:

```ts
const date = new Date(isoDate);
const day = date.getDate().toString().padStart(2, '0');
const month = (date.getMonth() + 1).toString().padStart(2, '0');
const year = date.getFullYear();
```

Hoje o resultado mostrado aqui está **correto** por coincidência: o valor de entrada já vem deslocado
para UTC pela função A, e ler de volta com getters locais desfaz exatamente esse deslocamento
(mesmo timezone/offset em ambas as pontas). Depois da correção de A (que passa a devolver
`yyyy-MM-dd` plano), `new Date("yyyy-MM-dd")` passa a ser interpretado como meia-noite UTC — ainda
seguro para timezones com offset ≥ 0 (Portugal), mas incorreto para qualquer timezone negativo, e
inconsistente com o padrão do resto do projeto. Corrigido pela mesma razão que A: para deixar de
depender de `Date`/timezone para um valor puramente de calendário.

**C. `CartoesCreditoPagarViewModel.computeDefaultPeriodoISO`**
([`cartoes-credito-pagar.view-model.ts:66-91`](../../../../frontend/src/app/features/cartoes-credito/components/pagar/cartoes-credito-pagar.view-model.ts)),
usada para pré-preencher o período por omissão no formulário "Pagar Cartão": lê
`cartao.periodo.dataFim` (produzido pela função A) via `new Date(...)` e faz aritmética de datas
(somar 1 dia, somar 1 mês, subtrair 1 dia) com getters/setters **locais**
(`getDate`/`setDate`/`getMonth`/`setMonth`) — mesma exposição que B, mas aqui precisa de facto de
aritmética de calendário, não só formatação.

**D. Feature diferente, mesmo padrão — `DespesasRecorrentesGerarTransacaoComponent`**
([`despesas-recorrentes-gerar-transacao.component.ts:34-35`](../../../../frontend/src/app/features/despesas-recorrentes/components/gerar-transacao/despesas-recorrentes-gerar-transacao.component.ts)),
usada para pré-preencher a data de "hoje" no formulário "Gerar Transação" de uma despesa recorrente:

```ts
const today = new Date();
const todayStr = today.toISOString().substring(0, 10); // YYYY-MM-DD
```

Mesma classe de erro na direção oposta: `toISOString()` converte "agora" (hora local) para UTC antes
de truncar à data. Em Portugal, no horário de verão (UTC+1), entre as 00:00 e a 00:59 locais, a hora
UTC ainda está no dia anterior — `todayStr` mostra o dia de ontem como "hoje" nesse formulário,
reproduzível todos os dias durante metade do ano, sem precisar de nenhum timezone exótico.

**Padrão correto já estabelecido no projeto**, sem passar por `Date`/timezone, em
[`transacoes-editar.component.ts:54-55`](../../../../frontend/src/app/features/transacoes/components/editar/transacoes-editar.component.ts)
e nos `*.view-model.ts` de `transacoes` (`criar-credito`, `criar-reembolso`, `criar-entradas`,
`criar-saidas`, `editar`) e de `cartoes-credito` (`criar`, `editar`, `pagar/submitPagar`) — todos
testam primeiro a regex `^(\d{4})-(\d{2})-(\d{2})$` e só caem em `new Date(...)` como *fallback*
defensivo para valores que nunca vêm do `app-date-picker`; **não precisam de alteração**.

**Achado à parte, sem impacto de comportamento:** `CartoesCreditoMapper.toDto`/`isoStringToDataProps`
(mapper.ts:38-59,83-94) tem o mesmo padrão problemático (`new Date(isoString)` + getters locais), mas
`toDto` nunca é chamado em lado nenhum do frontend — `cartoes-credito-criar.view-model.ts` e
`cartoes-credito-editar.view-model.ts` têm cada um o seu próprio parser inline (já seguro, regex
primeiro) para submeter o formulário, sem passar pelo mapper. É código morto; não faz parte deste
fix — referido aqui para que fique registado, não para ser alterado sem necessidade.

**Inventário (superfícies afetadas):**

- **A.** `CartoesCreditoMapper.dataPropsToISOString` — raiz do bug reportado.
- **B.** `CartoesCreditoListViewModel.formatDate` — listagem de cartões.
- **C.** `CartoesCreditoPagarViewModel.computeDefaultPeriodoISO` — período por omissão ao pagar.
- **D.** `DespesasRecorrentesGerarTransacaoComponent` (constructor) — data "hoje" por omissão.

**Escala:** 3 ficheiros, 4 métodos/blocos, 2 features (`cartoes-credito`, `despesas-recorrentes`).

## 2. Resultado pretendido

Todas as datas de período/data mostradas nestes 4 pontos aparecem sempre em `dd/MM/yyyy` sem hora
nem timezone, e sobrevivem a um ciclo completo (gravar → reabrir, ou "hoje" à meia-noite local) sem
deslocar de dia, em qualquer timezone — não só em Portugal.

**Decisões:**

- **Em A e B (só formatação/parse, sem aritmética de calendário): construir/ler a string
  `yyyy-MM-dd` diretamente dos números, sem nunca instanciar `Date`** — mesmo princípio já usado em
  `transacoes-editar.component.ts`. Elimina a conversão de timezone na raiz.
  **Alternativa rejeitada:** usar `Date.UTC(...)` + getters `getUTC*`. Rejeitada porque construir a
  string diretamente é mais curto e não há aritmética nestas duas funções que justifique um `Date`.
- **Em C e D (precisam de aritmética de calendário — somar mês/dia, ou obter "agora"): manter `Date`
  mas trocar todos os getters/setters locais pelos equivalentes UTC**
  (`getUTCFullYear`/`setUTCDate`/`getUTCMonth`/`setUTCMonth`/`getUTCDate`), incluindo a construção da
  string final. Isto evita qualquer conversão de timezone ao entrar/sair do `Date`, mantendo a
  aritmética que a função genuinamente precisa.
  **Alternativa rejeitada:** reescrever a aritmética "somar 1 mês"/"data de hoje" manualmente sem
  `Date`. Rejeitada por ser mais código e mais propensa a erros (meses com dias diferentes, ano
  bissexto) do que `Date` em UTC, que já trata esses casos corretamente.
- **`CartoesCreditoMapper.toDto`/`isoStringToDataProps` não são alterados** — código morto, sem
  chamador; alterá-los sem necessidade sairia do âmbito mínimo deste fix. Fica registado em §7.

## 3. Implementação

1. **`frontend/src/app/features/cartoes-credito/mappers/cartoes-credito.mapper.ts`** —
   `dataPropsToISOString` (linhas 71-78): substituir por
   `` `${String(data.ano).padStart(4,'0')}-${String(data.mes).padStart(2,'0')}-${String(data.dia).padStart(2,'0')}` ``.
2. **`frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.view-model.ts`** —
   `formatDate` (linhas 168-188): substituir `new Date(isoDate)` + getters locais por parse manual da
   string `yyyy-MM-dd` (`split('-')`), mantendo a validação/mensagens de erro existentes para entradas
   inválidas.
3. **`frontend/src/app/features/cartoes-credito/components/pagar/cartoes-credito-pagar.view-model.ts`** —
   `computeDefaultPeriodoISO` (linhas 66-91): trocar `getFullYear`/`getMonth`/`getDate`/`setDate`/
   `setMonth` pelos equivalentes `getUTCFullYear`/`getUTCMonth`/`getUTCDate`/`setUTCDate`/
   `setUTCMonth`; `new Date(cartao.periodo.dataFim)` mantém-se (parse de `yyyy-MM-dd` como meia-noite
   UTC já é o comportamento nativo correto do `Date`).
4. **`frontend/src/app/features/despesas-recorrentes/components/gerar-transacao/despesas-recorrentes-gerar-transacao.component.ts`** —
   constructor (linhas 34-35): substituir `today.toISOString().substring(0, 10)` por
   `` `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}` `` usando getters
   **locais** (aqui não há UTC envolvido — é a única função das 4 que parte de "agora" em vez de
   parsear um ISO existente, por isso o correto é ficar em hora local, não UTC).
5. **`frontend/src/app/features/cartoes-credito/mappers/cartoes-credito.mapper.spec.ts`** — acrescentar
   um teste a `describe('CartoesCreditoMapper')` que chama `toModel()` com `periodo.inicio`/`fecho` e
   verifica que `model.periodo.dataInicio`/`dataFim` são exatamente `'yyyy-MM-dd'` (sem `T`/hora/`Z`).
   Este teste falha contra o código atual (produz uma string com `T...Z`) e passa depois da correção
   do ponto 1 — prova a correção do bug reportado.

Fase única — as 4 alterações de produção são a mesma correção (mesmo padrão de bug, 4 funções em 2
features) mais o teste que a comprova; pequenas o suficiente para um único commit revisável.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros/warnings pré-existente a esta data.
- `cd frontend && npm test` — sem baseline de testes a falhar previamente; o novo teste do mapper
  deve passar.
- Verificação manual (não automatizável nesta sessão, ver `RESULT.md` §4): abrir Editar Cartão de
  Crédito e confirmar que Início/Fim mostram `dd/MM/yyyy`; gravar e reabrir para confirmar que a data
  não desloca de dia; conferir a listagem de cartões e o período por omissão em "Pagar Cartão"; abrir
  "Gerar Transação" de uma despesa recorrente e confirmar que a data por omissão é o dia atual.

## 5. Riscos

- **Risco:** alguma outra parte do frontend depende do formato atual (datetime ISO com timezone) do
  campo `periodo.dataInicio`/`dataFim` do `CartoesCreditoModel`, e passar a receber `yyyy-MM-dd`
  parte algo. **Mitigação:** grep confirmou que os únicos consumidores destes campos do model são os
  4 pontos listados no inventário (mais o `toDto` morto, não alterado) — nenhum outro ficheiro lê
  `periodo.dataInicio`/`dataFim` do `CartoesCreditoModel`.
- **Risco:** trocar getters locais por `getUTC*` em `computeDefaultPeriodoISO` (C) muda o resultado
  se `cartao.periodo.dataFim` alguma vez não for um `yyyy-MM-dd` puro. **Mitigação:** depois da
  correção do ponto A, esse campo é sempre produzido pelo mapper corrigido — sem outra fonte.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Datas sem timezone (cartão de crédito + despesas recorrentes) | `cartoes-credito.mapper.ts`, `cartoes-credito.mapper.spec.ts`, `cartoes-credito-listar.view-model.ts`, `cartoes-credito-pagar.view-model.ts`, `despesas-recorrentes-gerar-transacao.component.ts` | A, B, C, D |

## 7. Fora de âmbito / handoff

- **`CartoesCreditoMapper.toDto`/`isoStringToDataProps`** — código morto com o mesmo padrão de bug,
  mas sem chamador; não alterado para manter o âmbito mínimo. Se o mapper voltar a ser usado no
  caminho de submissão no futuro (em vez dos parsers inline em cada view-model), deve ser corrigido
  ou removido nessa altura.
- **Testes unitários para os view-models alterados (B, C) e para o componente D** — o projeto não tem
  specs Karma/Jasmine para nenhum destes ficheiros hoje; só `cartoes-credito.mapper.spec.ts` já
  existia, por isso só aí se acrescenta um teste, mantendo consistência com a cobertura atual.
- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão.
