# B0011 — Editar Transação mostra o campo "Estado" também para transações de conta

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/transacao-editar-nao-muda-conta` (mesmo branch do B0010 — mesma tela, mesmo lote de trabalho) |
| **Estado** | Planeado |
| **Âmbito** | 1 template Angular, feature `transacoes` |
| **Verificação** | `cd frontend && npm run build` |

## 1. Situação

No formulário "Editar Transação" (`transacoes-editar.component.html:61-64`), o campo "Estado"
(`Pendente`/`Concluído`) aparece sempre, para qualquer tipo de transação:

```html
<div class="form-field">
  <label class="form-label">Estado</label>
  <app-select formControlName="status" [options]="statusOptions"></app-select>
</div>
```

Isto é inconsistente com os campos "Conta"/"Cartão" logo acima, no mesmo template
(`transacoes-editar.component.html:47-59`), que já alternam consoante o tipo:

```html
<div class="form-field" *ngIf="transacao && transacao.tipo !== 'Crédito' && transacao.tipo !== 'Reembolso'">
  <label class="form-label">Conta</label>
  ...
</div>
<div class="form-field" *ngIf="transacao && (transacao.tipo === 'Crédito' || transacao.tipo === 'Reembolso')">
  <label class="form-label">Cartão</label>
  ...
</div>
```

Faz sentido: no backend, transações de conta (Entrada/Saída) são sempre criadas com estado
`'Concluído'` fixo (`TransacaoService.createEntrada`/`createSaida`) — o estado não tem significado
variável para elas. Já para Crédito/Reembolso (cartão), `Pendente`/`Concluído` tem impacto real
(afeta `saldoUtilizado` do cartão). Mostrar o seletor de Estado também para transações de conta expõe
um controlo que não se aplica a esse tipo.

**Escala:** 1 ficheiro (`transacoes-editar.component.html`).

## 2. Resultado pretendido

O campo "Estado" só aparece no formulário quando a transação é de cartão (`Crédito`/`Reembolso`) —
igual à condição já usada para "Conta"/"Cartão". Para transações de conta, o campo desaparece do
formulário.

**Decisão:** reutilizar exatamente a mesma condição de tipo já usada para "Cartão"
(`transacao.tipo === 'Crédito' || transacao.tipo === 'Reembolso'`), movendo o bloco do "Estado" para
dentro do `ng-container` que já expõe `transacao`, em vez de introduzir uma condição nova. O valor de
`status` do formulário mantém-se intacto (não é limpo) quando o campo fica escondido — o payload de
update continua a enviar o `status` já carregado da transação (sempre `'Concluído'` para
Entrada/Saída), sem alterar o comportamento de gravação.

## 3. Implementação

Fase única — uma alteração isolada num só template.

1. **`frontend/src/app/features/transacoes/components/editar/transacoes-editar.component.html`** —
   mover o bloco do campo "Estado" (linhas 61-64) para dentro do `ng-container *ngIf="vm.transacao$ |
   async as transacao"` (linha 47-59), com `*ngIf="transacao && (transacao.tipo === 'Crédito' ||
   transacao.tipo === 'Reembolso')"`.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros pré-existente a esta data.
- Verificação manual (não automatizável nesta sessão, ver `RESULT.md` §4): editar uma transação de
  conta (Entrada/Saída) e confirmar que o campo "Estado" não aparece; editar uma transação de cartão
  (Crédito/Reembolso) e confirmar que continua a aparecer e a funcionar como antes.

## 5. Riscos

- **Risco:** nenhum de fundo — é uma condição de visibilidade que reutiliza uma expressão já usada no
  mesmo template; o valor do form control `status` não é tocado, só a sua exibição.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Esconde "Estado" para transações de conta no formulário de editar | `transacoes-editar.component.html` | único item |

## 7. Fora de âmbito / handoff

- **Despesa Recorrente / Poupança** — o template atual já não trata estes tipos corretamente (não
  mostra `contaDestinoId`/`contaPoupancaId`), gap pré-existente e não relacionado com este pedido; não
  tocado aqui.
- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão.
