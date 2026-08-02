# Deploy e infraestrutura

CI, deployment em produção (Vercel) e ambiente de desenvolvimento containerizado. Coletivamente a
maior fonte de commits "fix" isolados do repositório — colocar este stack (Express 5 + Angular
SSR + TypeORM) a correr de forma estável em serverless (Vercel) foi um processo iterativo longo.

## CI

`8fbd376` criou o workflow `node.js.yml`. `ffaa9a1` e `c7e09b0` corrigiram esse workflow depois
de falhas iniciais. O workflow atual corre apenas `npm ci` + `npm run build` para backend e
frontend em push/PR para `main` — **não** corre a suite de testes (ver `CLAUDE.md`).

`c17f217` é o merge da branch `frontend` de volta para a principal (PR #27).

## Correções para produção no Vercel

Uma sequência longa de commits `fix:` foi necessária para o build/runtime funcionar em produção,
tocando em três áreas distintas repetidamente:

- **Tipos/build**: `f655954`, `fb17c2e` — erros de tipo e de compilação que só apareciam em
  build de produção (não em dev).
- **Entry point do backend**: `3a410a5`, `1a47c2d`, `311ceb5`, `587c880` — correções sucessivas
  em `index.ts`, incluindo ajuste do TypeORM para funcionar em local (`587c880`).
- **TypeORM**: `1ffed8b`, `f6396d9` — correções na configuração/DataSource do TypeORM
  especificamente para o ambiente de produção.
- **Swagger**: `038c686`, `19f349d` — correção dos "servers" declarados no Swagger para que a UI
  de `/api-docs` funcionasse também em produção (URLs diferentes de localhost).
- **Angular SSR**: `93c7152` (configuração de ambiente de produção + output path do build),
  `9bd1b3e` (file replacements de produção no `angular.json`), `177bf84` (mudança das rotas do
  servidor para client-side rendering — reversão parcial de SSR), `ad0d70c` (voltar a usar o
  servidor no frontend, revertendo `177bf84`) — o modo de rendering (SSR vs. CSR/static) foi
  alternado mais que uma vez antes de estabilizar.
- `3bacd47` — como parte dessa estabilização, mudança do frontend "de server para static".

Estas idas e vindas (`177bf84` → `ad0d70c`, depois `3bacd47`) indicam que a escolha entre SSR e
build estático não foi óbvia à primeira — vale a pena verificar o estado atual do deployment
antes de assumir qual modo está ativo.

## Vercel — fase 2 (organização)

`fa37420` (#39) é uma correção final e mais deliberada "para funcionar no Vercel", precedida por
`69ed665` (#39) — um refactor de organização do código para maior facilidade de manutenção — e
seguida por `343c941` (#39) que adicionou o Dependabot.

## Docker (ambiente local + mobile)

`3d8f5bd` (#41 #42) configurou o ambiente local para usar contentores Docker
(`docker-compose.yml`: Postgres + backend + frontend + Storybook). `e0348f0` (#41 #43) estendeu
essa configuração com um túnel ngrok, para permitir testar a app diretamente em dispositivos
mobile durante o desenvolvimento (ver [[Dashboard-e-Estatisticas]] para o trabalho de UI mobile
que motivou isto).

## Keep-alive

`7c129de` adicionou um endpoint à API cujo único propósito é ser chamado periodicamente para que
a API não "adormeça" após 15 minutos de inatividade — mitigação comum para planos serverless/free
tier com cold start ou sleep automático.

## Ver também

- [[Autenticacao-e-Utilizadores]] — sessão/token precisaram de tratamento especial por causa do
  ambiente serverless do Vercel.
- [[Estrutura]] — stack técnica completa e camadas afetadas por estas correções.
