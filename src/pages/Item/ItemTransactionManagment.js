import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, Typography, TextField, IconButton, InputAdornment,
  Snackbar, Alert, Table, TableHead, TableRow,
  TableCell, TableBody, TableFooter, TableContainer, Paper, Pagination, MenuItem, Tooltip, TableSortLabel
} from '@mui/material';
import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';

import ConfirmDialog from '../../components/utils/ConfirmDialog';
import axiosInstance from '../../components/service/axiosInstance';
import ItemAutocomplete from '../../components/Autocomplete/ItemAutocomplete';
import DateRangeSelector from '../../components/utils/DateRangeSelector';
import ItemTransactionPDF from '../../components/reports/item/ItemTransactionPDF';
import DialogPdf from '../../components/utils/DialogPdf';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ReportButton from '../../components/common/ReportButton';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { useItemUnits } from '../../hooks/useItemUnits';
import LoadingSpinner from '../../components/common/LoadingSpinner';


function ItemTransactionManagment({ isDrawerOpen }) {
  const initialFormData = {
    type: '',
    warehouse_id: '',
    item_id: '',
    unit_id: '',
    quantity: '',
    employee_id: '',
    note: '',
    search: '',
  };

    // Place this above your component
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);


  const rowsPerPage = 15;

  // States
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const [reportTransactions, setReportTransactions] = useState([]);
  // Filter states
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [filterItemId, setFilterItemId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ mode: 'today', start: today, end: today });
  const { company, fetchCompanyInfo } = useCompanyInfo();

// Item units for form
  const { units: itemUnits, loading: unitsLoading, fetchUnits } = useItemUnits(formData.item_id?.id || formData.item_id || '');



  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');


  // Fetch initial data
  useEffect(() => {
    fetchWarehouses();
    fetchEmployees();
    fetchUnitsList();
    fetchItems();
    fetchCategories();
  }, []);

  // Fetch filtered transactions on filter/sort/page change
  useEffect(() => {
    fetchFilteredTransactions();
    // eslint-disable-next-line
  }, [
    filterWarehouseId,
    filterItemId,
    filterType,
    filterEmployeeId,
    filterCategoryId,
    filterDateRange,
    search,
    currentPage,
    sortBy,
    sortOrder
  ]);


  useEffect(() => {
  if (
    selectedId &&
    formData.item_id &&
    (formData.item_id.id || typeof formData.item_id === 'number' || typeof formData.item_id === 'string') &&
    itemUnits.length > 0
  ) {
    const editingTransaction = transactions.find(t => t.id === selectedId);
    if (editingTransaction && editingTransaction.unit_id) {
      setFormData(prev => ({
        ...prev,
        unit_id: editingTransaction.unit_id,
      }));
    }
  }
  // eslint-disable-next-line
}, [itemUnits, selectedId]);



  // Fetchers
  const fetchWarehouses = async () => {
    try {
      const res = await axiosInstance.get('/warehouse/index');
      setWarehouses(res.data || []);
    } catch {}
  };

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get('/user/index');
      setEmployees(res.data || []);
    } catch {}
  };

 const fetchUnitsList = async () => {
    try {
      const res = await axiosInstance.get('/item-unit/index');
      setUnits(res.data || []);
    } catch {}
  };

  const fetchItems = async () => {
    try {
      const res = await axiosInstance.get('/item/index');
      setItems(res.data || []);
    } catch {}
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get('/item-category/index');
      setCategories(res.data || []);
    } catch {}
  };



    // Fetch all filtered transactions for report (no pagination)
  const fetchAllTransactionsForReport = async () => {
    try {
      const filters = {
        warehouse_ids: filterWarehouseId ? [filterWarehouseId] : [],
        item_ids: filterItemId && filterItemId.id ? [filterItemId.id] : [],
        types: filterType ? [filterType] : [],
        employee_ids: filterEmployeeId ? [filterEmployeeId] : [],
        category_ids: filterCategoryId ? [filterCategoryId] : [],
        startDate: filterDateRange.start || today,
        endDate: filterDateRange.end || today,
        search: search,
        sortBy,
        sortOrder
      };
      const res = await axiosInstance.post('/item-transaction/filter', { ...filters, page: 1, pageSize: 10000 });
      return res.data.transactions || [];
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی هەموو داتا');
      return [];
    }
  };

  // Main filter fetch
  const fetchFilteredTransactions = async () => {
    setFetching(true);
    try {
      const filters = {
        warehouse_ids: filterWarehouseId ? [filterWarehouseId] : [],
        item_ids: filterItemId && filterItemId.id ? [filterItemId.id] : [],
        types: filterType ? [filterType] : [],
        employee_ids: filterEmployeeId ? [filterEmployeeId] : [],
        category_ids: filterCategoryId ? [filterCategoryId] : [],
        startDate: filterDateRange.start || today,
        endDate: filterDateRange.end || today,
        search: search,
        page: currentPage,
        pageSize: rowsPerPage,
        sortBy,
        sortOrder
      };
      const res = await axiosInstance.post('/item-transaction/filter', filters);
      setTransactions(res.data.transactions || []);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      setTransactions([]);
      setTotalCount(0);
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتا');
    } finally {
      setFetching(false);
    }
  };

   // Open PDF preview
  const handleOpenPdfPreview = async () => {
    await fetchCompanyInfo();
    const allTransactions = await fetchAllTransactionsForReport();
    setReportTransactions(allTransactions);
    setOpenPdfPreview(true);
  };
  
    // Sum quantity by unit name and type
const sumByUnitAndType = transactions.reduce((acc, row) => {
  const unitName = units.find(u => u.id === row.unit_id)?.name || row.unit_id || 'ناناسراو';
  const type = row.type === '+' ? 'زیادکردن' : 'کەمکردن';
  if (!acc[unitName]) acc[unitName] = { 'زیادکردن': 0, 'کەمکردن': 0 };
  acc[unitName][type] += Number(row.quantity || 0);
  return acc;
}, {});

  // Form handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const errors = {};
    if (!formData.type) errors.type = 'جۆری مامەڵە پێویستە';
    if (!formData.warehouse_id) errors.warehouse_id = 'کۆگا پێویستە';
    if (!formData.item_id) errors.item_id = 'کاڵا پێویستە';
    if (!formData.unit_id) errors.unit_id = 'یەکە پێویستە';
    if (formData.quantity === '' || isNaN(Number(formData.quantity))) errors.quantity = 'بڕ پێویستە';
    if (!formData.employee_id) errors.employee_id = 'کارمەند پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
      type: formData.type,
      warehouse_id: formData.warehouse_id,
      item_id: formData.item_id?.id || formData.item_id,
      unit_id: formData.unit_id?.id || formData.unit_id,
      quantity: formData.quantity,
      employee_id: formData.employee_id,
      note: formData.note,
    };
      let response;
      if (selectedId) {
        response = await axiosInstance.put(`/item-transaction/update/${selectedId}`, payload);
      } else {
        response = await axiosInstance.post('/item-transaction/store', payload);
      }

      if ([200, 201].includes(response.status)) {
        fetchFilteredTransactions();
        setSuccess(true);
        setFormData(initialFormData);
        setSelectedId(null);
        setFormErrors({});
      } else {
        setErrorMessage(response.data.message || 'هەڵە ڕوویدا');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error || 'هەڵە ڕوویدا لە تۆمارکردن'
      );
    } finally {
      setLoading(false);
    }
  };
  const handleClearFilters = () => {
  setFilterWarehouseId('');
  setFilterItemId('');
  setFilterType('');
  setFilterEmployeeId('');
  setFilterCategoryId('');
  setFilterDateRange({ mode: 'today', start: today, end: today });
  setSearch('');
  setCurrentPage(1);
};

 // When setting formData for edit:
const handleEditClick = (row) => {
  setSelectedId(row.id);
  const itemObj = items.find(i => i.id === row.item_id) || { id: row.item_id, name: '' };
  setFormData({
    type: row.type || '',
    warehouse_id: row.warehouse_id || '',
    item_id: itemObj,
    unit_id: '', // will set after units loaded
    quantity: row.quantity || '',
    employee_id: row.employee_id || '',
    note: row.note || '',
    search: '',
  });
  setFormErrors({});
  if (row.item_id) {
    fetchUnits(row.item_id);
  }
};

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/item-transaction/delete/${selectedId}`);
      fetchFilteredTransactions();
      setSuccess(true);
    } catch (err) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    } finally {
      setOpenDialog(false);
      setSelectedId(null);
    }
  };

  // Filter handlers
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range) => {
    setFilterDateRange(range);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (_, value) => setCurrentPage(value);
  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);

  const handleChangeWithErrorReset = (e) => {
  const { name, value } = e.target;
  setErrorMessage('');
  setFormErrors(prev => ({ ...prev, [name]: '' }));

  if (name === 'item_id') {
    setFormData(prev => ({
      ...prev,
      item_id: value,
      unit_id: ''
    }));
    if (value && value.id) fetchUnits(value.id);
    else setFormData(prev => ({ ...prev, unit_id: '' }));
  } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
};

  const clearSelectField = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ m: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedId ? 'گۆڕینی مامەڵە' : 'زیادکردنی مامەڵە'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                select
                fullWidth
                label="جۆری مامەڵە"
                name="type"
                value={formData.type}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.type}
                helperText={formErrors.type}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">هیچ</MenuItem>
                <MenuItem value="+">زیادکردن</MenuItem>
                <MenuItem value="-">کەمکردن</MenuItem>
              </TextField>
              <TextField
                select
                fullWidth
                label="کۆگا"
                name="warehouse_id"
                value={formData.warehouse_id}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.warehouse_id}
                helperText={formErrors.warehouse_id}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">هیچ</MenuItem>
                {warehouses.map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={8}>
                 <ItemAutocomplete
                    value={formData.item_id}
                    onChange={val => handleChangeWithErrorReset({ target: { name: 'item_id', value: val } })}
                    error={formErrors.item_id}
                    helperText={formErrors.item_id}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                 <TextField
                        select
                        fullWidth
                        label="یەکە"
                        name="unit_id"
                        value={formData.unit_id}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.unit_id}
                        helperText={formErrors.unit_id}
                        disabled={unitsLoading || itemUnits.length === 0}
                      >
                        <MenuItem value="">هیچ</MenuItem>
                        {itemUnits.length === 0 && (
                          <MenuItem disabled value="">هیچ یەکەیەک بۆ ئەم کاڵا نییە</MenuItem>
                        )}
                        {itemUnits.map((u) => (
                          <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                        ))}
                      </TextField>
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="بڕ"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.quantity}
                helperText={formErrors.quantity}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.quantity && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('quantity')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                fullWidth
                label="کارمەند"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.employee_id}
                helperText={formErrors.employee_id}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">هیچ</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="تێبینی"
                name="note"
                value={formData.note}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.note && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('note')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

           <Grid container spacing={2} sx={{ mb: 2 }}>
            
            <Grid item xs={12} sm={8}>
              <RegisterButton onClick={handleSubmit} loading={loading} />
            </Grid>
            <Grid item xs={12} sm={4}>
                <ClearButton onClick={handleClearFilters} />

            </Grid>
          </Grid>
            </form>
          </Card>
        </Grid>

        {/* Table & Filter Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ m: 1, p: 2 }}>
            {/* Filter Controls */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="کۆگا"
                    value={filterWarehouseId}
                    onChange={e => { setFilterWarehouseId(e.target.value); setCurrentPage(1); }}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    {warehouses.map(w => (
                      <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <ItemAutocomplete
                    value={filterItemId}
                    onChange={val => { setFilterItemId(val); setCurrentPage(1); }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="جۆر"
                    value={filterType}
                    onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    <MenuItem value="+">زیادکردن</MenuItem>
                    <MenuItem value="-">کەمکردن</MenuItem>
                  </TextField>
                </Grid>
               
                 <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="کارمەند"
                    value={filterEmployeeId}
                    onChange={e => { setFilterEmployeeId(e.target.value); setCurrentPage(1); }}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    {employees.map(emp => (
                      <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

              </Grid>

              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2} alignItems="center">

                  <Grid item xs={12} md={6}>
                    <DateRangeSelector value={filterDateRange} onChange={handleDateRangeChange} />
                  </Grid>
                

                 <Grid item xs={12} md={4}>

                       <TextField
                                          fullWidth
                                          label="گەڕان"
                                          name="search"
                                          value={search}
                                          onChange={handleSearchChange}
                                          placeholder="ناو یان تێبینی..."
                                          InputProps={{
                                            endAdornment: (
                                              <InputAdornment position="end">
                                                <Tooltip title="هەموو داتاکان">
                                                  <IconButton onClick={() => { }}>
                                                    <SearchIcon />
                                                  </IconButton>
                                                </Tooltip>
                                              </InputAdornment>
                                            ),
                                          }}
                                        />

                     </Grid>

           <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                     <ReportButton onClick={handleOpenPdfPreview} />

                </Grid>
                        </Grid>
                </Box>
            </Box>


                                {/* Table */}
           <TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>
          <TableSortLabel
            active={sortBy === 'id'}
            direction={sortBy === 'id' ? sortOrder : 'asc'}
            onClick={() => handleSort('id')}
          >
            #
          </TableSortLabel>
        </TableCell>
        <TableCell>
          <TableSortLabel
            active={sortBy === 'type'}
            direction={sortBy === 'type' ? sortOrder : 'asc'}
            onClick={() => handleSort('type')}
          >
            جۆر
          </TableSortLabel>
        </TableCell>
        <TableCell>کۆگا</TableCell>
        <TableCell>کاڵا</TableCell>
        <TableCell>یەکە</TableCell>
        <TableCell>
          <TableSortLabel
            active={sortBy === 'quantity'}
            direction={sortBy === 'quantity' ? sortOrder : 'asc'}
            onClick={() => handleSort('quantity')}
          >
            بڕ
          </TableSortLabel>
        </TableCell>
        <TableCell>کارمەند</TableCell>
        <TableCell>تێبینی</TableCell>
        <TableCell>ئیش</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {fetching ? (
         <TableRow>
                      <TableCell colSpan={8} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
      ) : transactions.length > 0 ? (
        transactions.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.type === '+' ? 'زیادکردن' : 'کەمکردن'}</TableCell>
            <TableCell>{warehouses.find(w => w.id === row.warehouse_id)?.name || row.warehouse_id}</TableCell>
            <TableCell>{items.find(i => i.id === row.item_id)?.name || row.item_id}</TableCell>
            <TableCell>{units.find(u => u.id === row.unit_id)?.name || row.unit_id}</TableCell>
            <TableCell>{row.quantity}</TableCell>
            <TableCell>{employees.find(emp => emp.id === row.employee_id)?.name || row.employee_id}</TableCell>
            <TableCell>{row.note}</TableCell>
            <TableCell>
              <IconButton color="primary" onClick={() => handleEditClick(row)}>
                <EditIcon />
              </IconButton>
              <IconButton color="secondary" onClick={() => handleDeleteClick(row.id)}>
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={9} align="center">
            هیچ مامەڵەیەک نەدۆزرایەوە
          </TableCell>
        </TableRow>
      )}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colSpan={9} align="center" sx={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: 16 }}>
          {/* Sum by unit and type, all in one row, styled */}
          {Object.entries(sumByUnitAndType).length === 0 ? (
            <span>کۆی گشتی: -</span>
          ) : (
            Object.entries(sumByUnitAndType).map(([unit, sums], idx, arr) => (
              <span key={unit} style={{ margin: '0 12px' }}>
                <span style={{ fontWeight: 'bold', color: '#222' }}>{unit}:</span>
                <span style={{ color: '#388e3c', fontWeight: 'bold', marginRight: 4 }}>
                  {sums['زیادکردن'] > 0 ? ` +${sums['زیادکردن']}` : ''}
                </span>
                <span style={{ color: '#d32f2f', fontWeight: 'bold', marginRight: 4 }}>
                  {sums['کەمکردن'] > 0 ? ` -${sums['کەمکردن']}` : ''}
                </span>
                {idx < arr.length - 1 && <span style={{ color: '#888', margin: '0 8px' }}>|</span>}
              </span>
            ))
          )}
        </TableCell>
      </TableRow>
    </TableFooter>
  </Table>
</TableContainer>
            {totalCount > rowsPerPage && (
              <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                  count={Math.ceil(totalCount / rowsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={openDialog}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی مامەڵە"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم مامەڵە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />


      {/* PDF Dialog */}
      <DialogPdf
        open={openPdfPreview}
        onClose={() => setOpenPdfPreview(false)}
        document={
          <ItemTransactionPDF
            transactions={reportTransactions}
            warehouses={warehouses}
            items={items}
            units={units}
            employees={employees}
            categories={categories}
            company={company}
            filters={{
              warehouse: filterWarehouseId,
              item: filterItemId,
              type: filterType,
              employee: filterEmployeeId,
              category: filterCategoryId,
              dateRange: filterDateRange,
              search,
            }}
          />
        }
        fileName="item_transaction_report.pdf"
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
export default ItemTransactionManagment;