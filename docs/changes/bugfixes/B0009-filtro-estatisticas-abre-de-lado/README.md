# B0009 — Painel de filtros de Estatísticas abre ao lado em vez de abaixo do botão

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/estatisticas-duplica-pagamento-cartao` (a pedido do utilizador — junta-se ao B0007 na mesma branch, em vez de branch própria; base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | 1 template + 1 folha de estilo, feature `estatisticas` |
| **Verificação** | `npm run build` (frontend) |

## 1. Situação

Ao clicar em "Filtros" no ecrã de Estatísticas, o painel abre ao lado do botão, em vez de abrir por
baixo como em todos os outros ecrãs com o mesmo padrão (Transações, Despesas Recorrentes) —
reportado pelo utilizador.

**Evidência:**

Em [`estatisticas.component.html:8-34`](../../../../frontend/src/app/features/estatisticas/components/estatisticas.component.html),
o botão `.filter-toggle-btn` e o painel `.filter-panel` são **ambos filhos diretos** do mesmo
`<div class="page-actions">`:

```html
<div class="page-actions" *ngIf="hasBancoSelected$ | async">
  <button class="filter-toggle-btn" (click)="showFilters = !showFilters" ...>...</button>

  <div class="filter-panel" *ngIf="showFilters">...</div>
</div>
```

`.page-actions` é uma classe partilhada global
([`_layout.css:26-30`](../../../../frontend/src/styles/_layout.css)):

```css
.page-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}
```

É uma linha flex horizontal — por isso o painel aparece ao lado do botão, não abaixo.

Em todos os outros ecrãs com o mesmo botão/painel (`transacoes-listar.component.html:19-31`,
`despesas-recorrentes-listar.component.html:100-114`), o `.filter-toggle-btn` está dentro de um
cabeçalho de secção (`.section-header`, uma linha flex própria só para o título+botão) e o
`.filter-panel` é um **irmão** desse cabeçalho, fora de qualquer contentor flex — por isso cai
naturalmente por baixo, em fluxo de bloco normal:

```html
<div class="section-header">
  <h3 class="section-title">Transações de Contas</h3>
  <button class="filter-toggle-btn" ...>...</button>
</div>

<!-- Account Filters -->
<div class="filter-panel" *ngIf="showContaFilters">...</div>
```

Em Estatísticas, o painel ficou (por engano) dentro do mesmo `.page-actions` do botão, em vez de
irmão do cabeçalho — daí abrir "de lado".

**Inventário (superfícies afetadas):**

- **A.** `estatisticas.component.html` — estrutura do painel de filtros.

**Escala:** 1 ficheiro (só o template; nenhuma classe CSS precisa de mudar).

## 2. Resultado pretendido

O painel de filtros de Estatísticas abre por baixo do botão "Filtros", ocupando a largura disponível,
exatamente como em Transações e Despesas Recorrentes.

**Decisões:**

- **Mover `.filter-panel` para fora de `.page-actions`, como irmão de `.estatisticas_header`** (que
  também é `display: flex`, por isso o painel não pode ficar dentro dele nem do `.page-actions` — tem
  de ficar completamente fora de ambos os contentores flex). Mesma solução estrutural já usada em
  Transações/Despesas Recorrentes: o botão fica no cabeçalho flex, o painel fica em fluxo de bloco
  normal a seguir.
  **Alternativa rejeitada:** manter a estrutura atual e forçar a posição do painel com `position:
  absolute`/`top: 100%` no CSS. Rejeitada porque introduziria uma técnica (posicionamento absoluto)
  que não existe em nenhum outro `.filter-panel` do projeto, só para compensar uma estrutura HTML
  errada — mais frágil a longo prazo do que corrigir a estrutura para seguir o padrão já estabelecido.
- **A condição `*ngIf="hasBancoSelected$ | async"` repete-se no novo bloco irmão** (já se repete hoje
  no mesmo template para o parágrafo de `.title`, linha 5) em vez de introduzir um `<ng-container>`
  a envolver `.page-actions` e o painel. Mudança mínima, consistente com o padrão já usado neste
  mesmo ficheiro.

## 3. Implementação

1. **`frontend/src/app/features/estatisticas/components/estatisticas.component.html`** — mover o
   `<div class="filter-panel" *ngIf="showFilters">...</div>` (linhas 18-33) para fora do
   `<div class="page-actions">`, como irmão logo a seguir ao `</div>` que fecha
   `.estatisticas_header`; a sua condição passa a
   `*ngIf="showFilters && (hasBancoSelected$ | async)"`.

Fase única — é uma alteração estrutural pequena, sem lógica nova.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros/warnings pré-existente a esta data.
- Verificação manual (não automatizável nesta sessão, ver `RESULT.md` §4): abrir Estatísticas com um
  banco selecionado, clicar em "Filtros" e confirmar que o painel abre por baixo do botão, não ao
  lado.

## 5. Riscos

- **Risco:** algum estilo específico de `estatisticas.component.css` dependia da posição anterior do
  painel dentro de `.page-actions` (ex.: `gap`/gravidade de layout herdada do flex). **Mitigação:**
  `estatisticas.component.css` não tem nenhuma regra própria para `.filter-panel`/`.page-actions` na
  resolução base (só dentro do `@media (max-width: 768px)`, que já não depende da posição relativa ao
  botão) — confirmado por leitura do ficheiro completo.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Painel de filtros de Estatísticas abre por baixo do botão | `estatisticas.component.html` | A |

## 7. Fora de âmbito / handoff

- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão.
