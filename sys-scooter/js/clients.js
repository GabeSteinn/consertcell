/**
 * Funções relacionadas a clientes: WhatsApp, etc.
 */
var ClientsUtil = (function() {
  var DEFAULT_MSG = 'Olá {{nome_cliente}}, passando para lembrar que a garantia da sua scooter modelo {{modelo_scooter}} está próxima do vencimento. Qualquer dúvida estamos à disposição.';

  function getMessageTemplate() {
    try {
      if (typeof APP !== 'undefined' && APP.getWhatsappMsg) {
        var msg = APP.getWhatsappMsg();
        if (msg !== undefined && msg !== null && msg !== '') return msg;
      }
    } catch (e) {}
    return DEFAULT_MSG;
  }

  function setMessageTemplate(text) {
    if (typeof APP !== 'undefined' && APP.setWhatsappMsg) {
      APP.setWhatsappMsg(text);
    }
  }

  /**
   * Normaliza telefone para formato WhatsApp: apenas dígitos, com 55 (Brasil) se necessário.
   * Esperado: DDD + 9 + número (ex: 48988119857 ou (48) 98811-9857)
   */
  function normalizePhone(telefone) {
    if (!telefone || typeof telefone !== 'string') return '';
    var digits = telefone.replace(/\D/g, '');
    if (digits.length === 11 && digits.charAt(0) !== '0') return '55' + digits;
    if (digits.length === 10) return '55' + digits;
    if (digits.length > 11 && digits.substring(0, 2) === '55') return digits;
    return '55' + digits;
  }

  /**
   * Gera o link do WhatsApp com mensagem padrão (nome e modelo substituídos).
   * @param {Object} client - Objeto cliente com nome, modelo, telefone
   * @returns {string} URL completa para abrir em nova aba
   */
  function generateWhatsAppLink(client) {
    var numero = normalizePhone(client.telefone);
    if (!numero || numero === '55') return null;
    var msg = getMessageTemplate()
      .replace(/\{\{nome_cliente\}\}/g, (client.nome || '').trim())
      .replace(/\{\{modelo_scooter\}\}/g, (client.modelo || '').trim());
    var url = 'https://wa.me/' + numero + (msg ? '?text=' + encodeURIComponent(msg) : '');
    return url;
  }

  return {
    getMessageTemplate: getMessageTemplate,
    setMessageTemplate: setMessageTemplate,
    generateWhatsAppLink: generateWhatsAppLink,
    normalizePhone: normalizePhone
  };
})();
