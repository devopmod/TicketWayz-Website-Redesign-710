import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import { formatDateTime } from './formatDateTime.js';

function sanitizeValue(value) {
  return value === undefined || value === null ? '' : String(value).replace(/\s+/g, ' ').trim();
}

function sanitizeTicket(order = {}, seat = {}) {
  const event = order.event || {};
  const seatData = seat || {};
  return {
    event: {
      title: sanitizeValue(event.title || event.artist),
      date: event.date,
      location: sanitizeValue(event.location),
      image: event.image,
      note: sanitizeValue(event.note)
    },
    companyName: sanitizeValue(order.company?.name || ''),
    orderNumber: sanitizeValue(order.orderNumber || order.id),
    price: sanitizeValue(seatData.price || order.price || order.totalPrice),
    seat: {
      section: sanitizeValue(seatData.section),
      row: sanitizeValue(seatData.row_number || seatData.row),
      seat: sanitizeValue(seatData.seat_number || seatData.number),
      zone: sanitizeValue(seatData.zone?.name)
    },
    ticketId: sanitizeValue(seatData.id || order.id),
    terms: sanitizeValue(order.terms)
  };
}

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
  const data = sanitizeTicket(order, seat);
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
  const secondaryColor = hexToRgb(colorScheme.secondary || '#000000');
  const accentColor = hexToRgb(design.accent || colorScheme.accent || '#10B981');

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
  const radius = design.rounded ?? 12;
  const padding = 20;

  // Shadow and card background
  if (design.shadow !== false) {
    drawRoundedRect(page, cardX + 4, cardY - 4, cardWidth, cardHeight, radius, {
      color: rgb(0, 0, 0),
      opacity: 0.1
    });
  }
  drawRoundedRect(page, cardX, cardY, cardWidth, cardHeight, radius, {
    color: backgroundColor
  });

  // Header banner
  const headerHeight = 120;
  const bannerY = cardY + cardHeight - headerHeight;
  const heroUrl = design.heroUrl || data.event.image;
  if (heroUrl) {
    try {
      const imgBytes = await fetch(heroUrl).then((r) => r.arrayBuffer());
      let img;
      if (heroUrl.startsWith('data:image/png')) img = await pdfDoc.embedPng(imgBytes);
      else img = await pdfDoc.embedJpg(imgBytes);
      page.drawImage(img, {
        x: cardX,
        y: bannerY,
        width: cardWidth,
        height: headerHeight
      });
      if (design.darkHeader) {
        page.drawRectangle({
          x: cardX,
          y: bannerY,
          width: cardWidth,
          height: headerHeight,
          color: rgb(0, 0, 0),
          opacity: 0.3
        });
      }
    } catch {
      page.drawRectangle({
        x: cardX,
        y: bannerY,
        width: cardWidth,
        height: headerHeight,
        color: accentColor
      });
    }
  } else {
    page.drawRectangle({
      x: cardX,
      y: bannerY,
      width: cardWidth,
      height: headerHeight,
      color: accentColor
    });
  }

  // Brand badge placed over banner
  const brandName = companyInfo.name || data.companyName || 'TicketWayz';
  const badgeFont = fontSize - 2;
  const badgePadding = 6;
  const brandWidth = font.widthOfTextAtSize(brandName, badgeFont);
  const badgeWidth = brandWidth + badgePadding * 2;
  const badgeHeight = badgeFont + badgePadding;
  const badgeX = cardX + padding;
  const badgeY = bannerY + headerHeight - badgeHeight - padding / 2;
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
  const title = data.event.title;
  if (title) {
    page.drawText(title, {
      x: cardX + padding,
      y: cursorY,
      size: fontSize + 4,
      font,
      color: accentColor
    });
    cursorY -= fontSize + 8;
  }
  if (ticketContent.showDateTime && data.event.date) {
    const { dateTime } = formatDateTime(data.event.date);
    page.drawText(dateTime, {
      x: cardX + padding,
      y: cursorY,
      size: fontSize,
      font,
      color: textColor
    });
    cursorY -= fontSize + 4;
  }
  if (ticketContent.showVenueInfo && data.event.location) {
    page.drawText(data.event.location, {
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
  if (data.seat.section) gridItems.push({ label: 'Section', value: data.seat.section });
  if (data.seat.row) gridItems.push({ label: 'Row', value: data.seat.row });
  if (data.seat.seat) gridItems.push({ label: 'Seat', value: data.seat.seat });
  if (!data.seat.section && !data.seat.row && !data.seat.seat) {
    if (data.seat.zone) gridItems.push({ label: 'Zone', value: data.seat.zone });
    else gridItems.push({ label: 'Admission', value: 'General' });
  }
  if (ticketContent.showPrice !== false && data.price) {
    gridItems.push({ label: 'Price', value: data.price, accent: true });
  }

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

  // Terms/instructions and company footer
  const sizeMap = { small: 64, medium: 96, large: 128 };
  const qrSize = sizeMap[qrCode.size] || 96;
  let footerBase = cardY + padding;
  if (design.showQRCode !== false && ['bottom-left', 'bottom-right'].includes(qrCode.position)) {
    footerBase += qrSize + 10;
  }

  // Company footer (bottom-most)
  const companyLines = [companyInfo.name, companyInfo.phone, companyInfo.website].filter(Boolean);
  let footerY = footerBase;
  if (companyLines.length) {
    const lineHeight = fontSize - 2;
    companyLines.forEach((line, idx) => {
      page.drawText(String(line), {
        x: cardX + padding,
        y: footerY + idx * lineHeight,
        size: fontSize - 2,
        font,
        color: secondaryColor
      });
    });
    footerY += companyLines.length * lineHeight + 4;
    page.drawLine({
      start: { x: cardX + padding, y: footerY },
      end: { x: cardX + cardWidth - padding, y: footerY },
      thickness: 1,
      color: secondaryColor,
      dashArray: [3, 3]
    });
    footerY += 6;
  }

  const termsText = [data.event.note, ticketContent.customInstructions, ticketContent.termsAndConditions, data.terms]
    .filter(Boolean)
    .join(' ');
  if (termsText) {
    page.drawText(termsText, {
      x: cardX + padding,
      y: footerY,
      size: fontSize - 2,
      font,
      color: textColor,
      maxWidth: cardWidth - padding * 2
    });
  }

  // QR block with ticket ID footer
  if (design.showQRCode !== false) {
    try {
      const qrData = [];
      if (qrCode.includeEventInfo && data.event.title) qrData.push(data.event.title);
      if (qrCode.includeSeatInfo && data.ticketId) qrData.push(data.ticketId);
      if (qrCode.includeOrderInfo && data.orderNumber) qrData.push(data.orderNumber);
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

      const ticketId = data.ticketId;
      if (ticketId) {
        const idText = `ID: ${ticketId.slice(0, 8)}`;
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
  settings = settings || {};

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await fetch('https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf').then((res) =>
    res.arrayBuffer()
  );
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });

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

