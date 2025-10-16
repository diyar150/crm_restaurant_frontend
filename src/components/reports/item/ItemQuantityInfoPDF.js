import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import Rudaw from '../../../assets/fonts/rudawregular2.ttf';
import PdfReportHeader from '../../common/PdfReportHeader';

// Register font
Font.register({
  family: 'Rudaw',
  fonts: [{ src: Rudaw, fontWeight: 'normal' }],
});

// Styles
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    border: '1px solid #eee',
    fontSize: 10,
    textAlign: 'right',
    minWidth: 40,
    maxWidth: 120,
    overflow: 'hidden',
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
  // Column widths (responsive and based on text length)
  col1: { flex: 0.5, minWidth: 30, maxWidth: 40 },   // #
  col2: { flex: 1, minWidth: 60, maxWidth: 80 },     // گرووپ
  col3: { flex: 1, minWidth: 60, maxWidth: 80 },     // براند
  col4: { flex: 1, minWidth: 60, maxWidth: 80 },     // بارکۆد
  col5: { flex: 2, minWidth: 90, maxWidth: 140 },    // ناو
  col6: { flex: 1, minWidth: 60, maxWidth: 80 },     // کۆگا
  col7: { flex: 0.8, minWidth: 40, maxWidth: 60 },   // بڕ
  col8: { flex: 0.8, minWidth: 40, maxWidth: 60 },   // تێچوو
  col9: { flex: 1.2, minWidth: 60, maxWidth: 100 },  // کۆی تێچوو
});

// Utility
function formatNumberWithCommas(value) {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Main PDF component
const ItemQuantityInfoPDF = ({
  items = [],
  categories = [],
  brands = [],
  branches = [],
  warehouses = [],
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
if (filters.warehouse_id) {
  const warehouse = warehouses.find(w => w.id === filters.warehouse_id);
  filterTexts.push(`کۆگا: ${warehouse ? warehouse.name : filters.warehouse_id}`);
}
if (filters.branch_id) {
  const branch = (branches || []).find(b => String(b.id) === String(filters.branch_id));
filterTexts.push(`لق: ${branch ? branch.name : filters.branch_id}`);
}
if (filters.barcode) {
  filterTexts.push(`بارکۆد: ${filters.barcode}`);
}
if (filters.name) {
  filterTexts.push(`ناو: ${filters.name}`);
}
if (filters.min_quantity) {
  filterTexts.push(`کەمترین بڕ: ${filters.min_quantity}`);
}
if (filters.max_quantity) {
  filterTexts.push(`زۆرترین بڕ: ${filters.max_quantity}`);
}

  // Export/print date
  const exportDate = new Date().toLocaleString('ckb-IQ');

  // Sums
  const totalCost = items.reduce((acc, row) => acc + (Number(row.quantity || 0) * Number(row.cost || 0)), 0);
  const itemCount = items.length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <PdfReportHeader
          company={company}
          title="ڕاپۆرتی عددی کاڵا"
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
            <Text style={[styles.cell, styles.col6]}>کۆگا</Text>
            <Text style={[styles.cell, styles.col7]}>بڕ</Text>
            <Text style={[styles.cell, styles.col8]}>تێچوو</Text>
            <Text style={[styles.cell, styles.col9]}>کۆی تێچوو</Text>
          </View>

          {/* Data rows */}
          {items.map((item, idx) => (
            <View style={styles.row} key={item.item_id || idx}>
              <Text style={[styles.cell, styles.col1]}>{idx + 1}</Text>
              <Text style={[styles.cell, styles.col2]}>{item.category_name}</Text>
              <Text style={[styles.cell, styles.col3]}>{item.brand_name}</Text>
              <Text style={[styles.cell, styles.col4]}>{item.barcode}</Text>
              <Text style={[styles.cell, styles.col5]}>{item.name}</Text>
              <Text style={[styles.cell, styles.col6]}>{item.warehouse_name}</Text>
              <Text style={[styles.cell, styles.col7]}>{formatNumberWithCommas(item.quantity)}</Text>
              <Text style={[styles.cell, styles.col8]}>{formatNumberWithCommas(item.cost)}</Text>
              <Text style={[styles.cell, styles.col9]}>{formatNumberWithCommas(Number(item.quantity || 0) * Number(item.cost || 0))}</Text>
            </View>
          ))}

          {/* Sum row */}
         <View style={styles.sumRow}>
            <Text style={styles.sumTitle}>ژمارەی گشتی</Text>
            <Text style={styles.sumText}>{itemCount}</Text>
            <Text style={{ width: 30 }} /> {/* Add space between the two sections */}
            <Text style={styles.sumTitle}>کۆی نرخی گشتی</Text>
            <Text style={styles.sumText}>{formatNumberWithCommas(totalCost)}</Text>
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

}
export default ItemQuantityInfoPDF;