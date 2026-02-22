<?php
$pageTitle = 'Dashboard - Cert Mobility';
$currentPage = 'dashboard';
include 'includes/head.php';
?>
  <div class="admin-layout">
<?php include 'includes/sidebar.php'; ?>
    <div class="main-wrap">
      <header class="header">
        <h2 class="text-lg font-semibold text-gray-800">Dashboard</h2>
        <div class="header-actions">
          <div class="header-search-wrap">
            <input type="text" id="buscaGlobal" class="form-control form-control-sm header-search" placeholder="Buscar cliente, CPF ou modelo..." autocomplete="off">
            <div id="buscaGlobalResultados" class="header-search-resultados hidden"></div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="APP.logout()"><i class="fas fa-sign-out-alt"></i> Sair</button>
        </div>
      </header>
      <main class="content">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="card card-stat">
            <div>
              <div class="value" id="totalClientes">0</div>
              <div class="label">Total de clientes</div>
            </div>
            <div class="icon bg-brand"><i class="fas fa-users"></i></div>
          </div>
          <div class="card card-stat">
            <div>
              <div class="value" id="garantiasAtivas">0</div>
              <div class="label">Garantias ativas</div>
            </div>
            <div class="icon bg-green-500"><i class="fas fa-shield-alt"></i></div>
          </div>
          <div class="card card-stat">
            <div>
              <div class="value" id="garantiasVencendo">0</div>
              <div class="label">Garantias vencendo</div>
            </div>
            <div class="icon bg-amber-500"><i class="fas fa-exclamation-triangle"></i></div>
          </div>
          <div class="card card-stat">
            <div>
              <div class="value" id="garantiasVencidas">0</div>
              <div class="label">Garantias vencidas</div>
            </div>
            <div class="icon bg-red-500"><i class="fas fa-times-circle"></i></div>
          </div>
        </div>
        <div class="card card-alertas">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 class="text-lg font-semibold text-gray-800 m-0">Alertas de garantia</h3>
            <div class="alerta-filtros flex gap-2 flex-wrap">
              <button type="button" class="alerta-filtro active" data-filtro="todos">Todos</button>
              <button type="button" class="alerta-filtro" data-filtro="vencendo">Vencendo</button>
              <button type="button" class="alerta-filtro" data-filtro="vencida">Vencidas</button>
            </div>
          </div>
          <div id="listaAlertas" class="alertas-grid">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
          <p id="alertaVazio" class="text-gray-500 py-6 text-center hidden">Nenhum alerta de garantia no momento.</p>
        </div>
      </main>
    </div>
  </div>
  <script src="js/app.js"></script>
  <script src="js/clients.js"></script>
  <script src="js/busca-global.js"></script>
  <script>
    (async function() {
      if (!APP.requireAuth()) return;
      setActiveNav('dashboard.php');
      await APP.loadClients();
      await APP.loadConfig();
      const clients = APP.getClients();
      const todos = APP.getTodosScooters();
      const ativa = todos.filter(function(x) { return APP.statusGarantia(x.scooter.garantiaAte) === 'ativa'; }).length;
      const vencendo = todos.filter(function(x) { return APP.statusGarantia(x.scooter.garantiaAte) === 'vencendo'; }).length;
      const vencida = todos.filter(function(x) { return APP.statusGarantia(x.scooter.garantiaAte) === 'vencida'; }).length;
      document.getElementById('totalClientes').textContent = clients.length;
      document.getElementById('garantiasAtivas').textContent = ativa;
      document.getElementById('garantiasVencendo').textContent = vencendo;
      document.getElementById('garantiasVencidas').textContent = vencida;
      const alertas = todos
        .filter(function(x) { return ['vencendo', 'vencida'].includes(APP.statusGarantia(x.scooter.garantiaAte)); })
        .sort(function(a, b) { return new Date(a.scooter.garantiaAte) - new Date(b.scooter.garantiaAte); });

      function diasTexto(scooter) {
        var dias = APP.diasGarantia(scooter.garantiaAte);
        if (dias == null) return '';
        var status = APP.statusGarantia(scooter.garantiaAte);
        if (status === 'vencida') return 'Vencida há ' + Math.abs(dias) + ' dia' + (Math.abs(dias) !== 1 ? 's' : '');
        return 'Faltam ' + dias + ' dia' + (dias !== 1 ? 's' : '') + ' para vencer';
      }

      function renderAlertaCard(item) {
        var c = item.client;
        var s = item.scooter;
        var status = APP.statusGarantia(s.garantiaAte);
        var waClient = { nome: c.nome, telefone: c.telefone, modelo: s.modelo };
        var waUrl = ClientsUtil.generateWhatsAppLink(waClient);
        var statusClass = status === 'vencendo' ? 'alerta-vencendo' : 'alerta-vencida';
        var statusIcon = status === 'vencendo' ? 'fa-exclamation-triangle' : 'fa-times-circle';
        return '<article class="alerta-card ' + statusClass + '" data-status="' + status + '">' +
          '<div class="alerta-card-header">' +
          '<span class="alerta-card-icon"><i class="fas ' + statusIcon + '"></i></span>' +
          '<div class="alerta-card-titulo"><strong>' + escapeHtml(c.nome || '-') + '</strong>' +
          '<span class="alerta-card-modelo">' + escapeHtml(s.modelo || '-') + '</span></div></div>' +
          '<div class="alerta-card-info">' +
          '<span class="alerta-card-data">Vencimento: ' + formatarData(s.garantiaAte) + '</span>' +
          '<span class="alerta-card-dias">' + diasTexto(s) + '</span></div>' +
          '<div class="alerta-card-acoes">' +
          '<a href="client-details.html?id=' + encodeURIComponent(item.clientId) + '" class="btn btn-primary btn-sm"><i class="fas fa-eye"></i> Ver</a>' +
          (waUrl ? '<a href="' + waUrl.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm"><i class="fab fa-whatsapp"></i> Contato</a>' : '') +
          '</div></article>';
      }

      const lista = document.getElementById('listaAlertas');
      const alertaVazio = document.getElementById('alertaVazio');
      let filtroAtual = 'todos';

      function filtrarAlertas() {
        const filtrados = filtroAtual === 'todos' ? alertas : alertas.filter(function(x) { return APP.statusGarantia(x.scooter.garantiaAte) === filtroAtual; });
        const cards = document.querySelectorAll('.alerta-card');
        cards.forEach(function(card) {
          const status = card.getAttribute('data-status');
          const mostrar = filtroAtual === 'todos' || status === filtroAtual;
          card.classList.toggle('alerta-card-hidden', !mostrar);
        });
        alertaVazio.textContent = filtroAtual !== 'todos' && alertas.length > 0 && filtrados.length === 0
          ? 'Nenhum alerta nesta categoria.'
          : 'Nenhum alerta de garantia no momento.';
        alertaVazio.classList.toggle('hidden', filtrados.length > 0);
      }

      if (alertas.length === 0) {
        lista.innerHTML = '';
        lista.classList.remove('alertas-grid');
        alertaVazio.classList.remove('hidden');
      } else {
        lista.classList.add('alertas-grid');
        lista.innerHTML = alertas.map(renderAlertaCard).join('');
        document.querySelectorAll('.alerta-filtro').forEach(function(btn) {
          btn.addEventListener('click', function() {
            document.querySelectorAll('.alerta-filtro').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            filtroAtual = this.getAttribute('data-filtro');
            filtrarAlertas();
          });
        });
        filtrarAlertas();
      }
    })();
  </script>
</body>
</html>
