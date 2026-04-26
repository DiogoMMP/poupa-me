# Banco

**Aggregate Root** que representa uma instituição bancária.

## Estrutura

### Entidade
- **Classe**: `Banco`
- **Tabela**: `bancos`

### Value Objects
- `Nome` - Nome do banco
- `Icon` - Emoji/ícone representativo

### DTO
- `IBancoDTO` - Transfer object para Banco

### Mapper
- `BancoMap` - Banco Entity ↔ DTO

## Relacionamentos
- `1` → `0..*` [[Conta]] (um banco pode ter múltiplas contas)

## Regras de Negócio
- Apenas **Admin** pode criar bancos
- O saldo do "Banco" **nunca é guardado na BD**
- É calculado somando [[Contas]] e Provisões de [[CartaoCredito]] em tempo real

## Endpoints da API

| Método | Endpoint | Descrição | Role |
|--------|----------|-----------|------|
| `GET` | `/banco` | Listar bancos | Todos |
| `POST` | `/banco` | Criar banco | Admin |

## Ver Também
- [[Conta]]
- [[DDD]]
- [[RBAC]]
