# User

**Aggregate Root** que representa um utilizador do sistema.

## Estrutura

### Entidade
- **Classe**: `User`
- **Tabela**: `users`

### Value Objects
- `UserName` - Nome de utilizador
- `UserEmail` - Email válido
- `UserPassword` - Password com hash
- `UserRole` - Role (Admin/User/Guest)

### DTO
- `IUserDTO` - Transfer object para User

### Mapper
- `UserMap` - User Entity ↔ DTO

## Roles ([[RBAC]])

| Role | Descrição |
|------|-----------|
| `Admin` | Acesso completo, gestão de categorias e utilizadores |
| `User` | Gestão de transações, contas, cartões, despesas recorrentes |
| `Guest` | Acesso limitado (apenas visualização) |

## Funcionalidades

### Autenticação
- **JWT** para autenticação stateless
- **Sessão** com session secret
- Registo e login de utilizadores

### Perfil de Utilizador
- Perfil editável
- Gestão de dados pessoais

### Operações CRUD
- Criar, ler, atualizar e eliminar utilizadores (apenas Admin)

## Endpoints da API

| Método | Endpoint | Descrição | Role |
|--------|----------|-----------|------|
| `POST` | `/auth/login` | Autenticação | Todos |
| `POST` | `/auth/register` | Registo | Todos |
| `GET` | `/utilizadores` | Listar utilizadores | Admin |

## User Stories Relacionadas
- ~~Registar Usuário~~ (Closed)
- ~~Perfil de Usuário~~ (Closed)
- ~~Secção Usuários - Admin~~ (Closed)

## Ver Também
- [[RBAC]]
- [[Autenticação]]
- [[Categoria]]
