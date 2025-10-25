import React, { useState, useEffect } from 'react';
import axiosInstance from '../../components/service/axiosInstance';
import {
  Card,
  Typography,
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Paper,
  Pagination,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import { getCurrentUserId } from '../Authentication/auth';
import DateRangeSelector from '../../components/utils/DateRangeSelector';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function AppointmentManagment({ isDrawerOpen }) {
  // Today's date in yyyy-MM-dd format
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

   const initialFormData = {
    customer_name: '',
    customer_phone: '',
    name: '',
    table_id: '',
    note: '',
    branch_id: '',
    employee_id: '',
    appointment_date: today,
    start_time: '',
    end_time: '',
    search: '',
  };

  const rowsPerPage = 20;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tables, setTables] = useState([]);
  const [filterTableId, setFilterTableId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ mode: 'today', start: today, end: today });
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const { company, fetchCompanyInfo } = useCompanyInfo();
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('appointment_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch all data and initial appointments
  useEffect(() => {
    const currentUser = getCurrentUserId();
    setFormData((prev) => ({ ...initialFormData, user_id: currentUser, employee_id: currentUser }));
    fetchAllData();
    fetchAppointments();
    fetchCompanyInfo();
    // eslint-disable-next-line
  }, []);

    const fetchAllData = async () => {
    setFetching(true);
    try {
      const results = await Promise.allSettled([
        axiosInstance.get('/branch/index'),
        axiosInstance.get('/user/index'),
        axiosInstance.get('/table/index'),
      ]);
      
      if (results[0].status === 'fulfilled') setBranches(results[0].value.data || []);
      if (results[1].status === 'fulfilled') setEmployees(results[1].value.data || []);
      if (results[2].status === 'fulfilled') setTables(results[2].value.data || []);
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتا');
    } finally {
      setFetching(false);
    }
  };

   const fetchAppointments = async (
    searchValue = '',
    dateRange = filterDateRange,
    branchId = filterBranchId,
    employeeId = filterEmployeeId,
    tableId = filterTableId,
    page = currentPage,
    pageSize = rowsPerPage,
    sortField = sortBy,
    sortDirection = sortOrder
  ) => {
    setFetching(true);
    try {
      let params = {
        page,
        pageSize,
        sortBy: sortField,
        sortOrder: sortDirection,
      };
      
      if (searchValue.trim()) {
        params.name = searchValue;
        params.customer_name = searchValue;
        params.customer_phone = searchValue;
        
        if (!isNaN(searchValue)) {
          params.id = searchValue;
        }
      }
      
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      if (branchId) params.branch_id = branchId;
      if (employeeId) params.employee_id = employeeId;
      if (tableId) params.table_id = tableId;

      const response = await axiosInstance.get('/appointment/filter', { params });
      setAppointments(response.data.appointments || []);
      setTotalCount(response.data.total || 0);
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی زانیاری');
    } finally {
      setFetching(false);
    }
  };

    const handleDateRangeChange = (range) => {
    setFilterDateRange(range);
    setCurrentPage(1);
    fetchAppointments(search, range, filterBranchId, filterEmployeeId, filterTableId, 1);
  };

    const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setCurrentPage(1);
    fetchAppointments(value, filterDateRange, filterBranchId, filterEmployeeId, filterTableId, 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const errors = {};
    if (!formData.branch_id) errors.branch_id = 'لق دیاری بکە';
    if (!formData.customer_name) errors.customer_name = 'ناوی مشتری پێویستە';
    if (!formData.customer_phone) errors.customer_phone = 'ژمارەی مۆبایل پێویستە';
    if (!formData.appointment_date) errors.appointment_date = 'بەرواری دواکراو پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
           const payload = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        name: formData.name,
        table_id: formData.table_id || null,
        note: formData.note,
        branch_id: formData.branch_id,
        user_id: getCurrentUserId(),
        employee_id: formData.employee_id || null,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null
      };

      let response;
      if (selectedId) {
        response = await axiosInstance.put(`/appointment/update/${selectedId}`, payload);
      } else {
        response = await axiosInstance.post('/appointment/store', payload);
      }

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setErrorMessage('');
        setFormData({ ...initialFormData, user_id: getCurrentUserId(), employee_id: getCurrentUserId() });
        setSelectedId(null);
        setFormErrors({});
        setCurrentPage(1);
        fetchAppointments(
          search,
          filterDateRange,
          filterBranchId,
          filterEmployeeId,
           filterTableId,
          1
        );
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || 'هەڵە ڕوویدا لە تۆمارکردن'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (item) => {
    setSelectedId(item.id);
    setFormErrors({});
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/appointment/show/${item.id}`);
      const data = response.data;
     setFormData({
        customer_name: data.customer_name || '',
        customer_phone: data.customer_phone || '',
        name: data.name || '',
        table_id: data.table_id || '',
        note: data.note || '',
        branch_id: data.branch_id || '',
        employee_id: data.employee_id || data.user_id || '',
        user_id: data.user_id || getCurrentUserId(),
        appointment_date: data.appointment_date ? data.appointment_date : today,
        start_time: data.start_time || '',
        end_time: data.end_time || '',
        search: '',
      });
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە دۆزینەوەی زانیاری');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axiosInstance.delete(`/appointment/delete/${selectedId}`);
      if ([200, 201, 204].includes(response.status)) {
        setAppointments((prev) => prev.filter((a) => a.id !== selectedId));
        setOpenDialog(false);
        setSuccess(true);
        setErrorMessage('');
        setFormData(initialFormData);
        setSelectedId(null);
        setFormErrors({});
        setCurrentPage(1);
         fetchAppointments(
          search,
          filterDateRange,
          filterBranchId,
          filterEmployeeId,
          filterTableId,
          1
        );
      }
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    }
  };

  const handlePageChange = (_, value) => {
    setCurrentPage(value);
      fetchAppointments(
      search,
      filterDateRange,
      filterBranchId,
      filterEmployeeId,
      filterTableId,
      value,
      rowsPerPage
    );
  };

  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);

  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortBy(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
    setCurrentPage(1);
    fetchAppointments(
      search,
      filterDateRange,
      filterBranchId,
      filterEmployeeId,
      filterTableId,
      1,
      rowsPerPage,
      field,
      isAsc ? 'desc' : 'asc'
    );
  };

  const handleChangeWithErrorReset = (e) => {
    setErrorMessage('');
    setFormErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };


    const clearSelectField = (field) => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
    setFormErrors((prevErrors) => ({ ...prevErrors, [field]: '' }));
  };

  // Helper function to calculate duration between two times
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    // Handle case where end time is next day (negative duration)
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} خولەک`;
    } else if (minutes === 0) {
      return `${hours} کاتژمێر`;
    } else {
      return `${hours} کاتژمێر و ${minutes} خولەک`;
    }
  };




  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        {/* Form Section */}

        <Grid item xs={12} md={4}>

          <Card sx={{ margin: 1, padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedId ? 'گۆڕینی حیجزکردن' : 'زیادکردنی حیجزکردن'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ناوی کڕیار"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.customer_name}
                    helperText={formErrors.customer_name}
             
                    InputProps={{
                      endAdornment: formData.customer_name && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearSelectField('customer_name')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ژمارەی مۆبایل"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.customer_phone}
                    helperText={formErrors.customer_phone}
                
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="جۆر"
                    name="name"
                    value={formData.name}
                    onChange={handleChangeWithErrorReset}
                   
                  />
                </Grid>

                
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="مێز"
                    name="table_id"
                    value={formData.table_id}
                    onChange={handleChangeWithErrorReset}
                  >
                    <MenuItem value="">ژمارەی مێز</MenuItem>
                    {tables
                      .filter(t => !formData.branch_id || t.branch_id === formData.branch_id)
                      .map((table) => (
                        <MenuItem key={table.id} value={table.id}>
                          {table.table_number} ({table.capacity} کەس)
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>

               <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="لق"
                      name="branch_id"
                      value={formData.branch_id}
                      onChange={handleChangeWithErrorReset}
                      error={!!formErrors.branch_id}
                      helperText={formErrors.branch_id}
                    >
                      {branches.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
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
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </MenuItem>
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
                    
                />
           </Grid>
           
             <Grid item xs={12}>

                <TextField
                  fullWidth
                  label="بەروار"
                  name="appointment_date"
                  type="date"
                  value={formData.appointment_date}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.appointment_date}
                  helperText={formErrors.appointment_date}
             
                  InputLabelProps={{ shrink: true }}
                />

                       </Grid>
             

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="کات - دەستپێک"
                      name="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={handleChangeWithErrorReset}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                    <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="کات - کۆتایی"
                      name="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={handleChangeWithErrorReset}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
               
                  <Grid item xs={8}>
                    <RegisterButton loading={loading} fullWidth>
                      {selectedId ? 'نوێکردنەوە' : 'تۆمارکردن'}
                    </RegisterButton>
                  </Grid>
                  <Grid item xs={4}>
                    <ClearButton
                         onClick={() => {
                        setFormData({ ...initialFormData, user_id: getCurrentUserId() });
                        setFormErrors({});
                        setSelectedId(null);
                        setErrorMessage('');
                        setSearch('');
                        setFilterBranchId('');
                        setFilterEmployeeId('');
                        setFilterTableId('');
                        const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 10);
                        setFilterDateRange({ mode: 'today', start: today, end: today });
                        setCurrentPage(1);
                        fetchAppointments('', filterDateRange, '', '', '', 1);
                      }}
                      fullWidth
                    />
                  </Grid>
           
              </Grid>
            </form>
          </Card>
        </Grid>

        {/* Table Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ margin: 1, padding: 2 }}>
            {/* Search/Filter Controls */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                   <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="گەڕان"
                    name="search"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="گەڕان"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="هەموو داتاکان">
                            <IconButton onClick={() => { 
                              setSearch(''); 
                              fetchAppointments('', filterDateRange, filterBranchId, filterEmployeeId, filterTableId, 1); 
                            }}>
                              <SearchIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
               <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="لق"
                    value={filterBranchId}
                    onChange={e => {
                      setFilterBranchId(e.target.value);
                      setCurrentPage(1);
                      fetchAppointments(search, filterDateRange, e.target.value, filterEmployeeId, filterTableId, 1);
                    }}
                  >
                    <MenuItem value="">هەموو لقەکان</MenuItem>
                    {branches.map(branch => (
                      <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
               <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="کارمەند"
                    value={filterEmployeeId || ''}
                    onChange={e => {
                      setFilterEmployeeId(e.target.value);
                      setCurrentPage(1);
                      fetchAppointments(search, filterDateRange, filterBranchId, e.target.value, filterTableId, 1);
                    }}
                  >
                    <MenuItem value="">هەموو کارمەندان</MenuItem>
                    {employees.map(emp => (
                      <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                 <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="مێز"
                    value={filterTableId || ''}
                    onChange={e => {
                      setFilterTableId(e.target.value);
                      setCurrentPage(1);
                      fetchAppointments(search, filterDateRange, filterBranchId, filterEmployeeId, e.target.value, 1);
                    }}
                  >
                    <MenuItem value="">هەموو مێزەکان</MenuItem>
                    {tables.map(table => (
                      <MenuItem key={table.id} value={table.id}>
                        {table.table_number}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={8}>
                  <DateRangeSelector value={filterDateRange} onChange={handleDateRangeChange} />
                </Grid>
              </Grid>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>ناوی کڕیار</TableCell>
                    <TableCell>ژمارەی مۆبایل</TableCell>
                    <TableCell>مێز</TableCell>
                    <TableCell>تێبینی</TableCell>
                    <TableCell>لق</TableCell>
                    <TableCell>کارمەند</TableCell>
                    <TableCell>بەروار</TableCell>
                    <TableCell>کات</TableCell>
                    <TableCell>ماوەی مانەوە</TableCell>
                    <TableCell>ئیش</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fetching ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  ) : appointments.length > 0 ? (
                    appointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.id}</TableCell>
                        <TableCell>{a.customer_name}</TableCell>
                        <TableCell>{a.customer_phone}</TableCell>
                         <TableCell sx={{ color: 'red', fontWeight: 'bold' }}>
                          {a.table_number || '-'}
                        </TableCell>
                        <TableCell>{a.note}</TableCell>
                        <TableCell>{branches.find((b) => b.id === a.branch_id)?.name || a.branch_id}</TableCell>
                        <TableCell>{employees.find((e) => e.id === a.employee_id)?.name || a.employee_id}</TableCell>
                        <TableCell>{a.appointment_date ? new Date(a.appointment_date).toLocaleDateString('en-GB') : ''}</TableCell>
                        <TableCell>{(a.start_time || '') + (a.end_time ? ` - ${a.end_time}` : '')}</TableCell>
                       <TableCell>{calculateDuration(a.start_time, a.end_time)}</TableCell>

                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(a)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(a.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        هیچ داتایەک نەدۆزرایەوە
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      {/* optionally put totals or summary */}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="center">
              {appointments.length > 0 && (
                <Pagination
                  count={Math.ceil(totalCount / rowsPerPage) || 1}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={openDialog}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی حیجزکردن"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم حیجزکردنە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* Snackbars */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          جێبەجێکرا
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={handleErrorSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleErrorSnackbarClose} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AppointmentManagment;
