# Transação

**Aggregate Root** que representa um movimento financeiro (entrada, saída ou reembolso).

## Estrutura

### Entidade
- **Classe**: `Transacao`
- **Tabela**: `transacoes`

### Value Objects
- `Data` - Data da transação
- `Tipo` - Tipo de operação (Entrada, Saída, Reembolso)
- `Status` - Estado (Pendente/Concluído)
- `Descricao` - Descrição da transação
- `Dinheiro` - Valor monetário

### DTO
- `ITransacaoDTO` - Transfer object para Transação

### Mapper
- `TransacaoMap` - Transacao Entity ↔ DTO

## Relacionamentos
- `0..*` → `1` [[Conta]] (debita/credita em)
- `0..*` → `0..1` [[CartaoCredito]] (afeta limite de)
- `1` → `1` [[Categoria]] (classificada em)

## Tipos de Transação

| Tipo | Descrição |
|------|-----------|
| `Entrada` | Receita (salário, rendimentos, etc.) |
| `Saída` | Despesa (compras, serviços, etc.) |
| `Reembolso` | Devolução de dinheiro |
| `Crédito` | Movimento no cartão de crédito |

## Estados (Status)

| Estado | Descrição |
|--------|-----------|
| `Pendente` | Transação ainda não processada |
| `Concluído` | Transação finalizada |

## Regras de Negócio

### Indicador de Pendentes
Transações pendentes são destacadas na UI ([[US14]]).

### Categorização com IA
Transações podem ser categorizadas automaticamente via LLM ([[US18]]).

### Lazy Creation
Despesas recorrentes geram transações automaticamente ao entrar na app.

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/transacao` | Listar transações |
| `POST` | `/transacao` | Criar transação |

## User Stories Relacionadas
- [[US17]] - Registo de Transações
- [[US14]] - Indicador de Transações Pendentes
- [[US18]] - Categorização via LLM
- [[US11]] - Importar Transações via CSV

## Ver Também
- [[Conta]]
- [[CartaoCredito]]
- [[Categoria]]
- [[DespesaRecorrente]]
