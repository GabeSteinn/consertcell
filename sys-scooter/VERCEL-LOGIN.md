# Login no Vercel (sem PHP) – passo a passo

O sys-scooter pode rodar **100% no Vercel + GitHub** com login seguro e dados persistidos, usando **API serverless** (Node.js) e **Upstash Redis** (plano gratuito).

## O que foi feito no projeto

- **API serverless** em `api/scooter.js` (na raiz do repositório, pasta `api/`).
- **Upstash Redis** para armazenar sessões, clientes e configuração (sem PHP, sem arquivos no disco).
- **Frontend** usa `/api/scooter` quando está no ar (arquivo `js/api-base.js`).

Login e senha ficam **só nas variáveis de ambiente** do Vercel (não vão para o Git).

---

## 1. Criar conta e banco no Upstash (grátis)

1. Acesse **https://upstash.com** e crie uma conta (ou use “Sign in with Google”).
2. No painel, clique em **Create Database**.
3. Escolha **Global** ou a região mais próxima (ex.: South America se existir).
4. Deixe o plano **Free** e crie.
5. Na aba **REST API**, copie:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

Guarde esses dois valores para o próximo passo.

---

## 2. Variáveis de ambiente no Vercel

1. Abra o projeto no **Vercel** (Dashboard → seu projeto).
2. Vá em **Settings** → **Environment Variables**.
3. Adicione estas variáveis (uma a uma):

| Nome                     | Valor              | Ambiente  |
|--------------------------|--------------------|-----------|
| `SYS_SCOOTER_USER`       | seu usuário de login | Production (e Preview se quiser) |
| `SYS_SCOOTER_PASSWORD`  | sua senha forte    | Production (e Preview se quiser) |
| `UPSTASH_REDIS_REST_URL`   | (colado do Upstash) | Production (e Preview) |
| `UPSTASH_REDIS_REST_TOKEN` | (colado do Upstash) | Production (e Preview) |

4. Salve. **Não** commite esses valores no Git.

---

## 3. Estrutura do repositório no Vercel

A pasta **`api/`** precisa estar na **raiz** do que o Vercel usa como projeto.

- Se o projeto no Vercel é o repositório **consertcell** (raiz = pasta `consertcell`), a raiz já tem `api/scooter.js` → a rota será **/api/scooter**. Está correto.
- Se você configurou **Root Directory** no Vercel (ex.: `sys-scooter`), a `api/` ficaria fora da raiz e a rota não existiria. Nesse caso, deixe **Root Directory** em branco (raiz = repositório inteiro) para que **/api/scooter** funcione.

Ou seja: **não** defina “Root Directory” como `sys-scooter`; use a raiz do repo para ter tanto a API quanto o site.

---

## 4. Deploy

1. Dê **push** no GitHub (com a pasta `api/`, o `package.json` na raiz e o `js/api-base.js` no sys-scooter).
2. O Vercel faz o deploy automático.
3. Se o site estiver em um subpath (ex.: **/sys-scooter/**), acesse:  
   `https://seu-dominio.vercel.app/sys-scooter/`  
   (ou o domínio customizado que você usa).

O login deve funcionar: usuário e senha são os que você colocou em `SYS_SCOOTER_USER` e `SYS_SCOOTER_PASSWORD`.

---

## 5. Resumo de segurança

- Login e senha **só** nas variáveis de ambiente do Vercel (não aparecem no código nem no GitHub).
- Sessões e dados em **Upstash Redis** (acesso apenas pela API serverless, com as credenciais do Redis nas variáveis de ambiente).
- O frontend só envia o token (Bearer) após login; a API valida o token em toda requisição.

---

## Se usar hospedagem PHP depois

Em servidor com PHP, edite **`js/api-base.js`** e troque para:

```js
window.SYS_SCOOTER_API_BASE = 'api';
```

Assim o front passa a usar de novo a API em PHP (`api/index.php`).
