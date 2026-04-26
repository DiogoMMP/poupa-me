# Despesa Recorrente

**Aggregate Root** que funciona como molde para criar transações automáticas.

## Estrutura

### Entidade
- **Classe**: `DespesaRecorrente`
- **Tabela**: `despesas_recorrentes`

### Value Objects
- `Nome` - Nome da despesa
- `Dinheiro` - Valor (fixo ou variável)
- `diaDoMes` - Dia do mês para processamento
- `ultimoProcessamento` - Data do último processamento

### DTO
- `IDespesaRecorrenteDTO` - Transfer object para Despesa Recorrente

### Mapper
- `DespesaRecorrenteMap` - DespesaRecorrente Entity ↔ DTO

## Relacionamentos
- `1` → `1` [[Conta]] (será debitada em)
- `1` → `1` [[Categoria]] (pré-classificada como)

## Regras de Negócio

### Lazy Creation
Se `hoje >= diaDoMes` e **não foi processada este mês**, o sistema gera a [[Transacao]] automaticamente ao entrar na app.

### Tipos de Despesas Recorrentes

| Tipo | Exemplo |
|------|---------|
| **Mensal Fixa** | Renda, serviços, subscrições |
| **Mensal Variável** | Alimentação, transporte |

### Campo `ultimoProcessamento`
Campo crítico para evitar processamento duplicado no mesmo mês.

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/despesa-recorrente` | Listar despesas recorrentes |
| `POST` | `/despesa-recorrente` | Criar despesa recorrente |

## User Stories Relacionadas
- [[US22]] - Gestão de Despesas Recorrentes (Lazy List)
- [[US12]] - Geração Automática de Despesas Recorrentes (Lazy Creation)

## Ver Também
- [[Transacao]]
- [[Conta]]
- [[Categoria]]
