import React from 'react';
import ReactDOMServer from 'react-dom/server';
import QRCode from 'qrcode';
import TicketTemplate from '../components/ticket/TicketTemplateNode.js';

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

  const props = {
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
    qrValue: rest.qrValue || order.orderNumber || seatInfo.id,
    ticketId: rest.ticketId || seatInfo.id || order.orderNumber,
    terms: rest.terms || settings.terms,
    rounded:
      rest.rounded ??
      (rest.radius === undefined ? true : rest.radius !== false && rest.radius !== 0 && rest.radius !== 'none'),
    shadow: rest.shadow ?? true,
    showQr: rest.showQr ?? true,
    showPrice: rest.showPrice ?? true,
    showTerms: rest.showTerms ?? true,
    darkHeader: rest.darkHeader ?? false,
  };

  if (props.showQr && props.qrValue) {
    try {
      props.qrImage = await QRCode.toDataURL(String(props.qrValue));
    } catch {
      props.qrImage = '';
    }
  }

  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(TicketTemplate, props),
  );
}

export default applyTicketTemplate;
