import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { drawTicketPage } from './pdfGenerator.js';

test('drawTicketPage adds a page to the PDF document', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const order = { event: {} };
  const settings = { design: { showQRCode: false } };

  await drawTicketPage(pdfDoc, order, null, settings, font);

  assert.equal(pdfDoc.getPageCount(), 1);
});

test('drawTicketPage renders text', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const order = { event: { artist: 'Hello world!' } };
  const settings = { design: { showQRCode: false } };

  await drawTicketPage(pdfDoc, order, null, settings, font);
  const pdfBytes = await pdfDoc.save();
  assert.ok(pdfBytes.byteLength > 0);
});
