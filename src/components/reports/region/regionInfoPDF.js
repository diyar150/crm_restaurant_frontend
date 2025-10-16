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
  col2: { flex: 2 },
  col3: { flex: 2 },
  col4: { flex: 2 },
  col5: { flex: 2 },
  col6: { flex: 3 },
});

// 3. Main component
const RegionInfoPDF = ({
  regions = [],
  zones = [],
  cities = [],
  company,
  filters = {},
}) => {
  // Prepare filter display
  const filterTexts = [];
  if (filters.zone_id) {
    const zone = zones.find(z => z.id === filters.zone_id);
    filterTexts.push(`زۆن: ${zone ? zone.name : filters.zone_id}`);
  }
  if (filters.city_id) {
    const city = cities.find(c => c.id === filters.city_id);
    filterTexts.push(`شار: ${city ? city.name : filters.city_id}`);
  }
  if (filters.region_name) {
    filterTexts.push(`ناوی گەڕەک: ${filters.region_name}`);
  }

  // Export/print date
  const exportDate = new Date().toLocaleString('ckb-IQ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PDF Header */}
        <PdfReportHeader
          company={company}
          title="ڕاپۆرتی گەڕەکان"
          filters={filterTexts}
          exportDate={exportDate}
          styles={styles}
        />

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.col1]}>#</Text>
            <Text style={[styles.cell, styles.col2]}>ناوی گەڕەک</Text>
            <Text style={[styles.cell, styles.col3]}>زۆن</Text>
            <Text style={[styles.cell, styles.col4]}>شار</Text>
            <Text style={[styles.cell, styles.col5]}>وەسف</Text>
            <Text style={[styles.cell, styles.col6]}>بەرواری دروستکردن</Text>
          </View>

          {/* Data rows */}
          {regions.map(region => (
            <View style={styles.row} key={region.id}>
              <Text style={[styles.cell, styles.col1]}>{region.id}</Text>
              <Text style={[styles.cell, styles.col2]}>{region.name}</Text>
              <Text style={[styles.cell, styles.col3]}>
                {zones.find(z => z.id === region.zone_id)?.name || region.zone_id}
              </Text>
              <Text style={[styles.cell, styles.col4]}>
                {cities.find(c => c.id === region.city_id)?.name || region.city_id}
              </Text>
              <Text style={[styles.cell, styles.col5]}>{region.description}</Text>
              <Text style={[styles.cell, styles.col6]}>
                {region.created_at ? new Date(region.created_at).toLocaleDateString('ckb-IQ') : ''}
              </Text>
            </View>
          ))}

          {/* Sum row */}
          <View style={styles.sumRow}>
            <Text style={styles.sumTitle}>ژمارەی گشتی</Text>
            <Text style={styles.sumText}>{regions.length}</Text>
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

export default RegionInfoPDF;