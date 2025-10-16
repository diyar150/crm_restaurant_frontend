import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import Rudaw from '../../../assets/fonts/rudawregular2.ttf';
import PdfReportHeader from '../../common/PdfReportHeader';

// Register font
Font.register({
  family: 'Rudaw',
  fonts: [{ src: Rudaw, fontWeight: 'normal' }],
});

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Rudaw',
    direction: 'rtl',
    position: 'relative',
  },
  title: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  filters: {
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'center',
    color: '#444',
  },
  exportDate: {
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'center',
    color: '#444',
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 5,
    direction: 'rtl',
  },
  row: {
    flexDirection: 'row-reverse',
  },
  cell: {
    padding: 4,
    border: '1px solid #eee',
    fontSize: 10,
    textAlign: 'right',
  },
  header: {
    fontWeight: 'bold',
    backgroundColor: '#eee',
    fontSize: 11,
  },
  image: {
    width: 32,
    height: 32,
    borderRadius: 16,
    objectFit: 'cover',
    margin: 2,
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 18,
    borderTop: '1px solid #eee',
    paddingTop: 8,
    fontSize: 10,
    color: '#888',
    width: 'auto',
    height: 18,
  },
  footerRight: {
    position: 'absolute',
    right: 0,
    textAlign: 'right',
    width: '48%',
  },
  footerLeft: {
    position: 'absolute',
    left: 0,
    textAlign: 'left',
    width: '48%',
  },
  pageNumber: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#888',
  },
  // Column widths
  col1: { flex: 0.5 },
  col2: { flex: 2.2 },
  col3: { flex: 1.2 },
  col4: { flex: 1.2 },
  col5: { flex: 0.8 },
  col6: { flex: 1.2 },
  col7: { flex: 1.2 },
  col8: { flex: 0.8 },
  col9: { flex: 1 },
});

const DriverInfoPDF = ({
  drivers = [],
  company = {},
  filters = {},
}) => {
  // Prepare filter display
  const filterTexts = [];
  if (filters.name) filterTexts.push(`گەڕان: ${filters.name}`);
  if (filters.status) filterTexts.push(`دۆخ: ${filters.status}`);

  // Export/print date
  const exportDate = new Date().toLocaleString('ckb-IQ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PDF Header */}
        <PdfReportHeader
          company={company}
          title="ڕاپۆرتی زانیاری شۆفێر"
          filters={filterTexts}
          exportDate={exportDate}
          styles={styles}
        />

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.col1]}>#</Text>
            <Text style={[styles.cell, styles.col2]}>ناو</Text>
            <Text style={[styles.cell, styles.col3]}>ژمارەی مۆبایل</Text>
            <Text style={[styles.cell, styles.col4]}>ژمارەی مۆڵەت</Text>
            <Text style={[styles.cell, styles.col5]}>ژمارەی ناسنامە</Text>
            <Text style={[styles.cell, styles.col6]}>ناونیشان</Text>
            <Text style={[styles.cell, styles.col7]}>بەرواری دامەزراندن</Text>
            <Text style={[styles.cell, styles.col8]}>ژمارەی ئۆتۆمبێل</Text>
            <Text style={[styles.cell, styles.col9]}>ناوی ئۆتۆمبێل</Text>
          </View>

          {/* Data rows */}
          {drivers.map((driver, idx) => (
            <View style={styles.row} key={driver.id || idx}>
              <Text style={[styles.cell, styles.col1]}>{idx + 1}</Text>
              <Text style={[styles.cell, styles.col2]}>{driver.name}</Text>
              <Text style={[styles.cell, styles.col3]}>{driver.phone}</Text>
              <Text style={[styles.cell, styles.col4]}>{driver.license_number}</Text>
              <Text style={[styles.cell, styles.col5]}>{driver.national_id}</Text>
              <Text style={[styles.cell, styles.col6]}>{driver.address}</Text>
              <Text style={[styles.cell, styles.col7]}>{driver.hired_date}</Text>
              <Text style={[styles.cell, styles.col8]}>{driver.car_number}</Text>
              <Text style={[styles.cell, styles.col9]}>{driver.car_name}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        {(company?.address || company?.supplier_name) && (
          <View style={styles.footer}>
            {company?.address && (
              <Text style={styles.footerRight}>ناونیشان: {company.address}</Text>
            )}
            {company?.supplier_name && (
              <Text style={styles.footerLeft}>{company.supplier_name}</Text>
            )}
          </View>
        )}

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default DriverInfoPDF;