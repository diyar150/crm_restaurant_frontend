import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, Typography, TextField, MenuItem, Table, TableHead, TableRow,
  TableCell, TableBody, TableFooter, TableContainer, Paper, Pagination,
  InputAdornment, IconButton, TableSortLabel, Snackbar, Alert
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import ReportButton from '../../components/common/ReportButton';
import ClearButton from '../../components/common/ClearButton';

import axiosInstance from '../../components/service/axiosInstance';
import DialogPdf from '../../components/utils/DialogPdf';
import ItemQuantityInfoPDF from '../../components/reports/item/ItemQuantityInfoPDF';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function ItemQuantityInfo({ isDrawerOpen }) {
  // Filters and state
  const [filters, setFilters] = useState({
    item_id: '',
    name: '',
    barcode: '',
    category_id: '',
    brand_id: '',
    warehouse_id: '',
    min_quantity: '',
    max_quantity: '',
    sortBy: 'item_name',
    sortOrder: 'asc',
    page: 1,
    pageSize: 10,
  });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);

  // Dropdowns
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const { company, fetchCompanyInfo } = useCompanyInfo();

  // PDF dialog
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const [reportItems, setReportItems] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [branches, setBranches] = useState([]);
  // Fetch dropdown data
  useEffect(() => {
    axiosInstance.get('/item-category/index').then(res => setCategories(res.data || []));
    axiosInstance.get('/item-brand/index').then(res => setBrands(res.data || []));
    axiosInstance.get('/warehouse/index').then(res => setWarehouses(res.data || []));
    axiosInstance.get('/branch/index').then(res => setBranches(res.data || []));
  }, []);

  // Fetch items for table (paginated)
  useEffect(() => {
    setFetching(true);
    axiosInstance.get('/item/fullInfo', { params: filters })
      .then(res => {
        setItems(res.data.results || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => setItems([]))
      .finally(() => setFetching(false));
  }, [filters]);

  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value, page: 1 }));
  };
  const handleClearFilter = (field) => setFilters(f => ({ ...f, [field]: '', page: 1 }));
  const handleSort = (column) => {
    setFilters(f => ({
      ...f,
      sortBy: column,
      sortOrder: f.sortBy === column ? (f.sortOrder === 'asc' ? 'desc' : 'asc') : 'asc',
      page: 1
    }));
  };
  const handlePageChange = (_, value) => setFilters(f => ({ ...f, page: value }));

  // Fetch all filtered items for report (no pagination)
  const fetchAllItemsForReport = async () => {
    try {
      const res = await axiosInstance.get('/item/fullInfo', {
        params: { ...filters, page: 1, pageSize: 10000 }
      });
      return res.data.results || [];
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی هەموو داتا');
      return [];
    }
  };

  // PDF preview
  const handleOpenPdfPreview = async () => {
    await fetchCompanyInfo();
    const allItems = await fetchAllItemsForReport();
    setReportItems(allItems);
    setOpenPdfPreview(true);
  };

  const handleClosePdf = () => setOpenPdfPreview(false);
  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');

    // Reset filters and table data
  const handleClearAll = () => {
    setFilters({
      item_id: '',
      name: '',
      barcode: '',
      category_id: '',
      brand_id: '',
      warehouse_id: '',
      min_quantity: '',
      max_quantity: '',
      sortBy: 'item_name',
      sortOrder: 'asc',
      page: 1,
      pageSize: 10,
    });
    setItems([]);
    setTotal(0);
  };

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
           <Grid item xs={12}>
          <Card sx={{ m: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              زانیاری گشتی کاڵا
            </Typography>
            <Box sx={{ width: '100%', mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={2.4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="گرووپ"
                    name="category_id"
                    value={filters.category_id}
                    onChange={handleFilterChange}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    {categories.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="براند"
                    name="brand_id"
                    value={filters.brand_id}
                    onChange={handleFilterChange}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    {brands.map(b => (
                      <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="کۆگا"
                    name="warehouse_id"
                    value={filters.warehouse_id}
                    onChange={handleFilterChange}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    {warehouses.map(w => (
                      <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                   <Grid item xs={12} md={2.4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="ناو"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    sx={{ minWidth: 140 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {filters.name && (
                            <IconButton onClick={() => handleClearFilter('name')} size="small">
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )}
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="بارکۆد"
                    name="barcode"
                    value={filters.barcode}
                    onChange={handleFilterChange}
                    sx={{ minWidth: 140 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {filters.barcode && (
                            <IconButton onClick={() => handleClearFilter('barcode')} size="small">
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )}
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="کەمترین بڕ"
                    name="min_quantity"
                    type="number"
                    value={filters.min_quantity}
                    onChange={handleFilterChange}
                    sx={{ minWidth: 120 }}
                  />
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="زۆرترین بڕ"
                    name="max_quantity"
                    type="number"
                    value={filters.max_quantity}
                    onChange={handleFilterChange}
                    sx={{ minWidth: 120 }}
                  />
                </Grid>
                <Grid item xs={12} md={2.4}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="لق"
                        name="branch_id"
                        value={filters.branch_id}
                        onChange={handleFilterChange}
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value="">هەموو</MenuItem>
                        {branches.map(b => (
                          <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                <Grid item xs={12} md={2.4}>
                  <ReportButton onClick={handleOpenPdfPreview} fullWidth />
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <ClearButton onClick={handleClearAll} fullWidth>
                    پاکردنەوە
                  </ClearButton>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={{ m: 1, p: 2 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={filters.sortBy === 'category_name'}
                        direction={filters.sortOrder}
                        onClick={() => handleSort('category_name')}
                      >
                        گرووپ
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={filters.sortBy === 'brand_name'}
                        direction={filters.sortOrder}
                        onClick={() => handleSort('brand_name')}
                      >
                        براند
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={filters.sortBy === 'item_id'}
                        direction={filters.sortOrder}
                        onClick={() => handleSort('item_id')}
                      >
                        کۆد
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={filters.sortBy === 'item_name'}
                        direction={filters.sortOrder}
                        onClick={() => handleSort('item_name')}
                      >
                        ناو
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={filters.sortBy === 'warehouse_name'}
                        direction={filters.sortOrder}
                        onClick={() => handleSort('warehouse_name')}
                      >
                        کۆگا
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={filters.sortBy === 'quantity'}
                        direction={filters.sortOrder}
                        onClick={() => handleSort('quantity')}
                      >
                        
                        بڕ
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={filters.sortBy === 'cost'}
                        direction={filters.sortOrder}
                        onClick={() => handleSort('cost')}
                      >
                        تێچوون
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={filters.sortBy === 'total_cost'}
                        direction={filters.sortOrder}
                        onClick={() => handleSort('total_cost')}
                      >
                        کۆی تێچوون
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                 {fetching ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  ) : items.length > 0 ? (
                    items.map((row) => (
                      <TableRow key={row.item_id}>
                        <TableCell>{row.category_name}</TableCell>
                        <TableCell>{row.brand_name}</TableCell>
                        <TableCell>{row.barcode}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.warehouse_name}</TableCell>
                        <TableCell>
                          {Number(row.quantity || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {Number(row.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                        {(Number(row.quantity || 0) * Number(row.cost || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        هیچ داتایەک نەدۆزرایەوە
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: 16 }}>
                      {items.length === 0 ? (
                        <span>کۆی گشتی: -</span>
                      ) : (
                        (() => {
                          const totalCost = items.reduce((acc, row) => acc + (Number(row.quantity || 0) * Number(row.cost || 0)), 0);
                          const itemCount = items.length;
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3 }}>
                              <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                                ژمارەی کاڵا: {itemCount}
                              </span>
                              <span style={{ fontWeight: 'bold', color: '#388e3c' }}>
                                کۆی نرخی گشتی: {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

                              </span>
                            </Box>
                          );
                        })()
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Pagination
                        count={Math.ceil(total / filters.pageSize)}
                        page={filters.page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                      />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
      {/* PDF Dialog */}
      <DialogPdf
        open={openPdfPreview}
        onClose={handleClosePdf}
        document={
          <ItemQuantityInfoPDF
            items={reportItems}
            categories={categories}
            branches={branches} 
            brands={brands}
            warehouses={warehouses}
            company={company}
            filters={filters}
          />
        }
        fileName="item_quantity_info_report.pdf"
      />
      {/* Snackbars */}
      <Snackbar open={success} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity="success">جێبەجێکرا</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={4000} onClose={handleErrorSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleErrorSnackbarClose} severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
}

export default ItemQuantityInfo;