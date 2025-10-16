import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import Rudaw from '../../../assets/fonts/rudawregular2.ttf';
import PdfReportHeader from '../../common/PdfReportHeader';

// Font registration (same as regionInfoPdf)
Font.register({
  family: 'Rudaw',
  fonts: [{ src: Rudaw, fontWeight: 'normal' }],
});

// Styles (copied and adapted from regionInfoPdf)
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
  col2: { flex: 2 },
  col3: { flex: 2 },
  col4: { flex: 2 },
  col5: { flex: 2 },
  col6: { flex: 2 },
  col7: { flex: 2 },
  col8: { flex: 2 },
  col9: { flex: 2 },
  col10: { flex: 2 },
  col11: { flex: 3 },
});

const BranchInfoPDF = ({
  branches = [],
  cities = [],
  regions = [],
  company,
  filters = {},
}) => {
  // Prepare filter display
  const filterTexts = [];
  if (filters.city_id) {
    const city = cities.find(c => c.id === filters.city_id);
    filterTexts.push(`شار: ${city ? city.name : filters.city_id}`);
  }
  if (filters.region_id) {
    const region = regions.find(r => r.id === filters.region_id);
    filterTexts.push(`ناوچە: ${region ? region.name : filters.region_id}`);
  }
  if (filters.branch_name) {
    filterTexts.push(`ناوی لق: ${filters.branch_name}`);
  }
  if (filters.user_id) {
    filterTexts.push(`بەڕێوەبەر: ${filters.user_id}`);
  }

  // Export/print date
  const exportDate = new Date().toLocaleString('ckb-IQ');

  // Sums
  const totalWallet = branches.reduce((sum, b) => sum + Number(b.wallet || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PDF Header */}
        <PdfReportHeader
          company={company}
          title="ڕاپۆرتی لقەکان"
          filters={filterTexts}
          exportDate={exportDate}
          styles={styles}
        />

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.col1]}>#</Text>
             <Text style={[styles.cell, styles.col3]}>کۆمپانیا</Text>
            <Text style={[styles.cell, styles.col2]}>ناوی لق</Text>
            <Text style={[styles.cell, styles.col4]}>شار</Text>
            <Text style={[styles.cell, styles.col5]}>گەڕەک</Text>
            <Text style={[styles.cell, styles.col6]}>بەڕێوەبەر</Text>
            <Text style={[styles.cell, styles.col7]}>قاصە</Text>
            <Text style={[styles.cell, styles.col9]}>ژمارەی مۆبایل</Text>
            <Text style={[styles.cell, styles.col11]}>ناونیشان</Text>
          </View>

          {/* Data rows */}
          {branches.map(branch => (
            <View style={styles.row} key={branch.id}>
              <Text style={[styles.cell, styles.col1]}>{branch.id}</Text>
               <Text style={[styles.cell, styles.col3]}>{branch.company_name || '-'}</Text>
              <Text style={[styles.cell, styles.col2]}>{branch.name}</Text>
              <Text style={[styles.cell, styles.col4]}>
                {cities.find(c => c.id === branch.city_id)?.name || branch.city_name || '-'}
              </Text>
              <Text style={[styles.cell, styles.col5]}>
                {regions.find(r => r.id === branch.region_id)?.name || branch.region_name || '-'}
              </Text>
              <Text style={[styles.cell, styles.col6]}>{branch.user_name || '-'}</Text>
              <Text style={[styles.cell, styles.col7]}>
                {Number(branch.wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.cell, styles.col9]}>{branch.phone_1 || '-'}</Text>
              <Text style={[styles.cell, styles.col11]}>{branch.address || '-'}</Text>
            </View>
          ))}

          {/* Sum row */}
       <View style={styles.sumRow}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                    <Text style={[styles.sumTitle, { marginLeft: 6 }]}>ژمارەی گشتی:</Text>
                    <Text style={[styles.sumText, { color: '#1976d2', minWidth: 40 }]}>{branches.length}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: '#d1d5db', height: 24, marginHorizontal: 12 }} />
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                    <Text style={[styles.sumTitle, { marginLeft: 6 }]}>کۆی گشتی قاصەکان:</Text>
                    <Text
                    style={[
                        styles.sumText,
                        {
                        color:
                            totalWallet > 0
                            ? '#388e3c'
                            : totalWallet < 0
                            ? '#d32f2f'
                            : '#222',
                        minWidth: 80,
                        },
                    ]}
                    >
                    {totalWallet.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
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

export default BranchInfoPDF;
