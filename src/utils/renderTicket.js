import QRCode from 'qrcode';
import { formatDateTime } from './formatDateTime.js';
import { buildTermsText } from './ticketUtils.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function renderTicket({
  order = {},
  seat = {},
  heroUrl,
  accent,
  darkHeader,
  showPrice = true,
  showQr = true,
  showTerms = true,
  radius,
  shadow,
  qrValue,
  settings = {}
} = {}) {
  const { qrCode = {}, design = {}, colorScheme = {}, ticketContent = {}, companyInfo = {} } = settings;

  const actualHero = heroUrl ?? design.heroUrl;
  const actualAccent = accent ?? design.accent ?? colorScheme.accent ?? '#10B981';
  const actualDarkHeader = darkHeader ?? design.darkHeader ?? false;
  const actualRadius = radius ?? design.rounded ?? 24;
  const actualShadow = shadow ?? (design.shadow !== undefined ? design.shadow : true);
  const backgroundColor = colorScheme.background || '#FFFFFF';
  const textColor = colorScheme.text || '#111827';
  const grayColor = colorScheme.gray || '#6B7280';
  const lightGray = colorScheme.lightGray || '#D1D5DB';

  const event = order.event || {};
  const brandName = companyInfo.brand || companyInfo.name || order.company?.name || 'TicketWayz';
  const { dateTime } = event.date ? formatDateTime(event.date) : { dateTime: '' };
  const price = seat?.price || order.price || order.totalPrice;
  const ticketId = seat?.id || order.orderNumber || order.id;

  const showPriceFinal = showPrice && ticketContent.showPrice !== false;
  const showTermsFinal = showTerms && ticketContent.showTerms !== false;
  const showQrFinal = showQr && design.showQRCode !== false;

  const gridItems = [];
  if (seat?.section || seat?.row_number || seat?.seat_number) {
    if (seat.section) gridItems.push(['SECTION', seat.section]);
    if (seat.row_number) gridItems.push(['ROW', seat.row_number]);
    if (seat.seat_number) gridItems.push(['SEAT', seat.seat_number]);
  } else {
    gridItems.push(['ADMISSION', 'GA']);
  }
  if (showPriceFinal && price) gridItems.push(['PRICE', price]);

  const termsText = showTermsFinal ? buildTermsText(order, settings) : '';

  const qrString = qrCode.value || qrValue || ticketId || 'Ticket';
  let qrSvg = '';
  if (showQrFinal) {
    try {
      qrSvg = await QRCode.toString(qrString, { type: 'svg', margin: 0, width: 132 });
    } catch {
      qrSvg = '';
    }
  }

  return `
<div class="mx-auto ${actualShadow ? 'shadow-lg' : ''} rounded-[${actualRadius}px]" style="width:560px; background-color:${backgroundColor};">
  <div class="relative h-48 rounded-t-[inherit] overflow-hidden">
    ${actualHero ? `<img src="${escapeHtml(actualHero)}" alt="Hero" class="h-full w-full object-cover" />` : `<div class="h-full w-full" style="background-color:${actualAccent}"></div>`}
    <div class="absolute inset-0 bg-gradient-to-b ${actualDarkHeader ? 'from-black/60' : 'from-black/30'} to-black/0"></div>
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2">
      <div class="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
        <span class="h-2 w-2 rounded-full" style="background-color:${actualAccent}"></span>
        ${escapeHtml(brandName)}
      </div>
    </div>
  </div>
  <div class="-mt-6 rounded-b-[inherit] px-6 pb-8 pt-8" style="background-color:${backgroundColor}; color:${textColor};">
    ${event.title ? `<h1 class="text-2xl font-bold">${escapeHtml(event.title)}</h1>` : ''}
    ${event.date ? `<div class="mt-2 text-base" style="color:${grayColor};">${escapeHtml(dateTime)}</div>` : ''}
    ${event.location ? `<div class="mt-1 text-base" style="color:${grayColor};">${escapeHtml(event.location)}</div>` : ''}
    ${gridItems.length > 0 ? `
    <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-6">
      ${gridItems.map(([label, value]) => `
      <div>
        <div class="text-xs" style="color:${grayColor};">${escapeHtml(label)}</div>
        <div class="text-lg font-semibold" style="color:${actualAccent};">${escapeHtml(value)}</div>
      </div>`).join('')}
    </div>` : ''}
    ${showQrFinal && qrSvg ? `
    <div class="mt-8 flex flex-col items-center">
      <div class="flex items-center justify-center rounded-xl border" style="width:164px; height:164px; border-color:${lightGray};">
        <div class="h-[132px] w-[132px]">${qrSvg}</div>
      </div>
      ${qrCode.value ? `<div class="mt-4 text-xs" style="color:${grayColor};">${escapeHtml(qrCode.value)}</div>` : ''}
      ${ticketId ? `<div class="mt-1 text-xs" style="color:${grayColor};">ID: ${escapeHtml(ticketId)}</div>` : ''}
    </div>` : ''}
    ${termsText ? `<div class="mt-8 border-t border-dashed pt-4 text-xs" style="border-color:${lightGray}; color:${grayColor};">${escapeHtml(termsText)}</div>` : ''}
  </div>
</div>
`; 
}

export default renderTicket;

