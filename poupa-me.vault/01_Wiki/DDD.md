# DDD (Domain-Driven Design)

O projeto segue os princípios de Domain-Driven Design com foco em **Entidades**, **Value Objects** e **Repositórios**.

## Agregados (Aggregate Roots)

### 1. [[Banco]]
- **Entidade**: `Banco`
- **Value Objects**: `Nome`, `Icon`
- **Descrição**: Instituição bancária

### 2. [[Conta]]
- **Entidade**: `Conta`
- **Value Objects**: `Nome`, `Dinheiro`, `Icon`
- **Relacionamentos**: `0..*` → `1` [[Banco]] (domiciliada em)
- **Descrição**: Conta bancária com saldo em tempo real

### 3. [[CartaoCredito]]
- **Entidade**: `CartaoCredito`
- **Value Objects**: `Nome`, `Dinheiro`, `Icon`, `Periodo`
- **Relacionamentos**: `1` → `1` [[Conta]] (paga fatura via)
- **Descrição**: Cartão de crédito com limite e período de faturação

### 4. [[Transacao]]
- **Entidade**: `Transacao`
- **Value Objects**: `Data`, `Tipo`, `Status`, `Descricao`, `Dinheiro`
- **Relacionamentos**:
  - `0..*` → `1` [[Conta]] (debita/credita em)
  - `0..*` → `0..1` [[CartaoCredito]] (afeta limite de)
  - `1` → `1` [[Categoria]] (classificada em)
- **Tipos**: Entrada, Saída, Reembolso

### 5. [[DespesaRecorrente]]
- **Entidade**: `DespesaRecorrente`
- **Value Objects**: `Nome`, `Dinheiro`
- **Relacionamentos**:
  - `1` → `1` [[Conta]] (será debitada em)
  - `1` → `1` [[Categoria]] (pré-classificada como)
- **Descrição**: Molde para criar transações automáticas

### 6. [[Categoria]]
- **Entidade**: `Categoria`
- **Value Objects**: `Nome`, `Icon`
- **Descrição**: Categoria de despesas/receitas (Apenas Admin)

### 7. [[User]]
- **Entidade**: `User`
- **Value Objects**: `UserName`, `UserEmail`, `UserPassword`, `UserRole`
- **Roles**: `Admin`, `User`, `Guest`

## Base Classes

| Classe | Descrição |
|--------|-----------|
| `Entity<T>` | Classe base para entidades com ID único |
| `AggregateRoot<T>` | Entidade raiz de agregado |
| `ValueObject<T>` | Classe base para Value Objects |
| `Identifier<T>` | Wrapper para IDs tipados |
| `UniqueEntityID` | ID único baseado em UUID |
| `UseCase<T>` | Interface para casos de uso |
| `WatchedList<T>` | Lista com tracking de mudanças |

## Ver Também
- [[Arquitetura]]
- [[Banco]]
- [[Conta]]
- [[Transacao]]
