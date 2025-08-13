import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, PDFName } from 'pdf-lib';
import { drawTicketPage } from './pdfGenerator.js';

function hexText(text) {
  return `<${Buffer.from(text, 'utf8').toString('hex').toUpperCase()}>`;
}

function getContent(page) {
  return Buffer.from(page.getContentStream().getUnencodedContents()).toString('latin1');
}

function mockFetch() {
  return async (url) => {
    if (typeof url === 'string' && url.startsWith('data:')) {
      const base64 = url.split(',')[1];
      return new Response(Buffer.from(base64, 'base64'));
    }
    throw new Error('Network access blocked');
  };
}

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

test('canvas size is 560px wide and height changes with terms', async () => {
  const order = { event: { title: 'E' }, terms: 'T' };

  // no QR, no terms
  const pdfNoExtras = await PDFDocument.create();
  const font1 = await pdfNoExtras.embedFont(StandardFonts.Helvetica);
  const originalFetch = global.fetch;
  global.fetch = mockFetch();
  try {
    await drawTicketPage(
      pdfNoExtras,
      order,
      null,
      { design: { showQRCode: false }, ticketContent: { showTerms: false } },
      font1
    );
  } finally {
    global.fetch = originalFetch;
  }
  const page = pdfNoExtras.getPage(0);
  assert.equal(page.getWidth(), 560);
  assert.equal(page.getHeight(), 700);

  // enable terms increases height
  const pdfTerms = await PDFDocument.create();
  const font2 = await pdfTerms.embedFont(StandardFonts.Helvetica);
  const originalFetch2 = global.fetch;
  global.fetch = mockFetch();
  try {
    await drawTicketPage(
      pdfTerms,
      order,
      null,
      { design: { showQRCode: false }, ticketContent: { showTerms: true } },
      font2
    );
  } finally {
    global.fetch = originalFetch2;
  }
  assert.equal(pdfTerms.getPage(0).getHeight(), 860);
});

test('reserved ticket includes brand, seat grid, price and QR block', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const order = {
    event: { title: 'Show', date: '2025-08-13T20:25:00Z', location: 'Venue' },
    company: { name: 'MyBrand' },
    orderNumber: '123',
    price: '$50'
  };
  const seat = { section: 'SEC', row: 'ROW', number: '10' };
  const settings = {
    design: { showQRCode: true },
    ticketContent: { showTerms: false, showPrice: true }
  };
  const originalFetch = global.fetch;
  global.fetch = mockFetch();
  try {
    await drawTicketPage(pdfDoc, order, seat, settings, font);
  } finally {
    global.fetch = originalFetch;
  }
  const page = pdfDoc.getPage(0);
  const content = getContent(page);
  assert.ok(content.includes(hexText('MyBrand')));
  assert.ok(content.includes(hexText('SECTION')));
  assert.ok(content.includes(hexText('SEC')));
  assert.ok(content.includes(hexText('ROW')));
  assert.ok(content.includes(hexText('SEAT')));
  assert.ok(content.includes(hexText('10')));
  assert.ok(content.includes(hexText('PRICE')));
  assert.ok(content.includes(hexText('$50')));
  const xobj = page.node.Resources().lookup(PDFName.of('XObject'));
  assert.equal(xobj ? xobj.keys().length : 0, 1);
});

test('GA ticket hides price, shows terms and no QR', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const order = {
    event: { title: 'Show', date: '2025-08-13T20:25:00Z', location: 'Venue' },
    terms: 'All sales final'
  };
  const settings = {
    design: { showQRCode: false },
    ticketContent: { showTerms: true, showPrice: false }
  };
  const originalFetch = global.fetch;
  global.fetch = mockFetch();
  try {
    await drawTicketPage(pdfDoc, order, null, settings, font);
  } finally {
    global.fetch = originalFetch;
  }
  const page = pdfDoc.getPage(0);
  const content = getContent(page);
  assert.ok(content.includes(hexText('ADMISSION')));
  assert.ok(content.includes(hexText('GA')));
  assert.ok(!content.includes(hexText('PRICE')));
  assert.ok(content.includes(hexText('All sales final')));
  const xobj = page.node.Resources().lookup(PDFName.of('XObject'));
  assert.equal(xobj ? xobj.keys().length : 0, 0);
  assert.equal(page.getHeight(), 860);
});
