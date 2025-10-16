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
import DialogPdf from '../../components/utils/DialogPdf';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ReportButton from '../../components/common/ReportButton';
import ItemDamagePDF from '../../components/reports/item/ItemDamagePDF';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { useItemUnits } from '../../hooks/useItemUnits';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function ItemDamageManagment({ isDrawerOpen }) {
  // Initial form state
  const initialFormData = {
    type: '',
    warehouse_id: '',
    item_id: '',
    unit_id: '',
    quantity: '',
    user_id: '',
    reason: '',
    date_at: '',
  };

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const rowsPerPage = 10;

  // States
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [damages, setDamages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const [reportDamages, setReportDamages] = useState([]);
  const [allUnits, setAllUnits] = useState([]);

  // Filter states
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [filterItemId, setFilterItemId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ mode: 'today', start: today, end: today });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const { company, fetchCompanyInfo } = useCompanyInfo();

  // Units for selected item
  const { units, loading: unitsLoading, fetchUnits } = useItemUnits(formData.item_id);

  // Fetch all units on mount for table display
  useEffect(() => {
    const fetchAllUnits = async () => {
      try {
        const res = await axiosInstance.get('/item-unit/index');
        setAllUnits(res.data || []);
      } catch {}
    };
    fetchAllUnits();
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchWarehouses();
    fetchUsers();
    fetchItems();
  }, []);

  // Fetch filtered damages on filter/sort/page change
  useEffect(() => {
    fetchFilteredDamages();
    // eslint-disable-next-line
  }, [
    filterWarehouseId,
    filterItemId,
    filterType,
    filterUserId,
    filterDateRange,
    search,
    currentPage,
    sortBy,
    sortOrder
  ]);

  // Clear unit_id when item_id changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, unit_id: '' }));
  }, [formData.item_id]);

  // Fetchers
  const fetchWarehouses = async () => {
    try {
      const res = await axiosInstance.get('/warehouse/index');
      setWarehouses(res.data || []);
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/user/index');
      setUsers(res.data || []);
    } catch {}
  };

  const fetchItems = async () => {
    try {
      const res = await axiosInstance.get('/item/index');
      setItems(res.data || []);
    } catch {}
  };

  // Fetch all filtered damages for report (no pagination)
  const fetchAllDamagesForReport = async () => {
    try {
      const filters = {
        warehouse_id: filterWarehouseId,
        item_id: filterItemId,
        type: filterType,
        user_id: filterUserId,
        date_from: filterDateRange.start || today,
        date_to: filterDateRange.end || today,
        search,
        sortBy,
        sortOrder
      };
      const res = await axiosInstance.get('/item-damage/filter', { params: { ...filters, page: 1, pageSize: 10000 } });
      return res.data.data || [];
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی هەموو داتا');
      return [];
    }
  };

  // Main filter fetch
  const fetchFilteredDamages = async () => {
    setFetching(true);
    try {
      const filters = {
        warehouse_id: filterWarehouseId,
        item_id: filterItemId,
        type: filterType,
        user_id: filterUserId,
        date_from: filterDateRange.start || today,
        date_to: filterDateRange.end || today,
        search,
        page: currentPage,
        pageSize: rowsPerPage,
        sortBy,
        sortOrder
      };
      const res = await axiosInstance.get('/item-damage/filter', { params: filters });
      setDamages(res.data.data || []);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      setDamages([]);
      setTotalCount(0);
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتا');
    } finally {
      setFetching(false);
    }
  };

  // PDF preview
  const handleOpenPdfPreview = async () => {
    await fetchCompanyInfo();
    const allDamages = await fetchAllDamagesForReport();
    setReportDamages(allDamages);
    setOpenPdfPreview(true);
  };

  // Form handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const errors = {};
    if (!formData.type) errors.type = 'جۆری زیان پێویستە';
    if (!formData.warehouse_id) errors.warehouse_id = 'کۆگا پێویستە';
    if (!formData.item_id) errors.item_id = 'کاڵا پێویستە';
    if (!formData.unit_id) errors.unit_id = 'یەکە پێویستە';
    if (formData.quantity === '' || isNaN(Number(formData.quantity))) errors.quantity = 'بڕ پێویستە';
    if (!formData.user_id) errors.user_id = 'بەکارهێنەر پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        type: formData.type,
        warehouse_id: formData.warehouse_id,
        item_id: formData.item_id,
        unit_id: formData.unit_id,
        quantity: formData.quantity,
        user_id: formData.user_id,
        reason: formData.reason,
        date_at: formData.date_at || today,
      };
      let response;
      if (selectedId) {
        response = await axiosInstance.put(`/item-damage/update/${selectedId}`, payload);
      } else {
        response = await axiosInstance.post('/item-damage/store', payload);
      }

      if ([200, 201].includes(response.status)) {
        fetchFilteredDamages();
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

  const handleClearForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedId(null);
    setErrorMessage('');
    setFilterWarehouseId('');
    setFilterItemId('');
    setFilterType('');
    setFilterUserId('');
    setFilterDateRange({ mode: 'today', start: today, end: today });
    setSearch('');
    setCurrentPage(1);
  };

  // Edit handler: set form, fetch units, then set unit_id
  const handleEditClick = async (row) => {
    setSelectedId(row.id);
    setFormErrors({});
    setFormData({
      type: row.type || '',
      warehouse_id: row.warehouse_id || '',
      item_id: row.item_id || '',
      unit_id: '', // Clear first, will set after units loaded
      quantity: row.quantity || '',
      user_id: row.user_id || '',
      reason: row.reason || '',
      date_at: row.date_at ? row.date_at.slice(0, 10) : today,
    });

    if (row.item_id) {
      await fetchUnits(row.item_id);
      setFormData(prev => ({
        ...prev,
        unit_id: row.unit_id || '',
      }));
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/item-damage/delete/${selectedId}`);
      fetchFilteredDamages();
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

    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'item_id' ? { unit_id: '' } : {}) // Clear unit_id when item changes
    }));
  };

  const clearSelectField = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Total by unit for summary row
  const totalByUnit = damages.reduce((acc, row) => {
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
              {selectedId ? 'گۆڕینی (کاڵای خراپ بوو)' : 'زیادکردنی (کاڵای خراپ بوو)'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                select
                fullWidth
                label="جۆری خراپ بوون"
                name="type"
                value={formData.type}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.type}
                helperText={formErrors.type}
                sx={{ mb: 2 }}
              >
                <MenuItem value="وونبوون">وونبوون</MenuItem>
                <MenuItem value="شکان">شکان</MenuItem>
                <MenuItem value="بەسەرچوون">بەسەرچوون</MenuItem>
                <MenuItem value="تەڕبوون">تەڕبوون</MenuItem>
                <MenuItem value="سووتان">سووتان</MenuItem>
                <MenuItem value="هتر">هتر</MenuItem>
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
                    onChange={val => handleChangeWithErrorReset({ target: { name: 'item_id', value: val?.id || val } })}
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
                name="user_id"
                value={formData.user_id}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.user_id}
                helperText={formErrors.user_id}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">هیچ</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="هۆکار"
                name="reason"
                value={formData.reason}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.reason && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('reason')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="بەروار"
                name="date_at"
                type="date"
                value={formData.date_at || today}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={8}>
                  <RegisterButton onClick={handleSubmit} loading={loading} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <ClearButton onClick={handleClearForm} />
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
                    <MenuItem value="وونبوون">وونبوون</MenuItem>
                    <MenuItem value="شکان">شکان</MenuItem>
                    <MenuItem value="بەسەرچوون">بەسەرچوون</MenuItem>
                    <MenuItem value="تەڕبوون">تەڕبوون</MenuItem>
                    <MenuItem value="سووتان">سووتان</MenuItem>
                    <MenuItem value="هتر">هتر</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="کارمەند"
                    value={filterUserId}
                    onChange={e => { setFilterUserId(e.target.value); setCurrentPage(1); }}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    {users.map(u => (
                      <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
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
                      placeholder="ناو یان هۆکار..."
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
                  <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                    <ReportButton onClick={handleOpenPdfPreview} fullWidth={window.innerWidth < 900} />
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
                        active={sortBy === 'warehouse_id'}
                        direction={sortBy === 'warehouse_id' ? sortOrder : 'asc'}
                        onClick={() => handleSort('warehouse_id')}
                      >
                        کۆگا
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
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'type'}
                        direction={sortBy === 'type' ? sortOrder : 'asc'}
                        onClick={() => handleSort('type')}
                      >
                        جۆر
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>بەکارهێنەر</TableCell>
                    <TableCell>هۆکار</TableCell>
                    <TableCell>بەروار</TableCell>
                    <TableCell>ئیش</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                 {fetching ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  ) : damages.length > 0 ? (
                    damages.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{warehouses.find(w => w.id === row.warehouse_id)?.name || row.warehouse_id}</TableCell>
                        <TableCell>{items.find(i => i.id === row.item_id)?.name || row.item_id}</TableCell>
                        <TableCell>{allUnits.find(u => u.id === row.unit_id)?.name || 'نەناسراو'}</TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{users.find(u => u.id === row.user_id)?.name || row.user_id}</TableCell>
                        <TableCell>{row.reason}</TableCell>
                        <TableCell>{row.date_at ? row.date_at.slice(0, 10) : ''}</TableCell>
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
                        هیچ زیانێک نەدۆزرایەوە
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
        title="سڕینەوەی کاڵای خراپ بوو"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم کاڵا خراپ بووە ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* PDF Dialog */}
      <DialogPdf
        open={openPdfPreview}
        onClose={() => setOpenPdfPreview(false)}
        document={
          <ItemDamagePDF
            damages={reportDamages}
            warehouses={warehouses}
            items={items}
            units={units}
            users={users}
            company={company}
            filters={{
              warehouse: filterWarehouseId,
              item: filterItemId,
              type: filterType,
              user: filterUserId,
              dateRange: filterDateRange,
              search,
            }}
          />
        }
        fileName="item_damage_report.pdf"
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

export default ItemDamageManagment;