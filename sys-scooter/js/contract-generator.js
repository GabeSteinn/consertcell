/**
 * Gera o contrato preenchido com dados do cliente e abre para impressão/PDF
 */
var ContractGenerator = (function() {
  function escapeHtml(s) {
    if (s == null || s === undefined) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
  function formatarData(str) {
    if (!str) return '';
    return new Date(str).toLocaleDateString('pt-BR');
  }
  function formatarValorBR(val) {
    if (val == null || val === '' || isNaN(Number(val))) return '0,00';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function buildFormaPagamentoDetalhada(c) {
    if (typeof formaPagamentoDetalhada === 'function') return formaPagamentoDetalhada(c);
    var forma = (typeof labelFormaPagamento === 'function' ? labelFormaPagamento(c.formaPagamento) : c.formaPagamento || '');
    var parcelas = c.parcelas != null && c.parcelas > 0 ? c.parcelas : null;
    var ehParcelado = /parcelado/.test(c.formaPagamento || '');
    var sufixoParcelas = (ehParcelado && parcelas) ? ' em ' + parcelas + ' vez(es)' : '';
    if (c.valorEntrada != null && c.valorEntrada > 0 && c.valor != null) {
      var restante = c.valor - c.valorEntrada;
      var via = forma.replace(/^Entrada \+ /, '');
      return 'Entrada de R$ ' + formatarValorBR(c.valorEntrada) + ' e restante de R$ ' + formatarValorBR(restante) + ' via ' + via + sufixoParcelas;
    }
    return forma + sufixoParcelas;
  }
  function buildBlocoAcessorio(c) {
    var val = c.valorAcessorio != null && Number(c.valorAcessorio) > 0 ? Number(c.valorAcessorio) : null;
    if (!val) return '';
    var desc = (c.acessorioDescricao || 'Acessório').trim();
    return '<p>Foi vendido acessório junto: ' + escapeHtml(desc) + '. Valor do acessório: R$ ' + formatarValorBR(val) + '.</p><p><strong>O acessório não entra na garantia de 3 (três) meses.</strong></p>';
  }
  function getPlaceholders(c) {
    return {
      nome_cliente: c.nome || '',
      cpf_cliente: c.cpf || '',
      rg_cliente: c.rg || '',
      endereco_cliente: c.endereco || '',
      telefone_cliente: c.telefone || '',
      modelo_scooter: c.modelo || '',
      cor_scooter: c.cor || '',
      valor_total: formatarValorBR(c.valor),
      bloco_acessorio: buildBlocoAcessorio(c),
      forma_pagamento_detalhada: buildFormaPagamentoDetalhada(c),
      data_venda: formatarData(c.dataVenda),
      garantia_ate: formatarData(c.garantiaAte),
      cidade: c.cidade || 'Palhoça, SC',
      data_assinatura: formatarData(new Date().toISOString())
    };
  }
  function getPlaceholdersVenda(cliente, scooters) {
    if (!scooters || !scooters.length) return getPlaceholders({ ...cliente, ...(cliente.scooters && cliente.scooters[0]) });
    var primeiro = scooters[0];
    var flat = { ...cliente, ...primeiro };
    var n = scooters.length;
    var listaItens = '';
    var valorTotalNum = 0;
    var blocoAcessorio = '';
    var garantiasLista = [];
    scooters.forEach(function(s) {
      valorTotalNum += Number(s.valor) || 0;
      listaItens += '<li>Modelo: ' + escapeHtml(s.modelo || '-') + ', Cor: ' + escapeHtml(s.cor || '-') + ', Valor: R$ ' + formatarValorBR(s.valor) + '</li>';
      var ac = buildBlocoAcessorio({ ...cliente, ...s });
      if (ac) blocoAcessorio += ac;
      if (s.garantiaAte) garantiasLista.push((s.modelo || 'Item') + ': ' + formatarData(s.garantiaAte));
    });
    var quantidadeTexto = n === 1 ? '01 (uma) Scooter Elétrica' : (n < 10 ? '0' + n : n) + ' (' + (n === 2 ? 'duas' : n === 3 ? 'três' : n + '') + ') Scooters Elétricas';
    return {
      nome_cliente: cliente.nome || '',
      cpf_cliente: cliente.cpf || '',
      rg_cliente: cliente.rg || '',
      endereco_cliente: cliente.endereco || '',
      telefone_cliente: cliente.telefone || '',
      modelo_scooter: n === 1 ? (primeiro.modelo || '') : '',
      cor_scooter: n === 1 ? (primeiro.cor || '') : '',
      quantidade_itens: quantidadeTexto,
      lista_itens: listaItens,
      valor_total: formatarValorBR(valorTotalNum),
      bloco_acessorio: blocoAcessorio,
      forma_pagamento_detalhada: buildFormaPagamentoDetalhada(flat),
      data_venda: formatarData(primeiro.dataVenda),
      garantia_ate: n === 1 ? formatarData(primeiro.garantiaAte) : (garantiasLista.length ? garantiasLista.join('; ') : formatarData(primeiro.garantiaAte)),
      cidade: cliente.cidade || 'Palhoça, SC',
      data_assinatura: formatarData(new Date().toISOString()),
      objeto_plural: n > 1
  var RAW_HTML_KEYS_VENDA = ['bloco_acessorio', 'lista_itens'];
    };
  }
  var RAW_HTML_KEYS = ['bloco_acessorio', 'lista_itens'];
  function substituirPlaceholders(html, placeholders) {
    var result = html;
    Object.keys(placeholders).forEach(function(key) {
      var val = placeholders[key];
      result = result.split('{{' + key + '}}').join(RAW_HTML_KEYS.indexOf(key) >= 0 ? val : escapeHtml(String(val)));
    });
    return result;
  }
  function getTemplateHtml() {
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Contrato de Compra e Venda – Scooter Elétrica</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{font-family:\'Outfit\',sans-serif;font-size:11pt;line-height:1.5;color:#1a1a1a;max-width:210mm;margin:0 auto;padding:15mm 20mm;background:#fff}@media print{body{padding:12mm 18mm;max-width:none}.no-print{display:none!important}}h1{font-size:1.35rem;font-weight:700;text-align:center;margin:0 0 1.5rem 0;color:#008B8B;text-transform:uppercase;letter-spacing:.02em}.subtitle{text-align:center;font-size:.95rem;color:#555;margin-bottom:2rem}.parte{margin-bottom:1.5rem;text-align:justify}.parte strong{display:block;margin-bottom:.25rem;font-size:.9rem}.intro{text-align:justify;margin-bottom:1.75rem}.clausula{margin-bottom:1.5rem;text-align:justify}.clausula-titulo{font-weight:600;font-size:.95rem;color:#008B8B;margin-bottom:.5rem}.clausula p{margin:0 0 .5rem 0}.clausula p:last-child{margin-bottom:0}.dados-veiculo{margin:.5rem 0 0 1rem;list-style:none;padding:0}.dados-veiculo li{margin-bottom:.2rem}.assinaturas{margin-top:2.5rem;padding-top:1.5rem}.assinatura-local-data{text-align:center;margin-bottom:2rem;font-size:.95rem}.bloco-assinatura{margin-top:2.5rem}.bloco-assinatura .nome-empresa{font-weight:600;margin-bottom:2.5rem;font-size:.95rem}.linha-assinatura{border-bottom:1px solid #1a1a1a;width:100%;max-width:280px;margin-top:.25rem;height:1.2rem}.btn-print{position:fixed;top:1rem;right:1rem;padding:.5rem 1rem;font-family:\'Poppins\',sans-serif;font-size:.875rem;background:#008B8B;color:#fff;border:none;border-radius:9999px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)}.btn-print:hover{background:#006666}</style></head><body><button type="button" class="btn-print no-print" onclick="window.print()">Imprimir / Salvar PDF</button><h1>Contrato de Compra e Venda – Scooter Elétrica</h1><p class="subtitle">Instrumento particular</p><p class="intro">Pelo presente instrumento particular, as partes abaixo identificadas:</p><div class="parte"><strong>VENDEDORA:</strong>CERT CELL, inscrita no CNPJ nº 45.032.025/0001-05,<br>com sede na Rua Coronel Bernardino Machado, nº 51,<br>telefone (48) 2132-7188,<br>doravante denominada VENDEDORA.</div><div class="parte"><strong>COMPRADORA:</strong>{{nome_cliente}},<br>CPF nº {{cpf_cliente}},<br>RG nº {{rg_cliente}},<br>residente e domiciliada em {{endereco_cliente}},<br>telefone {{telefone_cliente}},<br>doravante denominada COMPRADORA.</div><p class="intro">As partes têm entre si justo e acordado o presente contrato, mediante as cláusulas e condições seguintes:</p><div class="clausula"><div class="clausula-titulo">CLÁUSULA 1ª – DO OBJETO</div><p>O presente contrato tem como objeto a compra e venda de 01 (uma) Scooter Elétrica:</p><ul class="dados-veiculo"><li>Modelo: {{modelo_scooter}}</li><li>Cor: {{cor_scooter}}</li></ul></div><div class="clausula"><div class="clausula-titulo">CLÁUSULA 2ª – DO VALOR E FORMA DE PAGAMENTO</div><p>Valor total da scooter: R$ {{valor_total}}</p>{{bloco_acessorio}}<p>Forma de pagamento:</p><p>{{forma_pagamento_detalhada}}</p></div><div class="clausula"><div class="clausula-titulo">CLÁUSULA 3ª – DA ENTREGA</div><p>A scooter será entregue após pagamento da entrada, salvo acordo diverso entre as partes.</p></div><div class="clausula"><div class="clausula-titulo">CLÁUSULA 4ª – DA GARANTIA</div><p>A VENDEDORA concede garantia de 90 (noventa) dias a partir da data da venda: {{data_venda}}.</p><p>Data de término da garantia: {{garantia_ate}}.</p><p>A garantia cobre defeitos de fabricação da scooter, não incluindo mau uso, quedas, danos por acidentes ou desgaste natural.</p><p><strong>Os acessórios eventualmente vendidos junto não entram na garantia de 3 (três) meses.</strong></p></div><div class="clausula"><div class="clausula-titulo">CLÁUSULA 5ª – DA RESPONSABILIDADE</div><p>Após a entrega, a COMPRADORA assume total responsabilidade pelo uso, conservação e riscos do equipamento.</p></div><div class="clausula"><div class="clausula-titulo">CLÁUSULA 6ª – DO ATRASO / INADIMPLÊNCIA</div><p>Em caso de atraso, poderá ser aplicada multa de 2% sobre o valor da parcela em atraso, acrescida de juros de 1% ao mês.</p><p>Caso haja atraso de 02 (duas) parcelas, consecutivas ou não, a VENDEDORA poderá exigir a devolução imediata da scooter, independentemente de notificação judicial.</p><p>Os valores pagos poderão ser retidos para cobrir despesas administrativas, desvalorização e custos de manutenção.</p></div><p class="intro">E por estarem de pleno acordo, firmam o presente instrumento:</p><div class="assinaturas"><div class="assinatura-local-data">Local: {{cidade}}<br>Data: {{data_assinatura}}</div><div class="bloco-assinatura"><div class="nome-empresa">VENDEDORA:</div><div>CERT CELL – CNPJ 45.032.025/0001-05</div><div class="linha-assinatura"></div></div><div class="bloco-assinatura"><div class="nome-empresa">COMPRADORA:</div><div>{{nome_cliente}} – CPF {{cpf_cliente}}</div><div class="linha-assinatura"></div></div></div></body></html>';
  }
  function gerarHtmlComDados(cliente) {
    var placeholders = getPlaceholders(cliente);
    var template = getTemplateHtml();
    return substituirPlaceholders(template, placeholders);
  }
  function getTemplateHtmlVenda() {
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Contrato – Scooter(s)</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{font-family:\'Outfit\',sans-serif;font-size:11pt;line-height:1.5;color:#1a1a1a;max-width:210mm;margin:0 auto;padding:15mm 20mm;background:#fff}@media print{.no-print{display:none!important}}h1{font-size:1.35rem;font-weight:700;text-align:center;margin:0 0 1.5rem 0;color:#008B8B}.subtitle{text-align:center;font-size:.95rem;color:#555;margin-bottom:2rem}.parte{margin-bottom:1.5rem}.parte strong{display:block;margin-bottom:.25rem}.intro{text-align:justify;margin-bottom:1.75rem}.clausula{margin-bottom:1.5rem;text-align:justify}.clausula-titulo{font-weight:600;font-size:.95rem;color:#008B8B;margin-bottom:.5rem}.dados-veiculo{margin:.5rem 0 0 1rem;list-style:none;padding:0}.dados-veiculo li{margin-bottom:.2rem}.assinaturas{margin-top:2.5rem;padding-top:1.5rem}.assinatura-local-data{text-align:center;margin-bottom:2rem}.bloco-assinatura{margin-top:2.5rem}.linha-assinatura{border-bottom:1px solid #1a1a1a;max-width:280px;margin-top:.25rem;height:1.2rem}.btn-print{position:fixed;top:1rem;right:1rem;padding:.5rem 1rem;font-size:.875rem;background:#008B8B;color:#fff;border:none;border-radius:9999px;cursor:pointer}</style></head><body><button type="button" class="btn-print no-print" onclick="window.print()">Imprimir / Salvar PDF</button><h1>Contrato de Compra e Venda – Scooter(s) Elétrica(s)</h1><p class="subtitle">Instrumento particular</p><p class="intro">Pelo presente instrumento particular, as partes abaixo identificadas:</p><div class="parte"><strong>VENDEDORA:</strong>CERT CELL, CNPJ 45.032.025/0001-05, Rua Coronel Bernardino Machado, nº 51, telefone (48) 2132-7188.</div><div class="parte"><strong>COMPRADORA:</strong>{{nome_cliente}}, CPF {{cpf_cliente}}, RG {{rg_cliente}}, residente em {{endereco_cliente}}, telefone {{telefone_cliente}}.</div><p class="intro">As partes acordam o presente contrato:</p><div class="clausula"><div class="clausula-titulo">CLÁUSULA 1ª – DO OBJETO</div><p>Objeto: compra e venda de {{quantidade_itens}}:</p><ul class="dados-veiculo">{{lista_itens}}</ul></div><div class="clausula"><div class="clausula-titulo">CLÁUSULA 2ª – VALOR E PAGAMENTO</div><p>Valor total: R$ {{valor_total}}</p>{{bloco_acessorio}}<p>Forma de pagamento: {{forma_pagamento_detalhada}}</p></div><div class="clausula"><div class="clausula-titulo">CLÁUSULA 3ª – ENTREGA</div><p>Entrega após pagamento da entrada, salvo acordo diverso.</p></div><div class="clausula"><div class="clausula-titulo">CLÁUSULA 4ª – GARANTIA</div><p>Garantia de 90 dias a partir da data da venda: {{data_venda}}. Término da garantia: {{garantia_ate}}. Acessórios não entram na garantia de 3 meses.</p></div><div class="clausula"><div class="clausula-titulo">CLÁUSULA 5ª – RESPONSABILIDADE</div><p>Após a entrega, a COMPRADORA assume responsabilidade pelo uso e riscos do(s) equipamento(s).</p></div><p class="intro">E por estarem de acordo, firmam o presente instrumento.</p><div class="assinaturas"><div class="assinatura-local-data">Local: {{cidade}} – Data: {{data_assinatura}}</div><div class="bloco-assinatura">VENDEDORA: CERT CELL<div class="linha-assinatura"></div></div><div class="bloco-assinatura">COMPRADORA: {{nome_cliente}} – CPF {{cpf_cliente}}<div class="linha-assinatura"></div></div></div></body></html>';
  }
  function gerarHtmlComDadosVenda(cliente, scooters) {
    var placeholders = getPlaceholdersVenda(cliente, scooters);
    var template = getTemplateHtmlVenda();
    return substituirPlaceholders(template, placeholders);
  }
  function abrirEImprimirVenda(cliente, scooters) {
    var html = gerarHtmlComDadosVenda(cliente, scooters);
    var w = window.open('', '_blank', 'width=900,height=900,scrollbars=yes');
    w.document.write(html);
    w.document.close();
    w.focus();
    w.onload = function() { setTimeout(function() { w.print(); }, 400); };
  }
  function abrirEImprimir(cliente) {
    var html = gerarHtmlComDados(cliente);
    var w = window.open('', '_blank', 'width=900,height=900,scrollbars=yes');
    w.document.write(html);
    w.document.close();
    w.focus();
    w.onload = function() { setTimeout(function() { w.print(); }, 400); };
  }
  return {
    gerarHtmlComDados: gerarHtmlComDados,
    gerarHtmlComDadosVenda: gerarHtmlComDadosVenda,
    abrirEImprimir: abrirEImprimir,
    abrirEImprimirVenda: abrirEImprimirVenda
  };
})();
