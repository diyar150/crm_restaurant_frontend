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
  col2: { flex: 1.2 },
  col3: { flex: 1.2 },
  col4: { flex: 1.2 },
  col5: { flex: 1.2 },
  col6: { flex: 1.2 },
  col7: { flex: 1.2 },
  col8: { flex: 1.2 },
  col9: { flex: 2 },
});

// 3. Utility
function formatNumberWithCommas(value) {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 4. Main component
const ItemTransactionPDF = ({
  transactions = [],
  warehouses = [],
  items = [],
  units = [],
  employees = [],
  categories = [],
  company = {},
  filters = {},
}) => {
  // Prepare filter display
  const filterTexts = [];
  if (filters.warehouse) {
    const warehouse = warehouses.find(w => w.id === filters.warehouse);
    filterTexts.push(`کۆگا: ${warehouse ? warehouse.name : filters.warehouse}`);
  }
  if (filters.item) {
    // Fix: always extract id if object
    const itemId = typeof filters.item === 'object' ? filters.item.id : filters.item;
    const item = items.find(i => i.id === itemId);
    filterTexts.push(`کاڵا: ${item ? item.name : itemId}`);
  }
  if (filters.type) {
    filterTexts.push(`جۆر: ${filters.type === '+' ? 'زیادکردن' : 'کەمکردن'}`);
  }
  if (filters.employee) {
    const emp = employees.find(e => e.id === filters.employee);
    filterTexts.push(`کارمەند: ${emp ? emp.name : filters.employee}`);
  }
  if (filters.category) {
    const cat = categories.find(c => c.id === filters.category);
    filterTexts.push(`گرووپ: ${cat ? cat.name : filters.category}`);
  }
  if (filters.dateRange?.start || filters.dateRange?.end) {
    filterTexts.push(
      `لە: ${filters.dateRange.start || '-'} بۆ: ${filters.dateRange.end || '-'}`
    );
  }
  if (filters.search) {
    filterTexts.push(`گەڕان: ${filters.search}`);
  }

  // Export/print date
  const exportDate = new Date().toLocaleString('ckb-IQ');

  // Total quantity
  const totalQuantity = transactions.reduce((sum, t) => sum + Number(t.quantity || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Reusable PDF Header */}
        <PdfReportHeader
          company={company}
          title="ڕاپۆرتی مامەڵەی کاڵا"
          filters={filterTexts}
          exportDate={exportDate}
          styles={styles}
        />

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.col1]}>#</Text>
            <Text style={[styles.cell, styles.col2]}>جۆر</Text>
            <Text style={[styles.cell, styles.col3]}>کۆگا</Text>
            <Text style={[styles.cell, styles.col4]}>کاڵا</Text>
            <Text style={[styles.cell, styles.col5]}>یەکە</Text>
            <Text style={[styles.cell, styles.col6]}>بڕ</Text>
            <Text style={[styles.cell, styles.col7]}>کارمەند</Text>
            <Text style={[styles.cell, styles.col8]}>کات</Text>
            <Text style={[styles.cell, styles.col9]}>تێبینی</Text>
          </View>

          {/* Data rows */}
          {transactions.map((tr, idx) => (
            <View style={styles.row} key={tr.id}>
              <Text style={[styles.cell, styles.col1]}>{idx + 1}</Text>
              <Text style={[styles.cell, styles.col2]}>{tr.type === '+' ? 'زیادکردن' : 'کەمکردن'}</Text>
              <Text style={[styles.cell, styles.col3]}>{warehouses.find(w => w.id === tr.warehouse_id)?.name || ''}</Text>
              <Text style={[styles.cell, styles.col4]}>{items.find(i => i.id === tr.item_id)?.name || ''}</Text>
              <Text style={[styles.cell, styles.col5]}>{units.find(u => u.id === tr.unit_id)?.name || ''}</Text>
              <Text style={[styles.cell, styles.col6]}>{formatNumberWithCommas(tr.quantity)}</Text>
              <Text style={[styles.cell, styles.col7]}>{employees.find(e => e.id === tr.employee_id)?.name || ''}</Text>
              <Text style={[styles.cell, styles.col8]}>{tr.created_at ? String(tr.created_at).slice(0, 16).replace('T', ' ') : ''}</Text>
              <Text style={[styles.cell, styles.col9]}>{tr.note}</Text>
            </View>
          ))}

          {/* Sum row */}
          <View style={styles.sumRow}>
            <Text style={styles.sumTitle}>کۆی گشتی بڕ</Text>
            <Text style={styles.sumText}>{formatNumberWithCommas(totalQuantity)}</Text>
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

export default ItemTransactionPDF;