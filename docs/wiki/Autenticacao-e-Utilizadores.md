# Autenticação e utilizadores

Evolução do contexto `User`/`Auth`, desde a v1 do domínio até à autenticação híbrida
JWT+sessão usada em produção.

## Endpoints e domínio de utilizador

`56bf129` corrigiu os endpoints de `User` da v1 inicial (ver [[Setup-e-Modelo-de-Dominio]]) e, no
mesmo commit, implementou as categorias de transação (ver [[Categorias-e-IA]]).

`5ec8c68` (#26) implementou o registo de utilizador (fluxo de signup). `e5af3e6` (#24 #25)
implementou a listagem de utilizadores (admin) e a página de perfil.

## Sessão e tokens em produção

Ao mover para produção (Vercel), a autenticação teve vários problemas de sessão que precisaram de
correção dedicada:

- `16576b2` — o endpoint de login não estava a devolver o token corretamente.
- `af37c7f` — correção do login para guardar a sessão corretamente, incluindo uma tentativa
  específica de compatibilidade com o ambiente Vercel (serverless, sem estado persistente entre
  invocações).
- `043d675` — melhoria da gestão de sessão do utilizador no frontend, com suporte a
  `localStorage` como reforço da persistência de sessão além do cookie.

Este padrão (JWT Bearer + cookie de sessão, `isAuth` middleware populando `req.currentUser`) é a
base do `AuthUser` (id/role/email) usado por `getEffectiveUserId(req)` para scoping de dados por
utilizador — Admins veem dados de todos, utilizadores normais só os próprios.

## Ver também

- [[Deploy-e-Infraestrutura]] — porque a sessão precisou de tratamento especial no Vercel
  (serverless sem estado persistente entre pedidos).
- [[Setup-e-Modelo-de-Dominio]] — origem do contexto `User`.
