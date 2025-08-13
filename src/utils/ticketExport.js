import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TicketTemplate from '../components/ticket/TicketTemplate.jsx';

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

export async function downloadTicketsPNG(order, baseFileName = 'ticket', templateSettings) {
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

  const seats = Array.isArray(order.seats) && order.seats.length > 0 ? order.seats : [null];
  const images = [];

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
      rounded: settings.design?.rounded,
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

    try {
      const dataUrl = await toPng(wrapper.firstElementChild, {
        cacheBust: true,
        backgroundColor: null,
      });
      images.push(dataUrl);
    } catch (err) {
      console.error('Error generating image', err);
    }

    document.body.removeChild(wrapper);
  }

  if (images.length === 0) return;

  if (images.length === 1) {
    const link = document.createElement('a');
    link.href = images[0];
    link.download = `${baseFileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const zip = new JSZip();
  for (let i = 0; i < images.length; i++) {
    const imgData = images[i];
    const blob = await fetch(imgData).then((res) => res.blob());
    zip.file(`${baseFileName}-${i + 1}.png`, blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseFileName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default downloadTicketsPNG;
