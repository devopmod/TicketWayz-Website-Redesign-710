import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const MARKUP = '<div class="ticket">Mock</div>';

global.document = {
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    firstElementChild: { style: {} },
    click: () => {},
    set innerHTML(html) {
      this.firstElementChild = { style: {}, outerHTML: html };
    },
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
};

global.__mockLinkClicks = [];

if (!global.URL) global.URL = function URL() {};
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};

async function loadExporter(renderToStaticMarkupMock, html2canvasMock, ticketUtilsMock) {
  global.__mockHtml2Canvas = html2canvasMock;
  global.__mockRenderToStaticMarkup = renderToStaticMarkupMock;
  global.__mockTicketUtils = ticketUtilsMock;
  const code = await fs.readFile(new URL('./ticketExport.js', import.meta.url), 'utf8');
  const patched = code
    .replace("import html2canvas from 'html2canvas';", 'const html2canvas = global.__mockHtml2Canvas;')
    .replace("import React from 'react';", 'const React = { createElement: (_c, props) => ({ props }) };')
    .replace("import { renderToStaticMarkup } from 'react-dom/server';", 'const renderToStaticMarkup = global.__mockRenderToStaticMarkup;')
    .replace("import TicketTemplate from '../components/ticket/TicketTemplate.jsx';", 'const TicketTemplate = null;')
    .replace("import { buildTermsText } from './ticketUtils.js';", 'const { buildTermsText } = global.__mockTicketUtils;');
  const { exportTicketsPNG } = await import(`data:text/javascript;base64,${Buffer.from(patched).toString('base64')}`);
  delete global.__mockHtml2Canvas;
  delete global.__mockRenderToStaticMarkup;
  delete global.__mockTicketUtils;
  return exportTicketsPNG;
}

test('exportTicketsPNG renders ticket with accent color', async () => {
  const renderArgs = [];
  let canvasCalls = 0;
  const html2canvasMock = async () => {
    canvasCalls++;
    return { width: 100, height: 50, toDataURL: () => 'data:image/png;base64,AAAA' };
  };
  const renderToStaticMarkupMock = (element) => { renderArgs.push(element.props); return MARKUP; };
  const exportTicketsPNG = await loadExporter(renderToStaticMarkupMock, html2canvasMock, { buildTermsText: () => 'No refunds' });
  const order = {
    seats: [{ id: 'ID1', section: 'A', row_number: '1', seat_number: '1', gate: 'G1', price: '50' }],
    event: { title: 'Show', location: 'Venue', address: '123 St' },
    company: { name: 'Brand' },
    currency: 'USD',
    orderNumber: 'ORD1',
  };
  await exportTicketsPNG(order, 'test', { design: { accent: '#00ff00', showQRCode: false }, ticketContent: { showPrice: true, showTerms: true } });
  assert.equal(canvasCalls, 1);
  assert.equal(renderArgs[0].options.accent, '#00ff00');
});
