/**
 * Busca global no header: filtra clientes por nome, CPF ou modelo e exibe resultados.
 */
(function() {
  var input = document.getElementById('buscaGlobal');
  var resultadosEl = document.getElementById('buscaGlobalResultados');
  if (!input || !resultadosEl) return;

  function showResultados(items) {
    resultadosEl.innerHTML = '';
    resultadosEl.classList.remove('hidden');
    if (items.length === 0) {
      resultadosEl.innerHTML = '<div class="header-search-item header-search-item--empty">Nenhum resultado</div>';
      return;
    }
    items.slice(0, 8).forEach(function(item) {
      var a = document.createElement('a');
      a.href = 'client-details.html?id=' + encodeURIComponent(item.clientId);
      a.className = 'header-search-item';
      a.textContent = (item.client.nome || '-') + ' · ' + (item.scooter.modelo || '-');
      a.addEventListener('click', function() { resultadosEl.classList.add('hidden'); });
      resultadosEl.appendChild(a);
    });
    if (items.length > 8) {
      var verTodos = document.createElement('a');
      verTodos.href = 'clients.php?q=' + encodeURIComponent(input.value.trim());
      verTodos.className = 'header-search-item header-search-item--more';
      verTodos.textContent = 'Ver todos (' + items.length + ')';
      resultadosEl.appendChild(verTodos);
    }
  }

  function hideResultados() {
    resultadosEl.classList.add('hidden');
  }

  function runBusca() {
    var q = (input.value || '').toLowerCase().trim();
    if (q.length < 2) {
      hideResultados();
      return;
    }
    var list = (APP.getTodosScooters && APP.getTodosScooters()) || [];
    var qNorm = q.replace(/\D/g, '');
    list = list.filter(function(item) {
      var nome = (item.client.nome || '').toLowerCase();
      var cpf = (item.client.cpf || '').replace(/\D/g, '');
      var modelo = (item.scooter.modelo || '').toLowerCase();
      return nome.indexOf(q) !== -1 || modelo.indexOf(q) !== -1 ||
        (qNorm.length >= 3 && cpf.indexOf(qNorm) !== -1);
    });
    showResultados(list);
  }

  input.addEventListener('input', runBusca);
  input.addEventListener('focus', function() { if (input.value.trim().length >= 2) runBusca(); });
  document.addEventListener('click', function(e) {
    if (resultadosEl && !resultadosEl.contains(e.target) && e.target !== input) hideResultados();
  });
})();
