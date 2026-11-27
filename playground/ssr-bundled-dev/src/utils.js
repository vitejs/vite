const escapeHtmlReplaceMap = {
  '&': '&amp;',
  "'": '&#x27;',
  '`': '&#x60;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;',
}

/**
 * @param {string} string
 * @returns {string}
 */
export function escapeHtml(string) {
  return string.replace(/[&'`"<>]/g, (match) => escapeHtmlReplaceMap[match])
}
