# B0017 — Editar uma Despesa Recorrente Concluída altera também a conta destino

| | |
| :--- | :--- |
| **Tipo** | Bugfix (issue [#88](https://github.com/DiogoMMP/poupa-me/issues/88), label `bug`) |
| **Branch** | `fix/editar-despesa-recorrente-concluida` (base: `develop` — não existe nenhum `release/*`, como nos registos anteriores) |
| **Estado** | Aprovado (2026-11-08) |
| **Âmbito** | Backend apenas: os quatro métodos de impacto de saldo de `TransacaoDespesasRecorrentesService` (despesa recorrente e poupança) + um ficheiro de testes novo. Frontend sem alterações. |
| **Verificação** | `cd backend && npm run build && npm test && npm run lint` — linha de base medida: build OK, 12 suites / 46 testes a passar, lint com 51 erros e 7 avisos **já existentes** |

## 1. Situação

Issue #88: *"Quando editamos uma transação do tipo despesa recorrente e que já está concluída ela edita tmb a conta destino e não o deve fazer apenas a conta origem."*

**Como o dinheiro se move hoje numa despesa recorrente não imediata** (com `contaDestino`):

| Momento | Conta origem | Conta destino | Conta poupança |
| :--- | :--- | :--- | :--- |
| Criar (Pendente) — `createDespesaMensal`/`Semanal`/`Anual`, `createPoupanca` | −v | +v | — |
| Concluir — `concluirDespesaRecorrente` / `concluirPoupanca` | — | −v | +v (só Poupança) |
| **Efeito líquido de uma Concluída** | **−v** | **0** | **+v (só Poupança)** |

Uma despesa imediata é criada logo Concluída e sem `contaDestino` (só origem −v).

**Evidência:**

- [`TransacaoService.updateTransacao`](../../../../backend/src/services/Transacao/TransacaoService.ts) (linhas 510-565) reverte o impacto da transação antiga e aplica o da nova; para `Despesa Mensal/Semanal/Anual` delega em `revertDespesaRecorrenteImpact`/`applyDespesaRecorrenteImpact`, para `Poupança` em `revertPoupancaImpact`/`applyPoupancaImpact`.
- [`TransacaoDespesasRecorrentesService.ts:718-790`](../../../../backend/src/services/Transacao/TransacaoDespesasRecorrentesService.ts) — `revertDespesaRecorrenteImpact`/`applyDespesaRecorrenteImpact` mexem na `contaDestino` **sempre que ela existe**, sem olhar para `status`. Para uma Concluída, o efeito líquido na destino é 0, mas o revert faz destino −v e o apply faz destino +v.
- [`TransacaoDespesasRecorrentesService.ts:796-888`](../../../../backend/src/services/Transacao/TransacaoDespesasRecorrentesService.ts) — `revertPoupancaImpact`/`applyPoupancaImpact` já olham para `status` na `contaPoupanca`, mas tocam na `contaDestino` com o comentário *"Sempre"*: o mesmo erro.
- [`TransacaoService.deleteTransacao`](../../../../backend/src/services/Transacao/TransacaoService.ts) (linhas 579-620) usa os mesmos `revert*Impact`: apagar uma despesa ou poupança Concluída tira também v da conta destino, que já tinha sido esvaziada ao concluir.
- Frontend ([`transacoes-editar.view-model.ts:106-114`](../../../../frontend/src/app/features/transacoes/components/editar/transacoes-editar.view-model.ts)) envia `contaId`, `valor`, `status` (o mesmo valor carregado) e nunca envia `contaDestinoId`. O erro não está no formulário.

**Reprodução (traçada no código):** despesa mensal Concluída de 100 €, destino com saldo 0 € (esvaziada ao concluir). Editar o valor para 120 €:

- revert: origem +100, destino −100 → `subtrairSaldo` na destino passa a −100 ou falha (se `Dinheiro` não aceitar negativo), e a edição dá erro;
- se passar, apply: origem −120, destino +120 → a destino fica com +20 €, quando devia continuar a 0 €. É exatamente o que a issue descreve.

**Inventário:**

- **A.** `revertDespesaRecorrenteImpact` — só reverter a `contaDestino` se a transação estiver Pendente.
- **B.** `applyDespesaRecorrenteImpact` — só aplicar à `contaDestino` se a nova transação estiver Pendente.
- **C.** `revertPoupancaImpact` — idem para a `contaDestino` (a `contaPoupanca` já está certa).
- **D.** `applyPoupancaImpact` — idem.
- **E.** Testes novos que falham contra o código atual e passam com a correção.

Efeito colateral corrigido sem código extra: `deleteTransacao` de uma despesa/poupança Concluída deixa de tirar dinheiro da conta destino.

**Escala:** 4 métodos num ficheiro (cada um com uma condição a acrescentar) + 1 ficheiro de testes.

## 2. Resultado pretendido

O impacto que se reverte e se aplica numa edição é o impacto **líquido** que a transação tem, conforme o estado:

| Estado | Origem | Destino | Poupança |
| :--- | :--- | :--- | :--- |
| Pendente | −v | +v | — |
| Concluído | −v | — | +v (só Poupança) |

Editar uma despesa recorrente Concluída passa a mexer só na conta origem (e, na Poupança, na conta poupança). A conta destino fica como está.

**Decisões:**

- **A condição é o `status` da transação que se está a reverter/aplicar** (`existing` no revert, `updatedTransacao` no apply). Assim as transições de estado por edição também ficam certas: Pendente → Concluído (revert: origem +v, destino −v; apply: origem −v) dá destino −v líquido, igual a concluir; Concluído → Pendente dá destino +v, igual a voltar a reservar o dinheiro.
- **Incluir a Poupança** (decidido com o utilizador): mesma causa, mesmo ficheiro, mesmo padrão.
- **Manter o resto dos métodos como estão** (mensagens de erro, a `contaPoupanca` em silêncio quando a destino não existe, etc.). A correção é só a condição sobre o estado.

**Alternativas rejeitadas:**

- *Impedir a edição de despesas Concluídas no frontend* — a issue pede que a edição funcione e mexa só na origem, não que seja bloqueada; e o `deleteTransacao` continuaria errado.
- *Limpar `contaDestino` ao concluir* — perde a informação de para onde o dinheiro foi reservado, obriga a uma migração dos dados que já existem, e mexe no modelo por um erro que está só no cálculo do saldo.
- *Tratar o caso só em `updateTransacao`* — deixava o `deleteTransacao` com o mesmo erro; a regra pertence aos métodos de impacto, que são o único sítio que a conhece.

## 3. Implementação

Uma fase de código e uma de testes. Não há hooks de commit no repo (sem `.husky/`, `.githooks/`, `.pre-commit-config.yaml` nem `core.hooksPath`).

1. **[`backend/src/services/Transacao/TransacaoDespesasRecorrentesService.ts`](../../../../backend/src/services/Transacao/TransacaoDespesasRecorrentesService.ts)**
   - `revertDespesaRecorrenteImpact` e `applyDespesaRecorrenteImpact`: o ramo que trata a `contaDestino` passa a correr só quando `transacao.status.value === "Pendente"`; caso contrário, segue o caminho que hoje já existe para a despesa imediata (só a origem é atualizada). Atualizar o JSDoc de ambos (hoje diz "immediate"/"non-immediate", passa a falar do estado).
   - `revertPoupancaImpact` e `applyPoupancaImpact`: o bloco da `contaDestino` passa de *"Sempre"* para *"Se Pendente"*; atualizar o JSDoc e os comentários (Concluído: origem e poupança; Pendente: origem e destino).
2. **`backend/src/services/Transacao/tests/TransacaoDespesasRecorrentesService.impacto.spec.ts`** (novo), no estilo de `TransacaoService.contasApagadas.spec.ts` (repos mockados, entidades de domínio reais):
   - Despesa Mensal **Concluída** com destino: `updateTransacao` com outro valor mexe só no saldo da origem; a destino mantém o saldo e `contaRepo.update` nunca é chamado com ela. **Reprodução direta da issue — tem de falhar contra o código atual.**
   - Poupança **Concluída** com destino: mesma verificação; a poupança é ajustada pela diferença do valor e a destino não muda.
   - Despesa Mensal **Pendente** com destino (regressão): a edição continua a ajustar origem e destino.
   - `deleteTransacao` de uma Despesa Mensal Concluída: só a origem recebe o valor de volta.

## 4. Verificação

- `cd backend && npm run build` — linha de base: OK, sem erros.
- `cd backend && npm test` — linha de base: 12 suites / 46 testes a passar. Depois: 13 suites, 46 + 4 testes a passar. Os testes de Concluída e de delete correm primeiro contra o código atual (têm de falhar) e depois contra a correção.
- `cd backend && npm run lint` — linha de base: 51 erros e 7 avisos já existentes; o número não pode subir.
- Verificação manual (precisa da app a correr, provavelmente não executada nesta sessão): criar uma despesa mensal não imediata, concluí-la, anotar os saldos de origem e destino, editar o valor e confirmar que só a origem muda.

## 5. Riscos

- **Dados já existentes com saldos errados.** Edições ou deletes anteriores de despesas Concluídas já podem ter deixado contas destino com saldos errados. A correção não os repara. **Validação:** fica em `RESULT.md` §2 como ponto a decidir (auditoria/correção manual dos saldos); não há acesso à BD de produção nesta sessão.
- **Transições de estado por edição.** Uma edição Pendente ↔ Concluído passa a ter outro efeito na destino. **Validação:** a tabela da §2 mostra que o resultado é igual ao de concluir / voltar a reservar; fica coberto pelo raciocínio e pelo teste Pendente; o caso de transição fica em `RESULT.md` §4 se não tiver teste próprio.
- **Despesa Pendente regredir.** A condição nova podia, por engano, desligar a destino também na Pendente. **Validação:** teste de regressão Pendente da fase 2.
- **Comportamento da `contaPoupanca` na Poupança imediata** (ver §7) — não é alterado; o teste de Poupança usa uma não imediata concluída para não depender dele.

## 6. Ordem de commits

| # | Unidade | Ficheiros | Inventário |
| :--- | :--- | :--- | :--- |
| 1 | `fix(transacoes)`: a conta destino só entra no impacto enquanto a despesa/poupança está Pendente | `TransacaoDespesasRecorrentesService.ts` | A, B, C, D |
| 2 | `test(transacoes)`: edição e delete de despesa/poupança concluída | `TransacaoDespesasRecorrentesService.impacto.spec.ts` | E |
| 3 | `docs(changes)`: regista B0017 | `docs/changes/bugfixes/B0017-*/`, `docs/changes/bugfixes/README.md` | — |

## 7. Fora do âmbito e handoff

- **Poupança imediata não credita a conta poupança ao ser criada** (`createPoupanca` com `imediata = true` só subtrai da origem), mas `revertPoupancaImpact`/`applyPoupancaImpact` tratam-na como se tivesse creditado (é Concluída). Editar ou apagar uma poupança imediata mexe na conta poupança de forma errada. É outro defeito, com outra decisão (a criação imediata deve ou não creditar a poupança?): fica para uma issue própria.
- **Correção dos saldos já afetados** por edições/deletes anteriores — precisa de dados reais; ver §5.
- **Verificação manual na app** — fica em `RESULT.md` §4 se não puder ser feita.
