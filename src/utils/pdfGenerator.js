import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fontkit from '@pdf-lib/fontkit';
// Optional local DejaVuSans font path for offline usage. Place the font file in
// `public/fonts/DejaVuSans.ttf` at build time if needed.
const localFontUrl = '/fonts/DejaVuSans.ttf';

function hexToRgb(hex) {
  const value = hex?.replace('#', '') || '000000';
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return rgb(r / 255, g / 255, b / 255);
}
function drawRoundedRect(page, x, y, width, height, radius, options = {}) {
  const path = [
    `M ${x + radius} ${y}`,
    `H ${x + width - radius}`,
    `Q ${x + width} ${y} ${x + width} ${y + radius}`,
    `V ${y + height - radius}`,
    `Q ${x + width} ${y + height} ${x + width - radius} ${y + height}`,
    `H ${x + radius}`,
    `Q ${x} ${y + height} ${x} ${y + height - radius}`,
    `V ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    'Z'
  ].join(' ');
  page.drawSvgPath(path, options);
}

async function drawTicketPage(pdfDoc, order, seat, settings, font) {
  let pageWidth = 400;
  let pageHeight = 600;
  if (settings.design?.layout === 'horizontal') {
    pageWidth = 600;
    pageHeight = 400;
  }
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const { colorScheme = {}, design = {}, qrCode = {}, ticketContent = {}, companyInfo = {} } = settings;

  const backgroundColor = hexToRgb(colorScheme.background || '#FFFFFF');
  const textColor = hexToRgb(colorScheme.text || '#000000');
  const primaryColor = hexToRgb(colorScheme.primary || '#000000');
  const secondaryColor = hexToRgb(colorScheme.secondary || '#000000');
  const accentColor = hexToRgb(colorScheme.accent || '#000000');

  // Page background
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: backgroundColor });

  let fontSize = 12;
  if (design.fontSize === 'small') fontSize = 10;
  else if (design.fontSize === 'large') fontSize = 16;

  const margin = 20;
  const cardX = margin;
  const cardY = margin;
  const cardWidth = pageWidth - margin * 2;
  const cardHeight = pageHeight - margin * 2;
  const radius = 12;
  const padding = 20;

  // Shadow and card background
  drawRoundedRect(page, cardX + 4, cardY - 4, cardWidth, cardHeight, radius, {
    color: rgb(0, 0, 0),
    opacity: 0.1
  });
  drawRoundedRect(page, cardX, cardY, cardWidth, cardHeight, radius, {
    color: backgroundColor
  });

  // Header banner
  const headerHeight = 120;
  const bannerY = cardY + cardHeight - headerHeight;
  if (order.event?.image) {
    try {
      const imgBytes = await fetch(order.event.image).then((r) => r.arrayBuffer());
      let img;
      if (order.event.image.startsWith('data:image/png')) img = await pdfDoc.embedPng(imgBytes);
      else img = await pdfDoc.embedJpg(imgBytes);
      page.drawImage(img, {
        x: cardX,
        y: bannerY,
        width: cardWidth,
        height: headerHeight
      });
    } catch {
      page.drawRectangle({
        x: cardX,
        y: bannerY,
        width: cardWidth,
        height: headerHeight,
        color: secondaryColor
      });
    }
  } else {
    page.drawRectangle({
      x: cardX,
      y: bannerY,
      width: cardWidth,
      height: headerHeight,
      color: secondaryColor
    });
  }

  // Brand badge
  const brandName = companyInfo.name || 'TicketWayz';
  const badgeFont = fontSize - 2;
  const badgePadding = 6;
  const brandWidth = font.widthOfTextAtSize(brandName, badgeFont);
  const badgeWidth = brandWidth + badgePadding * 2;
  const badgeHeight = badgeFont + badgePadding;
  const badgeX = cardX + padding;
  const badgeY = cardY + cardHeight - badgeHeight - padding / 2;
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: accentColor
  });
  page.drawText(brandName, {
    x: badgeX + badgePadding,
    y: badgeY + badgePadding / 2,
    size: badgeFont,
    font,
    color: backgroundColor
  });

  // Body content
  let cursorY = bannerY - padding / 2;
  const artist = order.event?.artist || order.event?.title;
  if (artist) {
    page.drawText(String(artist), {
      x: cardX + padding,
      y: cursorY,
      size: fontSize + 4,
      font,
      color: primaryColor
    });
    cursorY -= fontSize + 8;
  }
  if (ticketContent.showDateTime && order.event?.date) {
    page.drawText(String(order.event.date), {
      x: cardX + padding,
      y: cursorY,
      size: fontSize,
      font,
      color: accentColor
    });
    cursorY -= fontSize + 4;
  }
  if (ticketContent.showVenueInfo && order.event?.location) {
    page.drawText(String(order.event.location), {
      x: cardX + padding,
      y: cursorY,
      size: fontSize,
      font,
      color: textColor
    });
    cursorY -= fontSize + 8;
  }

  // Info grid
  cursorY -= 10;
  const gridItems = [];
  if (seat?.section) gridItems.push({ label: 'Section', value: seat.section });
  if (seat?.gate) gridItems.push({ label: 'Gate', value: seat.gate });
  if (seat?.row_number || seat?.row) gridItems.push({ label: 'Row', value: seat.row_number || seat.row });
  if (seat?.seat_number || seat?.number) gridItems.push({ label: 'Seat', value: seat.seat_number || seat.number });
  if (gridItems.length === 0) gridItems.push({ label: 'Admission', value: 'General' });
  if (ticketContent.showPrice && order.totalPrice)
    gridItems.push({ label: 'Price', value: order.totalPrice, accent: true });

  const colWidth = (cardWidth - padding * 2) / 2;
  const rowHeight = fontSize * 2 + 8;
  gridItems.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = cardX + padding + col * colWidth;
    const y = cursorY - row * rowHeight;
    page.drawText(item.label.toUpperCase(), {
      x,
      y,
      size: fontSize - 2,
      font,
      color: secondaryColor
    });
    page.drawText(String(item.value), {
      x,
      y: y - fontSize,
      size: fontSize,
      font,
      color: item.accent ? accentColor : textColor
    });
  });
  const rows = Math.ceil(gridItems.length / 2);
  cursorY -= rows * rowHeight + 10;

  // Terms and notes at bottom
  const sizeMap = { small: 64, medium: 96, large: 128 };
  const qrSize = sizeMap[qrCode.size] || 96;
  let termsY = cardY + padding;
  if (design.showQRCode && ['bottom-left', 'bottom-right'].includes(qrCode.position)) {
    termsY += qrSize + 10;
  }
  const termsText = [
    ticketContent.customInstructions,
    ticketContent.termsAndConditions
  ].filter(Boolean).join(' ');
  if (termsText) {
    page.drawText(termsText, {
      x: cardX + padding,
      y: termsY,
      size: fontSize - 2,
      font,
      color: textColor,
      maxWidth: cardWidth - padding * 2
    });
  }

  // QR block with ticket ID footer
  if (design.showQRCode) {
    try {
      const qrData = [];
      if (qrCode.includeEventInfo && order.event?.title) qrData.push(order.event.title);
      if (qrCode.includeSeatInfo && seat?.id) qrData.push(seat.id);
      if (qrCode.includeOrderInfo && order.orderNumber) qrData.push(order.orderNumber);
      const qrString = qrData.join('|') || 'TicketWayz';
      const qrDataUrl = await QRCode.toDataURL(qrString);
      const qrBytes = await fetch(qrDataUrl).then((res) => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrBytes);

      const positions = {
        'top-left': {
          x: cardX + padding,
          y: cardY + cardHeight - qrSize - padding
        },
        'top-right': {
          x: cardX + cardWidth - qrSize - padding,
          y: cardY + cardHeight - qrSize - padding
        },
        'bottom-left': { x: cardX + padding, y: cardY + padding },
        'bottom-right': {
          x: cardX + cardWidth - qrSize - padding,
          y: cardY + padding
        },
        center: {
          x: cardX + (cardWidth - qrSize) / 2,
          y: cardY + (cardHeight - qrSize) / 2
        }
      };

      const pos = positions[qrCode.position] || positions['bottom-right'];
      page.drawImage(qrImage, { x: pos.x, y: pos.y, width: qrSize, height: qrSize });

      const ticketId = seat?.id || order.id;
      if (ticketId) {
        const idText = `ID: ${String(ticketId).slice(0, 8)}`;
        const idWidth = font.widthOfTextAtSize(idText, fontSize - 2);
        let idY = pos.y - fontSize - 4;
        if (['bottom-left', 'bottom-right'].includes(qrCode.position)) {
          idY = pos.y + qrSize + 4;
        }
        page.drawText(idText, {
          x: pos.x + (qrSize - idWidth) / 2,
          y: idY,
          size: fontSize - 2,
          font,
          color: textColor
        });
      }
    } catch {
      // ignore QR errors
    }
  }
}

export async function downloadTicketsPDF(order, fileName = 'tickets.pdf', templateSettings) {
  if (!order) return;

  let settings = templateSettings;
  if (!settings) {
    try {
      const stored = localStorage.getItem('ticketTemplateSettings');
      if (stored) settings = JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const cdnFontUrl = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37/ttf/DejaVuSans.ttf';
  let fontBytes;
  try {
    const response = await fetch(cdnFontUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    fontBytes = await response.arrayBuffer();
  } catch (err) {
    console.error('Failed to load font from CDN:', err);
    console.warn('Falling back to locally stored DejaVuSans font.');
    try {
      const localResponse = await fetch(localFontUrl);
      if (!localResponse.ok) throw new Error(`HTTP ${localResponse.status}`);
      fontBytes = await localResponse.arrayBuffer();
    } catch (localErr) {
      console.error('Failed to load local fallback font:', localErr);
    }
  }

  let font;
  if (fontBytes) {
    font = await pdfDoc.embedFont(fontBytes);
  } else {
    console.warn('Using standard Helvetica font as a last resort.');
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  if (Array.isArray(order.seats) && order.seats.length > 0) {
    for (const seat of order.seats) {
      await drawTicketPage(pdfDoc, order, seat, settings, font);
    }
  } else {
    await drawTicketPage(pdfDoc, order, null, settings, font);
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { drawTicketPage };

