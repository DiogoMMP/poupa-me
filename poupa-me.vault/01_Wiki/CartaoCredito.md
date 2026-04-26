# Cartão de Crédito

**Aggregate Root** que representa um cartão de crédito com limite e período de faturação.

## Estrutura

### Entidade
- **Classe**: `CartaoCredito`
- **Tabela**: `cartoes_credito`

### Value Objects
- `Nome` - Nome do cartão
- `Dinheiro` - Limite total
- `Icon` - Emoji/ícone representativo
- `Periodo` - Período de faturação

### DTO
- `ICartaoCreditoDTO` - Transfer object para Cartão de Crédito

### Mapper
- `CartaoCreditoMap` - CartaoCredito Entity ↔ DTO

## Relacionamentos
- `1` → `1` [[Conta]] (paga fatura via)
- `0..*` → `0..1` [[Transacao]] (transações do cartão)

## Regras de Negócio

### Mealheiro (Provisionamento)
O dinheiro é provisionado conforme se gasta. Cada transação no cartão reserva o valor no "mealheiro".

### Ciclo de Faturação
- **Fatura Ativa**: Monitoriza o ciclo atual do cartão
- **Liquidação**: O pagamento da fatura deve:
  1. Subtrair o valor pago ao `saldoUtilizado`
  2. Marcar as transações do período como **"Concluído"**

### Barra de Progresso
UI mostra limite disponível vs. utilizado visualmente.

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/cartao-credito` | Listar cartões |

## User Stories Relacionadas
- [[US20]] - Monitor de Ciclo de Cartão (Fatura Ativa)
- [[US21]] - Botão de Liquidação de Fatura
- [[US08]] - Agrupamento de Despesas em Ciclos de Cartão
- [[US09]] - Liquidação de Fatura de Cartão

## Ver Também
- [[Conta]]
- [[Transacao]]
- [[DDD]]
