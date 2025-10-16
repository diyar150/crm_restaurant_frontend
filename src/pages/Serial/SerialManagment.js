import React, { useEffect, useState } from 'react';
import axiosInstance from '../../components/service/axiosInstance';
import {
  Card,
  Typography,
  Box,
  TextField,
  IconButton,
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
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import TableSortLabel from '@mui/material/TableSortLabel';
import DialogPdf from '../../components/utils/DialogPdf';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ReportButton from '../../components/common/ReportButton';
import SerialPDF from '../../components/reports/serial/SerialPDF';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import DateRangeSelector from '../../components/utils/DateRangeSelector';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function SerialManagment({ isDrawerOpen }) {
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const initialFormData = {
    type: '',
    name: '',
    note: '',
    date_at: today,
    branch_id: '',
    search: '',
  };

  const rowsPerPage = 20;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [serials, setSerials] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSerialId, setSelectedSerialId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ start: today, end: '' });
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalCount, setTotalCount] = useState(0);
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const [reportSerials, setReportSerials] = useState([]);
  const { company, fetchCompanyInfo } = useCompanyInfo();

  // Fetch branches for select
  const fetchBranches = async () => {
  try {
    const response = await axiosInstance.get('/branch/index');
    const branchList = response.data || [];
    setBranches(branchList);
    // Set default branch if not selected
    if (!filterBranchId && branchList.length > 0) {
      setFilterBranchId(branchList[0].id);
    }
  } catch (error) {
    setBranches([]);
  }
};

 useEffect(() => {
  fetchBranches();
  fetchCompanyInfo();
  // eslint-disable-next-line
}, []);

  useEffect(() => {
    handleFilter(currentPage, rowsPerPage, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [filterType, filterBranchId, filterName, filterDateRange, sortBy, sortOrder, currentPage]);

  // --- Data Fetchers ---
const handleFilter = async (
  page = currentPage,
  pageSize = rowsPerPage,
  sortField = sortBy,
  sortDirection = sortOrder
) => {
  setFetching(true);
  setErrorMessage('');
  try {
    const params = {
      page,
      pageSize,
      sortBy: sortField,
      sortOrder: sortDirection,
    };
    if (filterBranchId) params.branch_id = filterBranchId;
    if (filterType) params.type = filterType;
    if (filterName) params.name = filterName;
    if (filterDateRange.start) params.date_from = filterDateRange.start;
    if (filterDateRange.end) params.date_to = filterDateRange.end;

    const response = await axiosInstance.get('/serial/filter', { params });

    setSerials(response.data.data || []);
    setTotalCount(response.data.total || 0);
  } catch (error) {
    setErrorMessage(
      error.response?.data?.error ||
      error.message ||
      'هەڵە لە بارکردنی زانیاری'
    );
  } finally {
    setFetching(false);
  }
};

  const fetchAllSerialsForReport = async () => {
    try {
      const params = {
        sortBy,
        sortOrder,
      };
      if (filterType) params.type = filterType;
      if (filterName) params.name = filterName;
      if (filterBranchId) params.branch_id = filterBranchId;
      if (filterDateRange.start) params.date_from = filterDateRange.start;
      if (filterDateRange.end) params.date_to = filterDateRange.end;

      const response = await axiosInstance.get('/serial/filter', { params });
      return response.data.data || [];

    } catch (error) {
      setErrorMessage('هەڵە لە بارکردنی ڕاپۆرت');
      return [];
    }
  };

  // --- Handlers ---
  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortBy(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    if (dateString.includes('T')) return dateString.split('T')[0];
    return '';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    const errors = {};
    if (!formData.type) errors.type = 'جۆر پێویستە';
    if (!formData.name) errors.name = 'ناو پێویستە';
    if (!formData.date_at) errors.date_at = 'بەروار پێویستە';
    if (!formData.branch_id) errors.branch_id = 'لق پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      let response;
      if (selectedSerialId) {
        response = await axiosInstance.put(`/serial/update/${selectedSerialId}`, formData);
      } else {
        response = await axiosInstance.post('/serial/store', formData);
      }

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setErrorMessage('');
        setFormData(initialFormData);
        setSelectedSerialId(null);
        setFormErrors({});
        setCurrentPage(1);
        handleFilter(1, rowsPerPage, sortBy, sortOrder);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || 'هەڵە ڕوویدا لە تۆمارکردن'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (serial) => {
    setSelectedSerialId(serial.id);
    setFormErrors({});
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/serial/show/${serial.id}`);

      const data = response.data.data;
      setFormData({
        type: data.type || '',
        name: data.name || '',
        note: data.note || '',
        date_at: formatDate(data.date_at),
        branch_id: data.branch_id || '',
        search: '',
      });
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە دۆزینەوەی زانیاری');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedSerialId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axiosInstance.delete(`/serial/delete/${selectedSerialId}`, {
      });
      if ([200, 201, 204].includes(response.status)) {
        setSerials((prev) => prev.filter((serial) => serial.id !== selectedSerialId));
        setOpenDialog(false);
        setSuccess(true);
        setErrorMessage('');
        setFormData(initialFormData);
        setSelectedSerialId(null);
        setFormErrors({});
        handleFilter(currentPage, rowsPerPage, sortBy, sortOrder);
      }
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    }
  };

  const handlePageChange = (_, value) => {
    setCurrentPage(value);
  };

  const handleOpenPdfPreview = async () => {
    const allSerials = await fetchAllSerialsForReport();
    setReportSerials(allSerials);
    setOpenPdfPreview(true);
  };

  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);

  // --- Table Footer Summary ---
  const totalByType = serials.reduce((acc, row) => {
    const type = row.type || 'نەناسراو';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ margin: 1, padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedSerialId ? 'گۆڕینی سیریال' : 'زیادکردنی سیریال'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                select
                fullWidth
                label="جۆر"
                name="type"
                value={formData.type}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.type}
                helperText={formErrors.type}
                sx={{ mb: 2 }}
              >
                <MenuItem value="کڕین">کڕین</MenuItem>
                <MenuItem value="فرۆشتن">فرۆشتن</MenuItem>
                <MenuItem value="وەرگرتنەوە">وەرگرتنەوە</MenuItem>
                <MenuItem value="گەڕانەوە">گەڕانەوە</MenuItem>
                <MenuItem value="ئاڵوگۆڕ">ئاڵوگۆڕ</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="سریاڵ"
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
              <TextField
                fullWidth
                label="بەروار"
                name="date_at"
                type="date"
                value={formData.date_at}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.date_at}
                helperText={formErrors.date_at}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={8}>
                  <RegisterButton
                    loading={loading}
                    fullWidth
                    children={selectedSerialId ? 'نوێکردنەوە' : 'تۆمارکردن'}
                  />
                </Grid>
                <Grid item xs={4}>
                  <ClearButton
                    onClick={() => {
                      setFormData(initialFormData);
                      setFormErrors({});
                      setSelectedSerialId(null);
                      setErrorMessage('');
                      setCurrentPage(1);
                      handleFilter(1, rowsPerPage, sortBy, sortOrder);
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
                    onChange={e => {
                      setSearch(e.target.value);
                      setFilterName(e.target.value);
                      setCurrentPage(1);
                      handleFilter(1, rowsPerPage, sortBy, sortOrder);
                    }}
                    placeholder="سریاڵ یان تێبینی..."
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="هەموو داتاکان">
                            <IconButton onClick={() => { setSearch(''); setFilterName(''); handleFilter(1, rowsPerPage, sortBy, sortOrder); }}>
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
                      handleFilter(1, rowsPerPage, sortBy, sortOrder);
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
                    label="جۆر"
                    value={filterType}
                    onChange={e => {
                      setFilterType(e.target.value);
                      setCurrentPage(1);
                      handleFilter(1, rowsPerPage, sortBy, sortOrder);
                    }}
                  >
                    <MenuItem value="">هەموو جۆرەکان</MenuItem>
                    <MenuItem value="کڕین">کڕین</MenuItem>
                    <MenuItem value="فرۆشتن">فرۆشتن</MenuItem>
                    <MenuItem value="وەرگرتنەوە">وەرگرتنەوە</MenuItem>
                    <MenuItem value="گەڕانەوە">گەڕانەوە</MenuItem>
                    <MenuItem value="ئاڵوگۆڕ">ئاڵوگۆڕ</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <DateRangeSelector value={filterDateRange} onChange={setFilterDateRange} />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={9}></Grid>
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
                        active={sortBy === 'type'}
                        direction={sortBy === 'type' ? sortOrder : 'asc'}
                        onClick={() => handleSort('type')}
                      >
                        جۆر
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? sortOrder : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        سریاڵ
                      </TableSortLabel>
                    </TableCell>
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
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'date_at'}
                        direction={sortBy === 'date_at' ? sortOrder : 'asc'}
                        onClick={() => handleSort('date_at')}
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
                  ) : serials.length > 0 ? (
                    serials.map((serial) => (
                      <TableRow key={serial.id}>
                        <TableCell>{serial.id}</TableCell>
                        <TableCell>{serial.type}</TableCell>
                        <TableCell>{serial.name}</TableCell>
                        <TableCell>{serial.note}</TableCell>
                        <TableCell>
                          {branches.find((b) => b.id === serial.branch_id)?.name || serial.branch_id}
                        </TableCell>
                        <TableCell>{formatDate(serial.date_at)}</TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(serial)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(serial.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        هیچ سیریالێک نەدۆزرایەوە
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                      کۆی گشتی:
                    </TableCell>
                    <TableCell colSpan={5} align="left" sx={{ fontWeight: 'bold' }}>
                      {Object.entries(totalByType).map(([type, sum]) => (
                        <span key={type} style={{ marginRight: 16 }}>
                          {type}: {sum}
                        </span>
                      ))}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="center">
              {serials.length > 0 && (
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

      {/* PDF Dialog */}
      <DialogPdf
        open={openPdfPreview}
        onClose={() => setOpenPdfPreview(false)}
        document={
          <SerialPDF
            serials={reportSerials}
            branches={branches}
            company={company}
            filters={{
              branch: filterBranchId,
              type: filterType,
              name: filterName,
              dateRange: filterDateRange,
            }}
            totalByType={totalByType}
          />
        }
        fileName="serial_report.pdf"
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={openDialog}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی سیریال"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم سیریالە؟ ئەم کردارە گەرێنەوە نییە."
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

export default SerialManagment;