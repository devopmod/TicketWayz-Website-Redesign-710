import React from 'react';
import { Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { CARD_WIDTH, HEADER_HEIGHT, sanitizeTicket } from './TicketTemplate';

Font.register({
  family: 'Roboto',
  src: new URL('../../assets/fonts/Roboto-Regular.ttf', import.meta.url).href,
  format: 'truetype',
});

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
    fontFamily: 'Roboto',
  },
  content: {
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  smallText: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 2,
    fontFamily: 'Roboto',
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
    fontFamily: 'Roboto',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    fontFamily: 'Roboto',
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
    fontFamily: 'Roboto',
  },
  terms: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    borderStyle: 'dashed',
    paddingTop: 12,
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'Roboto',
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

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.ticket}>
        <View style={styles.hero}>
          {heroImage && <Image src={heroImage} style={styles.heroImage} />}
          {brand && <Text style={styles.brand}>{brand}</Text>}
        </View>
        <View style={styles.content}>
          {artist && <Text style={styles.heading}>{artist}</Text>}
          {(date || time) && (
            <Text style={styles.smallText}>
              {date}
              {time ? ` ${time}` : ''}
            </Text>
          )}
          {venue && <Text style={[styles.smallText, styles.highlight]}>{venue}</Text>}
          {address && <Text style={styles.smallText}>{address}</Text>}

          {(section || row || seat || (showPrice && price)) && (
            <View>
              <View style={styles.infoRow}>{[
                section && (
                  <View style={styles.infoBox} key="section">
                    <Text style={styles.infoLabel}>SECTION</Text>
                    <Text style={styles.infoValue}>{section}</Text>
                  </View>
                ),
                showPrice && price && (
                  <View style={[styles.infoBox, { alignItems: 'flex-end' }]} key="price">
                    <Text style={styles.infoLabel}>PRICE</Text>
                    <Text style={styles.infoValue}>
                      {price}
                      {currency ? ` ${currency}` : ''}
                    </Text>
                  </View>
                ),
              ].filter(Boolean)}</View>
              <View style={styles.infoRow}>{[
                row && (
                  <View style={styles.infoBox} key="row">
                    <Text style={styles.infoLabel}>ROW</Text>
                    <Text style={styles.infoValue}>{row}</Text>
                  </View>
                ),
                seat && (
                  <View style={[styles.infoBox, { alignItems: 'flex-end' }]} key="seat">
                    <Text style={styles.infoLabel}>SEAT</Text>
                    <Text style={styles.infoValue}>{seat}</Text>
                  </View>
                ),
              ].filter(Boolean)}</View>
            </View>
          )}

          {showQr && qrSrc && (
            <View style={styles.qrContainer}>
              <Image style={styles.qr} src={qrSrc} />
              {actualTicketId && <Text style={styles.ticketId}>{actualTicketId}</Text>}
            </View>
          )}
          {qrValue && actualTicketId && qrValue !== actualTicketId && (
            <Text style={styles.ticketId}>{qrValue}</Text>
          )}

          {terms && <Text style={styles.terms}>{terms}</Text>}
        </View>
      </View>
    </Page>
  );
};

export default TicketTemplatePDF;

