# Poupa-me - Projeto Completo

## 📋 Visão Geral

**Poupa-me** é uma aplicação web full-stack de gestão financeira pessoal desenvolvida com arquitetura monorepo, seguindo princípios de Domain-Driven Design (DDD) e Clean Architecture.

### Stack Tecnológico

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Frontend | Angular | 20 |
| Backend | Node.js + Express | 22 / 5 |
| Linguagem | TypeScript | 5.9 |
| Database | PostgreSQL | - |
| ORM | TypeORM | 0.3 |
| DI | TypeDI | 0.10 |
| Autenticação | JWT | 9.0 |
| Logging | Winston | 3 |

---

## 🏗️ Arquitetura

### Estrutura do Repositório

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

### Padrões de Design

- **Domain-Driven Design** - Entidades ricas, Value Objects, Aggregate Roots
- **Repository Pattern** - Abstração da camada de dados
- **Dependency Injection** - Via TypeDI
- **RBAC** - Controlo de acesso baseado em roles (Admin, User, Guest)
- **Result Pattern** - Tratamento explícito de erros sem exceções
- **Clean Architecture** - Separação de responsabilidades

---

## 📦 Módulos do Backend

### Controllers

| Controller | Descrição |
|------------|-----------|
| `AuthController` | Autenticação e registo de utilizadores |
| `BancoController` | Gestão de bancos |
| `CartaoCreditoController` | Gestão de cartões de crédito |
| `CategoriaController` | Gestão de categorias |
| `ContaController` | Gestão de contas bancárias |
| `DespesaRecorrenteController` | Gestão de despesas recorrentes |
| `EstatisticasController` | Estatísticas e relatórios |
| `TransacaoController` | Gestão de transações |
| `ImportController` | Importação de extratos |
| `IACategorizacaoController` | Categorização com IA |

### Services

| Service | Descrição |
|---------|-----------|
| `AuthService` | Lógica de autenticação e JWT |
| `BancoService` | Regras de negócio de bancos |
| `CartaoCreditoService` | Gestão de cartões e períodos |
| `CategoriaService` | Gestão de categorias |
| `ContaService` | Operações de contas bancárias |
| `DespesaRecorrenteService` | Automação de despesas |
| `EstatisticasService` | Cálculo de métricas |
| `TransacaoService` | Processamento de transações |
| `ImportService` | Parsing de extratos bancários |
| `IACategorizacaoService` | IA para categorização automática |

### Repositories

| Repo | Entidade |
|------|----------|
| `BancoRepo` | Banco |
| `CartaoCreditoRepo` | CartaoCredito |
| `CategoriaRepo` | Categoria |
| `ContaRepo` | Conta |
| `DespesaRecorrenteRepo` | DespesaRecorrente |
| `TransacaoRepo` | Transacao |
| `UserRepo` | User |

---

## 🎯 Domínios (Backend)

### Agregados e Entidades

#### 1. Banco (Aggregate Root)
- **Entidade**: `Banco`
- **Value Objects**: `Nome`, `Icon`
- **Descrição**: Instituição bancária

#### 2. Conta (Aggregate Root)
- **Entidade**: `Conta`
- **Value Objects**: `Nome`, `Dinheiro`, `Icon`
- **Relacionamentos**: 
  - `0..*` → `1` Banco (domiciliada em)
- **Descrição**: Conta bancária com saldo em tempo real

#### 3. CartaoCredito (Aggregate Root)
- **Entidade**: `CartaoCredito`
- **Value Objects**: `Nome`, `Dinheiro`, `Icon`, `Periodo`
- **Relacionamentos**:
  - `1` → `1` Conta (paga fatura via)
- **Descrição**: Cartão de crédito com limite e período de faturação

#### 4. Transacao (Aggregate Root)
- **Entidade**: `Transacao`
- **Value Objects**: `Data`, `Tipo`, `Status`, `Descricao`, `Dinheiro`
- **Relacionamentos**:
  - `0..*` → `1` Conta (debita/credita em)
  - `0..*` → `0..1` CartaoCredito (afeta limite de)
  - `1` → `1` Categoria (classificada em)
- **Tipos**: Entrada, Saída, Reembolso

#### 5. DespesaRecorrente (Aggregate Root)
- **Entidade**: `DespesaRecorrente`
- **Value Objects**: `Nome`, `Dinheiro`
- **Relacionamentos**:
  - `1` → `1` Conta (será debitada em)
  - `1` → `1` Categoria (pré-classificada como)
- **Descrição**: Molde para criar transações automáticas

#### 6. Categoria (Aggregate Root)
- **Entidade**: `Categoria`
- **Value Objects**: `Nome`, `Icon`
- **Descrição**: Categoria de despesas/receitas (Apenas Admin)

#### 7. User (Aggregate Root)
- **Entidade**: `User`
- **Value Objects**: `UserName`, `UserEmail`, `UserPassword`, `UserRole`
- **Roles**: `Admin`, `User`, `Guest`

---

## 🖥️ Módulos do Frontend

### Features

| Feature | Rotas | Roles | Descrição |
|---------|-------|-------|-----------|
| `auth` | `/entrar`, `/registar` | - | Autenticação e registo |
| `dashboard` | `/dashboard` | Admin, User | Resumo financeiro |
| `bancos` | `/bancos` | Admin, User | Gestão de bancos |
| `contas` | `/contas` | Admin, User | Gestão de contas bancárias |
| `cartoes-credito` | `/cartoes-credito` | Admin, User | Gestão de cartões |
| `transacoes` | `/transacoes` | Admin, User | Listar/criar transações |
| `despesas-recorrentes` | `/despesas-recorrentes` | Admin, User | Automação de despesas |
| `categorias` | `/categorias` | Admin | Gestão de categorias |
| `utilizadores` | `/utilizadores` | Admin | Gestão de utilizadores |
| `perfil` | `/perfil` | Admin, User | Perfil de utilizador |
| `estatisticas` | `/estatisticas` | Admin, User | Gráficos e relatórios |
| `ia-categorizacao` | - | - | Serviço de IA |

### Componentes de Layout

- `AppLayoutComponent` - Layout principal
- `HeaderComponent` - Cabeçalho
- `NavComponent` - Navegação lateral
- `FooterComponent` - Rodapé
- `NotificationsComponent` - Notificações

### Guards

- `NoLoginGuard` - Bloqueia acesso a páginas de auth quando logado
- `RoleGuard` - Controlo de acesso baseado em roles

---

## 🔌 API Endpoints

Base URL: `http://localhost:3000/api`

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/auth/login` | Autenticação |
| `POST` | `/auth/register` | Registo |

### Recursos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/transacao` | Listar transações |
| `POST` | `/transacao` | Criar transação |
| `GET` | `/conta` | Listar contas |
| `POST` | `/conta` | Criar conta |
| `GET` | `/cartao-credito` | Listar cartões |
| `GET` | `/categoria` | Listar categorias |
| `POST` | `/categoria` | Criar categoria (Admin) |
| `GET` | `/banco` | Listar bancos |
| `POST` | `/banco` | Criar banco (Admin) |
| `GET` | `/despesa-recorrente` | Listar despesas recorrentes |
| `POST` | `/despesa-recorrente` | Criar despesa recorrente |
| `GET` | `/estatisticas` | Obter estatísticas |
| `POST` | `/import` | Importar extrato |
| `GET` | `/utilizadores` | Listar utilizadores (Admin) |

**Swagger UI**: `http://localhost:3000/api-docs`

---

## ⚙️ Configuração

### Variáveis de Ambiente (Backend)

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de dados PostgreSQL
POSTGRES_URL=postgresql://postgres:password@localhost:5432/poupa-me

# Autenticação
JWT_SECRET=a_tua_chave_secreta_muito_segura
JWT_EXPIRATION=7d

# Sessão
SESSION_SECRET=outro_segredo_para_sessao

# Logging
LOG_LEVEL=silly

# IA (Hugging Face)
HF_TOKEN=teu_token_hugging_face
```

### Environment (Frontend)

```typescript
export const environment = {
  production: false,
  apiBaseUrl: '/api'
} as const;
```

---

## 🚀 Comandos

### Backend

```bash
cd backend
npm install        # Instalar dependências
npm run dev        # Desenvolvimento (hot-reload)
npm run build      # Build para produção
npm run start      # Iniciar servidor
npm run test       # Testes com Jest
npm run test:watch # Testes em watch mode
npm run lint       # Linting
```

### Frontend

```bash
cd frontend
npm install        # Instalar dependências
npm run start      # Servidor de desenvolvimento
npm run start:local # Com proxy para backend local
npm run build      # Build para produção
npm run test       # Testes unitários
npm run e2e        # Testes end-to-end
```

---

## 📊 Modelo de Domínio

```
┌─────────────────┐         ┌─────────────────┐
│     Banco       │◄────────│      Conta      │
│  (Aggregate)    │         │  (Aggregate)    │
│  - Nome         │         │  - Nome         │
│  - Icon         │         │  - Dinheiro     │
└─────────────────┘         │  - Icon         │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  CartaoCredito  │
                            │  (Aggregate)    │
                            │  - Nome         │
                            │  - Dinheiro     │
                            │  - Periodo      │
                            └────────┬────────┘
                                     │
                                     ▼
┌─────────────────┐         ┌─────────────────┐
│   Categoria     │◄────────│    Transacao    │
│  (Aggregate)    │         │  (Aggregate)    │
│  - Nome         │         │  - Data         │
│  - Icon         │         │  - Tipo         │
│                 │         │  - Status       │
└─────────────────┘         │  - Descricao    │
                            │  - Dinheiro     │
                            └─────────────────┘

┌─────────────────┐
│DespesaRecorrente│
│  (Aggregate)    │
│  - Nome         │
│  - Dinheiro     │
└─────────────────┘

┌─────────────────┐
│      User       │
│  (Aggregate)    │
│  - UserName     │
│  - UserEmail    │
│  - UserPassword │
│  - UserRole     │
└─────────────────┘
```

---

## 🔐 Controlo de Acessos (RBAC)

| Role | Permissões |
|------|------------|
| `Admin` | Acesso completo, gestão de categorias e utilizadores |
| `User` | Gestão de transações, contas, cartões, despesas recorrentes |
| `Guest` | Acesso limitado (apenas visualização) |

---

## 🧪 Testes

### Backend
- **Framework**: Jest
- **Config**: `jest.config.js`
- **Comando**: `npm run test`

### Frontend
- **Framework**: Karma + Jasmine
- **E2E**: Cypress
- **Comando**: `npm run test` / `npm run e2e`

---

## 🔄 CI/CD

**GitHub Actions** workflow em `.github/workflows/node.js.yml`:

1. Instalação de dependências (`npm ci`)
2. Build do backend e frontend
3. Execução dos testes

---

## 📝 DTOs (Data Transfer Objects)

### Backend DTOs

| DTO | Descrição |
|-----|-----------|
| `IBancoDTO` | Transfer object para Banco |
| `ICartaoCreditoDTO` | Transfer object para Cartão de Crédito |
| `ICategoriaDTO` | Transfer object para Categoria |
| `IContaDTO` | Transfer object para Conta |
| `IDashboardDTO` | Transfer object para Dashboard |
| `IDespesaRecorrenteDTO` | Transfer object para Despesa Recorrente |
| `IEstatisticasDTO` | Transfer object para Estatísticas |
| `ITransacaoDTO` | Transfer object para Transação |
| `IUserDTO` | Transfer object para User |

### Frontend DTOs

Cada feature possui os seus DTOs correspondentes para comunicação com a API.

---

## 🗺️ Mappers

### Backend

| Mapper | Função |
|--------|--------|
| `BancoMap` | Banco Entity ↔ DTO |
| `CartaoCreditoMap` | CartaoCredito Entity ↔ DTO |
| `CategoriaMap` | Categoria Entity ↔ DTO |
| `ContaMap` | Conta Entity ↔ DTO |
| `DespesaRecorrenteMap` | DespesaRecorrente Entity ↔ DTO |
| `TransacaoMap` | Transacao Entity ↔ DTO |
| `UserMap` | User Entity ↔ DTO |

### Frontend

Cada feature possui o seu mapper correspondente.

---

## 📁 Core Domain (Backend)

### Base Classes

| Classe | Descrição |
|--------|-----------|
| `Entity<T>` | Classe base para entidades com ID único |
| `AggregateRoot<T>` | Entidade raiz de agregado |
| `ValueObject<T>` | Classe base para Value Objects |
| `Identifier<T>` | Wrapper para IDs tipados |
| `UniqueEntityID` | ID único baseado em UUID |
| `UseCase<T>` | Interface para casos de uso |
| `WatchedList<T>` | Lista com tracking de mudanças |

### Domain Events

- `DomainEvents` - Dispatcher de eventos de domínio
- `IDomainEvent` - Interface para eventos
- `IHandle<T>` | Interface para handlers

### Logic Patterns

| Classe | Descrição |
|--------|-----------|
| `Result<T>` | Pattern para resultados de operações |
| `UseCaseError` | Base para erros de casos de uso |
| `AppError` | Erros da aplicação |
| `Guard` | Validações e asserções |

### Infraestrutura

| Classe | Descrição |
|--------|-----------|
| `BaseController` | Base para controladores HTTP |
| `Mapper<T>` | Base para mappers |
| `Repo<T>` | Base para repositórios |

---

## 🌐 Persistência (TypeORM)

### Entidades

| Entity | Tabela | Descrição |
|--------|--------|-----------|
| `BancoEntity` | `bancos` | Modelo de banco |
| `CartaoCreditoEntity` | `cartoes_credito` | Modelo de cartão de crédito |
| `CategoriaEntity` | `categorias` | Modelo de categoria |
| `ContaEntity` | `contas` | Modelo de conta bancária |
| `DespesaRecorrenteEntity` | `despesas_recorrentes` | Modelo de despesa recorrente |
| `TransacaoEntity` | `transacoes` | Modelo de transação |
| `UserEntity` | `users` | Modelo de utilizador |

---

## 🎨 Value Objects

### Shared

| VO | Descrição |
|----|-----------|
| `Nome` | Nome válido |
| `Dinheiro` | Valor monetário |
| `Icon` | Emoji/ícone |
| `Data` | Data válida |
| `Tipo` | Tipo de operação |

### Domínio Específico

| VO | Domínio | Descrição |
|----|---------|-----------|
| `Periodo` | CartaoCredito | Período de faturação |
| `Descricao` | Transacao | Descrição da transação |
| `Status` | Transacao | Estado da transação |
| `UserName` | User | Nome de utilizador |
| `UserEmail` | User | Email válido |
| `UserPassword` | User | Password hash |
| `UserRole` | User | Role (Admin/User/Guest) |

---

## 📌 Funcionalidades Principais

### Dashboard
- Resumo financeiro com saldo total
- Visão geral das contas bancárias
- Últimas transações
- Estado dos cartões de crédito

### Transações
- Registo de entradas, saídas e reembolsos
- Suporte a conta bancária e cartão de crédito
- Filtros por data, categoria, conta e tipo
- Categorização automática com IA

### Contas Bancárias
- Múltiplas contas com saldo em tempo real
- Associação a bancos
- Histórico de movimentos

### Cartões de Crédito
- Controlo de limite disponível/utilizado
- Barra de progresso visual
- Gestão de períodos de fatura

### Categorias
- Categorias personalizadas com emoji
- Apenas Admin pode criar/editar
- Filtros de transações por categoria

### Despesas Recorrentes
- Despesas automáticas (mensalidades, subscrições)
- Despesas mensais fixas (renda, serviços)
- Despesas mensais variáveis (alimentação, transporte)

### Gestão de Utilizadores
- Autenticação JWT + sessão
- RBAC (Admin, User, Guest)
- Painel de administração
- Perfil de utilizador editável

### Importação de Extratos
- Upload de ficheiros
- Parsing automático
- Categorização com IA

---

## 🔗 Links Importantes

- **Repositório**: `https://github.com/DiogoMP/poupa-me.git`
- **API Docs**: `http://localhost:3000/api-docs`
- **Frontend**: `http://localhost:4200`
- **Backend**: `http://localhost:3000`

---

## 📄 Licença

Ver ficheiro `LICENSE` no repositório.

---

*Documento gerado automaticamente a partir do código fonte.*
