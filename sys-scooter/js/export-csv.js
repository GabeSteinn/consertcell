/**
 * Exporta lista de clientes para CSV (abre em Excel/LibreOffice).
 */
function exportClientsCsv() {
  var items = APP.getTodosScooters && APP.getTodosScooters() || [];
  var headers = ['Nome', 'CPF', 'RG', 'Telefone', 'Endereço', 'Cidade', 'Modelo', 'Cor', 'Data venda', 'Garantia até', 'Status', 'Valor', 'Forma pagamento'];
  var rows = [headers.map(function(h) { return '"' + String(h).replace(/"/g, '""') + '"'; }).join(';')];
  items.forEach(function(item) {
    var c = item.client;
    var s = item.scooter;
    var status = APP.statusGarantia(s.garantiaAte);
    var dataVenda = s.dataVenda ? formatarData(s.dataVenda) : '';
    var garantiaAte = s.garantiaAte ? formatarData(s.garantiaAte) : '';
    var valor = s.valor != null ? String(s.valor).replace('.', ',') : '';
    var formaTexto = (typeof formaPagamentoDetalhada === 'function' ? formaPagamentoDetalhada({ ...c, ...s }) : (typeof labelFormaPagamento === 'function' ? labelFormaPagamento(s.formaPagamento) : s.formaPagamento)) || '';
    var row = [
      c.nome || '',
      c.cpf || '',
      c.rg || '',
      c.telefone || '',
      c.endereco || '',
      c.cidade || '',
      s.modelo || '',
      s.cor || '',
      dataVenda,
      garantiaAte,
      status,
      valor,
      formaTexto
    ];
    rows.push(row.map(function(cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(';'));
  });
  var csv = '\uFEFF' + rows.join('\r\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cert-mobility-clientes-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  if (typeof toast === 'function') toast('Planilha exportada.');
}
