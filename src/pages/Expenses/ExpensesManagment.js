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
import TableSortLabel from '@mui/material/TableSortLabel';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ReportButton from '../../components/common/ReportButton';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import { getCurrentUserId } from '../Authentication/auth';
import DateRangeSelector from '../../components/utils/DateRangeSelector';
import ExpensesPDF from '../../components/reports/expenses/ExpensesPDF';
import DialogPdf from '../../components/utils/DialogPdf';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function ExpensesManagment({ isDrawerOpen }) {
  // Today's date in yyyy-MM-dd format
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const initialFormData = {
    employee_id: '',
    category_id: '',
    name: '',
    amount: '',
    note: '',
    branch_id: '',
    currency_id: '',
    expense_date: today,
    search: '',
  };

  const rowsPerPage = 20;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ mode: 'today', start: today, end: today });
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const { company, fetchCompanyInfo } = useCompanyInfo();
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [reportExpenses, setReportExpenses] = useState([]);
  const [totalSumByCurrency, setTotalSumByCurrency] = useState({});
  const currentExpenses = expenses;


  // Fetch all data and initial expenses
  useEffect(() => {
    setFormData((prev) => ({ ...initialFormData, user_id: getCurrentUserId() }));
    fetchAllData();
    fetchExpenses();
    fetchCompanyInfo();
    fetchTotalSumByCurrency();
    // eslint-disable-next-line
  }, []);

  // Fetch sum of all filtered expenses by currency (not just current page)
  const fetchTotalSumByCurrency = async () => {
    try {
      let params = {
        sortBy,
        sortOrder,
      };
      if (search.trim()) {
        params.name = search;
        params.note = search;
        if (!isNaN(search)) {
          params.id = search;
        }
      }
      if (filterDateRange.start) params.startDate = filterDateRange.start;
      if (filterDateRange.end) params.endDate = filterDateRange.end;
      if (filterBranchId) params.branch_id = filterBranchId;
      if (filterEmployeeId) params.employee_id = filterEmployeeId;
      if (filterCategoryId) params.category_id = filterCategoryId;

      // Fetch all filtered expenses (no pagination)
      const response = await axiosInstance.get('/expenses/filter', { params });
      const allExpenses = response.data.expenses || [];
      // Calculate sum by currency
      const sums = {};
      allExpenses.forEach((exp) => {
        const currency = currencies.find((cur) => cur.id === exp.currency_id);
        const symbol = currency?.symbol || '';
        const key = symbol || exp.currency_id || '';
        const amount = Number(exp.amount || 0);
        if (!sums[key]) sums[key] = 0;
        sums[key] += amount;
      });
      setTotalSumByCurrency(sums);
    } catch (error) {
      setTotalSumByCurrency({});
    }
  };

  // Update sum when filters, sort, or page changes
  useEffect(() => {
    fetchTotalSumByCurrency();
    // eslint-disable-next-line
  }, [search, filterDateRange, filterBranchId, filterEmployeeId, filterCategoryId, sortBy, sortOrder]);

  const fetchAllData = async () => {
    setFetching(true);
    try {
      const [branchRes, employeeRes, categoryRes, currencyRes] = await Promise.all([
        axiosInstance.get('/branch/index'),
        axiosInstance.get('/user/index'),
        axiosInstance.get('/expenses-category/index'),
        axiosInstance.get('/currency/index'),
      ]);
      setBranches(branchRes.data || []);
      setEmployees(employeeRes.data || []);
      setCategories(categoryRes.data || []);
      setCurrencies(currencyRes.data || []);
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتا');
    } finally {
      setFetching(false);
    }
  };

  const fetchAllExpensesForReport = async () => {
    try {
      let params = {
        sortBy,
        sortOrder,
      };
      if (search.trim()) {
        params.name = search;
        params.note = search;
        if (!isNaN(search)) {
          params.id = search;
        }
      }
      if (filterDateRange.start) params.startDate = filterDateRange.start;
      if (filterDateRange.end) params.endDate = filterDateRange.end;
      if (filterBranchId) params.branch_id = filterBranchId;
      if (filterEmployeeId) params.employee_id = filterEmployeeId;
      if (filterCategoryId) params.category_id = filterCategoryId;

      const response = await axiosInstance.get('/expenses/filter', { params });
      return response.data.expenses || [];
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی هەموو داتا');
      return [];
    }
  };

  function formatNumberWithCommas(value) {
    if (!value) return '';
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  const fetchExpenses = async (
    searchValue = '',
    dateRange = filterDateRange,
    branchId = filterBranchId,
    employeeId = filterEmployeeId,
    categoryId = filterCategoryId,
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
        params.note = searchValue;
        if (!isNaN(searchValue)) {
          params.id = searchValue;
        }
      }
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      if (branchId) params.branch_id = branchId;
      if (employeeId) params.employee_id = employeeId;
      if (categoryId) params.category_id = categoryId;

      const response = await axiosInstance.get('/expenses/filter', { params });
      setExpenses(response.data.expenses || []);
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
    fetchExpenses(search, range, filterBranchId, filterEmployeeId, filterCategoryId, 1);
    fetchTotalSumByCurrency();
  };

  const handleOpenPdfPreview = async () => {
    const allExpenses = await fetchAllExpensesForReport();
    setReportExpenses(allExpenses);
    setOpenPdfPreview(true);

  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setCurrentPage(1);
    fetchExpenses(value, filterDateRange, filterBranchId, filterEmployeeId, filterCategoryId, 1);
    fetchTotalSumByCurrency();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const errors = {};
    if (!formData.employee_id) errors.employee_id = 'کارمەند دیاری بکە';
    if (!formData.category_id) errors.category_id = 'گرووپی مەسرووفات دیاری بکە';
    if (!formData.name) errors.name = 'ناوی مەسرووفات پێویستە';
    if (!formData.amount) errors.amount = 'بڕی مەسرووفات پێویستە';
    if (!formData.branch_id) errors.branch_id = 'لق دیاری بکە';
    if (!formData.currency_id) errors.currency_id = 'دراو دیاری بکە';
    if (!formData.expense_date) errors.expense_date = 'بەرواری مەسرووفات پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const { search, ...rest } = formData;
      const payload = {
        ...rest,
        user_id: getCurrentUserId(),
        amount: Number(formData.amount.toString().replace(/,/g, '')),
      };

      let response;
      if (selectedExpenseId) {
        response = await axiosInstance.put(`/expenses/update/${selectedExpenseId}`, payload);
      } else {
        response = await axiosInstance.post('/expenses/store', payload);
      }

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setErrorMessage('');
        setFormData({ ...initialFormData, user_id: getCurrentUserId() });
        setSelectedExpenseId(null);
        setFormErrors({});
        setCurrentPage(1);
        fetchExpenses(
          search,
          filterDateRange,
          filterBranchId,
          filterEmployeeId,
          filterCategoryId,
          1
        );
        fetchTotalSumByCurrency();
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || 'هەڵە ڕوویدا لە تۆمارکردن'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (expense) => {
    setSelectedExpenseId(expense.id);
    setFormErrors({});
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/expenses/show/${expense.id}`);
      const data = response.data;
      setFormData({
        employee_id: data.employee_id || '',
        category_id: data.category_id || '',
        name: data.name || '',
        amount: data.amount ? data.amount.toString().replace(/,/g, '') : '',
        note: data.note || '',
        branch_id: data.branch_id || '',
        user_id: getCurrentUserId(),
        currency_id: data.currency_id || '',
        expense_date: data.expense_date ? data.expense_date : today,
        search: '',
      });
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە دۆزینەوەی زانیاری');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedExpenseId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axiosInstance.delete(`/expenses/delete/${selectedExpenseId}`);
      if ([200, 201, 204].includes(response.status)) {
        setExpenses((prev) => prev.filter((expense) => expense.id !== selectedExpenseId));
        setOpenDialog(false);
        setSuccess(true);
        setErrorMessage('');
        setFormData(initialFormData);
        setSelectedExpenseId(null);
        setFormErrors({});
        setCurrentPage(1);
        fetchExpenses(
          search,
          filterDateRange,
          filterBranchId,
          filterEmployeeId,
          filterCategoryId,
          1
        );
        fetchTotalSumByCurrency();
      }
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    }
  };

  const handlePageChange = (_, value) => {
    setCurrentPage(value);
    fetchExpenses(
      search,
      filterDateRange,
      filterBranchId,
      filterEmployeeId,
      filterCategoryId,
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
    fetchExpenses(
      search,
      filterDateRange,
      filterBranchId,
      filterEmployeeId,
      filterCategoryId,
      1,
      rowsPerPage,
      field,
      isAsc ? 'desc' : 'asc'
    );
    fetchTotalSumByCurrency();
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

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ margin: 1, padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedExpenseId ? 'گۆڕینی مەسرووفات' : 'زیادکردنی مەسرووفات'}
            </Typography>
            <form onSubmit={handleSubmit}>
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
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="گرووپ"
                name="category_id"
                value={formData.category_id}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.category_id}
                helperText={formErrors.category_id}
                sx={{ mb: 2 }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="ناوی مەسرووف"
                name="name"
                value={formData.name}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.name}
                helperText={formErrors.name}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.name && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('name')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="بڕ"
                    name="amount"
                    type="text"
                    value={formatNumberWithCommas(formData.amount)}
                    onChange={(e) => {
                      // Remove commas for storage, allow only numbers and decimals
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
                label="تێبینی"
                name="note"
                value={formData.note}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
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
                <Grid item xs={6}>
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
              </Grid>

              <TextField
                fullWidth
                label="بەروار"
                name="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.expense_date}
                helperText={formErrors.expense_date}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={8}>
                  <RegisterButton
      loading={loading}
      fullWidth
    >
      {selectedExpenseId ? 'نوێکردنەوە' : 'تۆمارکردن'}
    </RegisterButton>
                </Grid>
                <Grid item xs={4}>
                 <ClearButton
                      onClick={() => {
                        setFormData({ ...initialFormData, user_id: getCurrentUserId() });
                        setFormErrors({});
                        setSelectedExpenseId(null);
                        setErrorMessage('');
                        setSearch('');
                        setFilterBranchId('');
                        setFilterEmployeeId('');
                        setFilterCategoryId('');
                          // Reset date range to today
                          const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 10);
                          setFilterDateRange({ mode: 'today', start: today, end: today });
                        setCurrentPage(1);
                        fetchExpenses(
                          '', // search
                          filterDateRange, // keep the current date range
                          '', // branch
                          '', // employee
                          '', // category
                          1 // page
                        );
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
            {/* Search/Filter Controls */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
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
                            <IconButton onClick={() => { setSearch(''); fetchExpenses(); fetchTotalSumByCurrency(); }}>
                              <SearchIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="لق"
                    value={filterBranchId}
                    onChange={e => {
                      setFilterBranchId(e.target.value);
                      setCurrentPage(1);
                      fetchExpenses(search, filterDateRange, e.target.value, filterEmployeeId, filterCategoryId, 1);
                      fetchTotalSumByCurrency();
                    }}
                  >
                    <MenuItem value="">هەموو لقەکان</MenuItem>
                    {branches.map(branch => (
                      <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="کارمەند"
                    value={filterEmployeeId || ''}
                    onChange={e => {
                      setFilterEmployeeId(e.target.value);
                      setCurrentPage(1);
                      fetchExpenses(search, filterDateRange, filterBranchId, e.target.value, filterCategoryId, 1);
                      fetchTotalSumByCurrency();
                    }}
                  >
                    <MenuItem value="">هەموو کارمەندان</MenuItem>
                    {employees.map(emp => (
                      <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="گرووپ"
                    value={filterCategoryId}
                    onChange={e => {
                      setFilterCategoryId(e.target.value);
                      setCurrentPage(1);
                      fetchExpenses(search, filterDateRange, filterBranchId, filterEmployeeId, e.target.value, 1);
                      fetchTotalSumByCurrency();
                    }}
                  >
                    <MenuItem value="">هەموو گرووپەکان</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={9}>
                    <DateRangeSelector value={filterDateRange} onChange={handleDateRangeChange} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ReportButton
                      onClick={handleOpenPdfPreview}
                      fullWidth
                    >
                      ڕاپۆرت
                    </ReportButton>
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
                        active={sortBy === 'category_id'}
                        direction={sortBy === 'category_id' ? sortOrder : 'asc'}
                        onClick={() => handleSort('category_id')}
                      >
                        گرووپ
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>ناو</TableCell>
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
                        active={sortBy === 'employee_id'}
                        direction={sortBy === 'employee_id' ? sortOrder : 'asc'}
                        onClick={() => handleSort('employee_id')}
                      >
                        کارمەند
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'branch_id'}
                        direction={sortBy === 'branch_id' ? sortOrder : 'asc'}
                        onClick={() => handleSort('branch_id')}
                      >
                        لق
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>تێبینی</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'expense_date'}
                        direction={sortBy === 'expense_date' ? sortOrder : 'asc'}
                        onClick={() => handleSort('expense_date')}
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
                      <TableCell colSpan={10} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  ) : currentExpenses.length > 0 ? (
                    currentExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.id}</TableCell>
                        <TableCell>
                          {categories.find((c) => c.id === expense.category_id)?.name || expense.category_id}
                        </TableCell>
                        <TableCell>{expense.name}</TableCell>
                        <TableCell>
                          {formatNumberWithCommas(expense.amount)} {currencies.find((c) => c.id === expense.currency_id)?.symbol || ''}
                        </TableCell>
                        <TableCell>
                          {employees.find((e) => e.id === expense.employee_id)?.name || expense.employee_id}
                        </TableCell>
                        <TableCell>
                          {branches.find((b) => b.id === expense.branch_id)?.name || expense.branch_id}
                        </TableCell>
                        <TableCell>{expense.note}</TableCell>
                        <TableCell>
                          {new Date(expense.expense_date).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(expense)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(expense.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        هیچ داتایەک نەدۆزرایەوە
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                      کۆی گشتی بڕ:
                    </TableCell>
                    <TableCell colSpan={6} align="left" sx={{ fontWeight: 'bold' }}>
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
              {expenses.length > 0 && (
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

      <DialogPdf
        open={openPdfPreview}
        onClose={() => setOpenPdfPreview(false)}
        document={
          <ExpensesPDF
            expenses={reportExpenses}
            categories={categories}
            branches={branches}
            employees={employees}
            currencies={currencies}
            company={company}
              filters={{
              branch: filterBranchId,
              employee: filterEmployeeId,
              category: filterCategoryId,
              dateRange: filterDateRange,
            }}
          />
        }
        fileName="expenses_report.pdf"
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={openDialog}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی مەسرووفات"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم مەسرووفاتە؟ ئەم کردارە گەرێنەوە نییە."
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

export default ExpensesManagment;