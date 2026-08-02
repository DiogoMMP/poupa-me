# Categorias e categorização por IA

Contexto `Categoria`, mais a feature de categorização automática de transações via IA
(`features/ia-categorizacao` no frontend).

## Categorias

`56bf129` (#10 #11) implementou as categorias de transação, no mesmo commit que corrigiu
endpoints de [[Autenticacao-e-Utilizadores|utilizador]]. `cceccbf` (#17) implementou a secção de
categorias no frontend, junto com a página de "não autorizado" (RBAC — ver [[Estrutura]],
`RoleGuard`).

## Categorização via IA

`e0b62d0` adicionou categorização de transações via IA, usando `@huggingface/inference` (ver
[[Estrutura]] para a stack backend) para sugerir automaticamente a categoria de uma transação a
partir da sua descrição — reduz o trabalho manual de classificar cada [[Transacoes|transação]].

## Ver também

- [[Transacoes]] — toda transação é classificada numa categoria.
- [[Despesas-Recorrentes]] — despesas recorrentes também são pré-classificadas por categoria.
