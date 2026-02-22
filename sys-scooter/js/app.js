/**
 * Sys-Scooter - Dados na hospedagem (API PHP) ou modo local (sem servidor)
 * Com servidor: login e dados no PHP. Sem servidor (arquivo no PC): login e dados no navegador (localStorage).
 */

const APP = {
  STORAGE_KEY: 'sys_scooter_auth',
  STORAGE_KEY_SESSION: 'sys_scooter_auth_session',
  LOCAL_MODE_KEY: 'sys_scooter_local_mode',
  CLIENTS_KEY: 'sys_scooter_clients',
  WHATSAPP_MSG_KEY: 'sys_scooter_whatsapp_msg',
  GARANTIA_DIAS: 90,
  get API_BASE() {
    return (typeof window !== 'undefined' && window.SYS_SCOOTER_API_BASE) ? window.SYS_SCOOTER_API_BASE : 'api';
  },
  get LOCAL_USER() {
    return (typeof window !== 'undefined' && window.SYS_SCOOTER_LOCAL_CREDENTIALS && window.SYS_SCOOTER_LOCAL_CREDENTIALS.user) || '';
  },
  get LOCAL_PASSWORD() {
    return (typeof window !== 'undefined' && window.SYS_SCOOTER_LOCAL_CREDENTIALS && window.SYS_SCOOTER_LOCAL_CREDENTIALS.password) || '';
  },
  _clientsCache: null,
  _configCache: null,

  isLocalMode() {
    return localStorage.getItem(this.LOCAL_MODE_KEY) === '1';
  },

  setLocalMode(on) {
    if (on) localStorage.setItem(this.LOCAL_MODE_KEY, '1');
    else localStorage.removeItem(this.LOCAL_MODE_KEY);
  },

  getAuthToken() {
    const fromLocal = localStorage.getItem(this.STORAGE_KEY);
    const fromSession = sessionStorage.getItem(this.STORAGE_KEY_SESSION);
    const auth = fromLocal || fromSession;
    if (!auth) return null;
    try {
      const data = JSON.parse(auth);
      return (data && data.token) ? data.token : null;
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getAuthToken();
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  /** Escapa HTML para exibição segura (uso global). */
  escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  },

  async apiRequest(method, action, body, needAuth) {
    const url = this.API_BASE + '/index.php?action=' + encodeURIComponent(action);
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const token = this.getAuthToken();
    if (needAuth !== false && token) opts.headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(url, opts);
    const data = await res.json().catch(function() { return {}; });
    if (!res.ok) throw new Error(data.error || 'Erro na requisição');
    this.setLocalMode(false);
    return data;
  },

  /** True quando a página foi aberta por file:// (sem servidor PHP). */
  isFileProtocol() {
    return typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
  },

  async login(loginName, password, manterConectado) {
    const login = (loginName && loginName.trim()) ? loginName.trim() : '';
    const senha = (password && typeof password === 'string') ? password.trim() : '';
    if (!login || !senha) return { ok: false, error: 'Informe login e senha.' };

    var isLocalCreds = login.toLowerCase() === this.LOCAL_USER.toLowerCase() && senha.toLowerCase() === this.LOCAL_PASSWORD.toLowerCase();

    if (this.isFileProtocol()) {
      if (isLocalCreds) {
        this.setLocalMode(true);
        var token = 'auth_local_' + Date.now();
        var payload = { token: token, login: this.LOCAL_USER };
        if (manterConectado) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
          sessionStorage.removeItem(this.STORAGE_KEY_SESSION);
        } else {
          sessionStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify(payload));
          localStorage.removeItem(this.STORAGE_KEY);
        }
        return { ok: true };
      }
      return { ok: false, error: 'Login ou senha incorretos. Para uso offline, crie js/config.js a partir de js/config.example.js.' };
    }

    try {
      const data = await this.apiRequest('POST', 'login', {
        action: 'login',
        login: login,
        password: senha
      }, false);
      if (!data.token) return { ok: false, error: 'Login ou senha incorretos.' };
      const payload = { token: data.token, login: data.login || login };
      if (manterConectado) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
        sessionStorage.removeItem(this.STORAGE_KEY_SESSION);
      } else {
        sessionStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify(payload));
        localStorage.removeItem(this.STORAGE_KEY);
      }
      return { ok: true };
    } catch (e) {
      const msg = (e && e.message) ? e.message : '';
      if (msg.indexOf('Login ou senha') !== -1) return { ok: false, error: 'Login ou senha incorretos.' };
      if (isLocalCreds) {
        this.setLocalMode(true);
        const token = 'auth_local_' + Date.now();
        const payload = { token: token, login: this.LOCAL_USER };
        if (manterConectado) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
          sessionStorage.removeItem(this.STORAGE_KEY_SESSION);
        } else {
          sessionStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify(payload));
          localStorage.removeItem(this.STORAGE_KEY);
        }
        return { ok: true };
      }
      if (this.isFileProtocol()) {
        return { ok: false, error: 'Servidor indisponível. Para uso offline, crie js/config.js a partir de js/config.example.js.' };
      }
      return { ok: false, error: 'Não foi possível conectar ao servidor. O sistema precisa da API (PHP) para login online. Hospede a pasta api/ em um servidor com PHP ou configure a URL da API em js/config.js (apiBase).' };
    }
  },

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.STORAGE_KEY_SESSION);
    this._clientsCache = null;
    this._configCache = null;
    window.location.href = 'index.html';
  },

  _getClientsFromStorage() {
    try {
      const raw = localStorage.getItem(this.CLIENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  _saveClientsToStorage(clients) {
    localStorage.setItem(this.CLIENTS_KEY, JSON.stringify(clients));
  },

  /** Converte cliente no formato antigo (modelo no root) para formato com scooters[]. */
  normalizeClient(c) {
    if (!c || typeof c !== 'object') return c;
    if (Array.isArray(c.scooters) && c.scooters.length > 0) return c;
    const scooters = [{
      id: (c.id || 'c') + '_s1',
      modelo: c.modelo,
      cor: c.cor,
      dataVenda: c.dataVenda,
      garantiaAte: c.garantiaAte || calcularGarantia(c.dataVenda),
      valor: c.valor,
      formaPagamento: c.formaPagamento,
      parcelas: c.parcelas,
      valorEntrada: c.valorEntrada,
      acessorioDescricao: c.acessorioDescricao,
      valorAcessorio: c.valorAcessorio,
      foto_scooter: c.foto_scooter || c.fotoBase64,
      contrato_assinado: c.contrato_assinado,
      observacoes: c.observacoes
    }];
    const { modelo, cor, dataVenda, garantiaAte, valor, formaPagamento, valorEntrada, acessorioDescricao, valorAcessorio, foto_scooter, fotoBase64, contrato_assinado, ...rest } = c;
    return { ...rest, scooters };
  },

  /** Agrupa scooters por data de venda (mesmo dia = mesma venda). Retorna [{ dataVenda, dataVendaLabel, scooters }] ordenado por data. */
  groupScootersByDataVenda(scooters) {
    if (!Array.isArray(scooters) || !scooters.length) return [];
    const byDate = {};
    scooters.forEach(s => {
      const key = (s.dataVenda || '').split('T')[0] || 'sem-data';
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(s);
    });
    return Object.keys(byDate)
      .sort()
      .map(key => ({
        dataVenda: key,
        dataVendaLabel: key === 'sem-data' ? 'Data não informada' : formatarData(key),
        scooters: byDate[key]
      }));
  },

  /** Resumo do cliente para lista: totais de garantias e quantidade de scooters. */
  getClientResumo(client) {
    const c = this.normalizeClient(client);
    const scooters = c.scooters || [];
    let ativa = 0, vencendo = 0, vencida = 0;
    const datas = [];
    scooters.forEach(s => {
      const st = this.statusGarantia(s.garantiaAte);
      if (st === 'ativa') ativa++;
      else if (st === 'vencendo') vencendo++;
      else vencida++;
      if (s.dataVenda) {
        const d = (s.dataVenda || '').split('T')[0];
        if (d && datas.indexOf(d) === -1) datas.push(d);
      }
    });
    datas.sort();
    return {
      total: scooters.length,
      ativa,
      vencendo,
      vencida,
      datasVenda: datas,
      ultimaVenda: datas.length ? datas[datas.length - 1] : null
    };
  },

  /** Lista plana: cada item é { client, scooter, clientId, scooterId } para cada scooter de cada cliente. */
  getTodosScooters() {
    const clients = (this._clientsCache || []).map(c => this.normalizeClient(c));
    const out = [];
    clients.forEach(client => {
      const scooters = Array.isArray(client.scooters) ? client.scooters : [];
      scooters.forEach(scooter => {
        out.push({
          client,
          scooter,
          clientId: client.id,
          scooterId: scooter.id
        });
      });
    });
    return out;
  },

  /** Em ambiente hospedado (http/https) sempre usa o servidor; modo local só para file:// */
  _preferServerIfOnline() {
    if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:') {
      if (this.isLocalMode()) this.setLocalMode(false);
    }
  },

  async loadClients() {
    this._preferServerIfOnline();
    let raw = [];
    if (this.isLocalMode()) {
      raw = this._getClientsFromStorage();
    } else {
      try {
        const data = await this.apiRequest('GET', 'getClients');
        raw = Array.isArray(data.clients) ? data.clients : [];
      } catch (e) {
      }
    }
    this._clientsCache = raw.map(c => this.normalizeClient(c));
    return this._clientsCache;
  },

  getClients() {
    return this._clientsCache || [];
  },

  async saveClients(clients) {
    if (this.isLocalMode()) {
      this._saveClientsToStorage(clients);
      this._clientsCache = clients;
      return;
    }
    await this.apiRequest('POST', 'saveClients', { clients: clients });
    this._clientsCache = clients;
  },

  getClientById(id) {
    const clients = this.getClients();
    const c = clients.find(x => x.id === id) || null;
    if (!c) return null;
    return this.normalizeClient(c);
  },

  async addClient(data) {
    const clients = this.getClients().slice();
    const cid = 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    let scooters;
    if (Array.isArray(data.scooters) && data.scooters.length > 0) {
      scooters = data.scooters.map((s, i) => {
        const sid = cid + '_s' + (i + 1);
        const garantiaAte = s.garantiaAte || calcularGarantia(s.dataVenda);
        return {
          id: sid,
          modelo: s.modelo,
          cor: s.cor,
          dataVenda: s.dataVenda,
          garantiaAte,
          valor: s.valor,
          formaPagamento: s.formaPagamento,
          parcelas: s.parcelas,
          valorEntrada: s.valorEntrada,
          acessorioDescricao: s.acessorioDescricao,
          valorAcessorio: s.valorAcessorio,
          foto_scooter: s.foto_scooter,
          contrato_assinado: s.contrato_assinado,
          observacoes: s.observacoes
        };
      });
    } else {
      const garantiaAte = data.garantiaAte || calcularGarantia(data.dataVenda);
      scooters = [{
        id: cid + '_s1',
        modelo: data.modelo,
        cor: data.cor,
        dataVenda: data.dataVenda,
        garantiaAte,
        valor: data.valor,
        formaPagamento: data.formaPagamento,
        parcelas: data.parcelas,
        valorEntrada: data.valorEntrada,
        acessorioDescricao: data.acessorioDescricao,
        valorAcessorio: data.valorAcessorio,
        foto_scooter: data.foto_scooter,
        contrato_assinado: data.contrato_assinado,
        observacoes: data.observacoes
      }];
    }
    const client = {
      id: cid,
      nome: data.nome,
      cpf: data.cpf,
      rg: data.rg,
      telefone: data.telefone,
      endereco: data.endereco,
      cidade: data.cidade,
      scooters,
      createdAt: new Date().toISOString()
    };
    clients.push(client);
    await this.saveClients(clients);
    return this.normalizeClient(client);
  },

  async updateClient(id, data) {
    const clients = this.getClients().slice();
    const i = clients.findIndex(c => c.id === id);
    if (i === -1) return null;
    const current = this.normalizeClient(clients[i]);
    if (Array.isArray(data.scooters)) {
      clients[i] = { ...current, ...data };
    } else {
      const first = current.scooters[0] || {};
      const garantiaAte = data.garantiaAte || (data.dataVenda ? calcularGarantia(data.dataVenda) : first.garantiaAte);
      const updatedScooter = {
        ...first,
        modelo: data.modelo !== undefined ? data.modelo : first.modelo,
        cor: data.cor !== undefined ? data.cor : first.cor,
        dataVenda: data.dataVenda !== undefined ? data.dataVenda : first.dataVenda,
        garantiaAte,
        valor: data.valor !== undefined ? data.valor : first.valor,
        formaPagamento: data.formaPagamento !== undefined ? data.formaPagamento : first.formaPagamento,
        parcelas: data.parcelas !== undefined ? data.parcelas : first.parcelas,
        valorEntrada: data.valorEntrada !== undefined ? data.valorEntrada : first.valorEntrada,
        acessorioDescricao: data.acessorioDescricao !== undefined ? data.acessorioDescricao : first.acessorioDescricao,
        valorAcessorio: data.valorAcessorio !== undefined ? data.valorAcessorio : first.valorAcessorio,
        foto_scooter: data.foto_scooter !== undefined ? data.foto_scooter : first.foto_scooter,
        contrato_assinado: data.contrato_assinado !== undefined ? data.contrato_assinado : first.contrato_assinado,
        observacoes: data.observacoes !== undefined ? data.observacoes : first.observacoes
      };
      clients[i] = {
        ...current,
        nome: data.nome !== undefined ? data.nome : current.nome,
        cpf: data.cpf !== undefined ? data.cpf : current.cpf,
        rg: data.rg !== undefined ? data.rg : current.rg,
        telefone: data.telefone !== undefined ? data.telefone : current.telefone,
        endereco: data.endereco !== undefined ? data.endereco : current.endereco,
        cidade: data.cidade !== undefined ? data.cidade : current.cidade,
        scooters: [updatedScooter].concat((current.scooters || []).slice(1))
      };
    }
    await this.saveClients(clients);
    return this.normalizeClient(clients[i]);
  },

  async addScooterToClient(clientId, data) {
    const clients = this.getClients().slice();
    const i = clients.findIndex(c => c.id === clientId);
    if (i === -1) return null;
    const current = this.normalizeClient(clients[i]);
    const sid = clientId + '_s' + (current.scooters.length + 1);
    const garantiaAte = data.garantiaAte || calcularGarantia(data.dataVenda);
    const scooter = {
      id: sid,
      modelo: data.modelo,
      cor: data.cor,
      dataVenda: data.dataVenda,
      garantiaAte,
      valor: data.valor,
      formaPagamento: data.formaPagamento,
      parcelas: data.parcelas,
      valorEntrada: data.valorEntrada,
      acessorioDescricao: data.acessorioDescricao,
      valorAcessorio: data.valorAcessorio,
      foto_scooter: data.foto_scooter,
      contrato_assinado: data.contrato_assinado,
      observacoes: data.observacoes
    };
    current.scooters = (current.scooters || []).concat(scooter);
    clients[i] = current;
    await this.saveClients(clients);
    return this.normalizeClient(clients[i]);
  },

  async removeScooterFromClient(clientId, scooterId) {
    const clients = this.getClients().slice();
    const i = clients.findIndex(c => c.id === clientId);
    if (i === -1) return null;
    const current = this.normalizeClient(clients[i]);
    const scooters = (current.scooters || []).filter(s => s.id !== scooterId);
    if (scooters.length === 0) return null;
    clients[i] = { ...current, scooters };
    await this.saveClients(clients);
    return this.normalizeClient(clients[i]);
  },

  async deleteClient(id) {
    const clients = this.getClients().filter(c => c.id !== id);
    await this.saveClients(clients);
    return true;
  },

  async loadConfig() {
    if (this.isLocalMode()) {
      const msg = localStorage.getItem(this.WHATSAPP_MSG_KEY);
      const dv = localStorage.getItem('sys_scooter_dias_vencendo');
      const n = dv !== null && dv !== '' ? parseInt(dv, 10) : 15;
      this._configCache = {
        whatsappMsg: msg !== null && msg !== '' ? msg : '',
        diasVencendo: (!isNaN(n) && n >= 0) ? n : 15
      };
      return this._configCache;
    }
    try {
      const data = await this.apiRequest('GET', 'getConfig');
      this._configCache = data.config && typeof data.config === 'object' ? data.config : {};
      return this._configCache;
    } catch (e) {
    }
    this._configCache = {};
    return this._configCache;
  },

  getWhatsappMsg() {
    if (this._configCache && this._configCache.whatsappMsg !== undefined) {
      return this._configCache.whatsappMsg;
    }
    return '';
  },

  async setWhatsappMsg(msg) {
    if (this.isLocalMode()) {
      localStorage.setItem(this.WHATSAPP_MSG_KEY, msg);
      this._configCache = this._configCache || {};
      this._configCache.whatsappMsg = msg;
      return;
    }
    await this.apiRequest('POST', 'saveConfig', { whatsappMsg: msg });
    this._configCache = this._configCache || {};
    this._configCache.whatsappMsg = msg;
  },

  async setDiasVencendo(dias) {
    const n = Math.max(0, Math.min(365, parseInt(dias, 10) || 15));
    if (this.isLocalMode()) {
      this._configCache = this._configCache || {};
      this._configCache.diasVencendo = n;
      try { localStorage.setItem('sys_scooter_dias_vencendo', String(n)); } catch (e) {}
      return;
    }
    await this.apiRequest('POST', 'saveConfig', { diasVencendo: n });
    this._configCache = this._configCache || {};
    this._configCache.diasVencendo = n;
  },

  /** Número de dias para considerar garantia "vencendo" (vem da config ou 15). */
  getDiasVencendo() {
    if (this._configCache && typeof this._configCache.diasVencendo === 'number' && this._configCache.diasVencendo >= 0)
      return this._configCache.diasVencendo;
    if (this.isLocalMode()) {
      const v = localStorage.getItem('sys_scooter_dias_vencendo');
      if (v !== null && v !== '') { const n = parseInt(v, 10); if (!isNaN(n) && n >= 0) return n; }
    }
    return 15;
  },

  statusGarantia(garantiaAte) {
    if (!garantiaAte) return 'vencida';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fim = new Date(garantiaAte);
    fim.setHours(0, 0, 0, 0);
    const diff = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'vencida';
    const diasVencendo = this.getDiasVencendo();
    if (diff <= diasVencendo) return 'vencendo';
    return 'ativa';
  },

  /** Retorna dias até o vencimento (positivo) ou dias desde o vencimento (negativo). */
  diasGarantia(garantiaAte) {
    if (!garantiaAte) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fim = new Date(garantiaAte);
    fim.setHours(0, 0, 0, 0);
    return Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
  },

  getFotoScooter(client, scooter) {
    if (!client) return null;
    if (scooter) return scooter.foto_scooter || scooter.fotoBase64 || client.foto_scooter || client.fotoBase64 || null;
    if (client.scooters && client.scooters[0]) return client.scooters[0].foto_scooter || client.scooters[0].fotoBase64 || client.foto_scooter || client.fotoBase64 || null;
    return client.foto_scooter || client.fotoBase64 || null;
  },

  exportData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      clients: this.getClients(),
      whatsappMsg: this.getWhatsappMsg()
    };
  },

  async importData(data) {
    if (!data) return false;
    if (data.clients && Array.isArray(data.clients)) {
      await this.saveClients(data.clients);
    }
    if (data.whatsappMsg !== undefined && data.whatsappMsg !== null) {
      await this.setWhatsappMsg(data.whatsappMsg);
    }
    return true;
  }
};

function calcularGarantia(dataVenda) {
  if (!dataVenda) return '';
  const d = new Date(dataVenda);
  d.setDate(d.getDate() + APP.GARANTIA_DIAS);
  return d.toISOString().split('T')[0];
}

function formatarData(str) {
  if (!str) return '-';
  const d = new Date(str);
  return d.toLocaleDateString('pt-BR');
}

function formatarMoeda(val) {
  if (val == null || val === '') return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
}

/** Labels das formas de pagamento (à vista: pix, débito, crédito; parcelado: cartão, boleto; com entrada). */
function labelFormaPagamento(v) {
  var map = {
    pix: 'PIX', debito: 'Cartão de débito', credito: 'Cartão de crédito à vista',
    parcelado_cartao: 'Parcelado no cartão', parcelado_boleto: 'Parcelado no boleto',
    entrada_pix: 'Entrada + PIX', entrada_debito: 'Entrada + Débito', entrada_credito: 'Entrada + Crédito',
    entrada_parcelado_cartao: 'Entrada + Parcelado no cartão', entrada_parcelado_boleto: 'Entrada + Parcelado no boleto',
    cartao_credito: 'Cartão de crédito', cartao_debito: 'Cartão de débito', parcelado: 'Parcelado',
    entrada_cartao_credito: 'Entrada + Cartão de crédito', entrada_cartao_debito: 'Entrada + Cartão de débito', entrada_parcelado: 'Entrada + Parcelado'
  };
  return map[v] || v || '-';
}

/** Texto detalhado para contrato/recibo (inclui parcelas quando aplicável). */
function formaPagamentoDetalhada(c) {
  var forma = labelFormaPagamento(c.formaPagamento);
  var parcelas = c.parcelas != null && c.parcelas > 0 ? c.parcelas : null;
  var ehParcelado = /parcelado/.test(c.formaPagamento || '');
  var sufixoParcelas = (ehParcelado && parcelas) ? ' em ' + parcelas + ' vez(es)' : '';
  if (c.valorEntrada != null && c.valorEntrada > 0 && c.valor != null) {
    var restante = c.valor - c.valorEntrada;
    var via = forma.replace(/^Entrada \+ /, '');
    return 'Entrada de R$ ' + Number(c.valorEntrada).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' e restante de R$ ' + Number(restante).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' via ' + via + sufixoParcelas;
  }
  return forma + sufixoParcelas;
}

/** Alias global para APP.escapeHtml. */
function escapeHtml(s) {
  return APP.escapeHtml(s);
}

function setActiveNav(path) {
  const links = document.querySelectorAll('.sidebar-nav a[data-page]');
  links.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path || a.getAttribute('data-page') === path);
  });
}

function toast(message, durationMs) {
  durationMs = durationMs || 2500;
  var el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = message;
  document.body.appendChild(el);
  el.offsetHeight;
  el.classList.add('toast-show');
  setTimeout(function() {
    el.classList.remove('toast-show');
    setTimeout(function() { el.remove(); }, 300);
  }, durationMs);
}
