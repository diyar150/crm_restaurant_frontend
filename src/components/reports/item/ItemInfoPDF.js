import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import Rudaw from '../../../assets/fonts/rudawregular2.ttf';
import PdfReportHeader from '../../common/PdfReportHeader';

// 1. Font registration
Font.register({
  family: 'Rudaw',
  fonts: [{ src: Rudaw, fontWeight: 'normal' }],
});

// 2. Styles
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
  sumRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 16,
    boxSizing: 'border-box',
    width: '100%',
    border: '1px solid #d1d5db',
  },
  sumTitle: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#222',
    flex: 1,
    textAlign: 'right',
  },
  sumText: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#222',
    flex: 2,
    textAlign: 'left',
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  signatureBox: {
    borderTop: '1px solid #888',
    width: 120,
    textAlign: 'center',
    fontSize: 10,
    paddingTop: 4,
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
  col2: { flex: 1.5 },
  col3: { flex: 1.5 },
  col4: { flex: 1.5 },
  col5: { flex: 2 },
  col6: { flex: 1.5 },
  col7: { flex: 1.5 },
  col8: { flex: 2 },
});

// 3. Utility
function formatNumberWithCommas(value) {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 4. Main component
const ItemInfoPDF = ({
  items = [],
  categories = [],
  brands = [],
  company = {},
  filters = {},
}) => {
  // Prepare filter display
  const filterTexts = [];
  if (filters.category_id) {
    const cat = categories.find(c => c.id === filters.category_id);
    filterTexts.push(`گرووپ: ${cat ? cat.name : filters.category_id}`);
  }
  if (filters.brand_id) {
    const brand = brands.find(b => b.id === filters.brand_id);
    filterTexts.push(`براند: ${brand ? brand.name : filters.brand_id}`);
  }
  if (filters.barcode) {
    filterTexts.push(`بارکۆد: ${filters.barcode}`);
  }
  if (filters.name) {
    filterTexts.push(`ناو: ${filters.name}`);
  }

  // Export/print date
  const exportDate = new Date().toLocaleString('ckb-IQ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Reusable PDF Header */}
        <PdfReportHeader
          company={company}
          title="ڕاپۆرتی کاڵاکان"
          filters={filterTexts}
          exportDate={exportDate}
          styles={styles}
        />

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.col1]}>#</Text>
            <Text style={[styles.cell, styles.col2]}>گرووپ</Text>
            <Text style={[styles.cell, styles.col3]}>براند</Text>
            <Text style={[styles.cell, styles.col4]}>بارکۆد</Text>
            <Text style={[styles.cell, styles.col5]}>ناو</Text>
            <Text style={[styles.cell, styles.col6]}>نرخ</Text>
            <Text style={[styles.cell, styles.col7]}>جۆر</Text>
            <Text style={[styles.cell, styles.col8]}>وەسف</Text>
          </View>

          {/* Data rows */}
          {items.map((item, idx) => (
            <View style={styles.row} key={item.id}>
              <Text style={[styles.cell, styles.col1]}>{idx + 1}</Text>
              <Text style={[styles.cell, styles.col2]}>{categories.find(c => c.id === item.category_id)?.name || ''}</Text>
              <Text style={[styles.cell, styles.col3]}>{brands.find(b => b.id === item.brand_id)?.name || ''}</Text>
              <Text style={[styles.cell, styles.col4]}>{item.barcode}</Text>
              <Text style={[styles.cell, styles.col5]}>{item.name}</Text>
              <Text style={[styles.cell, styles.col6]}>{formatNumberWithCommas(item.cost)}</Text>
              <Text style={[styles.cell, styles.col7]}>{item.isService ? "خزمەتگوزاری" : "کاڵا"}</Text>
              <Text style={[styles.cell, styles.col8]}>{item.description}</Text>
            </View>
          ))}

          {/* Sum row */}
          <View style={styles.sumRow}>
            <Text style={styles.sumTitle}>ژمارەی گشتی</Text>
            <Text style={styles.sumText}>{items.length}</Text>
          </View>
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


export default ItemInfoPDF;