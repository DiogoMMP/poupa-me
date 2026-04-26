# Arquitetura

**Poupa-me** é uma aplicação web full-stack de gestão financeira pessoal desenvolvida com arquitetura monorepo, seguindo princípios de [[DDD]] e Clean Architecture.

## Estrutura do Repositório

```
poupa-me/
├── backend/           # API REST Node.js + Express 5
│   └── src/
│       ├── domain/    # Entidades e Value Objects (DDD)
│       ├── repos/     # Repositórios (Repository Pattern)
│       ├── services/  # Lógica de negócio
│       ├── controllers/ # Controladores HTTP
│       ├── api/       # Rotas e middlewares
│       ├── persistence/ # Entidades TypeORM
│       ├── dto/       # Data Transfer Objects
│       ├── mappers/   # Domain ↔ DTO mappings
│       ├── loaders/   # Bootstrap (Express, TypeORM, DI)
│       ├── config/    # Configuração centralizada
│       └── core/      # Core DDD patterns
│
├── frontend/          # Angular 20 SPA (SSR com Angular Universal)
│   └── src/app/
│       ├── features/  # Módulos por funcionalidade
│       ├── layout/    # Componentes de layout
│       ├── services/  # Serviços HTTP
│       └── guards/    # Auth guards
│
└── docs/              # Documentação e diagramas
```

## Padrões de Design

- **[[DDD]]** - Entidades ricas, Value Objects, Aggregate Roots
- **Repository Pattern** - Abstração da camada de dados
- **Dependency Injection** - Via TypeDI
- **[[RBAC]]** - Controlo de acesso baseado em roles (Admin, User, Guest)
- **Result Pattern** - Tratamento explícito de erros sem exceções
- **Clean Architecture** - Separação de responsabilidades

## Conceitos Chave

### Mealheiro para Cartões de Crédito
O dinheiro é provisionado conforme se gasta no cartão de crédito.

### Lazy Creation para Despesas Recorrentes
As despesas são geradas automaticamente ao entrar na app, verificando se `hoje >= diaDoMes` e se não foi processada este mês.

## Ver Também
- [[Stack Tecnológico]]
- [[DDD]]
- [[User]]
