<?php $currentPage = isset($currentPage) ? $currentPage : ''; ?>
<aside class="sidebar" id="sidebar">
  <div class="sidebar-brand"><img src="logoscotter.png" alt="" class="sidebar-logo"> Cert Mobility</div>
  <button type="button" class="sidebar-toggle" id="sidebarToggle" aria-label="Abrir/fechar menu"><i class="fas fa-bars"></i></button>
  <nav class="sidebar-nav">
    <a href="dashboard.php" data-page="dashboard" class="<?php echo $currentPage === 'dashboard' ? 'active' : ''; ?>"><i class="fas fa-home"></i> Dashboard</a>
    <a href="clients.php" data-page="clients" class="<?php echo $currentPage === 'clients' ? 'active' : ''; ?>"><i class="fas fa-users"></i> Clientes</a>
    <a href="new-client.html" data-page="new-client" class="<?php echo $currentPage === 'new-client' ? 'active' : ''; ?>"><i class="fas fa-user-plus"></i> Novo Cliente</a>
    <a href="reports.php" data-page="reports" class="<?php echo $currentPage === 'reports' ? 'active' : ''; ?>"><i class="fas fa-chart-bar"></i> Relatórios</a>
    <a href="config.php" data-page="config" class="<?php echo $currentPage === 'config' ? 'active' : ''; ?>"><i class="fas fa-cog"></i> Configuração</a>
  </nav>
</aside>
<div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>
<script>
(function(){
  var sb = document.getElementById('sidebar');
  var ov = document.getElementById('sidebarOverlay');
  var btn = document.getElementById('sidebarToggle');
  if (!sb || !ov) return;
  function close() { sb.classList.remove('open'); ov.classList.remove('show'); }
  function open() { sb.classList.add('open'); ov.classList.add('show'); }
  function toggle() { sb.classList.toggle('open'); ov.classList.toggle('show'); }
  if (btn) btn.addEventListener('click', toggle);
  ov.addEventListener('click', close);
  sb.querySelectorAll('.sidebar-nav a').forEach(function(a){ a.addEventListener('click', close); });
})();
</script>
