<div align="center">
  <img src="frontend/public/logos/logo_com_fundo.png" alt="Poupa-me Logo" width="200"/>

  <h1>Poupa-me 💰</h1>
  <p><strong>A tua aplicação pessoal de gestão financeira</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular"/>
    <img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/PostgreSQL-latest-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
    <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
    <img src="https://img.shields.io/github/actions/workflow/status/diogo/poupa-me/node.js.yml?style=for-the-badge&label=CI&logo=github-actions&logoColor=white" alt="CI"/>
  </p>

  <p>
    <a href="#-funcionalidades">Funcionalidades</a> •
    <a href="#-arquitetura">Arquitetura</a> •
    <a href="#-stack-tecnológica">Stack</a> •
    <a href="#-instalação">Instalação</a> •
    <a href="#-variáveis-de-ambiente">Configuração</a> •
    <a href="#-api">API</a> •
    <a href="#-licença">Licença</a>
  </p>
</div>

---

## 📖 Sobre o Projeto

O **Poupa-me** é uma aplicação web full-stack de gestão financeira pessoal que te permite ter controlo total sobre o teu
dinheiro. Regista transações, gere contas bancárias e cartões de crédito, categoriza despesas e visualiza o teu resumo
financeiro num dashboard intuitivo — tudo num só lugar.

---

## ✨ Funcionalidades

### 📊 Dashboard

- Resumo financeiro com saldo total
- Visão geral das contas bancárias com saldos atualizados
- Últimas transações e estado dos cartões de crédito
- Acesso rápido para criar nova transação

### 💸 Transações

- Registo de **entradas**, **saídas** e **reembolsos**
- Suporte a transações de conta bancária e cartão de crédito
- Filtros por data, categoria, conta e tipo

### 🏦 Contas Bancárias

- Gestão de múltiplas contas com saldo em tempo real
- Associação a bancos com identificação visual por emoji
- Histórico de movimentos por conta

### 💳 Cartões de Crédito

- Controlo de limite disponível e utilizado
- Barra de progresso visual do limite
- Gestão de períodos de fatura

### 🏷️ Categorias

- Criação de categorias personalizadas com emoji (Apenas Admin)
- Organização de despesas e receitas
- Filtros de transações por categoria

### 🔁 Despesas Recorrentes

- Configuração de despesas automáticas (mensalidades, subscrições, etc.)
- Configuração de despesas mensais fixas (renda, serviços, etc.)
- Configuração de despesas mensais variáveis (alimentação, transporte, etc.)

### 👤 Gestão de Utilizadores

- Autenticação segura com **JWT** + sessão
- Controlo de acessos baseado em funções (**RBAC**): `Admin`, `User`, `Guest`
- Painel de administração para gestão de utilizadores (Apenas Admin)
- Perfil de utilizador editável

---

## 🏗️ Arquitetura

O projeto segue uma arquitetura **monorepo** com separação clara entre frontend e backend, aplicando princípios de *
*Domain-Driven Design (DDD)** e **Clean Architecture** no backend.

```
poupa-me/
├── frontend/          # Angular 20 SPA (SSR com Angular Universal)
│   └── src/app/
│       ├── features/  # Módulos por funcionalidade (dashboard, transações, etc.)
│       ├── layout/    # Componentes de layout (navbar, header, sidebar)
│       ├── services/  # Serviços HTTP partilhados
│       └── guards/    # Guards de autenticação e autorização
│
└── backend/           # API REST Node.js + Express 5
    └── src/
        ├── domain/    # Entidades e Value Objects (DDD)
        ├── repos/     # Repositórios (padrão Repository)
        ├── services/  # Lógica de negócio
        ├── controllers/ # Controladores HTTP
        ├── api/       # Rotas e middlewares
        ├── persistence/ # Entidades TypeORM
        └── loaders/   # Bootstrap da aplicação
```

### Padrões aplicados

- **Domain-Driven Design** — Entidades ricas, Value Objects, lógica de domínio encapsulada
- **Repository Pattern** — Abstração da camada de dados
- **Dependency Injection** — Via `TypeDI`
- **RBAC** — Controlo de acesso granular por roles
- **Result Pattern** — Tratamento explícito de erros sem exceções

---

## 🛠️ Stack Tecnológica

### Frontend

| Tecnologia | Versão | Descrição             |
|------------|--------|-----------------------|
| Angular    | 20     | Framework SPA com SSR |
| TypeScript | 5.9    | Tipagem estática      |
| RxJS       | 7.8    | Programação reativa   |
| Picmo      | 5.8    | Seletor de emojis     |

### Backend

| Tecnologia | Versão | Descrição                          |
|------------|--------|------------------------------------|
| Node.js    | 22     | Runtime                            |
| Express    | 5      | Framework HTTP                     |
| TypeScript | 5.9    | Tipagem estática                   |
| TypeORM    | 0.3    | ORM para PostgreSQL                |
| TypeDI     | 0.10   | Injeção de dependências            |
| JWT        | 9.0    | Autenticação stateless             |
| Winston    | 3      | Logging estruturado (JSON + CLI)   |
| Swagger    | —      | Documentação da API (OpenAPI 3)    |

### Base de Dados

| Tecnologia | Descrição                            |
|------------|--------------------------------------|
| PostgreSQL | Base de dados principal              |
| TypeORM    | Migrations e sincronização de schema |

---

## 🚀 Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) `>= 22`
- [PostgreSQL](https://www.postgresql.org/) `>= 14`
- [npm](https://www.npmjs.com/) `>= 10`

### 1. Clonar o repositório

```bash
git clone https://github.com/DiogoMMP/poupa-me.git
cd poupa-me
```

### 2. Configurar o Backend

```bash
cd backend
npm install
```

Cria o ficheiro `.env` na pasta `backend/` (ver [Variáveis de Ambiente](#-variáveis-de-ambiente)).

```bash
# Iniciar em modo de desenvolvimento (com hot-reload)
npm run dev
```

### 3. Configurar o Frontend

```bash
cd ../frontend
npm install

# Iniciar com proxy para o backend local
npm run start:local
```

A aplicação estará disponível em **http://localhost:4200**

---

## ⚙️ Variáveis de Ambiente

Cria um ficheiro `.env` dentro da pasta `backend/` com o seguinte conteúdo:

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
```

> ⚠️ **Nunca** commites o ficheiro `.env` para o repositório.

---

## 📡 API

A API REST está disponível em `http://localhost:3000/api` e documentada via **Swagger UI** em:

```
http://localhost:3000/api-docs
```

### Principais endpoints

| Método | Endpoint              | Descrição             |
|--------|-----------------------|-----------------------|
| `POST` | `/api/auth/login`     | Autenticação          |
| `POST` | `/api/auth/register`  | Registo de utilizador |
| `GET`  | `/api/transacao`      | Listar transações     |
| `POST` | `/api/transacao`      | Criar transação       |
| `GET`  | `/api/conta`          | Listar contas         |
| `POST` | `/api/conta`          | Criar conta           |
| `GET`  | `/api/cartao-credito` | Listar cartões        |
| `GET`  | `/api/categoria`      | Listar categorias     |
| `GET`  | `/api/banco`          | Listar bancos         |
| `POST` | `/api/import`         | Importar extrato      |

---

## 🔄 CI/CD

O projeto utiliza **GitHub Actions** para integração contínua. A cada push ou pull request para `main`, o pipeline
executa automaticamente:

1. Instalação de dependências (`npm ci`)
2. Build do backend e frontend
3. Execução dos testes

Consulta o workflow em [`.github/workflows/node.js.yml`](.github/workflows/node.js.yml).

---

## 📁 Estrutura de Pastas Detalhada

<details>
<summary>Ver estrutura completa</summary>

```
poupa-me/
├── .github/
│   └── workflows/
│       └── node.js.yml          # Pipeline CI/CD
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── middlewares/     # isAuth, authorize (RBAC)
│   │   │   └── routes/          # Rotas por recurso
│   │   ├── config/              # Configuração centralizada
│   │   ├── controllers/         # Controladores HTTP
│   │   ├── core/
│   │   │   ├── domain/          # Base classes DDD
│   │   │   ├── logic/           # Result pattern, UseCases
│   │   │   └── tests/           # Helpers de teste
│   │   ├── domain/
│   │   │   ├── Banco/
│   │   │   ├── CartaoCredito/
│   │   │   ├── Categoria/
│   │   │   ├── Conta/
│   │   │   ├── DespesaRecorrente/
│   │   │   ├── Shared/          # Value Objects partilhados
│   │   │   ├── Transacao/
│   │   │   └── User/
│   │   ├── dto/                 # Data Transfer Objects
│   │   ├── loaders/             # Bootstrap (Express, TypeORM, DI)
│   │   ├── mappers/             # Domain ↔ DTO mappings
│   │   ├── persistence/
│   │   │   └── entities/        # Entidades TypeORM
│   │   ├── repos/               # Repositórios
│   │   └── services/            # Lógica de negócio
│   ├── jest.config.js
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── features/        # Módulos por página
│   │   │   ├── guards/          # Auth guards
│   │   │   ├── layout/          # Nav, Header, Sidebar
│   │   │   └── services/        # Serviços HTTP
│   │   ├── environments/
│   │   └── styles.css           # Estilos globais
│   ├── public/                  # Assets estáticos (ícones, logos)
│   ├── angular.json
│   └── package.json
├── docs/
│   └── domain_model.puml        # Diagrama do modelo de domínio
└── README.md
```

</details>

---

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faz um **fork** do repositório
2. Cria uma branch para a tua feature: `git checkout -b feature/nova-funcionalidade`
3. Faz commit das alterações: `git commit -m 'feat: adicionar nova funcionalidade'`
4. Faz push para a branch: `git push origin feature/nova-funcionalidade`
5. Abre um **Pull Request**

---

## 📄 Licença

Este projeto está licenciado sob a licença incluída no ficheiro [LICENSE](LICENSE).

---

<div align="center">
  <p>Feito com ❤️ para quem quer poupar mais e gastar melhor.</p>
  <img src="frontend/public/logos/logo_redondo_com_fundo.png" alt="Poupa-me" width="60"/>
</div>

