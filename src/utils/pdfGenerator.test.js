import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Minimal DOM stubs
global.document = {
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    firstElementChild: { style: {} },
    click: () => {},
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
};

global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};
global.fetch = async () => ({ arrayBuffer: async () => new ArrayBuffer(0) });

test('downloadTicketsPDF creates a page for each seat', async (t) => {
  const addPageCalls = [];
  const pdfDocMock = {
    addPage: (size) => { addPageCalls.push(size); return { drawImage: () => {} }; },
    embedPng: async () => ({ width: 100, height: 50 }),
    save: async () => new Uint8Array(),
  };
  let canvasCalls = 0;
  const html2canvasMock = async () => {
    canvasCalls++;
    return { width: 100, height: 50, toDataURL: () => 'data:image/png;base64,AAAA' };
  };

  global.__mockPDFLib = { PDFDocument: { create: async () => pdfDocMock } };
  global.__mockHtml2Canvas = html2canvasMock;
  const code = await fs.readFile(new URL('./pdfGenerator.js', import.meta.url), 'utf8');
  const patched = code
    .replace("import { PDFDocument } from 'pdf-lib';", 'const { PDFDocument } = global.__mockPDFLib;')
    .replace("import html2canvas from 'html2canvas';", 'const html2canvas = global.__mockHtml2Canvas;')
    .replace("import React from 'react';", 'const React = { createElement: () => ({}) };')
    .replace("import { createRoot } from 'react-dom/client';", 'const createRoot = () => ({ render: () => {}, unmount: () => {} });')
    .replace("import TicketTemplate from '../components/ticket/TicketTemplate.jsx';", 'const TicketTemplate = () => null;');
  const { downloadTicketsPDF } = await import(`data:text/javascript;base64,${Buffer.from(patched).toString('base64')}`);

  const order = { seats: [{ id: 1 }, { id: 2 }], event: {} };
  await downloadTicketsPDF(order, 'test.pdf', { design: {}, ticketContent: {} });

  assert.equal(canvasCalls, 2);
  assert.equal(addPageCalls.length, 2);
  delete global.__mockPDFLib;
  delete global.__mockHtml2Canvas;
});
