# B0012 — Erro genérico ao criar Transação com data no futuro

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/data-futura-e-banco-nao-selecionado` (base: `develop`) — partilhado com o B0013, a pedido do utilizador |
| **Estado** | Planeado |
| **Âmbito** | 1 componente partilhado (`date-picker`) + 5 view-models + 1 util novo, feature `transacoes` |
| **Verificação** | `cd frontend && npm run build` + `npm test` |

## 1. Situação

Issue [#70](https://github.com/DiogoMMP/poupa-me/issues/70): *"Quando estamos a criar uma transação e
colocamos uma data no futuro no frontend aparece um erro geral"* — ao criar uma Transação
(Entrada/Saída/Crédito/Reembolso) com uma data futura, o utilizador só vê um erro genérico, sem
perceber que a causa é a data.

**Evidência:**

O backend já rejeita corretamente datas futuras, com uma mensagem específica —
`Data.createFromParts` (`backend/src/domain/Shared/ValueObjects/Data.ts:65`):

```ts
if (!Data.verifyDateLimitations(year, month, day, allowPastDates)) {
    return Result.fail<Data>(allowPastDates ? 'Invalid date' : 'Invalid date or date is in the future');
}
```

Essa falha chega ao frontend como `400 { "error": "Invalid date or date is in the future" }`
(`backend/src/controllers/Transacao/TransacaoController.ts:25,35,45,55,129` — `createEntrada`,
`createSaida`, `createCredito`, `createReembolso` e `updateTransacao`, todos com o mesmo
`res.status(400).json({ error: result.error })`).

Mas os 5 pontos do frontend que chamam estes endpoints **ignoram por completo o corpo do erro**. Os 4
view-models de criação e o de edição têm todos o mesmo padrão
(`transacoes-criar-entradas.view-model.ts:83-86`, e análogo em `criar-saidas`, `criar-credito`,
`criar-reembolso`, `editar`):

```ts
error: () => {
  this.notification.error('Falha ao criar entrada');   // string fixa, sempre igual
  this.isLoading$.next(false);
}
```

O callback nem sequer recebe o parâmetro `err` — a mensagem real do backend (`err.error.error`) nunca
é lida. É isto que o utilizador reporta como "erro geral": a app tem a informação certa e descarta-a.

Agrava a confusão o facto de `app-date-picker`
(`frontend/src/app/shared/components/date-picker/date-picker.component.ts`) não ter nenhuma
restrição de data máxima — o calendário deixa escolher livremente qualquer data futura, sem pista
visual de que vai falhar.

**Inventário (superfícies afetadas):**

- **A.** `DatePickerComponent` — sem suporte para limitar a data máxima selecionável.
- **B.** `transacoes-criar-entradas.view-model.ts` — erro genérico fixo.
- **C.** `transacoes-criar-saidas.view-model.ts` — erro genérico fixo.
- **D.** `transacoes-criar-credito.view-model.ts` — erro genérico fixo.
- **E.** `transacoes-criar-reembolso.view-model.ts` — erro genérico fixo.
- **F.** `transacoes-editar.view-model.ts` — erro genérico fixo (mesmo problema ao editar para uma
  data futura).

**Escala:** 8 ficheiros (1 componente partilhado + 5 view-models + 1 util novo + 5 templates de
criação/edição a passar `maxDate`).

## 2. Resultado pretendido

Ao criar (ou editar) uma transação de conta/cartão com data futura: (1) o calendário já não deixa
escolher uma data depois de hoje, evitando a maior parte dos casos; (2) se ainda assim o pedido
chegar ao backend com uma data futura (ex.: input inválido enviado por outra via) e falhar, o
utilizador vê uma mensagem clara em português — "A data não pode ser uma data futura." — em vez do
texto genérico fixo.

**Decisões:**

- **Âmbito reduzido ao pedido literal da issue** (decidido com o utilizador): só mensagem clara +
  bloqueio de seleção no date-picker para Entrada/Saída/Crédito/Reembolso (criar e editar). **Não**
  muda a regra de negócio de Despesa Recorrente/Poupança, que sofre do mesmo bloqueio de datas
  futuras em `TransacaoDespesasRecorrentesService` — isso faz sentido ser revisto à parte, porque é
  uma mudança de regra de domínio (permitir data futura nesses tipos), não uma correção de mensagem.
  Registado em §7 para um issue novo.
- **Mapeamento de erro no frontend, não tradução no backend.** O backend mantém a mensagem em inglês
  (`'Invalid date or date is in the future'`) — é o padrão já usado em todos os outros `Result.fail`
  do projeto (mensagens internas em inglês; é o frontend que traduz para o utilizador, como já
  acontece com os textos fixos existentes). Criado um pequeno util
  `transacao-error.util.ts` que mapeia esta mensagem conhecida para PT-PT, com fallback para a
  mensagem genérica atual quando o erro não é este.
- **`maxDate` como `@Input` opcional no `DatePickerComponent`**, não um comportamento sempre ativo —
  os restantes usos do componente (período de cartão, despesas recorrentes, etc., fora de âmbito
  aqui) continuam sem restrição, sem qualquer mudança de comportamento.
- **Comparação de datas por string ISO** (`cell.iso > maxDate`), sem introduzir `Date` novo — o
  formato `yyyy-MM-dd` já usado em todo o componente é ordenável lexicograficamente, evitando bugs de
  timezone (já um problema resolvido no B0006 para outro componente).

**Alternativa rejeitada:** mostrar sempre `err.error.error` tal como o backend o devolve. Rejeitada
porque está em inglês e quebraria a convenção PT-PT do resto da UI para um único caso específico sem
nenhum ganho sobre o mapeamento dedicado.

## 3. Implementação

1. **`frontend/src/app/shared/utils/date-formatter.util.ts`** — acrescentar
   `export function getTodayIso(): string`, devolvendo a data de hoje em `yyyy-MM-dd` (mesma lógica
   que `DatePickerComponent.todayIso` já usa internamente, extraída para reutilização pelos
   consumidores do componente).

2. **`frontend/src/app/shared/components/date-picker/date-picker.component.ts`**:
   - Acrescentar `@Input() maxDate: string | null = null;`.
   - `DayCell` passa a ter `disabled: boolean`; no `days` computed, `disabled: this.maxDate != null
     && cell.iso > this.maxDate`.
   - `selectDay(...)`: `if (cell.disabled) return;` no início.
   - `onPanelKeydown(...)`, nos casos `Enter`/`' '`: não confirmar seleção (`return` sem `onChange`)
     quando `this.maxDate != null && active > this.maxDate`.

3. **`frontend/src/app/shared/components/date-picker/date-picker.component.html`** — no
   `<button #dayEl ...>`, acrescentar `[class.disabled]="cell.disabled"` e `[disabled]="cell.disabled"`.

4. **`frontend/src/app/shared/components/date-picker/date-picker.component.css`** — nova regra
   `.app-date-picker-day.disabled` (opacidade reduzida, `cursor: not-allowed`, sem hover/focus),
   ao lado das regras `.muted`/`.today`/`.selected` já existentes.

5. **`frontend/src/app/features/transacoes/utils/transacao-error.util.ts`** (novo) —
   `export function mapTransacaoErrorMessage(err: unknown, fallback: string): string`, que lê
   `err instanceof HttpErrorResponse ? err.error?.error : undefined` e devolve `'A data não pode ser
   uma data futura.'` quando for `'Invalid date or date is in the future'`, ou `fallback` em
   qualquer outro caso.

6. **Os 5 view-models** (`transacoes-criar-entradas.view-model.ts`, `-criar-saidas`, `-criar-credito`,
   `-criar-reembolso`, `-editar`) — no `error:` do `subscribe(...)`, passar a receber
   `(err: HttpErrorResponse)` e chamar
   `this.notification.error(mapTransacaoErrorMessage(err, '<mensagem genérica atual>'))` em vez da
   string fixa (a mensagem genérica de cada um mantém-se como fallback, inalterada).

7. **Os 5 templates correspondentes** (`transacoes-criar-entradas.component.ts` e os outros 4) —
   expor `readonly todayIso = getTodayIso();` no componente e ligar `[maxDate]="todayIso"` no
   `<app-date-picker>`.

8. **`frontend/src/app/features/transacoes/utils/transacao-error.util.spec.ts`** (novo) — testes
   unitários de `mapTransacaoErrorMessage`: mensagem conhecida → texto PT-PT; mensagem desconhecida →
   fallback; erro sem `HttpErrorResponse`/sem corpo → fallback.

Fase única — as alterações são pequenas e interligadas (o `maxDate` do date-picker e o mapeamento de
erro resolvem a mesma causa em dois pontos complementares); um só commit revisável.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros pré-existente a esta data.
- `cd frontend && npm test` — sem baseline de testes a falhar previamente; o novo
  `transacao-error.util.spec.ts` deve passar.
- Verificação manual (não automatizável nesta sessão, ver `RESULT.md` §4): abrir "Criar Entrada" (ou
  Saída/Crédito/Reembolso), confirmar que o calendário não deixa selecionar dias depois de hoje;
  forçar um pedido com data futura (ex. via devtools) e confirmar que aparece "A data não pode ser
  uma data futura." em vez do texto genérico.

## 5. Riscos

- **Risco:** `maxDate` fica `null` por omissão nos restantes usos do `date-picker` (período de
  cartão, despesas recorrentes) — nenhuma mudança de comportamento aí. **Mitigação:** `disabled` só é
  `true` quando `maxDate` está definido; verificado por leitura de todos os 13 ficheiros que usam
  `app-date-picker` (§1) — só os 5 em âmbito recebem o novo `[maxDate]`.
- **Risco:** o mapeamento de erro só cobre a mensagem exata `'Invalid date or date is in the
  future'`; qualquer variação de wording no backend deixa de ser reconhecida. **Mitigação:** o
  `fallback` garante que o comportamento nunca fica pior do que hoje (mensagem genérica), só melhora
  no caso coberto.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | `maxDate` no date-picker + mensagem clara nos view-models de Transação | `date-formatter.util.ts`, `date-picker.component.{ts,html,css}`, `transacao-error.util.ts` (+spec), 5 view-models, 5 templates | A, B, C, D, E, F |

## 7. Fora de âmbito / handoff

- **Permitir data futura em Despesa Recorrente/Poupança** — `TransacaoDespesasRecorrentesService`
  sofre do mesmo bloqueio (`Data.createFromParts` sem `allowPastDates`), mas para esses tipos uma
  data futura é o caso normal (despesa a vencer, meta de poupança). É uma mudança de regra de
  domínio, decidida como fora de âmbito para não misturar com esta correção de mensagem — candidato a
  issue novo.
- **`err.error.error` genérico para outros formulários** (Contas, Cartões, Bancos, etc.) — o mesmo
  padrão de "erro genérico fixo" existe noutras features, mas só foi corrigido aqui para o fluxo
  reportado na issue #70.
- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão.
