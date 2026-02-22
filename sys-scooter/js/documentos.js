/**
 * Geração de documentos (contrato, recibo, termo) - HTML dinâmico, pronto para backend
 */
var Documentos = (function() {
  function escapeHtml(s) {
    if (s == null) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
  function formatarData(str) {
    if (!str) return '';
    return new Date(str).toLocaleDateString('pt-BR');
  }
  function formatarMoeda(val) {
    if (val == null || val === '') return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  }
  function labelFormaPagamentoDoc(v) {
    return (typeof labelFormaPagamento === 'function' ? labelFormaPagamento(v) : v) || '';
  }
  function formaPagamentoDetalhadaDoc(c) {
    return (typeof formaPagamentoDetalhada === 'function' ? formaPagamentoDetalhada(c) : labelFormaPagamentoDoc(c.formaPagamento));
  }
  function abrirJanela(html, titulo) {
    var w = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
    w.document.write('<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>' + escapeHtml(titulo) + '</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet"><style>body{font-family:Outfit,sans-serif;padding:2rem;max-width:700px;margin:0 auto;}</style></head><body>' + html + '</body></html>');
    w.document.close();
    return w;
  }
  function imprimirJanela(w) {
    if (w && !w.closed) w.print();
  }
  function contratoHTML(c) {
    var garantia = c.garantiaAte ? formatarData(c.garantiaAte) : '90 dias a partir da data da compra';
    return '<h1 style="text-align:center;color:#008B8B;">CONTRATO DE COMPRA E VENDA</h1>' +
      '<p style="text-align:center;color:#666;">Scooter elétrica</p>' +
      '<p>Por este instrumento particular, de um lado <strong>' + escapeHtml(c.nome || '') + '</strong>, portador do CPF ' + escapeHtml(c.cpf || '') + ', RG ' + escapeHtml(c.rg || '') + ', residente e domiciliado em ' + escapeHtml(c.endereco || '') + ', telefone ' + escapeHtml(c.telefone || '') + ', doravante denominado COMPRADOR.</p>' +
      '<p>O COMPRADOR declara ter adquirido 1 (uma) scooter elétrica, modelo <strong>' + escapeHtml(c.modelo || '') + '</strong>, cor ' + escapeHtml(c.cor || '') + ', na data de ' + formatarData(c.dataVenda) + ', pelo valor total de ' + formatarMoeda(c.valor) + (c.valorEntrada != null ? ' (entrada: ' + formatarMoeda(c.valorEntrada) + ', restante: ' + formatarMoeda(c.valor != null ? c.valor - c.valorEntrada : null) + ')' : '') + ', forma de pagamento: ' + formaPagamentoDetalhadaDoc(c) + '.</p>' +
      '<p>Fica acordado que a garantia do produto é válida até <strong>' + garantia + '</strong>, conforme condições do fabricante.</p>' +
      '<p>O comprador declara estar ciente das condições de uso e manutenção do equipamento.</p>' +
      '<p style="margin-top:2rem;">Data: ' + formatarData(new Date().toISOString()) + '.</p>' +
      '<p style="margin-top:2rem;">_________________________________<br>Assinatura do comprador</p>';
  }
  function reciboHTML(c) {
    return '<h1 style="text-align:center;color:#008B8B;">RECIBO</h1>' +
      '<p style="text-align:center;">Recebemos de <strong>' + escapeHtml(c.nome || '') + '</strong>, CPF ' + escapeHtml(c.cpf || '') + ', a quantia de <strong>' + formatarMoeda(c.valor) + '</strong> (' + (c.valor ? 'valor referente à compra de 1 scooter elétrica, modelo ' + escapeHtml(c.modelo || '') + ')' : '') + '.</p>' +
      (c.valorEntrada != null ? '<p>Valor da entrada: <strong>' + formatarMoeda(c.valorEntrada) + '</strong>. Valor restante: <strong>' + formatarMoeda(c.valor != null ? c.valor - c.valorEntrada : null) + '</strong>.</p>' : '') +
      '<p>Forma de pagamento: ' + formaPagamentoDetalhadaDoc(c) + '.</p>' +
      '<p>Data da venda: ' + formatarData(c.dataVenda) + '.</p>' +
      '<p style="margin-top:2rem;">Data do recibo: ' + formatarData(new Date().toISOString()) + '.</p>' +
      '<p style="margin-top:2rem;">_________________________________<br>Emitente</p>';
  }
  function reciboHTMLVenda(cliente, scooters) {
    if (!scooters || !scooters.length) return reciboHTML({ ...cliente, ...(cliente.scooters && cliente.scooters[0]) });
    var total = 0;
    scooters.forEach(function(s) { total += Number(s.valor) || 0; });
    var primeiro = scooters[0];
    var flat = { ...cliente, ...primeiro };
    var desc = scooters.length === 1
      ? '1 scooter elétrica, modelo ' + escapeHtml(primeiro.modelo || '')
      : 'compra de ' + scooters.length + ' scooters elétricas (data ' + formatarData(primeiro.dataVenda) + ')';
    return '<h1 style="text-align:center;color:#008B8B;">RECIBO</h1>' +
      '<p style="text-align:center;">Recebemos de <strong>' + escapeHtml(cliente.nome || '') + '</strong>, CPF ' + escapeHtml(cliente.cpf || '') + ', a quantia de <strong>' + formatarMoeda(total) + '</strong> (valor referente à ' + desc + ').</p>' +
      '<p>Forma de pagamento: ' + formaPagamentoDetalhadaDoc(flat) + '.</p>' +
      '<p>Data da venda: ' + formatarData(primeiro.dataVenda) + '.</p>' +
      '<p style="margin-top:2rem;">Data do recibo: ' + formatarData(new Date().toISOString()) + '.</p>' +
      '<p style="margin-top:2rem;">_________________________________<br>Emitente</p>';
  }
  function termoHTML(c) {
    return '<h1 style="text-align:center;color:#008B8B;">TERMO DE CUIDADOS E USO</h1>' +
      '<p style="text-align:center;">Scooter elétrica - ' + escapeHtml(c.modelo || '') + '</p>' +
      '<p>O cliente <strong>' + escapeHtml(c.nome || '') + '</strong> declara ter ciência dos seguintes cuidados recomendados para a scooter elétrica:</p>' +
      '<ul>' +
      '<li>Recarregar a bateria conforme orientação do manual;</li>' +
      '<li>Evitar exposição prolongada à chuva;</li>' +
      '<li>Manter os pneus calibrados;</li>' +
      '<li>Não sobrecarregar o veículo além da capacidade indicada;</li>' +
      '<li>Realizar revisões periódicas conforme especificação.</li>' +
      '</ul>' +
      '<p>A garantia é válida até ' + formatarData(c.garantiaAte) + ', desde que observados os cuidados de uso.</p>' +
      '<p style="margin-top:2rem;">Data: ' + formatarData(new Date().toISOString()) + '.</p>' +
      '<p>_________________________________<br>Cliente</p>';
  }
  function termoHTMLVenda(cliente, scooters) {
    if (!scooters || !scooters.length) return termoHTML({ ...cliente, ...(cliente.scooters && cliente.scooters[0]) });
    var primeiro = scooters[0];
    var flat = { ...cliente, ...primeiro };
    var titulo = scooters.length === 1 ? ('Scooter elétrica - ' + escapeHtml(primeiro.modelo || '')) : (scooters.length + ' Scooters elétricas');
    var garantiaTexto = scooters.length === 1 ? formatarData(primeiro.garantiaAte) : scooters.map(function(s) { return (s.modelo || 'Item') + ': ' + formatarData(s.garantiaAte); }).join('; ');
    return '<h1 style="text-align:center;color:#008B8B;">TERMO DE CUIDADOS E USO</h1>' +
      '<p style="text-align:center;">' + titulo + '</p>' +
      '<p>O cliente <strong>' + escapeHtml(cliente.nome || '') + '</strong> declara ter ciência dos seguintes cuidados recomendados:</p>' +
      '<ul><li>Recarregar a bateria conforme orientação do manual;</li><li>Evitar exposição prolongada à chuva;</li><li>Manter os pneus calibrados;</li><li>Não sobrecarregar o veículo além da capacidade indicada;</li><li>Realizar revisões periódicas conforme especificação.</li></ul>' +
      '<p>Garantia válida até: ' + garantiaTexto + '.</p>' +
      '<p style="margin-top:2rem;">Data: ' + formatarData(new Date().toISOString()) + '.</p>' +
      '<p>_________________________________<br>Cliente</p>';
  }
  return {
    contrato: function(c) {
      var w = abrirJanela(contratoHTML(c), 'Contrato - ' + (c.nome || 'Cliente'));
      setTimeout(function() { imprimirJanela(w); }, 300);
    },
    recibo: function(c) {
      var w = abrirJanela(reciboHTML(c), 'Recibo - ' + (c.nome || 'Cliente'));
      setTimeout(function() { imprimirJanela(w); }, 300);
    },
    reciboVenda: function(cliente, scooters) {
      var w = abrirJanela(reciboHTMLVenda(cliente, scooters), 'Recibo - ' + (cliente.nome || 'Cliente'));
      setTimeout(function() { imprimirJanela(w); }, 300);
    },
    termoCuidados: function(c) {
      var w = abrirJanela(termoHTML(c), 'Termo de Cuidados - ' + (c.nome || 'Cliente'));
      setTimeout(function() { imprimirJanela(w); }, 300);
    },
    termoCuidadosVenda: function(cliente, scooters) {
      var w = abrirJanela(termoHTMLVenda(cliente, scooters), 'Termo - ' + (cliente.nome || 'Cliente'));
      setTimeout(function() { imprimirJanela(w); }, 300);
    },
    pacoteCompleto: function(c) {
      var html = contratoHTML(c) + '<hr style="margin:2rem 0;">' + reciboHTML(c) + '<hr style="margin:2rem 0;">' + termoHTML(c);
      var w = abrirJanela(html, 'Pacote - ' + (c.nome || 'Cliente'));
      setTimeout(function() { imprimirJanela(w); }, 500);
    },
    pacoteVenda: function(cliente, scooters) {
      var contratoHtml = (typeof ContractGenerator !== 'undefined' && ContractGenerator.gerarHtmlComDadosVenda) ? ContractGenerator.gerarHtmlComDadosVenda(cliente, scooters) : contratoHTML({ ...cliente, ...(scooters && scooters[0]) });
      var html = contratoHtml + '<hr style="margin:2rem 0;">' + reciboHTMLVenda(cliente, scooters) + '<hr style="margin:2rem 0;">' + termoHTMLVenda(cliente, scooters);
      var w = abrirJanela(html, 'Pacote - ' + (cliente.nome || 'Cliente'));
      setTimeout(function() { imprimirJanela(w); }, 500);
    }
  };
})();
