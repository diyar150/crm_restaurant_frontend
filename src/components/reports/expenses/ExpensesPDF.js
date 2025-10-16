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
  col3: { flex: 2 },
  col4: { flex: 1.5 },
  col5: { flex: 2 },
  col6: { flex: 1.5 },
  col7: { flex: 2 },
  col8: { flex: 1.5 },
});

// 3. Utility function
function getSumByCurrency(expenses, currencies) {
  const sums = {};
  expenses.forEach(exp => {
    const currency = currencies.find(cur => cur.id === exp.currency_id);
    const symbol = currency?.symbol || '';
    const key = symbol || exp.currency_id || '';
    const amount = Number(exp.amount || 0);
    if (!sums[key]) sums[key] = 0;
    sums[key] += amount;
  });
  return sums;
}
function formatNumberWithCommas(value) {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 4. Main component
const ExpensesPDF = ({
  expenses,
  categories,
  branches,
  employees,
  currencies,
  company,
  filters = {},
}) => {
  const sumByCurrency = getSumByCurrency(expenses, currencies);

  // Prepare filter display
  const filterTexts = [];
  if (filters.branch) {
    const branch = branches.find(b => b.id === filters.branch);
    filterTexts.push(`لق: ${branch ? branch.name : filters.branch}`);
  }
  if (filters.employee) {
    const emp = employees.find(e => e.id === filters.employee);
    filterTexts.push(`کارمەند: ${emp ? emp.name : filters.employee}`);
  }
  if (filters.category) {
    const cat = categories.find(c => c.id === filters.category);
    filterTexts.push(`گرووپ: ${cat ? cat.name : filters.category}`);
  }
  if (filters.dateRange) {
    filterTexts.push(`بەروار: ${filters.dateRange.start || ''} - ${filters.dateRange.end || ''}`);
  }

  // Export/print date
  const exportDate = new Date().toLocaleString('ckb-IQ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PDF Header */}
        <PdfReportHeader
          company={company}
          title="ڕاپۆرتی مەسرووفات"
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
            <Text style={[styles.cell, styles.col3]}>ناو</Text>
            <Text style={[styles.cell, styles.col4]}>بڕ</Text>
            <Text style={[styles.cell, styles.col5]}>کارمەند</Text>
            <Text style={[styles.cell, styles.col6]}>لق</Text>
            <Text style={[styles.cell, styles.col7]}>تێبینی</Text>
            <Text style={[styles.cell, styles.col8]}>بەروار</Text>
          </View>

          {/* Data rows */}
          {expenses.map(exp => (
            <View style={styles.row} key={exp.id}>
              <Text style={[styles.cell, styles.col1]}>{exp.id}</Text>
              <Text style={[styles.cell, styles.col2]}>{categories.find(c => c.id === exp.category_id)?.name || ''}</Text>
              <Text style={[styles.cell, styles.col3]}>{exp.name}</Text>
              <Text style={[styles.cell, styles.col4]}>
                {(currencies.find(cur => cur.id === exp.currency_id)?.symbol || '') + formatNumberWithCommas(exp.amount)}
              </Text>
              <Text style={[styles.cell, styles.col5]}>{employees.find(e => e.id === exp.employee_id)?.name || ''}</Text>
              <Text style={[styles.cell, styles.col6]}>{branches.find(b => b.id === exp.branch_id)?.name || ''}</Text>
              <Text style={[styles.cell, styles.col7]}>{exp.note}</Text>
              <Text style={[styles.cell, styles.col8]}>
                {new Date(exp.expense_date).toLocaleDateString('ckb-IQ')}
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
        </View>

        {/* Signature/Approval Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>واژۆی یەکەم</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>واژۆی دووەم</Text>
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

export default ExpensesPDF;