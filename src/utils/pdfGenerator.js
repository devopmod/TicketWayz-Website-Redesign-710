import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TicketTemplate from '../components/ticket/TicketTemplate.jsx';
import { buildTermsText } from './ticketUtils.js';

function validateImageUrl(url) {
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
  settings.design = settings.design || {};
  settings.ticketContent = settings.ticketContent || {};
  order.event = order.event || {};
  settings.design.heroUrl = validateImageUrl(settings.design.heroUrl);
  order.event.image = validateImageUrl(order.event.image);

  const pdfDoc = await PDFDocument.create();
  const seats = Array.isArray(order.seats) && order.seats.length > 0 ? order.seats : [null];

  for (const seat of seats) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-10000px';
    document.body.appendChild(wrapper);

    const event = order.event || {};
    const company = order.company || {};
    const seatInfo = seat || order.seat || {};
    const dateObj = event.date ? new Date(event.date) : null;
    const date = dateObj ? dateObj.toLocaleDateString() : undefined;
    const time = dateObj
      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined;

    const data = {
      heroImage: settings.design?.heroUrl || event.image,
      brand: company.name,
      artist: event.title,
      date,
      time,
      venue: event.location,
      address: event.address || event.note,
      section: seatInfo.section,
      row: seatInfo.row_number,
      seat: seatInfo.seat_number,
      gate: seatInfo.gate,
      price: seatInfo.price || order.price,
      currency: order.currency,
      ticketId: seatInfo.id || order.orderNumber,
      terms: buildTermsText(order, settings),
    };

    const options = {
      accent: settings.design?.accent,
      darkHeader: settings.design?.darkHeader,
      showPrice: settings.ticketContent?.showPrice,
      showQr: settings.design?.showQRCode,
      showTerms: settings.ticketContent?.showTerms,
      radius: settings.design?.rounded,
      shadow: settings.design?.shadow,
      qrValue: order.orderNumber || seatInfo.id,
    };

    const markup = renderToStaticMarkup(
      React.createElement(TicketTemplate, { data, options }),
    );
    wrapper.innerHTML = markup;

    const child = wrapper.firstElementChild;
    if (child && child.style) {
      child.style.width = '560px';
      const scale = settings.scale || settings.design.scale;
      if (scale && scale !== 1) {
        child.style.transform = `scale(${scale})`;
        child.style.transformOrigin = 'top left';
      }
    }

    await new Promise((r) => setTimeout(r, 100));

    const canvas = await html2canvas(wrapper.firstElementChild, {
      backgroundColor: null,
      useCORS: true,
    });
    document.body.removeChild(wrapper);
    if (!canvas.width || !canvas.height) continue;
    const imgData = canvas.toDataURL('image/png');
    const imgBytes = await fetch(imgData).then((res) => res.arrayBuffer());
    const img = await pdfDoc.embedPng(imgBytes);
    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
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

export default downloadTicketsPDF;
