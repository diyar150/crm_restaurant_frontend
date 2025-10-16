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
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  signatureBox: {
   // borderTop: '1px solid #888',
    width: 120,
    textAlign: 'center',
    fontSize: 10,
    paddingTop: 4,
  },
  signatureBoxLeft: {
   // borderTop: '1px solid #888',
    width: 180,
    textAlign: 'center',
    fontSize: 10,
    paddingTop: 4,
    minHeight: 28,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
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
  col2: { flex: 1.2 },   // Item barcode
  col3: { flex: 3.5 },   // Item name
  col4: { flex: 0.7 },   // Unit
  col5: { flex: 0.6 },   // Quantity
  col6: { flex: 0.7 },   // Unit price
  col7: { flex: 1 },     // Total
});

// 3. Utility functions
function formatNumberWithCommas(value) {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getSumByCurrency(items, currencies) {
  const sums = {};
  items.forEach(item => {
    const currency = currencies.find(cur => cur.id === item.currency_id);
    const symbol = currency?.symbol || '';
    const key = symbol || item.currency_id || '';
    const amount = Number(item.total_amount || 0);
    if (!sums[key]) sums[key] = 0;
    sums[key] += amount;
  });
  return sums;
}

// 4. Main PDF component
const BuyInvoicePDF = ({
  invoice,
  items,
  currencies,
  branches,
  warehouses,
  employees,
  company,
}) => {
  // Prepare filter display (as chips)
  const filterChips = [];
  if (invoice.branch_id) {
    const branch = branches.find(b => b.id === invoice.branch_id);
    const warehouse = warehouses.find(w => w.id === invoice.warehouse_id);
    filterChips.push(`${branch ? branch.name : invoice.branch_id} : ${warehouse ? warehouse.name : invoice.warehouse_id}`);
  }
  if (invoice.type) {
    filterChips.push(`جۆر: ${invoice.type}`);
  }
  if (invoice.invoice_date) {
    filterChips.push(`بەروار: ${invoice.invoice_date}`);
  }
  if (invoice.currency_id) {
    const currency = currencies.find(c => c.id === invoice.currency_id);
    filterChips.push(`دراو: ${currency ? currency.name : invoice.currency_id}`);
  }
  // Add customer and invoice id as chips at the start
  const customerChip = `کڕیار: ${invoice.customer_name || (invoice.customer_id === 0 ? '-' : invoice.customer_id)}`;
  const invoiceIdChip = `پسوڵە: ${invoice.invoice_number || invoice.id}`;
  const allChips = [customerChip, invoiceIdChip, ...filterChips];

  // Export/print date
  const exportDate = new Date().toLocaleString('ckb-IQ');

  // Currency symbol
  const currency = currencies.find(c => c.id === invoice.currency_id);
  const currencySymbol = currency?.symbol || '';

  // Sum by currency (for multi-currency, if needed)
  const sumByCurrency = getSumByCurrency([invoice], currencies);

  // Find employee for signature section
  let employeeName = '';
  if (invoice.employee_id) {
    const emp = employees.find(e => e.id === invoice.employee_id);
    employeeName = emp ? emp.name : invoice.employee_id;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PDF Header */}
        <PdfReportHeader
          company={company}
          title="پسوڵەی کڕین"
          filters={[]} // We'll show filters as chips below
          exportDate={exportDate}
          styles={styles}
        />

        {/* Filter Chips (all on one row, employee removed from here) */}
        {allChips.length > 0 && (
          <View style={styles.filtersBox}>
            {allChips.map((chip, idx) => (
              <Text key={idx} style={styles.filterChip}>
                {chip}
              </Text>
            ))}
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.col1]}>#</Text>
            <Text style={[styles.cell, styles.col2]}>کۆد</Text>
            <Text style={[styles.cell, styles.col3]}>کاڵا</Text>
            <Text style={[styles.cell, styles.col4]}>یەکە</Text>
            <Text style={[styles.cell, styles.col5]}>بڕ</Text>
            <Text style={[styles.cell, styles.col6]}>نرخ</Text>
            <Text style={[styles.cell, styles.col7]}>کۆی گشتی</Text>
          </View>

          {/* Data rows */}
          
      {items.map((item, idx) => (
        <View style={styles.row} key={item.id || idx}>
          <Text style={[styles.cell, styles.col1]}>{idx + 1}</Text>
          <Text style={[styles.cell, styles.col2]}>{item.item_barcode || item.barcode || item.item_id}</Text>
          <Text style={[styles.cell, styles.col3]}>{item.item_name || item.item_id}</Text>
          <Text style={[styles.cell, styles.col4]}>{item.unit_name || item.item_unit_id}</Text>
          <Text style={[styles.cell, styles.col5]}>{formatNumberWithCommas(item.quantity)}</Text>
          <Text style={[styles.cell, styles.col6]}>
            {currencySymbol}{formatNumberWithCommas(item.unit_price)}
          </Text>
          <Text style={[styles.cell, styles.col7]}>
            {currencySymbol}{formatNumberWithCommas(item.total_amount || item.total)}
          </Text>
        </View>
      ))}

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

             {/* Modern Note Section below the table */}
                {invoice.note && (
            <View
                style={{
                marginTop: 5,
                marginBottom: 0,
                padding: 5,
                minHeight: 24,
                width: '100%',
                textAlign: 'right',
                }}
            >
                <Text style={{ fontSize: 10, color: '#374151' }}>
                {invoice.note}
                </Text>
            </View>
            )}



        </View>



        {/* Signature/Approval Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>واژۆی یەکەم</Text>
          </View>
          <View style={styles.signatureBoxLeft}>
            <Text>واژۆی دووەم</Text>
            {employeeName && (
              <Text style={{ fontSize: 10, marginTop: 2, color: '#1976d2' }}>
                {employeeName}
              </Text>
            )}
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

export default BuyInvoicePDF;