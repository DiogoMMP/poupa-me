# B0008 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/checkboxes-nao-marcadas-editar-banco` |
| **Estado** | Implementado |
| **Build** | `npm run build` (frontend) — sem erros |
| **Testes** | `npm test` (frontend, Karma/ChromeHeadless) — 10/10 sucesso (era 9/9 antes; +1 teste novo no mapper) |
| **Commits** | Ainda não commitado nesta sessão (ver §6 Próximo passo) |

## 1. O que foi fechado

- **A.** `BancosDTO.contasCartoesSelecionados` — corrigido. Tipo passou de `string[]` para
  `EntityReference[]`, alinhado com o que `GET /banco/:id` realmente devolve.
- **B.** `BancosMapper.toModel` — corrigido. Passou a extrair `.id` de cada referência, produzindo o
  `string[]` que `isSelected`/`toggleSelection` já esperavam.

Como efeito colateral necessário (a mudança de tipo do ponto A obriga-o a compilar), `BancosMapper
.toDto` — código morto, sem chamador, tal como o equivalente em `CartoesCreditoMapper` (B0006) — foi
ajustado para o novo tipo (`model.contasCartoesSelecionados?.map(id => ({ id }))`), sem mudar o seu
comportamento (continua sem ser chamado em lado nenhum).

## 2. Pontos a precisar de decisão

Nenhum surgiu durante a implementação.

## 3. Desvios do plano aprovado

Nenhum desvio de fundo. O README já previa que a correção do tipo em `BancosDTO` obrigaria o mapper a
mudar para continuar a compilar; na prática isso incluiu `toDto` (não só `toModel`), que o README não
tinha listado explicitamente — ajuste mecânico de tipo, sem alterar comportamento.

## 4. Não verificado

- **Verificação manual num browser** (editar um banco com contas/cartões associados e confirmar que
  aparecem pré-marcados) — não disponível nesta sessão (sem backend/browser a correr). Consequência
  operacional: o comportamento está coberto pelo teste unitário do mapper (que reproduz exatamente a
  forma como o backend responde), mas a confirmação visual das checkboxes só fica feita quando alguém
  abrir a app manualmente.

## 5. Como correr a verificação

- `cd frontend && npm run build` — prova que o novo tipo `EntityReference[]` compila em todos os
  consumidores de `BancosDTO.contasCartoesSelecionados` (incluindo o `toDto` morto).
- `cd frontend && npm test` — o teste novo em `bancos.mapper.spec.ts` (`'should map
  contasCartoesSelecionados entity references to plain ids'`) reproduz a forma real da resposta do
  backend (`[{id, nome}, ...]`) e falha contra o código anterior (o mapper devolvia os objetos, não os
  ids) — prova direta da correção do bug reportado.

## 6. Inventário de alterações

| Ficheiro | Tipo |
| :--- | :--- |
| `frontend/src/app/features/bancos/dto/bancos.dto.ts` | alterado |
| `frontend/src/app/features/bancos/mappers/bancos.mapper.ts` | alterado |
| `frontend/src/app/features/bancos/mappers/bancos.mapper.spec.ts` | alterado (+1 teste) |
| `docs/changes/bugfixes/B0008-checkboxes-nao-marcadas-editar-banco/README.md` | novo |
| `docs/changes/bugfixes/B0008-checkboxes-nao-marcadas-editar-banco/RESULT.md` | novo |
