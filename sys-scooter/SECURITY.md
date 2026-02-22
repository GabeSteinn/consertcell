# Segurança – Sys-Scooter

## Arquivos que NUNCA devem ir para o GitHub

| Arquivo              | Motivo                          |
|----------------------|----------------------------------|
| `api/config.php`     | Contém **login e senha** da API |
| `js/config.js`       | Contém **login e senha** offline |
| `data/*.json`        | Dados de clientes e sessões      |

Esses arquivos estão no `.gitignore`. Não use `git add -f` neles.

## Antes de cada push

1. Rode `git status`.
2. Confira que **não** aparecem:
   - `api/config.php`
   - `js/config.js`
   - `data/clients.json`, `data/config.json`, `data/sessions.json`
3. Se aparecerem, **não** faça commit. Remova do stage:  
   `git restore --staged sys-scooter/api/config.php sys-scooter/js/config.js`

## Se você já commitou credenciais

1. Remova do repositório (mantendo no disco):  
   `git rm --cached sys-scooter/api/config.php sys-scooter/js/config.js`
2. Faça commit: `git commit -m "Remove credenciais do controle de versão"`
3. Troque a senha no servidor e em `api/config.php` / `js/config.js`, pois o histórico do Git ainda terá a antiga.

## Deploy seguro

- No servidor, crie `api/config.php` a partir de `api/config.example.php` e preencha com usuário e senha **fortes**.
- Mantenha a pasta `data/` com permissão restrita (só o PHP deve escrever).
- Use **HTTPS** em produção.
