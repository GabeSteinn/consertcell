<?php
$pageTitle = 'Clientes - Cert Mobility';
$currentPage = 'clients';
include 'includes/head.php';
?>
  <div class="admin-layout">
<?php include 'includes/sidebar.php'; ?>
    <div class="main-wrap">
      <header class="header">
        <h2 class="text-lg font-semibold text-gray-800">Clientes</h2>
        <div class="header-actions">
          <div class="header-search-wrap">
            <input type="text" id="buscaGlobal" class="form-control form-control-sm header-search" placeholder="Buscar cliente, CPF ou modelo..." autocomplete="off">
            <div id="buscaGlobalResultados" class="header-search-resultados hidden"></div>
          </div>
          <a href="new-client.html" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Novo Cliente</a>
          <button type="button" class="btn btn-secondary btn-sm" onclick="APP.logout()"><i class="fas fa-sign-out-alt"></i> Sair</button>
        </div>
      </header>
      <main class="content">
        <div class="flex flex-col sm:flex-row gap-4 mb-4">
          <div class="flex-1 relative">
            <input type="text" id="busca" class="form-control pl-10" placeholder="Buscar por nome, CPF ou modelo">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
          <select id="filtroStatus" class="form-control w-full sm:w-48">
            <option value="">Todos os status</option>
            <option value="ativa">Ativa</option>
            <option value="vencendo">Vencendo</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>
        <div class="table-wrap">
          <table class="table-admin">
            <thead>
              <tr>
                <th class="w-10"></th>
                <th>Nome</th>
                <th>Scooters</th>
                <th>Venda(s)</th>
                <th>Garantias</th>
                <th class="w-40">Ações</th>
              </tr>
            </thead>
            <tbody id="tbody">
              <tr><td colspan="6" class="text-center text-gray-500 py-8">Carregando...</td></tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
  <script src="js/app.js"></script>
  <script src="js/busca-global.js"></script>
  <script>
    (async function() {
      if (!APP.requireAuth()) return;
      setActiveNav('clients.php');
      await APP.loadClients();
      function statusClass(s) {
        return s === 'ativa' ? 'badge-ativa' : s === 'vencendo' ? 'badge-vencendo' : 'badge-vencida';
      }
      function statusLabel(s) {
        return s === 'ativa' ? 'Ativa' : s === 'vencendo' ? 'Vencendo' : 'Vencida';
      }
      function resumoGarantiasText(r) {
        var p = [];
        if (r.ativa > 0) p.push(r.ativa + ' ativa' + (r.ativa > 1 ? 's' : ''));
        if (r.vencendo > 0) p.push(r.vencendo + ' vencendo');
        if (r.vencida > 0) p.push(r.vencida + ' vencida' + (r.vencida > 1 ? 's' : ''));
        return p.length ? p.join(', ') : '-';
      }
      function render(clients) {
        const tbody = document.getElementById('tbody');
        if (!clients.length) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 py-8">Nenhum cliente encontrado.</td></tr>';
          return;
        }
        var html = '';
        clients.forEach(function(client) {
          var norm = APP.normalizeClient(client);
          var scooters = norm.scooters || [];
          var r = APP.getClientResumo(client);
          var ultimaVenda = r.ultimaVenda ? formatarData(r.ultimaVenda) : '-';
          var vendasText = r.datasVenda.length > 1 ? r.datasVenda.length + ' vendas' : ultimaVenda;
          var rowId = 'row-' + (client.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
          var expandId = 'expand-' + rowId;
          html += '<tr class="client-row cursor-pointer hover:bg-gray-50" data-client-id="' + escapeHtml(client.id) + '" data-expand-id="' + expandId + '" role="button" tabindex="0" aria-expanded="false" aria-controls="' + expandId + '" title="Clique para expandir ou recolher">';
          html += '<td class="expand-cell w-10 py-3"><i class="fas fa-chevron-right expand-icon text-gray-400 transition-transform" style="font-size:.7rem" aria-hidden="true"></i></td>';
          html += '<td class="font-medium">' + escapeHtml(client.nome || '-') + '</td>';
          html += '<td>' + r.total + ' scooter' + (r.total !== 1 ? 's' : '') + '</td>';
          html += '<td>' + vendasText + '</td>';
          html += '<td>' + resumoGarantiasText(r) + '</td>';
          html += '<td onclick="event.stopPropagation()"><div class="actions">' +
            '<a href="client-details.html?id=' + encodeURIComponent(client.id) + '" class="btn btn-primary btn-sm">Ver</a> ' +
            '<a href="new-client.html?id=' + encodeURIComponent(client.id) + '" class="btn btn-secondary btn-sm">Editar</a> ' +
            '<button type="button" class="btn btn-danger btn-sm btn-delete-client" data-id="' + escapeHtml(client.id) + '" data-nome="' + escapeHtml(client.nome || '') + '">Excluir</button>' +
            '</div></td></tr>';
          html += '<tr class="expand-row bg-gray-50/70 border-b border-gray-200" id="' + expandId + '" role="region" aria-label="Detalhes do cliente"><td colspan="6" class="p-0"><div class="expand-inner"><div class="expand-content px-6 py-4">';
          if (scooters.length) {
            html += '<div class="text-sm font-medium text-gray-600 mb-3">Scooters deste cliente (' + scooters.length + ')</div>';
            html += '<div class="space-y-2 mb-4">';
            scooters.forEach(function(s) {
              var sc = s.scooter || s;
              var status = APP.statusGarantia(s.garantiaAte);
              var badgeClass = status === 'ativa' ? 'badge-ativa' : status === 'vencendo' ? 'badge-vencendo' : 'badge-vencida';
              var badgeText = status === 'ativa' ? 'Ativa' : status === 'vencendo' ? 'Vencendo' : 'Vencida';
              var scooterAnchor = 'scooter-' + String(s.id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
              html += '<div class="scooter-line-item flex flex-wrap items-center gap-x-4 gap-y-1 py-2 border-b border-gray-100 last:border-0">';
              html += '<span class="font-medium">' + escapeHtml(sc.modelo || s.modelo || '-') + '</span>';
              html += '<span class="text-gray-500">' + escapeHtml(sc.cor || s.cor || '') + '</span>';
              html += '<span class="text-gray-500">Venda: ' + formatarData(s.dataVenda) + '</span>';
              html += '<span class="text-gray-500">Garantia: ' + formatarData(s.garantiaAte) + ' <span class="badge ' + badgeClass + '">' + badgeText + '</span></span>';
              html += '<span class="text-gray-600">' + formatarMoeda(s.valor) + '</span>';
              html += '<a href="client-details.html?id=' + encodeURIComponent(client.id) + '#' + escapeHtml(scooterAnchor) + '" class="btn btn-primary btn-sm ml-auto"><i class="fas fa-eye"></i> Ver</a>';
              html += '</div>';
            });
            html += '</div>';
          } else {
            html += '<div class="text-sm text-gray-500 mb-4">Nenhuma scooter cadastrada.</div>';
          }
          html += '<div class="flex flex-wrap gap-2"><a href="client-details.html?id=' + encodeURIComponent(client.id) + '" class="btn btn-primary btn-sm"><i class="fas fa-eye"></i> Ver detalhes</a>';
          html += '<a href="new-client.html?id=' + encodeURIComponent(client.id) + '" class="btn btn-secondary btn-sm"><i class="fas fa-edit"></i> Editar</a>';
          html += '<a href="new-client.html?clientId=' + encodeURIComponent(client.id) + '" class="btn btn-secondary btn-sm"><i class="fas fa-plus"></i> Adicionar scooter</a>';
          html += '<button type="button" class="btn btn-danger btn-sm btn-delete-client" data-id="' + escapeHtml(client.id) + '" data-nome="' + escapeHtml(client.nome || '') + '"><i class="fas fa-trash"></i> Excluir cliente</button></div>';
          html += '</div></div></td></tr>';
        });
        var expandedIds = new Set();
        tbody.querySelectorAll('.client-row').forEach(function(tr) {
          var exp = document.getElementById(tr.getAttribute('data-expand-id'));
          if (exp && exp.classList.contains('expand-row--open')) {
            var cid = tr.getAttribute('data-client-id');
            if (cid) expandedIds.add(cid);
          }
        });
        tbody.innerHTML = html;
        tbody.querySelectorAll('.client-row').forEach(function(tr) {
          function toggleExpand() {
            var expandId = tr.getAttribute('data-expand-id');
            var expandTr = document.getElementById(expandId);
            var icon = tr.querySelector('.expand-icon');
            if (!expandTr) return;
            var isOpen = expandTr.classList.contains('expand-row--open');
            expandTr.classList.toggle('expand-row--open', !isOpen);
            tr.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
            if (icon) icon.style.transform = !isOpen ? 'rotate(90deg)' : '';
          }
          tr.addEventListener('click', function(e) {
            if (e.target.closest('.actions') || e.target.closest('a') || e.target.closest('button')) return;
            toggleExpand();
          });
          tr.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              if (tr.getAttribute('aria-expanded') === 'true') toggleExpand();
              e.stopPropagation();
              return;
            }
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (e.target.closest('.actions') || e.target.closest('a') || e.target.closest('button')) return;
              toggleExpand();
            }
          });
        });
        expandedIds.forEach(function(id) {
          tbody.querySelectorAll('.client-row').forEach(function(tr) {
            if (tr.getAttribute('data-client-id') === id) {
              var expandId = tr.getAttribute('data-expand-id');
              var expandTr = document.getElementById(expandId);
              var icon = tr.querySelector('.expand-icon');
              if (expandTr) {
                expandTr.classList.add('expand-row--open');
                tr.setAttribute('aria-expanded', 'true');
                if (icon) icon.style.transform = 'rotate(90deg)';
              }
            }
          });
        });
        tbody.querySelectorAll('.btn-delete-client').forEach(function(btn) {
          btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            var id = this.getAttribute('data-id');
            if (confirm('Excluir este cliente e todas as scooters? Esta ação não pode ser desfeita.')) {
              await APP.deleteClient(id);
              filtrar();
              toast('Cliente excluído.');
            }
          });
        });
      }
      function filtrar() {
        const urlQ = new URLSearchParams(window.location.search).get('q');
        if (urlQ) document.getElementById('busca').value = urlQ;
        const buscaVal = (document.getElementById('busca').value || '').toLowerCase().trim();
        const statusFiltro = (document.getElementById('filtroStatus').value || '').trim();
        let list = APP.getClients();
        if (buscaVal) {
          list = list.filter(c => {
            var r = APP.getClientResumo(c);
            var nomes = (c.nome || '').toLowerCase();
            var cpf = (c.cpf || '').replace(/\D/g, '');
            var todos = APP.getTodosScooters();
            var items = todos.filter(x => x.clientId === c.id);
            var algumModelo = items.some(x => (x.scooter.modelo || '').toLowerCase().includes(buscaVal));
            return nomes.includes(buscaVal) || (buscaVal.replace(/\D/g, '').length >= 3 && cpf.includes(buscaVal.replace(/\D/g, ''))) || algumModelo;
          });
        }
        if (statusFiltro) {
          list = list.filter(c => {
            var r = APP.getClientResumo(c);
            if (statusFiltro === 'ativa') return r.ativa > 0;
            if (statusFiltro === 'vencendo') return r.vencendo > 0;
            if (statusFiltro === 'vencida') return r.vencida > 0;
            return true;
          });
        }
        render(list);
      }
      document.getElementById('busca').addEventListener('input', filtrar);
      document.getElementById('busca').addEventListener('keyup', function(e) { if (e.key === 'Enter') filtrar(); });
      document.getElementById('filtroStatus').addEventListener('change', filtrar);
      filtrar();
    })();
  </script>
</body>
</html>
