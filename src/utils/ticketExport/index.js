import React from 'react';
import { pdf, Document } from '@react-pdf/renderer';
import { TicketTemplatePDF } from '../../components/ticket';

/**
 * Build TicketTemplate props from order, seat and settings objects.
 * @param {Object} [order={}] Order data
 * @param {Object} [seat={}] Seat-specific data
 * @param {Object} [settings={}] Template settings
 * @returns {{data: Object, options: Object}} Props for TicketTemplate
 */
export function buildTicketTemplateProps(order = {}, seat = {}, settings = {}) {
  settings = settings || {};
  const design = settings.design || {};
  const ticketContent = settings.ticketContent || {};

  const event = order.event || {};
  const company = order.company || {};
  const seatInfo = seat || order.seat || {};

  const dateObj = event.date ? new Date(event.date) : null;
  const date = dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString() : order.date;
  const time =
    dateObj && !isNaN(dateObj)
      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : order.time;

  const data = {
    heroImage: design.heroUrl || event.image || order.heroImage,
    brand: company.name || order.brand,
    artist: event.title || order.artist,
    date,
    time,
    venue: event.location || order.venue,
    address: event.address || order.address,
    section: seatInfo.section || seatInfo.zoneName || seatInfo.zone?.name || order.section,
    row: seatInfo.row_number || order.row,
    seat: seatInfo.seat_number || order.seat,
    price: seatInfo.price ?? order.price,
    currency: order.currency,
    qrValue: seatInfo.id || order.orderNumber || order.qrValue,
    ticketType: seatInfo.ticketType || seatInfo.type || order.ticketType,
    terms: order?.event?.note || '',
  };

  const options = {
    accent: design.accent,
    darkHeader: design.darkHeader,
    showPrice: ticketContent.showPrice,
    showQr: design.showQRCode,
    showTerms: Boolean(order?.event?.note),
    rounded: design.rounded,
    shadow: design.shadow,
    scale: settings.scale || design.scale,
  };

  return { data, options };
}

/**
 * Generate a PDF of tickets and trigger download in the browser.
 *
 * @param {Object} order Order data including event, company and seats
 * @param {string} [baseFileName='ticket'] Base name for the resulting file
 * @param {Object} [templateSettings] Ticket template settings
 * @returns {Promise<void>} Resolves when the download has been triggered
 */
export async function downloadTicketsPDF(order, baseFileName = 'ticket', templateSettings) {
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
  const seats = Array.isArray(order.seats) && order.seats.length > 0 ? order.seats : [null];
  const pages = [];

  for (const seat of seats) {
    const seatInfo = seat || order.seat || {};
    const { data, options } = buildTicketTemplateProps(order, seatInfo, settings);
    pages.push(
      React.createElement(TicketTemplatePDF, {
        key: pages.length,
        data,
        options,
      }),
    );
  }

  if (pages.length === 0) return;

  const doc = pdf(React.createElement(Document, null, pages));
  const blob = await doc.toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseFileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default downloadTicketsPDF;
