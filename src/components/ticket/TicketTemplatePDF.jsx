import React from 'react';
import { Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { CARD_WIDTH, HEADER_HEIGHT, sanitizeTicket } from './TicketTemplate';
import robotoTtf from '../../assets/fonts/Roboto-Regular.ttf?url';

let fontFamily = 'Helvetica';
try {
  Font.register({ family: 'Roboto', src: robotoTtf, format: 'truetype' });
  fontFamily = 'Roboto';
} catch (err) {
  console.error('Failed to register Roboto font', err);
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticket: {
    width: CARD_WIDTH,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  hero: {
    width: '100%',
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    objectFit: 'cover',
  },
  brand: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    borderRadius: 4,
    fontFamily,
  },
  content: {
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily,
  },
  smallText: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 2,
    fontFamily,
  },
  highlight: {
    color: '#f59e0b',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  infoBox: {
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    fontFamily,
  },
  qrContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  qr: {
    width: 164,
    height: 164,
  },
  ticketId: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    fontFamily,
  },
  terms: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    borderStyle: 'dashed',
    paddingTop: 12,
    fontSize: 10,
    color: '#6b7280',
    fontFamily,
  },
});

const TicketTemplatePDF = ({ data = {}, options = {} }) => {
  const ticket = sanitizeTicket(data);
  const {
    heroImage,
    brand,
    artist,
    date,
    time,
    venue,
    address,
    section,
    row,
    seat,
    price,
    currency,
    ticketId,
    qrImage,
    qrValue,
    terms,
  } = ticket;

  const actualTicketId = ticketId || qrValue;
  const { showPrice = true, showQr = true } = options;
  const qrSrc = qrImage || (qrValue ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrValue)}&size=164x164` : null);

  const firstRow = [];
  if (section) {
    firstRow.push(
      <View style={styles.infoBox} key="section">
        <Text style={styles.infoLabel}>SECTION</Text>
        <Text style={styles.infoValue}>{section}</Text>
      </View>,
    );
  }
  if (showPrice && price) {
    firstRow.push(
      <View style={[styles.infoBox, { alignItems: 'flex-end' }]} key="price">
        <Text style={styles.infoLabel}>PRICE</Text>
        <Text style={styles.infoValue}>
          {price}
          {currency ? ` ${currency}` : ''}
        </Text>
      </View>,
    );
  }

  const secondRow = [];
  if (row) {
    secondRow.push(
      <View style={styles.infoBox} key="row">
        <Text style={styles.infoLabel}>ROW</Text>
        <Text style={styles.infoValue}>{row}</Text>
      </View>,
    );
  }
  if (seat) {
    secondRow.push(
      <View style={[styles.infoBox, { alignItems: 'flex-end' }]} key="seat">
        <Text style={styles.infoLabel}>SEAT</Text>
        <Text style={styles.infoValue}>{seat}</Text>
      </View>,
    );
  }

  const filteredFirstRow = firstRow.filter(Boolean);
  const filteredSecondRow = secondRow.filter(Boolean);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.ticket}>
        <View style={styles.hero}>
          {heroImage ? <Image src={heroImage} style={styles.heroImage} /> : null}
          {brand ? <Text style={styles.brand}>{brand}</Text> : null}
        </View>
        <View style={styles.content}>
          {artist ? <Text style={styles.heading}>{artist}</Text> : null}
          {(date || time) ? (
            <Text style={styles.smallText}>
              {date}
              {time ? ` ${time}` : ''}
            </Text>
          ) : null}
          {venue ? <Text style={[styles.smallText, styles.highlight]}>{venue}</Text> : null}
          {address ? <Text style={styles.smallText}>{address}</Text> : null}

          {(filteredFirstRow.length > 0 || filteredSecondRow.length > 0) ? (<View style={{ flexDirection: 'row' }}><View style={{ flex: 1, borderRightWidth: 1, borderColor: 'transparent', alignItems: 'flex-start' }}>{filteredFirstRow}</View><View style={{ flex: 1, borderLeftWidth: 1, borderColor: 'transparent', alignItems: 'flex-end' }}>{filteredSecondRow}</View></View>) : null}

          {showQr && qrSrc ? (
            <View style={styles.qrContainer}>
              <Image style={styles.qr} src={qrSrc} />
              {actualTicketId ? <Text style={styles.ticketId}>{actualTicketId}</Text> : null}
            </View>
          ) : null}
          {qrValue && actualTicketId && qrValue !== actualTicketId ? (
            <Text style={styles.ticketId}>{qrValue}</Text>
          ) : null}

          {terms ? <Text style={styles.terms}>{terms}</Text> : null}
        </View>
      </View>
    </Page>
  );
};

export default TicketTemplatePDF;

