# Poupa-me (codebase KB)

Created 2026-08-02. Last compiled 2026-08-02 (full git history).

Map of content for this repo's knowledge base. Kept up to date by `compile-wiki` as notes and
commits get folded into articles.

## Start here

- [[Estrutura]] — layout de pastas, stack técnica, entry points e diagrama de domínio atual
  (sempre regenerado, reflete o estado presente do repositório).

## Concepts

- [[Setup-e-Modelo-de-Dominio]] — arranque do projeto, DDD/Clean Architecture, origem do modelo
  de domínio.
- [[Autenticacao-e-Utilizadores]] — contexto `User`, registo, sessão JWT+cookie, correções de
  auth em produção.
- [[Bancos]] — contexto `Banco`, seleção de banco como estado cross-feature.
- [[Contas]] — contexto `Conta`.
- [[Cartoes-de-Credito]] — contexto `CartaoCredito`, ciclo de faturação, pagamento de fatura.
- [[Transacoes]] — contexto `Transacao`, incluindo importação de CSV do Notion.
- [[Despesas-Recorrentes]] — contexto `DespesaRecorrente`, processamento/agendamento, área mais
  iterada do domínio.
- [[Categorias-e-IA]] — contexto `Categoria` e categorização automática via IA
  (`@huggingface/inference`).
- [[Dashboard-e-Estatisticas]] — telas agregadoras, gráficos, otimização mobile.
- [[Deploy-e-Infraestrutura]] — CI, deployment no Vercel (SSR vs. CSR, TypeORM, Swagger), Docker
  local, keep-alive.

## General vault

- `_geral/` — link para o vault geral/partilhado (conteúdo mantido por esse vault, não por este
  projeto).
