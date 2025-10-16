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
  TableFooter,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  MenuItem,

} from '@mui/material';
import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import TableSortLabel from '@mui/material/TableSortLabel';
import DialogPdf from '../../components/utils/DialogPdf';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ReportButton from '../../components/common/ReportButton';
import SalaryPDF from '../../components/reports/salary/SalaryPDF';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import DateRangeSelector from '../../components/utils/DateRangeSelector';
import { getCurrentUserId } from '../Authentication/auth';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import LoadingSpinner from '../../components/common/LoadingSpinner';


function SalaryManagment({ isDrawerOpen }) {
  // --- State ---
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const initialFormData = {
    employee_id: '',
    amount: '',
    salary_period_start: today,
    salary_period_end: today,
    note: '',
    user_id: '',
    branch_id: '',
    currency_id: '',
    search: '',
  };

  const rowsPerPage = 5;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [salaries, setSalaries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSalaryId, setSelectedSalaryId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ mode: 'today', start: today, end: today });
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalCount, setTotalCount] = useState(0);
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const [reportSalaries, setReportSalaries] = useState([]);
  const { company, fetchCompanyInfo } = useCompanyInfo();
  const [totalSumByCurrency, setTotalSumByCurrency] = useState({});

  // --- Effects ---

  // Fetch all data and company info on mount
  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId) {
      setFormData((prev) => ({ ...prev, user_id: userId }));
    }
    fetchAllData();
    fetchCompanyInfo();
    handleFilter(1, rowsPerPage, sortBy, sortOrder);
    // eslint-disable-next-line
  }, []);

  // Refetch salaries when filters, sorting, or pagination change
  useEffect(() => {
  if (!filterEmployee && !filterBranch && !filterDateRange.start && !filterDateRange.end) {
    setCurrentPage(1);
    setSalaries([]);
    setTotalCount(0);
    setTotalSumByCurrency({});
    return;
  }
  const timeout = setTimeout(() => {
    handleFilter(currentPage, rowsPerPage, sortBy, sortOrder);
    fetchTotalSumByCurrency(); // <-- Add this line
  }, 400);
  return () => clearTimeout(timeout);
  // eslint-disable-next-line
}, [filterEmployee, filterBranch, filterDateRange, sortBy, sortOrder, currentPage]);

  // --- Data Fetchers ---

  // Fetch branches, employees, currencies
  const fetchAllData = async () => {
    setFetching(true);
    try {
      const [branchRes, employeeRes, currencyRes] = await Promise.all([
        axiosInstance.get('/branch/index'),
        axiosInstance.get('/user/index'),
        axiosInstance.get('/currency/index'),
      ]);
      setBranches(branchRes.data || []);
      setEmployees(employeeRes.data || []);
      setCurrencies(currencyRes.data || []);
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتا');
    } finally {
      setFetching(false);
    }
  };


// Fetch all filtered salaries and calculate sum
const fetchTotalSumByCurrency = async () => {
  try {
    const params = {
      sortBy,
      sortOrder,
    };
    if (filterEmployee) params.employee_id = filterEmployee;
    if (filterBranch) params.branch_id = filterBranch;
    if (filterDateRange.start) params.startDate = filterDateRange.start;
    if (filterDateRange.end) params.endDate = filterDateRange.end;

    // Fetch all filtered salaries (no pagination)
    const response = await axiosInstance.get('/salary/filter', { params });
    const allSalaries = response.data.salaries || [];
    // Calculate sum by currency
    const sums = {};
    allSalaries.forEach((sal) => {
      const currency = currencies.find((cur) => cur.id === sal.currency_id);
      const symbol = currency?.symbol || '';
      const key = symbol || sal.currency_id || '';
      const amount = Number(sal.amount || 0);
      if (!sums[key]) sums[key] = 0;
      sums[key] += amount;
    });
    setTotalSumByCurrency(sums);
  } catch (error) {
    setTotalSumByCurrency({});
  }
};

  // Fetch all salaries for report (no pagination)
  const fetchAllSalariesForReport = async () => {
    try {
      const params = {
        sortBy,
        sortOrder,
      };
      if (filterEmployee) params.employee_id = filterEmployee;
      if (filterBranch) params.branch_id = filterBranch;
      if (filterDateRange.start) params.startDate = filterDateRange.start;
      if (filterDateRange.end) params.endDate = filterDateRange.end;

      const response = await axiosInstance.get('/salary/filter', { params });
      return response.data.salaries || [];
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی هەموو داتا');
      return [];
    }
  };

  // --- Handlers ---

  // Sorting handler
  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortBy(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  // Filter salaries by employee, branch, date range, sorting, and pagination
  const handleFilter = async (
    page = currentPage,
    pageSize = rowsPerPage,
    sortField = sortBy,
    sortDirection = sortOrder
  ) => {
    setFetching(true);
    setErrorMessage('');
    try {
      if (!filterDateRange.start && !filterDateRange.end) {
        setErrorMessage('بەرواری دەستپێکردن یان کۆتایی پێویستە');
        setFetching(false);
        return;
      }
      const params = {
        page,
        pageSize,
        sortBy: sortField,
        sortOrder: sortDirection,
      };
      if (filterEmployee) params.employee_id = filterEmployee;
      if (filterBranch) params.branch_id = filterBranch;
      if (filterDateRange.start) params.startDate = filterDateRange.start;
      if (filterDateRange.end) params.endDate = filterDateRange.end;

      const response = await axiosInstance.get('/salary/filter', { params });
      setSalaries(response.data.salaries || []);
      setTotalCount(response.data.total || 0);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error ||
        error.message ||
        'هەڵە لە گەڕان'
      );
    } finally {
      setFetching(false);
    }
  };

  // Format date to yyyy-MM-dd
  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    if (dateString.includes('T')) return dateString.split('T')[0];
    return '';
  };

  // Format number with commas
  function formatNumberWithCommas(value) {
    if (!value) return '';
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  // Get the salary of a user by user ID
  const getUserSalary = async (userId) => {
    try {
      const response = await axiosInstance.get(`/user/show/${userId}`);
      return response.data.salary;
    } catch (error) {
      return null;
    }
  };

  // Open PDF preview (fetch company info again to ensure up-to-date)
  const handleOpenPdfPreview = async () => {
    await fetchCompanyInfo();
    const allSalaries = await fetchAllSalariesForReport();
    setReportSalaries(allSalaries);
    setOpenPdfPreview(true);
  };

  // When employee changes, auto-fill amount if available
  const handleEmployeeChange = async (e) => {
    const employee_id = e.target.value;
    setFormData((prev) => ({ ...prev, employee_id }));
    if (employee_id) {
      const salary = await getUserSalary(employee_id);
      setFormData((prev) => ({
        ...prev,
        amount: salary !== undefined && salary !== null ? salary : '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, amount: '' }));
    }
  };

  // Handle form field changes and reset error for that field
  const handleChangeWithErrorReset = (e) => {
    setErrorMessage('');
    setFormErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Clear a specific field
  const clearSelectField = (field) => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
    setFormErrors((prevErrors) => ({ ...prevErrors, [field]: '' }));
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    const errors = {};
    if (!formData.employee_id) errors.employee_id = 'کارمەند دیاری بکە';
    if (!formData.amount || isNaN(Number(formData.amount.toString().replace(/,/g, '')))) errors.amount = 'بڕی مووچە پێویستە';
    if (!formData.branch_id) errors.branch_id = 'لق دیاری بکە';
    if (!formData.currency_id) errors.currency_id = 'دراو دیاری بکە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData, amount: Number(formData.amount.toString().replace(/,/g, '')) };
      let response;
      if (selectedSalaryId) {
        response = await axiosInstance.put(`/salary/update/${selectedSalaryId}`, payload);
      } else {
        response = await axiosInstance.post('/salary/store', payload);
      }

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setErrorMessage('');
        setFormData({
          ...initialFormData,
          user_id: getCurrentUserId(),
        });
        setSelectedSalaryId(null);
        setFormErrors({});
        setCurrentPage(1);
        handleFilter(1, rowsPerPage, sortBy, sortOrder);
          fetchTotalSumByCurrency(); // <-- Add this line

      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || 'هەڵە ڕوویدا لە تۆمارکردن'
      );
    } finally {
      setLoading(false);
    }
  };

  // Edit salary
  const handleEditClick = async (salary) => {
    setSelectedSalaryId(salary.id);
    setFormErrors({});
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/salary/show/${salary.id}`);
      const data = response.data;
      setFormData({
        employee_id: data.employee_id || '',
        amount: data.amount ? data.amount.toString().replace(/,/g, '') : '',
        salary_period_start: formatDate(data.salary_period_start),
        salary_period_end: formatDate(data.salary_period_end),
        note: data.note || '',
        user_id: data.user_id || '',
        branch_id: data.branch_id || '',
        currency_id: data.currency_id || '',
        search: '',
      });
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە دۆزینەوەی زانیاری');
    } finally {
      setLoading(false);
    }
  };

  // Delete salary
  const handleDeleteClick = (id) => {
    setSelectedSalaryId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axiosInstance.delete(`/salary/delete/${selectedSalaryId}`);
      if ([200, 201, 204].includes(response.status)) {
        setSalaries((prev) => prev.filter((salary) => salary.id !== selectedSalaryId));
        setOpenDialog(false);
        setSuccess(true);
        setErrorMessage('');
        setFormData({
          ...initialFormData,
          user_id: getCurrentUserId(),
        });
        setSelectedSalaryId(null);
        setFormErrors({});
        handleFilter(currentPage, rowsPerPage, sortBy, sortOrder);
          fetchTotalSumByCurrency(); // <-- Add this line

      }
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    }
  };

  // Pagination
  const currentSalaries = salaries; // No slicing, backend paginates
  const handlePageChange = (_, value) => {
    setCurrentPage(value);
  };

  // Snackbar and dialog handlers
  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);

  // --- Render ---
  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ margin: 1, padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedSalaryId ? 'گۆڕینی مووچە' : 'زیادکردنی مووچە'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                select
                fullWidth
                label="کارمەند"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleEmployeeChange}
                error={!!formErrors.employee_id}
                helperText={formErrors.employee_id}
                sx={{ mb: 2 }}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="بڕی مووچە"
                    name="amount"
                    type="text"
                    value={formatNumberWithCommas(formData.amount)}
                    onChange={e => {
                      const rawValue = e.target.value.replace(/,/g, '');
                      if (!/^\d*\.?\d*$/.test(rawValue)) return;
                      handleChangeWithErrorReset({
                        target: { name: 'amount', value: rawValue }
                      });
                    }}
                    error={!!formErrors.amount}
                    helperText={formErrors.amount}
                    InputProps={{
                      endAdornment: formData.amount && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearSelectField('amount')}>
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
                    label="دراو"
                    name="currency_id"
                    value={formData.currency_id}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.currency_id}
                    helperText={formErrors.currency_id}
                  >
                    {currencies.map((cur) => (
                      <MenuItem key={cur.id} value={cur.id}>
                        {cur.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="دەستپێکردنی مانگ"
                name="salary_period_start"
                type="date"
                value={formData.salary_period_start}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="کۆتایی مانگ"
                name="salary_period_end"
                type="date"
                value={formData.salary_period_end}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="تێبینی"
                name="note"
                value={formData.note}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
              />

              <TextField
                select
                fullWidth
                label="لق"
                name="branch_id"
                value={formData.branch_id}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.branch_id}
                helperText={formErrors.branch_id}
                sx={{ mb: 2 }}
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </TextField>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                 <Grid item xs={8}>
                  <RegisterButton
                    loading={loading}
                    fullWidth
                    children={selectedSalaryId ? 'نوێکردنەوە' : 'تۆمارکردن'}
                  />
                </Grid>
               <Grid item xs={4}>
                <ClearButton
                  onClick={() => {
                    setFormData({ ...initialFormData, user_id: getCurrentUserId() });
                    setFormErrors({});
                    setSelectedSalaryId(null);
                    setErrorMessage('');
                    
                    setFilterDateRange({ mode: 'today', start: today, end: today });
                    setCurrentPage(1);
                    handleFilter(1, rowsPerPage, sortBy, sortOrder);
                    fetchTotalSumByCurrency();
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
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="کارمەند"
                    value={filterEmployee}
                    onChange={e => setFilterEmployee(e.target.value)}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    {employees.map(emp => (
                      <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="لق"
                    value={filterBranch}
                    onChange={e => setFilterBranch(e.target.value)}
                  >
                    <MenuItem value="">هەموو</MenuItem>
                    {branches.map(branch => (
                      <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={9}>
                    <DateRangeSelector value={filterDateRange} onChange={setFilterDateRange} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                     <ReportButton
                          onClick={handleOpenPdfPreview}
                          fullWidth
                          children="چاپکردن"
                        />
                  </Grid>
                </Grid>
              </Box>
            </Box>

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
                        active={sortBy === 'employee_id'}
                        direction={sortBy === 'employee_id' ? sortOrder : 'asc'}
                        onClick={() => handleSort('employee_id')}
                      >
                        کارمەند
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'amount'}
                        direction={sortBy === 'amount' ? sortOrder : 'asc'}
                        onClick={() => handleSort('amount')}
                      >
                        بڕ
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'salary_period_start'}
                        direction={sortBy === 'salary_period_start' ? sortOrder : 'asc'}
                        onClick={() => handleSort('salary_period_start')}
                      >
                        دەستپێکردن
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>کۆتایی</TableCell>
                    <TableCell>تێبینی</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'branch_id'}
                        direction={sortBy === 'branch_id' ? sortOrder : 'asc'}
                        onClick={() => handleSort('branch_id')}
                      >
                        لق
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>بەروار</TableCell>
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
                  )  : currentSalaries.length > 0 ? (
                    currentSalaries.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell>{salary.id}</TableCell>
                        <TableCell>
                          {employees.find((e) => e.id === salary.employee_id)?.name || salary.employee_id}
                        </TableCell>
                        <TableCell>
                          {formatNumberWithCommas(salary.amount)} {currencies.find((c) => c.id === salary.currency_id)?.symbol || ''}
                        </TableCell>
                        <TableCell>{formatDate(salary.salary_period_start)}</TableCell>
                        <TableCell>{formatDate(salary.salary_period_end)}</TableCell>
                        <TableCell>{salary.note}</TableCell>
                        <TableCell>
                          {branches.find((b) => b.id === salary.branch_id)?.name || salary.branch_id}
                        </TableCell>
                        <TableCell>{formatDate(salary.created_at)}</TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(salary)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(salary.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        {formData.search
                          ? "هیچ مووچەیەک بە گەڕانەکەت نەدۆزرایەوە"
                          : "هیچ مووچەیەک نەدۆزرایەوە"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                   <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                      کۆی گشتی بڕ:
                    </TableCell>
                    <TableCell colSpan={7} align="left" sx={{ fontWeight: 'bold' }}>
                      {Object.entries(totalSumByCurrency).map(([symbol, total]) => (
                        <span key={symbol} style={{ marginRight: 16 }}>
                          {symbol}{formatNumberWithCommas(total)}
                        </span>
                      ))}
                    </TableCell>
                  </TableRow>
                </TableFooter>

              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="center">
              {totalCount > 0 && (
                <Pagination
                  count={Math.ceil(totalCount / rowsPerPage)}
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
        title="سڕینەوەی مووچە"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم مووچەیە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* PDF Dialog */}
      <DialogPdf
        open={openPdfPreview}
        onClose={() => setOpenPdfPreview(false)}
        document={
          <SalaryPDF
            salaries={reportSalaries}
            employees={employees}
            branches={branches}
            currencies={currencies}
            company={company}
             filters={{
              employee: filterEmployee,
              branch: filterBranch,
              dateRange: filterDateRange,
            }}
          />
        }
        fileName="salary_report.pdf"
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

export default SalaryManagment;