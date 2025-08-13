import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QRCode from 'qrcode';
import TicketTemplate from '../components/ticket/TicketTemplateNode.js';

export function sanitizeTicket(data = {}) {
  const stringFields = [
    'heroImage',
    'brand',
    'artist',
    'date',
    'time',
    'venue',
    'address',
    'section',
    'row',
    'seat',
    'gate',
    'price',
    'currency',
    'qrImage',
    'ticketId',
    'terms',
  ];
  const result = { ...data };
  for (const key of stringFields) {
    const val = result[key];
    result[key] = val === undefined || val === null ? undefined : String(val);
  }
  return result;
}

export async function applyTicketTemplate(data = {}) {
  const { order = {}, seat = {}, settings = {}, ...rest } = data;
  const event = order.event || {};
  const company = order.company || {};
  const seatInfo = Object.keys(seat).length ? seat : (order.seat || {});

  let date = rest.date;
  let time = rest.time;
  const dateTime = rest.dateTime || event.date;
  if (dateTime && !date && !time) {
    try {
      const dt = new Date(dateTime);
      date = dt.toLocaleDateString();
      time = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      // ignore parsing errors
    }
  }

  const ticketData = sanitizeTicket({
    heroImage: rest.heroUrl || settings.design?.heroUrl || event.image,
    brand: rest.brand || company.name,
    artist: rest.artist || event.title,
    date,
    time,
    venue: rest.venue || event.location,
    address: rest.address || event.address,
    section: rest.section || seatInfo.section,
    row: rest.row || seatInfo.row_number,
    seat: rest.seat || seatInfo.seat_number,
    gate: rest.gate || seatInfo.gate,
    price: rest.price || seatInfo.price || order.price,
    currency: rest.currency || order.currency,
    ticketId: rest.ticketId || seatInfo.id || order.orderNumber,
    terms: rest.terms || settings.terms,
  });

  const options = {
    accent: rest.accent || settings.design?.accent,
    darkHeader: rest.darkHeader ?? settings.design?.darkHeader ?? false,
    showPrice: rest.showPrice ?? true,
    showQr: rest.showQr ?? true,
    showTerms: rest.showTerms ?? true,
    radius:
      rest.radius === undefined ? settings.design?.rounded : rest.radius,
    shadow: rest.shadow ?? true,
    qrValue: rest.qrValue || order.orderNumber || seatInfo.id,
  };

  if (options.showQr && options.qrValue) {
    try {
      ticketData.qrImage = await QRCode.toDataURL(String(options.qrValue));
    } catch {
      ticketData.qrImage = '';
    }
  }

  return renderToStaticMarkup(
    React.createElement(TicketTemplate, { data: ticketData, options }),
  );
}

export default applyTicketTemplate;
