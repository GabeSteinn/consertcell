# Sys-Scooter (Cert Mobility)

Sistema administrativo para gestão de clientes e scooters: cadastro, garantias, contratos, recibos e relatórios.

## Requisitos

- **Hospedagem**: PHP 7+ com permissão de escrita na pasta `data/`
- **Navegador**: uso em tablet e desktop (layout responsivo)

## Colocar o site no ar

1. Envie todos os arquivos do projeto para a hospedagem (via FTP, Git ou painel).
2. Garanta que a pasta **`data/`** exista e que o servidor tenha **permissão de escrita** nela (o PHP criará `clients.json`, `config.json` e `sessions.json` automaticamente).
3. Acesse o site pela **URL pública** (ex.: `https://seusite.com.br/sys-scooter/`).

Quando o site é acessado por **http** ou **https** (e não por arquivo local), os dados são **sempre salvos no servidor**. Qualquer dispositivo que abrir o mesmo endereço verá os mesmos clientes e configurações.

## Uso offline (arquivo local)

Se abrir o sistema por `file://` (arquivo no PC), crie **`js/config.js`** a partir de **`js/config.example.js`**, defina `user` e `password`, e use esse login para ativar o modo local (dados no localStorage).

## Dados sensíveis (não vão para o GitHub)

Os arquivos com credenciais são **ignorados pelo Git** e **não devem ser commitados**:

| Arquivo | Uso |
|--------|-----|
| **`api/config.php`** | Login e senha da API (site online). Copie `api/config.example.php` para `config.php` e preencha. |
| **`js/config.js`** | Login e senha para uso offline (arquivo local). Copie `js/config.example.js` para `config.js` e preencha. |
| **`data/*.json`** | Dados de clientes, configuração e sessões (criados no servidor). |

Ao clonar o repositório ou fazer deploy, crie **`api/config.php`** no servidor a partir do exemplo para o login online funcionar.

## Estrutura

- `api/index.php` – API (login, clientes, configuração). Credenciais em `api/config.php` (não versionado).
- `api/config.example.php` – Exemplo de configuração; copie para `config.php` e preencha.
- `data/` – dados em JSON (não versionados; criados no servidor)
- `js/app.js` – lógica principal do sistema
- `js/config.example.js` – Exemplo para uso offline; copie para `config.js` (não versionado) e preencha.
- Páginas: login, dashboard, clientes, novo/editar cliente, detalhes do cliente, relatórios, configuração

## Enviar para o GitHub

No PowerShell (ou terminal), na pasta do projeto:

```powershell
cd "d:\scooter\consertcell\sys-scooter"

git init
git add .
git commit -m "Sys-Scooter: sistema responsivo, dados no servidor quando online"

git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

Substitua `SEU_USUARIO/SEU_REPOSITORIO` pela URL do repositório que você criou no GitHub. Se o repositório já existir e tiver arquivos, use `git pull origin main --rebase` antes do primeiro `git push`.

## Licença

Uso interno / Cert Mobility.
