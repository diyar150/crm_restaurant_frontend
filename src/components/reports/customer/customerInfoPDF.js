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
  col4: { flex: 1.5 },
  col5: { flex: 1.2 },
  col6: { flex: 1.2 },
  col7: { flex: 1.2 },
  col8: { flex: 1.2 },
  col9: { flex: 1.2 },
  col10: { flex: 1.2 },
  col11: { flex: 1.2 },
  col12: { flex: 1.2 },
});

function formatNumberWithCommas(value) {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Sum by currency for loans
function getLoanSummaryByCurrency(customers, currencies) {
  const summary = {};
  customers.forEach((c) => {
    const currencyId = c.currency_id;
    const currency = currencies.find(cur => cur.id === currencyId);
    const currencyName = currency?.name || currencyId || '-';
    const loan = Number(c.loan) || 0;
    if (!summary[currencyId]) {
      summary[currencyId] = {
        currencyName,
        positive: 0,
        negative: 0,
      };
    }
    if (loan > 0) {
      summary[currencyId].positive += loan;
    } else if (loan < 0) {
      summary[currencyId].negative += loan;
    }
  });
  return Object.values(summary);
}

// Helper to get display value for IDs
function getDisplayValue(key, value, { categories, zones, currencies, cities, mandub }) {
  if (value === null || value === undefined || value === '') return '-';
  if (key === 'category_id') {
    return categories?.find(c => c.id === value)?.name || value;
  }
  if (key === 'zone_id') {
    return zones?.find(z => z.id === value)?.name || value;
  }
  if (key === 'currency_id') {
    return currencies?.find(c => c.id === value)?.name || value;
  }
  if (key === 'city_id') {
    return cities?.find(c => c.id === value)?.name || value;
  }
  if (key === 'mandub_id') {
    return mandub?.find(m => m.id === value)?.name || value;
  }
  return value;
}

const CustomerInfoPDF = ({
  customers = [],
  categories = [],
  zones = [],
  currencies = [],
  cities = [],
  mandub = [],
  company = {},
  filters = {},
  priceTypes = [],
}) => {
  // Prepare filter display
  const filterTexts = [];
if (filters.category_id) {
  const cat = categories.find(c => c.id === filters.category_id);
  filterTexts.push(`گرووپ: ${cat ? cat.name : filters.category_id}`);
}
if (filters.zone_id) {
  const zone = zones.find(z => z.id === filters.zone_id);
  filterTexts.push(`زۆن: ${zone ? zone.name : filters.zone_id}`);
}
if (filters.city_id) {
  const city = cities.find(c => c.id === filters.city_id);
  filterTexts.push(`شار: ${city ? city.name : filters.city_id}`);
}
if (filters.mandub_id) {
  const m = mandub.find(m => m.id === filters.mandub_id);
  filterTexts.push(`مەندووب: ${m ? m.name : filters.mandub_id}`);
}
if (filters.price_type_id && filters.price_type_id !== '0') {
  const pt = priceTypes.find(p => String(p.id) === String(filters.price_type_id));
  filterTexts.push(`جۆری نرخ: ${pt ? pt.name : filters.price_type_id}`);
}
if (filters.type) {
  filterTexts.push(`جۆر: ${filters.type}`);
}
if (filters.state) {
  filterTexts.push(`حاڵەت: ${filters.state}`);
}
if (filters.currency_id) {
  const c = currencies.find(c => c.id === filters.currency_id);
  filterTexts.push(`دراو: ${c ? c.name : filters.currency_id}`);
}
if (filters.loan_positive) {
  filterTexts.push('تەنها قەرزەکانم');
}
if (filters.loan_negative) {
  filterTexts.push('تەنها قەرزی خەڵک');
}
if (filters.loan_zero) {
  filterTexts.push('تەنها قەرزی سفرە');
}
if (filters.search) {
  filterTexts.push(`گەڕان: ${filters.search}`);
}

  // Export/print date
  const exportDate = new Date().toLocaleString('ckb-IQ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PDF Header */}
        <PdfReportHeader
          company={company}
          title="ڕاپۆرتی زانیاری کڕیار"
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
            <Text style={[styles.cell, styles.col3]}>کۆد</Text>
            <Text style={[styles.cell, styles.col4]}>ناو</Text>
            <Text style={[styles.cell, styles.col5]}>مۆبایل١</Text>
            <Text style={[styles.cell, styles.col6]}>جۆر</Text>
            <Text style={[styles.cell, styles.col7]}>شار</Text>
            <Text style={[styles.cell, styles.col8]}>زۆن</Text>
            <Text style={[styles.cell, styles.col9]}>ناونیشان</Text>
            <Text style={[styles.cell, styles.col10]}>مەندووب</Text>
            <Text style={[styles.cell, styles.col11]}>دراو</Text>
            <Text style={[styles.cell, styles.col12]}>قەرز</Text>
          </View>

          {/* Data rows */}
          {customers.map((customer, idx) => (
            <View style={styles.row} key={customer.id || idx}>
              <Text style={[styles.cell, styles.col1]}>{idx + 1}</Text>
              <Text style={[styles.cell, styles.col2]}>{getDisplayValue('category_id', customer.category_id, { categories })}</Text>
              <Text style={[styles.cell, styles.col3]}>{customer.code}</Text>
              <Text style={[styles.cell, styles.col4]}>{customer.name}</Text>
              <Text style={[styles.cell, styles.col5]}>{customer.phone_1}</Text>
              <Text style={[styles.cell, styles.col6]}>{customer.type}</Text>
              <Text style={[styles.cell, styles.col7]}>{getDisplayValue('city_id', customer.city_id, { cities })}</Text>
              <Text style={[styles.cell, styles.col8]}>{getDisplayValue('zone_id', customer.zone_id, { zones })}</Text>
              <Text style={[styles.cell, styles.col9]}>{customer.address}</Text>
              <Text style={[styles.cell, styles.col10]}>{getDisplayValue('mandub_id', customer.mandub_id, { mandub })}</Text>
              <Text style={[styles.cell, styles.col11]}>{getDisplayValue('currency_id', customer.currency_id, { currencies })}</Text>
              <Text style={[styles.cell, styles.col12]}>{formatNumberWithCommas(customer.loan)}</Text>
            </View>
          ))}

          {/* Sum row */}
          <View style={styles.sumRow}>
              <Text style={styles.sumTitle}>کۆی قەرز:</Text>
              <View style={{ flex: 2, flexDirection: 'column' }}>
                {getLoanSummaryByCurrency(customers, currencies).map((row) => (
                  <View key={row.currencyName} style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                    <Text style={{ color: '#388e3c', fontWeight: 'bold', fontSize: 11, marginLeft: 8 }}>
                      +{formatNumberWithCommas(row.positive)}
                    </Text>
                    <Text style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 11, marginLeft: 8 }}>
                      {formatNumberWithCommas(row.negative)}
                    </Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 11 }}>{row.currencyName}</Text>
                  </View>
                ))}
              </View>
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

export default CustomerInfoPDF;