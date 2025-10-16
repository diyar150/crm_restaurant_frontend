// filepath: /src/components/reports/common/PdfReportHeader.js
import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';

const PdfReportHeader = ({ company, title, filters, exportDate, styles }) => (
  <>
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 12 }}>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{company?.name || ''}</Text>
        <Text style={{ fontSize: 10 }}>{company?.tagline || ''}</Text>
        <Text style={{ fontSize: 10 }}>{company?.phone_1 || ''}</Text>
        <Text style={{ fontSize: 10 }}>{company?.phone_2 || ''}</Text>
      </View>
      {company?.logo_1 && (
        <Image
          src={company.logo_1}
          style={{ width: 100, height: 100, marginLeft: 15, borderRadius: 1 }}
        />
      )}
    </View>
       <Text style={[styles.exportDate, { marginBottom: 0 ,textAlign:'left'}]}>
        بەرواری چاپ: {exportDate}
      </Text>

    <Text style={styles.title}>{title}</Text>
    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      {filters && filters.length > 0 && (
        <Text style={[styles.filters, { marginBottom: 0 }]}>
         {filters.join(' | ')}
        </Text>
      )}
     
    </View>
  </>
);

export default PdfReportHeader;