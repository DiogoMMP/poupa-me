# RBAC (Role-Based Access Control)

Controlo de acesso baseado em roles para o sistema Poupa-me.

## Roles

| Role | Permissões |
|------|------------|
| `Admin` | Acesso completo, gestão de categorias e utilizadores |
| `User` | Gestão de transações, contas, cartões, despesas recorrentes |
| `Guest` | Acesso limitado (apenas visualização) |

## Guards do Frontend

- **`NoLoginGuard`** - Bloqueia acesso a páginas de auth quando logado
- **`RoleGuard`** - Controlo de acesso baseado em roles

## Endpoints Protegidos

### Apenas Admin
- `POST /categoria` - Criar categoria
- `POST /banco` - Criar banco
- `GET /utilizadores` - Listar utilizadores

### Admin e User
- Gestão de transações, contas, cartões, despesas recorrentes
- Dashboard e estatísticas

## Ver Também
- [[User]]
- [[Autenticação]]
- [[Arquitetura]]
