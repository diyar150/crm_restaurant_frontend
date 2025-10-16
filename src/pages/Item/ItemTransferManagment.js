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
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ReportButton from '../../components/common/ReportButton';
import DialogPdf from '../../components/utils/DialogPdf';
import ItemTransferPDF from '../../components/reports/item/ItemTransferPDF';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { useItemUnits } from '../../hooks/useItemUnits';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function ItemTransferManagment({ isDrawerOpen }) {
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const initialFormData = {
    item_id: '',
    from_warehouse_id: '',
    to_warehouse_id: '',
    unit_id: '',
    quantity: '',
    employee_id: '',
    note: '',
    transfer_date: today,
    search: '',
  };

  const rowsPerPage = 10;

  // States
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [transfers, setTransfers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [warehouses, setWarehouses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const [reportTransfers, setReportTransfers] = useState([]);

  // Use item unit hook for form
  const { units, loading: unitsLoading, fetchUnits } = useItemUnits(formData.item_id?.id || formData.item_id || '');

  // For table/filter: fetch all units once
  const [allUnits, setAllUnits] = useState([]);
  useEffect(() => {
    const fetchAllUnits = async () => {
      try {
        const res = await axiosInstance.get('/item-unit/index');
        setAllUnits(res.data || []);
      } catch {}
    };
    fetchAllUnits();
  }, []);

 // Ensure unit_id is set after units are loaded for edit
  useEffect(() => {
    if (
      selectedId &&
      formData.item_id &&
      (formData.item_id.id || typeof formData.item_id === 'number' || typeof formData.item_id === 'string') &&
      units.length > 0
    ) {
      const editingTransfer = transfers.find(t => t.id === selectedId);
      if (editingTransfer && editingTransfer.unit_id) {
        setFormData(prev => ({
          ...prev,
          unit_id: editingTransfer.unit_id,
        }));
      }
    }
    // eslint-disable-next-line
  }, [units, selectedId]);

  // Filter states
  const [filterFromWarehouseId, setFilterFromWarehouseId] = useState('');
  const [filterToWarehouseId, setFilterToWarehouseId] = useState('');
  const [filterItemId, setFilterItemId] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ start: today, end: today });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const { company, fetchCompanyInfo } = useCompanyInfo();

  // Fetch initial data
  useEffect(() => {
    fetchWarehouses();
    fetchEmployees();
    fetchItems();
  }, []);

  useEffect(() => {
    fetchFilteredTransfers();
    // eslint-disable-next-line
  }, [
    filterFromWarehouseId,
    filterToWarehouseId,
    filterItemId,
    filterEmployeeId,
    filterDateRange,
    search,
    currentPage,
    sortBy,
    sortOrder
  ]);

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

  const fetchItems = async () => {
    try {
      const res = await axiosInstance.get('/item/index');
      setItems(res.data || []);
    } catch {}
  };

  // Main filter fetch
  const fetchFilteredTransfers = async () => {
    setFetching(true);
    try {
      const filters = {
        from_warehouse_id: filterFromWarehouseId,
        to_warehouse_id: filterToWarehouseId,
        item_id: filterItemId && filterItemId.id ? filterItemId.id : '',
        employee_id: filterEmployeeId,
        startDate: filterDateRange.start || today,
        endDate: filterDateRange.end || today,
        search: search,
        page: currentPage,
        pageSize: rowsPerPage,
        sortBy,
        sortOrder
      };
      const res = await axiosInstance.get('/item-transfer/filter', { params: filters });
      setTransfers(res.data.data || []);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      setTransfers([]);
      setTotalCount(0);
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتا');
    } finally {
      setFetching(false);
    }
  };


    // Fetch all filtered transfers for report (no pagination)
  const fetchAllTransfersForReport = async () => {
    try {
      const filters = {
        from_warehouse_id: filterFromWarehouseId,
        to_warehouse_id: filterToWarehouseId,
        item_id: filterItemId && filterItemId.id ? filterItemId.id : '',
        employee_id: filterEmployeeId,
        startDate: filterDateRange.start || today,
        endDate: filterDateRange.end || today,
        search,
        sortBy,
        sortOrder
      };
      const res = await axiosInstance.get('/item-transfer/filter', { params: { ...filters, page: 1, pageSize: 10000 } });
      return res.data.data || [];
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی هەموو داتا');
      return [];
    }
  };

  // Form handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const errors = {};
    if (!formData.item_id) errors.item_id = 'کاڵا پێویستە';
    if (!formData.from_warehouse_id) errors.from_warehouse_id = 'کۆگا سەرچاوە پێویستە';
    if (!formData.to_warehouse_id) errors.to_warehouse_id = 'کۆگا مەبەست پێویستە';
    if (!formData.unit_id) errors.unit_id = 'یەکە پێویستە';
    if (formData.quantity === '' || isNaN(Number(formData.quantity))) errors.quantity = 'بڕ پێویستە';
    if (!formData.employee_id) errors.employee_id = 'کارمەند پێویستە';
    if (!formData.transfer_date) errors.transfer_date = 'بەروار پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        item_id: formData.item_id?.id || formData.item_id || '',
        from_warehouse_id: formData.from_warehouse_id,
        to_warehouse_id: formData.to_warehouse_id,
        unit_id: formData.unit_id,
        quantity: Number(formData.quantity), // supports decimals
        employee_id: formData.employee_id,
        note: formData.note,
        transfer_date: formData.transfer_date || today,
      };
      let response;

      if (selectedId) {
        response = await axiosInstance.put(`/item-transfer/update/${selectedId}`, payload);
      } else {
        response = await axiosInstance.post('/item-transfer/store', payload);
      }

      if ([200, 201].includes(response.status)) {
        fetchFilteredTransfers();
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
    setFilterFromWarehouseId('');
    setFilterToWarehouseId('');
    setFilterItemId('');
    setFilterEmployeeId('');
    setFilterDateRange({ start: today, end: today });
    setSearch('');
    setCurrentPage(1);
    setFormData(initialFormData); // Reset form fields
    setFormErrors({});            // Reset form errors
    setSelectedId(null);          // Reset edit mode
  };

  const handleEditClick = async (row) => {
    setSelectedId(row.id);
    setFormErrors({});
      const itemObj = items.find(i => i.id === row.item_id) || { id: row.item_id, name: '' };

    setFormData({
      item_id: itemObj,
      from_warehouse_id: row.from_warehouse_id || '',
      to_warehouse_id: row.to_warehouse_id || '',
      unit_id: '', // Clear first, will set after units loaded
      quantity: row.quantity || '',
      employee_id: row.employee_id || '',
      note: row.note || '',
      transfer_date: row.transfer_date ? row.transfer_date.slice(0, 10) : today,
      search: '',
    });

     if (row.item_id) {
    await fetchUnits(row.item_id);
    // Do NOT set unit_id here!
  }
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/item-transfer/delete/${selectedId}`);
      fetchFilteredTransfers();
      setSuccess(true);
    } catch (err) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    } finally {
      setOpenDialog(false);
      setSelectedId(null);
    }
  };

  // PDF preview handler
  const handleOpenPdfPreview = async () => {
    await fetchCompanyInfo();
    const allTransfers = await fetchAllTransfersForReport();
    setReportTransfers(allTransfers);
    setOpenPdfPreview(true);
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

    // If item_id changes, clear unit_id and fetch new units
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

  // Total by unit for summary row
  const totalByUnit = transfers.reduce((acc, row) => {
    const unitName = allUnits.find(u => u.id === row.unit_id)?.name || 'نەناسراو';
    acc[unitName] = (acc[unitName] || 0) + Number(row.quantity || 0);
    return acc;
  }, {});

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ m: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedId ? 'گۆڕینی گواستنەوە' : 'زیادکردنی گواستنەوە'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                 <ItemAutocomplete
                    value={formData.item_id}
                    onChange={val => handleChangeWithErrorReset({ target: { name: 'item_id', value: val } })}
                    error={formErrors.item_id}
                    helperText={formErrors.item_id}
                  />
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="بڕ"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.quantity}
                    helperText={formErrors.quantity}
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
                </Grid>
                <Grid item xs={4}>
                   <TextField
                    select
                    fullWidth
                    label="یەکە"
                    name="unit_id"
                    value={formData.unit_id}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.unit_id}
                    helperText={formErrors.unit_id}
                    disabled={unitsLoading || units.length === 0}
                  >
                    <MenuItem value="">هیچ</MenuItem>
                    {units.length === 0 && (
                      <MenuItem disabled value="">هیچ یەکەیەک بۆ ئەم کاڵا نییە</MenuItem>
                    )}
                    {units.map((u) => (
                      <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="کۆگا سەرچاوە"
                    name="from_warehouse_id"
                    value={formData.from_warehouse_id}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.from_warehouse_id}
                    helperText={formErrors.from_warehouse_id}
                  >
                    <MenuItem value="">هیچ</MenuItem>
                    {warehouses.map((w) => (
                      <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="کۆگا مەبەست"
                    name="to_warehouse_id"
                    value={formData.to_warehouse_id}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.to_warehouse_id}
                    helperText={formErrors.to_warehouse_id}
                  >
                    <MenuItem value="">هیچ</MenuItem>
                    {warehouses.map((w) => (
                      <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="کارمەند"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.employee_id}
                    helperText={formErrors.employee_id}
                  >
                    <MenuItem value="">هیچ</MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="تێبینی"
                    name="note"
                    value={formData.note}
                    onChange={handleChangeWithErrorReset}
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="بەروار"
                    name="transfer_date"
                    type="date"
                    value={formData.transfer_date || today}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.transfer_date}
                    helperText={formErrors.transfer_date}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
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
                    label="کۆگا سەرچاوە"
                    value={filterFromWarehouseId}
                    onChange={e => { setFilterFromWarehouseId(e.target.value); setCurrentPage(1); }}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    {warehouses.map(w => (
                      <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="کۆگا مەبەست"
                    value={filterToWarehouseId}
                    onChange={e => { setFilterToWarehouseId(e.target.value); setCurrentPage(1); }}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    {warehouses.map(w => (
                      <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                 <ItemAutocomplete
                    value={filterItemId}
                    onChange={val => { setFilterItemId(val); setCurrentPage(1); }}
                  />
                </Grid>
                {/* Removed unit filter field */}
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
                  <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <Box sx={{ width: '100%' }}>
                        <ReportButton
                          onClick={handleOpenPdfPreview}
                          fullWidth={true}
                          sx={{ width: '100%' }}
                        />
                      </Box>
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
                        active={sortBy === 'item_id'}
                        direction={sortBy === 'item_id' ? sortOrder : 'asc'}
                        onClick={() => handleSort('item_id')}
                      >
                        کاڵا
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>کۆگا سەرچاوە</TableCell>
                    <TableCell>کۆگا مەبەست</TableCell>
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
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'transfer_date'}
                        direction={sortBy === 'transfer_date' ? sortOrder : 'asc'}
                        onClick={() => handleSort('transfer_date')}
                      >
                        بەروار
                      </TableSortLabel>
                    </TableCell>
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
                  ) : transfers.length > 0 ? (
                    transfers.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{items.find(i => i.id === row.item_id)?.name || row.item_id}</TableCell>
                        <TableCell>{warehouses.find(w => w.id === row.from_warehouse_id)?.name || row.from_warehouse_id}</TableCell>
                        <TableCell>{warehouses.find(w => w.id === row.to_warehouse_id)?.name || row.to_warehouse_id}</TableCell>
                        <TableCell>{allUnits.find(u => u.id === row.unit_id)?.name || 'نەناسراو'}</TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        <TableCell>{employees.find(emp => emp.id === row.employee_id)?.name || row.employee_id}</TableCell>
                        <TableCell>{row.note}</TableCell>
                        <TableCell>{row.transfer_date ? row.transfer_date.slice(0, 10) : ''}</TableCell>
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
                      <TableCell colSpan={10} align="center">
                        هیچ گواستنەوەیەک نەدۆزرایەوە
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: 16 }}>
                      {Object.entries(totalByUnit).length === 0 ? (
                        <span>کۆی گشتی: -</span>
                      ) : (
                        Object.entries(totalByUnit).map(([unit, sum], idx, arr) => (
                          <span key={unit} style={{ margin: '0 12px' }}>
                            <span style={{ fontWeight: 'bold', color: '#222' }}>{unit}:</span>
                            <span style={{ color: '#d32f2f', fontWeight: 'bold', marginRight: 4 }}>
                              {sum > 0 ? ` -${sum}` : ''}
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
        title="سڕینەوەی گواستنەوە"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم گواستنەوە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* PDF Dialog */}
      <DialogPdf
        open={openPdfPreview}
        onClose={() => setOpenPdfPreview(false)}
        document={
          <ItemTransferPDF
            transfers={reportTransfers}
            warehouses={warehouses}
            items={items}
            units={allUnits}
            users={employees}
            company={company}
            filters={{
              from_warehouse_id: filterFromWarehouseId,
              to_warehouse_id: filterToWarehouseId,
              item_id: filterItemId,
              employee_id: filterEmployeeId,
              dateRange: filterDateRange,
              search,
            }}
          />
        }
        fileName="item_transfer_report.pdf"
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

export default ItemTransferManagment;