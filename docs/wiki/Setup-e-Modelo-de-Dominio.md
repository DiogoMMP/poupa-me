# Setup e modelo de domínio

Como o projeto arrancou e por que motivo a arquitetura segue DDD/Clean Architecture desde o
início.

## Arranque do projeto

O commit `72b1ede` ("Primeiro commit") criou os dois projetos (`frontend/` Angular e `backend/`
Node.js) e implementou a primeira versão do domínio, incluindo o contexto `User`. O commit
`fd44a20` ("Initial commit") é o commit vazio inicial do repositório.

O modelo de domínio ficou documentado visualmente em `docs/domain_model.puml`
(ver [[Estrutura]] para o diagrama Mermaid equivalente e a lista de agregados por contexto:
`Banco`, `Conta`, `CartaoCredito`, `Transacao`, `DespesaRecorrente`, `Categoria`, mais `User` e
`EntradaRecorrente` que existem no código mas não estão no `.puml`).

A arquitetura backend segue Domain-Driven Design + Clean Architecture desde o commit inicial:
entidades de domínio criadas via construtor privado + `create()` estático que corre `Guard` e
devolve `Result<T>` (ver `core/domain/`, `core/logic/Result.ts`), em vez de exceções para erros
de negócio esperados.

O commit `c80dd13` acrescentou o `README.md` com a descrição do projeto e funcionalidades — vale
a pena ler para o "elevator pitch" do produto.

## Ver também

- [[Estrutura]] — layout de pastas, stack técnica e diagrama de domínio atual.
- [[Autenticacao-e-Utilizadores]] — evolução do contexto `User` a partir da v1 aqui implementada.
