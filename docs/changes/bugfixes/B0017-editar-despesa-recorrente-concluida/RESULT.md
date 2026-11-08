# B0017 — Resultado: editar uma Despesa Recorrente Concluída altera também a conta destino

| | |
| :--- | :--- |
| **Tipo** | Bugfix (issue [#88](https://github.com/DiogoMMP/poupa-me/issues/88)) |
| **Branch** | `fix/editar-despesa-recorrente-concluida` (base: `develop`) — PR [#94](https://github.com/DiogoMMP/poupa-me/pull/94) |
| **Estado** | Implementado, incluindo a segunda ronda (revisão do PR #94, README §8) |
| **Build** | `npm run build` OK — linha de base também OK |
| **Testes** | 14 suites / 59 testes a passar (linha de base: 12 / 46); **13 novos** — 8 em `TransacaoDespesasRecorrentesService.impacto.spec.ts`, 5 em `UnidadeDeTrabalho.spec.ts` |
| **Lint** | 51 erros e 7 avisos — igual à linha de base. Nos ficheiros tocados, só os 2 `no-explicit-any` que já existiam em `loaders/index.ts` |
| **Commits** | 1.ª ronda: `a8bb66d`, `fade618`, `f89ddab`. 2.ª ronda: por commitar |

## 1. O que foi fechado

- **A.** `revertDespesaRecorrenteImpact` — a conta destino só é revertida se a transação estiver Pendente. Fechado.
- **B.** `applyDespesaRecorrenteImpact` — a conta destino só é creditada se a nova transação estiver Pendente. Fechado.
- **C.** `revertPoupancaImpact` — o bloco da conta destino passou de "sempre" para "se Pendente". Fechado.
- **D.** `applyPoupancaImpact` — idem. Fechado.
- **E.** `TransacaoDespesasRecorrentesService.impacto.spec.ts` — testes que passam pelo `TransacaoService` real e pelo `TransacaoDespesasRecorrentesService` real, e verificam o saldo **gravado** em cada conta (o que `contaRepo.update` recebeu). Contra o código antigo, 5 dos 7 testes de impacto falham como se esperava:
  - editar uma Despesa Mensal Concluída (100 € → 120 €): destino esperada 0 €, **recebida 20 €** — é a issue;
  - editar uma Poupança Concluída: destino esperada 0 €, **recebida 20 €**;
  - editar uma Despesa Mensal de Pendente para Concluído: destino esperada 0 €, recebida 100 €;
  - editar uma Despesa Mensal de Concluído para Pendente: falha contra o código antigo;
  - apagar uma Despesa Mensal Concluída: destino esperada 0 €, **recebida −100 €**;
  - editar uma Despesa Mensal Pendente e uma Poupança Pendente (regressão): passam antes e depois.

Corrigido também, pelo mesmo código: `deleteTransacao` de uma despesa ou poupança Concluída deixa de tirar o valor da conta destino.

Segunda ronda (README §8):

- **R1.** Editar e apagar uma transação passam a ser atómicos. Fechado:
  - `UnidadeDeTrabalho` abre uma transação de BD e faz rollback quando o trabalho devolve um `Result` falhado ou lança uma exceção;
  - os três repos que o `updateTransacao`/`deleteTransacao` usam (`ContaRepo`, `TransacaoRepo`, `CartaoCreditoRepo`) resolvem os repositórios através dela;
  - teste de uma edição que falha a meio: o saldo já gravado na origem volta ao que era.
- **R2.** Não corrigido, por decisão (ver §2).
- **R3.** Texto do §2 corrigido. Fechado.
- **R4–R6.** Testes: saldo gravado, transições de estado e Poupança Pendente. Fechados.

## 2. Pontos a decidir

- **Saldos já afetados em produção.** Cada edição de uma despesa ou poupança Concluída alterou a conta destino. Se só o valor mudou, a destino ficou com a diferença (v₂ − v₁) a mais. Se a destino também mudou de A para B (só possível pela API — o frontend nunca envia `contaDestinoId`), A ficou com v₁ a menos e B com v₂ a mais. Cada delete de uma Concluída tirou v da conta destino. A correção não repara nada disto. **Consequência:** as contas usadas como destino de quem já editou ou apagou despesas concluídas continuam com um saldo errado até alguém o corrigir à mão ou com um script. Não há histórico de edições, por isso um script só pode recalcular o saldo esperado a partir das transações.
- **Despesas passadas a Concluída por edição, antes desta correção** (finding R2 do CodeRabbit). Por uma chamada direta à API, uma despesa Pendente podia ser editada para Concluído sem que o valor saísse da conta destino. Agora, apagar ou editar essa despesa já não mexe na destino, e o valor fica lá para sempre. **Decisão do utilizador: não tratar, é um problema de dados.** **Consequência:** se isto aconteceu, essas contas destino mostram v a mais até serem corrigidas à mão; o código não tem como distinguir estes casos.
- **Poupança imediata não credita a conta poupança** (README §7). **Consequência:** criar uma poupança imediata tira o dinheiro da origem e não o põe na poupança; depois, editar o valor mexe na poupança pela diferença e apagar tira-lhe v que ela nunca recebeu. Fica para uma issue própria.

## 3. Desvios do plano aprovado

- **O `README` §1 dizia que o revert da destino "passa a −100 ou falha".** Verificado depois: `Dinheiro` aceita valores negativos, por isso nunca falha — o erro aparece sempre em silêncio. Não muda a correção.
- **Segunda ronda fora do plano original** — atomicidade e testes extra, pedidos na revisão do PR #94; registados como adenda no README §8, como na B0016.
- **Assinatura do `TransacaoService`**: ganha um 8.º parâmetro (`UnidadeDeTrabalho`). Os quatro specs que o constroem passam uma unidade de trabalho que só corre o trabalho (sem transação).
- **`updateTransacao`/`deleteTransacao` passaram a delegar** em `atualizarTransacao`/`apagarTransacao` (privados, com o corpo de antes), para o corpo correr dentro da unidade de trabalho sem ser reindentado.
- **O spec da `UnidadeDeTrabalho` usa uma classe simples como entidade**: importar o `ContaEntity` diretamente no Jest dava `Cannot access 'ContaEntity' before initialization` (ciclo de imports entre entidades).

## 4. Verificação feita fora da suite e o que fica por verificar

- **Na app (feito pelo utilizador):** testes manuais no frontend da primeira ronda.
- **Contra Postgres real (feito nesta sessão),** numa base de dados temporária (`b0017_tmp`, apagada no fim), com os repos e serviços compilados:
  - editar uma Despesa Mensal Concluída de 100 € para 120 € → origem 400 → 380, destino 0 → 0;
  - a mesma edição com a gravação da transação a falhar, com a unidade de trabalho → saldos e transação ficam como estavam;
  - sem a unidade de trabalho → a origem fica alterada (380 → 350) com a transação por gravar — o problema do finding.
- **Por verificar:** a segunda ronda na app a correr (o backend do `docker compose` tem de ser reconstruído com este código); dados reais de produção (ver §2).

## 5. Como correr a verificação

- `cd backend && npm run build` — o TypeScript compila.
- `cd backend && npm test` — 14 suites / 59 testes a passar.
- `cd backend && node --experimental-vm-modules node_modules/jest/bin/jest.js src/services/Transacao/tests/TransacaoDespesasRecorrentesService.impacto.spec.ts` — os 8 testes de impacto e atomicidade.
- `cd backend && node --experimental-vm-modules node_modules/jest/bin/jest.js src/repos/Shared/tests/UnidadeDeTrabalho.spec.ts` — commit, rollback, exceção, repositório dentro/fora da transação, transação aninhada.
- `cd backend && npm run lint` — tem de continuar em 51 erros e 7 avisos.

## 6. Inventário de alterações

1.ª ronda:

- `backend/src/services/Transacao/TransacaoDespesasRecorrentesService.ts` — alterado (condição sobre `status` nos 4 métodos de impacto; JSDoc e comentários)
- `backend/src/services/Transacao/tests/TransacaoDespesasRecorrentesService.impacto.spec.ts` — novo
- `docs/changes/bugfixes/B0017-editar-despesa-recorrente-concluida/README.md` — novo
- `docs/changes/bugfixes/B0017-editar-despesa-recorrente-concluida/RESULT.md` — novo
- `docs/changes/bugfixes/README.md` — alterado (linha da B0017)

2.ª ronda:

- `backend/src/repos/Shared/UnidadeDeTrabalho.ts` — novo
- `backend/src/repos/Shared/IRepos/IUnidadeDeTrabalho.ts` — novo
- `backend/src/repos/Shared/tests/UnidadeDeTrabalho.spec.ts` — novo
- `backend/src/repos/Conta/ContaRepo.ts`, `backend/src/repos/Transacao/TransacaoRepo.ts`, `backend/src/repos/CartaoCredito/CartaoCreditoRepo.ts` — alterados (repositórios via `repositorio(...)`)
- `backend/src/config/index.ts`, `backend/src/loaders/index.ts` — alterados (registo da `UnidadeDeTrabalho` na DI)
- `backend/src/services/Transacao/TransacaoService.ts` — alterado (`updateTransacao`/`deleteTransacao` dentro da unidade de trabalho)
- `backend/src/services/Transacao/tests/TransacaoDespesasRecorrentesService.impacto.spec.ts` — alterado (saldo gravado, 4 testes novos, unidade de trabalho falsa)
- `backend/src/services/Transacao/tests/TransacaoService.spec.ts`, `TransacaoService.activeTargets.spec.ts`, `TransacaoService.contasApagadas.spec.ts` — alterados (8.º argumento do construtor)
- `docs/changes/bugfixes/B0017-editar-despesa-recorrente-concluida/README.md` — alterado (adenda §8)
- `docs/changes/bugfixes/B0017-editar-despesa-recorrente-concluida/RESULT.md` — alterado
- `docs/changes/bugfixes/README.md` — alterado (itens em aberto da B0017)
