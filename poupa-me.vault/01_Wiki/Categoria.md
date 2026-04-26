# Categoria

**Aggregate Root** que representa categorias de despesas e receitas.

## Estrutura

### Entidade
- **Classe**: `Categoria`
- **Tabela**: `categorias`

### Value Objects
- `Nome` - Nome da categoria
- `Icon` - Emoji/ícone representativo

### DTO
- `ICategoriaDTO` - Transfer object para Categoria

### Mapper
- `CategoriaMap` - Categoria Entity ↔ DTO

## Relacionamentos
- `1` → `0..*` [[Transacao]] (transações classificadas)
- `1` → `0..*` [[DespesaRecorrente]] (despesas pré-classificadas)

## Regras de Negócio

### Apenas Admin
- Apenas utilizadores com role **Admin** podem criar/editar categorias
- Utilizadores normais apenas selecionam categorias existentes

### Personalização (Visual)
Categorias personalizadas com emoji ([[US16]]).

### Categorização com IA
IA pode sugerir categorias automaticamente para transações ([[US18]]).

## Endpoints da API

| Método | Endpoint | Descrição | Role |
|--------|----------|-----------|------|
| `GET` | `/categoria` | Listar categorias | Todos |
| `POST` | `/categoria` | Criar categoria | Admin |

## User Stories Relacionadas
- [[US16]] - Personalização de Categorias (Visual)
- [[US18]] - Categorização via LLM
- [[US10]] - Gestão de Categorias Personalizadas

## Ver Também
- [[Transacao]]
- [[DespesaRecorrente]]
- [[RBAC]]
- [[User]]
