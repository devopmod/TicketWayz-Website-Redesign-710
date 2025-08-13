import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const RESERVED_HTML = `<div class="ticket w-[560px] bg-white text-gray-900 font-sans border rounded-lg overflow-hidden shadow-md"><div class="relative h-40 w-full"><div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div><span class="absolute top-4 left-4 px-2 py-1 text-white text-xs font-semibold rounded" style="background-color:#00ff00">Brand</span></div><div class="p-6 space-y-2"><h1 class="text-2xl font-bold">Show</h1><div class="text-sm">Venue</div><div class="text-sm text-gray-500">123 St</div><div class="mt-6 grid grid-cols-5 gap-4 text-center"><div><div class="text-xs text-gray-500">SECTION</div><div class="text-lg font-semibold">A</div></div><div><div class="text-xs text-gray-500">ROW</div><div class="text-lg font-semibold">1</div></div><div><div class="text-xs text-gray-500">SEAT</div><div class="text-lg font-semibold">1</div></div><div><div class="text-xs text-gray-500">GATE</div><div class="text-lg font-semibold">G1</div></div><div><div class="text-xs text-gray-500">PRICE</div><div class="text-lg font-semibold">50 USD</div></div></div><div class="mt-6 text-[10px] text-gray-500">No refunds</div></div></div>`;
const GA_HTML = `<div class="ticket w-[560px] bg-white text-gray-900 font-sans border rounded-lg overflow-hidden shadow-md"><div class="relative h-40 w-full"><div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div><span class="absolute top-4 left-4 px-2 py-1 text-white text-xs font-semibold rounded" style="background-color:#000000b3">Brand</span></div><div class="p-6 space-y-2"><h1 class="text-2xl font-bold">Show</h1><div class="text-sm">Venue</div><div class="text-sm text-gray-500">123 St</div><div class="mt-6 grid grid-cols-4 gap-4 text-center"></div></div></div>`;

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

global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};
global.fetch = async () => ({ arrayBuffer: async () => new ArrayBuffer(0) });

async function loadDownloader(renderToStaticMarkupMock, html2canvasMock, pdfDocMock, ticketUtilsMock) {
  global.__mockPDFLib = { PDFDocument: { create: async () => pdfDocMock } };
  global.__mockHtml2Canvas = html2canvasMock;
  global.__mockRenderToStaticMarkup = renderToStaticMarkupMock;
  global.__mockTicketUtils = ticketUtilsMock;
  const code = await fs.readFile(new URL('./pdfGenerator.js', import.meta.url), 'utf8');
  const patched = code
    .replace("import { PDFDocument } from 'pdf-lib';", 'const { PDFDocument } = global.__mockPDFLib;')
    .replace("import html2canvas from 'html2canvas';", 'const html2canvas = global.__mockHtml2Canvas;')
    .replace("import React from 'react';", 'const React = { createElement: (_c, props) => ({ props }) };')
    .replace("import { renderToStaticMarkup } from 'react-dom/server';", 'const renderToStaticMarkup = global.__mockRenderToStaticMarkup;')
    .replace("import TicketTemplate from '../components/ticket/TicketTemplate.jsx';", 'const TicketTemplate = null;')
    .replace("import { buildTermsText } from './ticketUtils.js';", 'const { buildTermsText } = global.__mockTicketUtils;');
  const { downloadTicketsPDF } = await import(`data:text/javascript;base64,${Buffer.from(patched).toString('base64')}`);
  delete global.__mockPDFLib;
  delete global.__mockHtml2Canvas;
  delete global.__mockRenderToStaticMarkup;
  delete global.__mockTicketUtils;
  return downloadTicketsPDF;
}

test('downloadTicketsPDF renders reserved tickets with accent color', async () => {
  const addPageCalls = [];
  const markups = [];
  const renderArgs = [];
  let canvasCalls = 0;
  const pdfDocMock = {
    addPage: (size) => { addPageCalls.push(size); return { drawImage: () => {} }; },
    embedPng: async () => ({ width: 100, height: 50 }),
    save: async () => new Uint8Array(),
  };
  const html2canvasMock = async () => { canvasCalls++; return { width: 100, height: 50, toDataURL: () => 'data:image/png;base64,AAAA' }; };
  const renderToStaticMarkupMock = (element) => { renderArgs.push(element.props); markups.push(RESERVED_HTML); return RESERVED_HTML; };
  const downloadTicketsPDF = await loadDownloader(renderToStaticMarkupMock, html2canvasMock, pdfDocMock, { buildTermsText: () => 'No refunds' });
  const order = { seats: [{ id: 'ID1', section: 'A', row_number: '1', seat_number: '1', gate: 'G1', price: '50' }], event: { title: 'Show', location: 'Venue', address: '123 St' }, company: { name: 'Brand' }, currency: 'USD', orderNumber: 'ORD1' };
  await downloadTicketsPDF(order, 'test.pdf', { design: { accent: '#00ff00', showQRCode: false }, ticketContent: { showPrice: true, showTerms: true } });
  assert.equal(markups[0], RESERVED_HTML);
  assert.equal(canvasCalls, 1);
  assert.equal(addPageCalls.length, 1);
  assert.equal(renderArgs[0].options.accent, '#00ff00');
});

