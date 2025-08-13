export function buildTermsText(order = {}, settings = {}) {
  const eventNote = order?.event?.note;
  const ticketContent = settings.ticketContent || {};
  return [
    eventNote,
    ticketContent.customInstructions,
    ticketContent.termsAndConditions,
    order?.terms,
  ]
    .filter(Boolean)
    .join(' ');
}

export function validateImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  try {
    const { protocol } = new URL(url);
    if (protocol === 'http:' || protocol === 'https:') return url;
  } catch {
    // ignore
  }
  console.warn('Hero image URL must be an absolute, publicly accessible URL:', url);
  return null;
}
