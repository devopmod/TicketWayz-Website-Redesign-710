import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { drawTicketPage } from './pdfGenerator.js';

test('drawTicketPage adds a page to the PDF document', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await fetch('https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf').then((res) =>
    res.arrayBuffer()
  );
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });
  const order = { event: {} };
  const settings = { design: { showQRCode: false } };

  await drawTicketPage(pdfDoc, order, null, settings, font);

  assert.equal(pdfDoc.getPageCount(), 1);
});

test('drawTicketPage supports Cyrillic characters', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await fetch('https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf').then((res) =>
    res.arrayBuffer()
  );
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });
  const order = { event: { artist: 'Привет мир!' } };
  const settings = { design: { showQRCode: false } };

  await drawTicketPage(pdfDoc, order, null, settings, font);
  const pdfBytes = await pdfDoc.save();
  assert.ok(pdfBytes.byteLength > 0);
});
