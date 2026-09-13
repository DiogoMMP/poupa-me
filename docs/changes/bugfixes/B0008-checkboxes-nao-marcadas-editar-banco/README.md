# B0008 — Contas/Cartões associados não aparecem marcados ao editar um Banco

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/checkboxes-nao-marcadas-editar-banco` (base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | 1 DTO + 1 mapper, feature `bancos` |
| **Verificação** | `npm run build` (frontend) + `npm test` (frontend) |

## 1. Situação

Em "Editar Banco", as listas "Selecionar Contas"/"Selecionar Cartões" (checkboxes — reportadas pelo
utilizador como "radios") nunca aparecem marcadas, mesmo quando o banco já tem contas/cartões
associados.

**Evidência:**

`bancos-editar.component.ts:135-138` decide se uma checkbox aparece marcada assim:

```ts
isSelected(id: string): boolean {
  const arr: string[] = this.form.get('contasCartoesSelecionados')?.value || [];
  return arr.includes(id);
}
```

Isto espera que `contasCartoesSelecionados` seja um array de ids simples (`string[]`) — é assim que
o DTO do frontend o declara
([`bancos.dto.ts:11`](../../../../frontend/src/app/features/bancos/dto/bancos.dto.ts)):

```ts
export interface BancosDTO {
  ...
  contasCartoesSelecionados?: string[];
}
```

Mas o endpoint que alimenta este ecrã (`GET /banco/:id`, chamado por
[`bancos-editar.view-model.ts:40-42`](../../../../frontend/src/app/features/bancos/components/editar/bancos-editar.view-model.ts))
devolve outra coisa. `BancoMap.toDTO`
([`BancoMap.ts:70-89`](../../../../backend/src/mappers/BancoMap.ts)), usado por esse endpoint, resolve
cada id para um objeto:

```ts
contasCartoesSelecionados: banco.contasCartoesSelecionados?.map(id => {
  const info = contasCartoesMap?.get(id);
  return { id, nome: info?.nome, icon: info?.icon };
})
```

— tal como o próprio DTO backend documenta
([`IBancoDTO.ts:4,12`](../../../../backend/src/dto/IBancoDTO.ts)):

```ts
/**
 * Data Transfer Object for Banco entity (detail view — includes contasCartoesSelecionados).
 * Used for GET /banco/:id
 */
export interface IBancoDTO {
  ...
  contasCartoesSelecionados?: IEntityReferenceDTO[];
}
```

Ou seja, o backend responde com `[{id, nome, icon}, ...]` — o padrão "entity reference" já usado no
resto do projeto para `user`/`banco`/`contaPagamento`
([`entity-reference.model.ts`](../../../../frontend/src/app/shared/models/entity-reference.model.ts),
cujo próprio comentário documenta que "as DTOs moved from loose ids to entity references"). O DTO do
frontend nunca foi atualizado para essa migração neste campo específico — continua à espera de
`string[]`. Em runtime, `contasCartoesSelecionados` chega como um array de objetos; `arr.includes(id)`
compara um `string` com objetos e nunca encontra correspondência — nenhuma checkbox aparece marcada.

O DTO de **escrita** (`BancosUpdateDTO`, usado ao "Guardar") já está correto — o backend espera
`string[]` nesse sentido
([`IUpdateBancoDTO.ts:40`](../../../../backend/src/dto/IBancoDTO.ts) `contasCartoesSelecionados?:
string[]`) e o frontend já envia assim. O bug é só na leitura (GET → mostrar o formulário).

**Inventário (superfícies afetadas):**

- **A.** `BancosDTO.contasCartoesSelecionados` (tipo incorreto).
- **B.** `BancosMapper.toModel` (não converte o array de objetos para ids).

Confirmado por grep que nenhum outro ficheiro do frontend lê `contasCartoesSelecionados` — o campo só
existe em `bancos.dto.ts`, `bancos.model.ts`, `bancos.mapper.ts` e `bancos-editar.component.ts`; a
listagem de bancos e o dashboard usam `GET /banco` (lista), que nem devolve este campo
(`IBancoSummaryDTO` não o inclui).

**Escala:** 2 ficheiros.

## 2. Resultado pretendido

Ao abrir "Editar Banco", as checkboxes das contas/cartões já associados ao banco aparecem marcadas;
(des)marcar continua a funcionar e o valor gravado ao "Guardar" continua a ser uma lista de ids
simples, exatamente como hoje.

**Decisões:**

- **Corrigir o tipo do DTO de leitura para `EntityReference[]`** (o modelo partilhado já usado para
  `user`/`banco`/`contaPagamento`) **e resolver os ids no mapper**, em vez de mudar o backend para
  devolver `string[]`. O backend já segue deliberadamente o padrão "entity reference" (documentado no
  próprio `EntityReference` partilhado) para todos os campos deste tipo; mudar o backend quebraria
  essa consistência só para este campo.
  **Alternativa rejeitada:** mudar `BancoMap.toDTO` para devolver `string[]` em vez de
  `IEntityReferenceDTO[]`. Rejeitada porque sairia do padrão que o resto da API já segue, e perderia
  `nome`/`icon` já resolvidos pelo backend sem custo extra (não usados hoje pelo frontend, mas
  disponíveis para o dia em que a listagem de seleção quiser evitar o `loadContas`/`loadCartoes`
  extra).
- **`BancosModel.contasCartoesSelecionados` mantém-se `string[]`** — é o formato que
  `isSelected`/`toggleSelection`/o binding das checkboxes já usam corretamente; a conversão
  objeto→id fica isolada no mapper (a fronteira DTO↔Model), sem tocar no componente.

## 3. Implementação

1. **`frontend/src/app/features/bancos/dto/bancos.dto.ts`** — importar `EntityReference` (já usado
   para `user`) e mudar `BancosDTO.contasCartoesSelecionados` de `string[]` para `EntityReference[]`
   (linha 11). `BancosUpdateDTO.contasCartoesSelecionados` (linha 29) mantém-se `string[]`.
2. **`frontend/src/app/features/bancos/mappers/bancos.mapper.ts`** — `toModel` (linha 17): mudar
   `contasCartoesSelecionados: dto.contasCartoesSelecionados || []` para
   `(dto.contasCartoesSelecionados || []).map(ref => ref.id)`.
3. **`frontend/src/app/features/bancos/mappers/bancos.mapper.spec.ts`** — acrescentar um teste que
   chama `toModel()` com `contasCartoesSelecionados: [{ id: 'CNT00000000001', nome: 'Conta Ordenado'
   }, { id: 'CRT00000000001', nome: 'Cartão Ouro' }]` (a forma real que o backend envia) e verifica
   que `model.contasCartoesSelecionados` é `['CNT00000000001', 'CRT00000000001']`. Este teste falha
   contra o código atual (o mapper devolveria os objetos, não os ids) e passa depois da correção — e
   o próprio passo 1 (corrigir o tipo do DTO) já obriga o passo 2 a ser feito, porque de outra forma
   o `toModel` deixaria de compilar.

Fase única — as duas alterações de produção são a mesma correção (tipo + conversão), pequenas o
suficiente para um único commit revisável.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros/warnings pré-existente a esta data.
- `cd frontend && npm test` — sem baseline de testes a falhar previamente; o novo teste do mapper
  deve passar.
- Verificação manual (não automatizável nesta sessão, ver `RESULT.md` §4): editar um banco que já
  tenha contas/cartões associados e confirmar que aparecem pré-marcados; (des)marcar e gravar,
  reabrir e confirmar que o estado persiste corretamente.

## 5. Riscos

- **Risco:** `contasCartoesMap` (usado por `BancoMap.toDTO` no backend para resolver `nome`/`icon`)
  não tiver entrada para algum id de `banco.contasCartoesSelecionados` (ex.: conta entretanto
  eliminada) — nesse caso o backend já devolve `{id, nome: undefined, icon: undefined}` (não falha);
  o mapper do frontend só usa `.id`, por isso não é afetado.
- **Risco:** outro sítio do frontend vir a consumir `BancosDTO.contasCartoesSelecionados` como
  `string[]` no futuro sem reparar na mudança de tipo. **Mitigação:** o TypeScript falha a compilar
  nesse caso (tipo `EntityReference[]` não é atribuível a `string[]`), tornando o erro visível de
  imediato em `npm run build`.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Corrige o tipo de `contasCartoesSelecionados` na leitura de Banco | `bancos.dto.ts`, `bancos.mapper.ts`, `bancos.mapper.spec.ts` | A, B |

## 7. Fora de âmbito / handoff

- **`BancosMapper.toDto`** — não chamado em lado nenhum do frontend (código morto, como o
  equivalente em `CartoesCreditoMapper` referido no B0006); não alterado.
- **Usar `nome`/`icon` já resolvidos pelo backend para evitar o `loadContas`/`loadCartoes` extra em
  `bancos-editar.view-model.ts`** — otimização válida mas fora do âmbito deste bugfix (o comportamento
  atual, com um pedido extra, já funciona uma vez corrigido o bug dos ids).
- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão.
