import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import Rudaw from '../../../assets/fonts/rudawregular2.ttf';
import PdfReportHeader from '../../common/PdfReportHeader';

// Font registration
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
    fontWeight: 'bold',
  },
  filtersBox: {
    display: 'flex',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#e0e7ef',
    color: '#1f2937',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 10,
    marginHorizontal: 2,
    marginVertical: 2,
    border: '1px solid #b6c3d1',
    fontWeight: 'bold',
    minHeight: 20,
    minWidth: 45,
    textAlign: 'center',
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
  col1: { flex: 0.2 },   // #
  col2: { flex: 0.8 },   // Invoice No
  col3: { flex: 1.5 },   // Customer
  col4: { flex: 0.8 },   // Type
  col5: { flex: 1.2 },   // Branch
  col6: { flex: 1.2 },   // Warehouse
  col7: { flex: 0.8 },   // Date
  col8: { flex: 0.7 },   // Currency
  col9: { flex: 1 },     // Total
  col10: { flex: 1.5 },  // Note
});

// Utility
function formatNumberWithCommas(value) {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getSumByCurrency(invoices, currencies) {
  const sums = {};
  invoices.forEach(inv => {
    const currency = currencies.find(cur => cur.id === inv.currency_id);
    const symbol = currency?.symbol || '';
    const key = symbol || inv.currency_id || '';
    const amount = Number(inv.total_amount || 0);
    if (!sums[key]) sums[key] = 0;
    sums[key] += amount;
  });
  return sums;
}

// Main PDF component
const BuyReturnInvoiceDetailsPDF = ({
  invoices = [],
  currencies = [],
  branches = [],
  warehouses = [],
  employees = [],
  company = {},
}) => {
  // Export/print date
  const exportDate = new Date().toLocaleString('ckb-IQ');

  // Sum by currency
  const sumByCurrency = getSumByCurrency(invoices, currencies);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PDF Header */}
        <PdfReportHeader
          company={company}
          title="ڕاپۆرتی گشتی وەسڵی گەڕانەوەی کاڵاکان"
          filters={[]} // You can add filter chips if needed
          exportDate={exportDate}
          styles={styles}
        />

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.col1]}>#</Text>
            <Text style={[styles.cell, styles.col2]}>ژمارە</Text>
            <Text style={[styles.cell, styles.col3]}>کڕیار</Text>
            <Text style={[styles.cell, styles.col4]}>جۆر</Text>
            <Text style={[styles.cell, styles.col5]}>لق</Text>
            <Text style={[styles.cell, styles.col6]}>کۆگا</Text>
            <Text style={[styles.cell, styles.col7]}>بەروار</Text>
            <Text style={[styles.cell, styles.col8]}>دراو</Text>
            <Text style={[styles.cell, styles.col9]}>کۆی گشتی</Text>
            <Text style={[styles.cell, styles.col10]}>تێبینی</Text>
          </View>

          {/* Data rows */}
          {invoices.map((inv, idx) => {
            const branch = branches.find(b => b.id === inv.branch_id);
            const warehouse = warehouses.find(w => w.id === inv.warehouse_id);
            const currency = currencies.find(c => c.id === inv.currency_id);
            const customer = inv.customer_name || (inv.customer_id === 0 ? '-' : inv.customer_id);
            return (
              <View style={styles.row} key={inv.id || idx}>
                <Text style={[styles.cell, styles.col1]}>{idx + 1}</Text>
                <Text style={[styles.cell, styles.col2]}>{inv.invoice_number || inv.id}</Text>
                <Text style={[styles.cell, styles.col3]}>{customer}</Text>
                <Text style={[styles.cell, styles.col4]}>{inv.type}</Text>
                <Text style={[styles.cell, styles.col5]}>{branch ? branch.name : inv.branch_id}</Text>
                <Text style={[styles.cell, styles.col6]}>{warehouse ? warehouse.name : inv.warehouse_id}</Text>
                <Text style={[styles.cell, styles.col7]}>{inv.invoice_date}</Text>
                <Text style={[styles.cell, styles.col8]}>{currency ? currency.name : inv.currency_id}</Text>
                <Text style={[styles.cell, styles.col9]}>
                  {(currency?.symbol || '') + formatNumberWithCommas(inv.total_amount)}
                </Text>
                <Text style={[styles.cell, styles.col10]}>{inv.note || ''}</Text>
              </View>
            );
          })}

          {/* Sum row */}
          <View style={styles.sumRow}>
            <Text style={styles.sumTitle}>کۆی گشتی</Text>
            <Text style={styles.sumText}>
              {Object.entries(sumByCurrency).map(([symbol, total], idx, arr) => (
                <Text key={symbol} style={{ marginHorizontal: 1 }}>
                  {symbol}{formatNumberWithCommas(total)}{idx < arr.length - 1 ? ' | ' : ''}
                </Text>
              ))}
            </Text>
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

export default BuyReturnInvoiceDetailsPDF;