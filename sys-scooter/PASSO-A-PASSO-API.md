# Passo a passo: resolver "Não foi possível conectar ao servidor"

Essa mensagem aparece quando o **front** (telas do sistema) está no ar, mas a **API em PHP** não está rodando no mesmo lugar. O login e os dados dependem dessa API.

## Solução: hospedar o sys-scooter em um servidor com PHP

Siga estes passos na ordem.

---

### 1. Ter uma hospedagem com PHP

Você precisa de um servidor que execute PHP (versão 7 ou superior). Exemplos:

- **Hospedagem do próprio domínio** – Se o domínio (ex.: assistenciaconsertcell.com.br) já está em uma hospedagem (Hostinger, Locaweb, cPanel, etc.), use essa mesma hospedagem.
- **Nova hospedagem** – Se hoje o site está só no Vercel, contrate uma hospedagem com PHP ou use a que já tiver para outro projeto.

O Vercel **não executa PHP**. Por isso o sistema precisa estar em um servidor com PHP.

---

### 2. Enviar a pasta sys-scooter para o servidor

- Acesse o servidor por **FTP**, **Gerenciador de arquivos** (cPanel, painel da hospedagem) ou **SSH**.
- Crie uma pasta, por exemplo **`sys-scooter`** (ou **`painel`**, **`admin`**, o nome que quiser).
- Envie **toda** a pasta do projeto para dentro dela, mantendo a estrutura:
  - `api/`
  - `css/`
  - `js/`
  - `data/`
  - `includes/`
  - `index.html`, `dashboard.php`, `clients.php`, etc.

Não envie só a pasta `api/` sozinha: envie o projeto **inteiro**.

---

### 3. Criar o arquivo de configuração da API (login e senha)

No servidor, dentro da pasta **`api/`**:

1. Copie o arquivo **`config.example.php`** e renomeie a cópia para **`config.php`**.
2. Abra **`config.php`** e preencha:
   - `user` → usuário do login (ex.: neia)
   - `password` → senha (escolha uma senha forte)

Salve o arquivo. **Não** coloque esse `config.php` no Git (ele já está no .gitignore).

---

### 4. Ajustar permissões da pasta `data/`

A API grava os dados em arquivos dentro de **`data/`**.

- Crie a pasta **`data/`** se não existir.
- Ajuste as permissões para o PHP poder escrever (no cPanel ou via FTP: permissão **755** ou **775**, conforme a hospedagem).

No primeiro login, a API criará automaticamente arquivos como `clients.json`, `config.json`, `sessions.json` dentro de `data/`.

---

### 5. Acessar o sistema pela URL correta

Abra o navegador e acesse a **URL do seu servidor** apontando para a pasta do sys-scooter, por exemplo:

- `https://www.assistenciaconsertcell.com.br/sys-scooter/`  
  ou  
- `https://seudominio.com.br/sys-scooter/`

Use **https** se o servidor tiver SSL. A URL deve ser a do **servidor com PHP**, não a do Vercel.

---

### 6. (Opcional) Apontar o domínio para a hospedagem PHP

Se hoje **www.assistenciaconsertcell.com.br** abre o site no **Vercel**:

- Para o **sys-scooter** funcionar com login, ele precisa ser acessado no **servidor com PHP**.
- No painel do domínio (DNS), você pode:
  - **Opção A:** Apontar o domínio (ou um subdomínio) para a hospedagem PHP e colocar o sys-scooter lá (assim o sistema inteiro fica em PHP).
  - **Opção B:** Manter o site principal no Vercel e usar um **subdomínio** (ex.: `painel.assistenciaconsertcell.com.br`) apontando para a hospedagem PHP onde está o sys-scooter.

Depois disso, use sempre a URL que aponta para a pasta do sys-scooter no servidor PHP (com a barra no final, ex.: `https://www.assistenciaconsertcell.com.br/sys-scooter/`).

---

## Resumo

| Onde está hoje        | O que fazer |
|-----------------------|-------------|
| Só no GitHub / Vercel | Hospedar o **projeto inteiro** (incluindo `api/`) em um servidor com PHP. |
| Já tem hospedagem PHP | Enviar a pasta sys-scooter, criar `api/config.php` e liberar escrita em `data/`. |

Depois de seguir esses passos, ao acessar a URL do sys-scooter no servidor PHP, a mensagem "Não foi possível conectar ao servidor" deve sumir e o login passar a funcionar.
