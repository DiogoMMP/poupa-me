# Conta

**Aggregate Root** que representa uma conta bancária com saldo em tempo real.

## Estrutura

### Entidade
- **Classe**: `Conta`
- **Tabela**: `contas`

### Value Objects
- `Nome` - Nome da conta
- `Dinheiro` - Saldo atual
- `Icon` - Emoji/ícone representativo

### DTO
- `IContaDTO` - Transfer object para Conta

### Mapper
- `ContaMap` - Conta Entity ↔ DTO

## Relacionamentos
- `0..*` → `1` [[Banco]] (domiciliada em)
- `1` → `0..*` [[Transacao]] (movimentos)
- `1` → `0..*` [[CartaoCredito]] (cartões associados)

## Regras de Negócio
- **Saldo em Tempo Real**: O saldo é calculado somando todas as transações
- **Domiciliação**: Cada conta está associada a um banco
- **Transações**: Suporta entradas, saídas e reembolsos

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/conta` | Listar contas |
| `POST` | `/conta` | Criar conta |

## Ver Também
- [[Banco]]
- [[Transacao]]
- [[CartaoCredito]]
- [[DDD]]
