function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

async function loadTemplate() {
  const url = new URL('../templates/ticket.html', import.meta.url);
  if (typeof window !== 'undefined' && window.fetch) {
    const res = await fetch(url);
    return res.text();
  }
  const { readFile } = await import('node:fs/promises');
  return readFile(url, 'utf-8');
}

export async function applyTicketTemplate(data = {}) {
  const html = await loadTemplate();
  const combined = {
    ...data,
    event: data.order?.event || {},
    company: data.order?.company || {},
    seat: data.seat || data.order?.seat || {},
    settings: data.settings || {},
  };
  return html.replace(/(<[^>]*data-slot="([^"]+)"[^>]*>)(.*?)(<\/[^>]+>)/gs, (
    _match,
    start,
    slot,
    content,
    end,
  ) => {
    const value = getValue(combined, slot);
    if (value === undefined || value === null) return start + content + end;
    return start + escapeHtml(String(value)) + end;
  });
}

export default applyTicketTemplate;
