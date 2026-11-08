# B0017 — Resultado: editar uma Despesa Recorrente Concluída altera também a conta destino

| | |
| :--- | :--- |
| **Tipo** | Bugfix (issue [#88](https://github.com/DiogoMMP/poupa-me/issues/88)) |
| **Branch** | `fix/editar-despesa-recorrente-concluida` (base: `develop`) |
| **Estado** | Implementado (por commitar) |
| **Build** | `npm run build` OK — linha de base também OK |
| **Testes** | 13 suites / 50 testes a passar (linha de base: 12 / 46); **4 novos**, dos quais 3 falharam contra o código antigo |
| **Lint** | 51 erros e 7 avisos — igual à linha de base; os dois ficheiros alterados não têm nenhum erro nem aviso |
| **Commits** | Nenhum ainda — ver README §6 |

## 1. O que foi fechado

- **A.** `revertDespesaRecorrenteImpact` — a conta destino só é revertida se a transação estiver Pendente. Fechado.
- **B.** `applyDespesaRecorrenteImpact` — a conta destino só é creditada se a nova transação estiver Pendente. Fechado.
- **C.** `revertPoupancaImpact` — o bloco da conta destino passou de "sempre" para "se Pendente". Fechado.
- **D.** `applyPoupancaImpact` — idem. Fechado.
- **E.** `TransacaoDespesasRecorrentesService.impacto.spec.ts` — 4 testes que passam pelo `TransacaoService` real e pelo `TransacaoDespesasRecorrentesService` real, com os saldos das contas a acumular num repo mockado. Corridos contra o código antigo, falharam como se esperava:
  - editar uma Despesa Mensal Concluída (100 € → 120 €): destino esperada 0 €, **recebida 20 €** — é a issue;
  - editar uma Poupança Concluída: destino esperada 0 €, **recebida 20 €**;
  - apagar uma Despesa Mensal Concluída: destino esperada 0 €, **recebida −100 €**;
  - editar uma Despesa Mensal Pendente (regressão): passou antes e depois.

Corrigido também, pelo mesmo código: `deleteTransacao` de uma despesa ou poupança Concluída deixa de tirar o valor da conta destino.

## 2. Pontos a decidir

- **Saldos já afetados em produção.** Cada edição de uma despesa ou poupança Concluída em que o valor mudou deixou a conta destino com a diferença (v₂ − v₁) a mais. Cada delete de uma Concluída tirou v da conta destino. A correção não repara nada disto. **Consequência:** as contas "Despesas Mensais" (ou outras usadas como destino) de quem já editou ou apagou despesas concluídas continuam a mostrar um saldo errado até alguém o corrigir à mão ou com um script de auditoria. Não há forma de saber, só pelos dados, que edições aconteceram (não há histórico de edições), por isso um script só pode recalcular o saldo esperado a partir das transações.
- **Poupança imediata não credita a conta poupança** (README §7). **Consequência:** criar uma poupança imediata tira o dinheiro da origem e não o põe na poupança; depois, editar o valor mexe na poupança pela diferença e apagar tira-lhe v que ela nunca recebeu. Fica para uma issue própria.

## 3. Desvios do plano aprovado

- **O `README` §1 dizia que o revert da destino "passa a −100 ou falha".** Verificado depois: `Dinheiro` aceita valores negativos, por isso nunca falha — o erro aparece sempre em silêncio (a destino fica negativa ou com a diferença). Não muda a correção.
- **O teste de regressão Pendente passou também contra o código antigo**, como é de esperar de um teste de regressão: é ele que protege o caso que tem de continuar a funcionar. Os outros três são os que provam a correção.
- **Mudança de estado por edição** (Pendente ↔ Concluído) não ganhou teste próprio: a §2 do README mostra o resultado, mas não está fixado por um teste. Ver §4.

## 4. Não verificado

- **Na app:** criar uma despesa mensal não imediata, concluí-la, editar o valor e ver que só a origem muda. Precisa do stack a correr (`docker compose up`, ou backend + frontend + Postgres). Não foi executado nesta sessão.
- **Transição Pendente ↔ Concluído por edição** — sem teste automático; o frontend só mostra o campo Estado para Crédito/Reembolso, por isso hoje só acontece por chamada direta à API.
- **Dados reais** — sem acesso à BD de produção (ver §2).

## 5. Como correr a verificação

- `cd backend && npm run build` — o TypeScript compila.
- `cd backend && npm test` — corre a suite toda; tem de dar 13 suites / 50 testes a passar.
- `cd backend && node --experimental-vm-modules node_modules/jest/bin/jest.js src/services/Transacao/tests/TransacaoDespesasRecorrentesService.impacto.spec.ts` — só os 4 testes desta correção; com o `git stash` da alteração ao service, 3 deles falham.
- `cd backend && npm run lint` — tem de continuar em 51 erros e 7 avisos.

## 6. Inventário de alterações

- `backend/src/services/Transacao/TransacaoDespesasRecorrentesService.ts` — alterado (condição sobre `status` nos 4 métodos de impacto; JSDoc e comentários atualizados)
- `backend/src/services/Transacao/tests/TransacaoDespesasRecorrentesService.impacto.spec.ts` — novo
- `docs/changes/bugfixes/B0017-editar-despesa-recorrente-concluida/README.md` — novo
- `docs/changes/bugfixes/B0017-editar-despesa-recorrente-concluida/RESULT.md` — novo
- `docs/changes/bugfixes/README.md` — alterado (linha da B0017)
