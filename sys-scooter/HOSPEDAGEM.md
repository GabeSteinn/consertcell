# Sys Scooter – Publicar na hospedagem

Os dados (clientes, configuração e login) são salvos **no servidor**, não no navegador. Assim, ao acessar de outro celular ou computador, tudo aparece igual.

## O que enviar para o servidor

Envie toda a pasta **sys-scooter** para a hospedagem (FTP, gerenciador de arquivos ou Git), mantendo a estrutura:

- `api/` – API em PHP (index.php, backup.php)
- `includes/` – cabeçalho e menu (head.php, sidebar.php)
- `data/` – pasta onde os dados serão gravados (clientes, configuração, sessões, backups)
- `css/`, `js/`, `index.html`, `dashboard.php`, `clients.php`, `config.php`, `reports.php`, etc.

## Requisitos da hospedagem

1. **PHP** (versão 7 ou superior).
2. **Pasta `data/` gravável** pelo PHP.  
   No primeiro uso, a API cria os arquivos em `data/` (clients.json, config.json, sessions.json).  
   Se der erro ao salvar, confira permissões da pasta `data/` (por exemplo 755 ou 775, conforme o servidor).

## Como acessar

Abra o sistema pela **URL do site**, por exemplo:

- `https://seusite.com.br/sys-scooter/`  
  ou  
- `https://seusite.com.br/`

Não use abrir os arquivos direto no PC (file://) – o login e os dados dependem da API no servidor.

## Login

- **Usuário:** neia  
- **Senha:** yasmin18

(As credenciais estão no PHP em `api/index.php`; você pode alterar lá se quiser mudar a senha.)

**Backup automático:** o script `api/backup.php` grava em `data/backups/` (crie a pasta e deixe gravável). Agende no cron do servidor, por exemplo: `0 3 * * * curl -s "https://seusite.com.br/sys-scooter/api/backup.php?token=SEU_TOKEN"`. O token está na variável `$BACKUP_SECRET` em `api/backup.php`.

## Backup

Em **Configuração** você pode **Exportar dados** (JSON), **Exportar planilha (CSV)** e **Importar**. Os dados “oficiais” continuam sendo os que estão na hospedagem (pasta `data/`).
