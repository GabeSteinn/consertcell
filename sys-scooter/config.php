<?php
$pageTitle = 'Configuração - Cert Mobility';
$currentPage = 'config';
include 'includes/head.php';
?>
  <div class="admin-layout">
<?php include 'includes/sidebar.php'; ?>
    <div class="main-wrap">
      <header class="header">
        <h2 class="text-lg font-semibold text-gray-800">Configuração</h2>
        <div class="header-actions">
          <div class="header-search-wrap">
            <input type="text" id="buscaGlobal" class="form-control form-control-sm header-search" placeholder="Buscar..." autocomplete="off">
            <div id="buscaGlobalResultados" class="header-search-resultados hidden"></div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="APP.logout()"><i class="fas fa-sign-out-alt"></i> Sair</button>
        </div>
      </header>
      <main class="content">
        <div class="card p-6 max-w-2xl">
          <h3 class="font-semibold text-gray-800 mb-2">Dias para aviso "Garantia vencendo"</h3>
          <p class="text-sm text-gray-500 mb-4">Quantos dias antes do vencimento a garantia aparece como "Vencendo" nos alertas (padrão: 15).</p>
          <div class="flex items-center gap-2">
            <input type="number" id="diasVencendo" class="form-control w-24" min="0" max="365" value="15">
            <span class="text-sm text-gray-500">dias</span>
          </div>
          <button type="button" id="btnSalvarDias" class="btn btn-primary mt-2 btn-sm"><i class="fas fa-save"></i> Salvar</button>
        </div>
        <div class="card p-6 max-w-2xl mt-6">
          <h3 class="font-semibold text-gray-800 mb-2">Mensagem padrão do WhatsApp</h3>
          <p class="text-sm text-gray-500 mb-4">Use {{nome_cliente}} e {{modelo_scooter}} para personalizar.</p>
          <textarea id="whatsappMsg" class="form-control w-full" rows="5" placeholder="Olá {{nome_cliente}}, ..."></textarea>
          <div class="mt-4 flex gap-2">
            <button type="button" id="btnSalvar" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
            <button type="button" id="btnRestaurar" class="btn btn-secondary">Restaurar padrão</button>
          </div>
        </div>
        <div class="card p-6 max-w-2xl mt-6">
          <h3 class="font-semibold text-gray-800 mb-2">Backup e exportação</h3>
          <p class="text-sm text-gray-500 mb-4">Exporte dados em JSON (backup) ou em planilha CSV/Excel.</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="btnExportar" class="btn btn-primary"><i class="fas fa-download"></i> Exportar JSON</button>
            <button type="button" id="btnExportarCsv" class="btn btn-primary"><i class="fas fa-file-csv"></i> Exportar planilha (CSV)</button>
            <label class="btn btn-secondary cursor-pointer mb-0">
              <i class="fas fa-upload"></i> Importar dados
              <input type="file" id="inputImportar" accept=".json" class="hidden">
            </label>
          </div>
        </div>
      </main>
    </div>
  </div>
  <script src="js/app.js"></script>
  <script src="js/clients.js"></script>
  <script src="js/busca-global.js"></script>
  <script src="js/export-csv.js"></script>
  <script>
    (async function() {
      if (!APP.requireAuth()) return;
      setActiveNav('config.php');
      await APP.loadConfig();
      var defaultMsg = 'Olá {{nome_cliente}}, passando para lembrar que a garantia da sua scooter modelo {{modelo_scooter}} está próxima do vencimento. Qualquer dúvida estamos à disposição.';
      var ta = document.getElementById('whatsappMsg');
      ta.value = APP.getWhatsappMsg() || defaultMsg;
      var diasInput = document.getElementById('diasVencendo');
      diasInput.value = APP.getDiasVencendo();
      document.getElementById('btnSalvarDias').onclick = async function() {
        await APP.setDiasVencendo(parseInt(diasInput.value, 10) || 15);
        toast('Dias para vencendo salvos.');
      };
      document.getElementById('btnSalvar').onclick = async function() {
        var val = ta.value.trim() || defaultMsg;
        await APP.setWhatsappMsg(val);
        toast('Configuração salva.');
      };
      document.getElementById('btnRestaurar').onclick = function() {
        ta.value = defaultMsg;
      };
      document.getElementById('btnExportar').onclick = async function() {
        await APP.loadClients();
        var data = APP.exportData();
        var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'cert-mobility-backup-' + new Date().toISOString().slice(0,10) + '.json';
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Backup exportado.');
      };
      document.getElementById('btnExportarCsv').onclick = async function() {
        await APP.loadClients();
        if (typeof exportClientsCsv === 'function') exportClientsCsv();
        else toast('Erro ao exportar CSV.');
      };
      document.getElementById('inputImportar').addEventListener('change', async function() {
        var file = this.files[0];
        if (!file) return;
        var r = new FileReader();
        r.onload = async function() {
          try {
            var data = JSON.parse(r.result);
            if (await APP.importData(data)) {
              toast('Dados importados. Recarregando...');
              ta.value = APP.getWhatsappMsg() || defaultMsg;
              diasInput.value = APP.getDiasVencendo();
              setTimeout(function() { window.location.reload(); }, 1200);
            } else {
              toast('Arquivo inválido.');
            }
          } catch (e) {
            toast('Erro ao ler arquivo.');
          }
        };
        r.readAsText(file);
        this.value = '';
      });
    })();
  </script>
</body>
</html>
