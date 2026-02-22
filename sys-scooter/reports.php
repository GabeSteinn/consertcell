<?php
$pageTitle = 'Relatórios - Cert Mobility';
$currentPage = 'reports';
include 'includes/head.php';
?>
  <div class="admin-layout">
<?php include 'includes/sidebar.php'; ?>
    <div class="main-wrap">
      <header class="header">
        <h2 class="text-lg font-semibold text-gray-800">Relatórios</h2>
        <div class="header-actions">
          <div class="header-search-wrap">
            <input type="text" id="buscaGlobal" class="form-control form-control-sm header-search" placeholder="Buscar..." autocomplete="off">
            <div id="buscaGlobalResultados" class="header-search-resultados hidden"></div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="APP.logout()"><i class="fas fa-sign-out-alt"></i> Sair</button>
        </div>
      </header>
      <main class="content">
        <div class="card p-6 mb-6">
          <h3 class="font-semibold text-gray-800 mb-4">Vendas por período</h3>
          <div class="flex flex-wrap gap-4 items-end mb-4">
            <div>
              <label class="block text-sm text-gray-500 mb-1">Data inicial</label>
              <input type="date" id="reportDataInicio" class="form-control w-40">
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1">Data final</label>
              <input type="date" id="reportDataFim" class="form-control w-40">
            </div>
            <button type="button" id="btnFiltrarVendas" class="btn btn-primary"><i class="fas fa-filter"></i> Filtrar</button>
          </div>
          <div id="reportVendasResumo" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div class="card card-stat p-4">
              <div class="value" id="reportQtdVendas">0</div>
              <div class="label">Vendas no período</div>
            </div>
            <div class="card card-stat p-4">
              <div class="value" id="reportValorTotal">R$ 0,00</div>
              <div class="label">Valor total</div>
            </div>
            <div class="card card-stat p-4">
              <div class="value" id="reportTicketMedio">R$ 0,00</div>
              <div class="label">Ticket médio</div>
            </div>
          </div>
          <div class="table-wrap">
            <table class="table-admin">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Modelo</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody id="reportVendasTbody">
                <tr><td colspan="4" class="text-center text-gray-500 py-4">Defina o período e clique em Filtrar.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card p-6">
          <h3 class="font-semibold text-gray-800 mb-4">Resumo de garantias</h3>
          <p class="text-sm text-gray-500 mb-4">Quantidade de garantias que vencem por mês (próximos 12 meses).</p>
          <div id="reportGarantiasResumo" class="space-y-2">
            <p class="text-gray-500">Carregando...</p>
          </div>
        </div>
      </main>
    </div>
  </div>
  <script src="js/app.js"></script>
  <script src="js/busca-global.js"></script>
  <script>
    (async function() {
      if (!APP.requireAuth()) return;
      setActiveNav('reports.php');
      await APP.loadClients();
      await APP.loadConfig();
      var items = APP.getTodosScooters && APP.getTodosScooters() || [];

      function runVendasReport() {
        var ini = document.getElementById('reportDataInicio').value;
        var fim = document.getElementById('reportDataFim').value;
        if (!ini || !fim) {
          if (typeof toast === 'function') toast('Informe data inicial e final.');
          return;
        }
        var dIni = new Date(ini);
        var dFim = new Date(fim);
        if (dFim < dIni) {
          if (typeof toast === 'function') toast('Data final deve ser após a inicial.');
          return;
        }
        var list = items.filter(function(item) {
          if (!item.scooter.dataVenda) return false;
          var d = new Date(item.scooter.dataVenda);
          return d >= dIni && d <= dFim;
        });
        var total = list.reduce(function(s, item) { return s + (Number(item.scooter.valor) || 0); }, 0);
        document.getElementById('reportQtdVendas').textContent = list.length;
        document.getElementById('reportValorTotal').textContent = formatarMoeda(total);
        document.getElementById('reportTicketMedio').textContent = list.length ? formatarMoeda(total / list.length) : formatarMoeda(0);
        var tbody = document.getElementById('reportVendasTbody');
        if (!list.length) {
          tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500 py-4">Nenhuma venda no período.</td></tr>';
          return;
        }
        list.sort(function(a, b) { return new Date(a.scooter.dataVenda) - new Date(b.scooter.dataVenda); });
        tbody.innerHTML = list.map(function(item) {
          var c = item.client;
          var s = item.scooter;
          return '<tr><td>' + formatarData(s.dataVenda) + '</td><td>' + escapeHtml(c.nome || '-') + '</td><td>' + escapeHtml(s.modelo || '-') + '</td><td>' + formatarMoeda(s.valor) + '</td></tr>';
        }).join('');
      }

      document.getElementById('btnFiltrarVendas').addEventListener('click', runVendasReport);

      var hoje = new Date();
      var mesAtual = hoje.getFullYear() * 12 + hoje.getMonth();
      var porMes = {};
      for (var m = 0; m < 12; m++) {
        var y = Math.floor((mesAtual + m) / 12);
        var mo = (mesAtual + m) % 12;
        var key = y + '-' + (mo + 1).toString().padStart(2, '0');
        porMes[key] = { label: (mo + 1).toString().padStart(2, '0') + '/' + y, count: 0 };
      }
      items.forEach(function(item) {
        var s = item.scooter;
        if (!s.garantiaAte) return;
        var d = new Date(s.garantiaAte);
        if (d < hoje) return;
        var y = d.getFullYear();
        var mo = d.getMonth() + 1;
        var key = y + '-' + (mo < 10 ? '0' : '') + mo;
        if (porMes[key]) porMes[key].count++;
      });
      var garantiasHtml = '';
      Object.keys(porMes).sort().forEach(function(k) {
        var o = porMes[k];
        if (o.count > 0) garantiasHtml += '<div class="flex justify-between py-2 border-b border-gray-100"><span>' + o.label + '</span><strong>' + o.count + ' garantia(s)</strong></div>';
      });
      document.getElementById('reportGarantiasResumo').innerHTML = garantiasHtml || '<p class="text-gray-500">Nenhuma garantia a vencer nos próximos 12 meses.</p>';
    })();
  </script>
</body>
</html>
