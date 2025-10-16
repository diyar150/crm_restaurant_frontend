import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Paper,
  IconButton,
  Pagination,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  Typography,
  MenuItem,
  Grid,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward,
  ArrowDownward,
  Clear as ClearIcon,
} from '@mui/icons-material';
import axiosInstance from '../../components/service/axiosInstance';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import ReportButton from '../../components/common/ReportButton';
import ClearButton from '../../components/common/ClearButton';
import AddButton from '../../components/common/AddButton';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CustomerDialogInfo from '../../components/utils/CustomerDialogInfo';
import CustomerInfoPDF from '../../components/reports/customer/customerInfoPDF';
import DialogPdf from '../../components/utils/DialogPdf';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// .
function CustomerList({ isDrawerOpen }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZoneId, setFilterZoneId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterCityId, setFilterCityId] = useState('');
  const [filterMandubId, setFilterMandubId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterState, setFilterState] = useState('');
  const [zones, setZones] = useState([]);
  const [mandub, setMandub] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [totalCount, setTotalCount] = useState(0);
  const [currencies, setCurrencies] = useState([]);
  const [priceTypes, setPriceTypes] = useState([]);
  const [filterCurrencyId, setFilterCurrencyId] = useState('');
  const [filterPriceTypeId, setFilterPriceTypeId] = useState('0');
  const [showDialog, setShowDialog] = useState(false);
  const [showCustomer, setShowCustomer] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [filterLoanPositive, setFilterLoanPositive] = useState(false);
  const [filterLoanNegative, setFilterLoanNegative] = useState(false);
  const [filterLoanZero, setFilterLoanZero] = useState(false);
  const [openCustomerInfoPDF, setOpenCustomerInfoPDF] = useState(false);
  const [reportCustomers, setReportCustomers] = useState([]);
  const { company, fetchCompanyInfo } = useCompanyInfo();
  const rowsPerPage = 20;

  // Fetch filter dropdown data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [
          zoneRes,
          categoryRes,
          cityRes,
          mandubRes,
          currencyRes,
          priceTypeRes,
        ] = await Promise.all([
          axiosInstance.get('/zone/index'),
          axiosInstance.get('/customer-category/index'),
          axiosInstance.get('/city/index'),
          axiosInstance.get('/user/index'),
          axiosInstance.get('/currency/index'),
          axiosInstance.get('/item-price-type/index'),
        ]);
        setZones(zoneRes.data || []);
        setCategories(categoryRes.data || []);
        setCities(cityRes.data || []);
        setMandub(mandubRes.data || []);
        setCurrencies(currencyRes.data || []);
        setPriceTypes(priceTypeRes.data || []);
        fetchCompanyInfo();
      } catch {
        // ignore dropdown errors
      }
    };
    fetchDropdowns();
    // eslint-disable-next-line
  }, []);

  // Fetch customers with filters, sort, pagination
  const fetchCustomers = async (
    page = currentPage,
    pageSize = rowsPerPage,
    sortField = sortBy,
    sortDirection = sortOrder
  ) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        pageSize,
        sortBy: sortField,
        sortOrder: sortDirection,
        search: searchQuery,
        zone_id: filterZoneId,
        category_id: filterCategoryId,
        city_id: filterCityId,
        mandub_id: filterMandubId,
        type: filterType,
        state: filterState,
        currency_id: filterCurrencyId ? Number(filterCurrencyId) : '',
        price_type_id: Number(filterPriceTypeId),
        loan_positive: filterLoanPositive ? true : undefined,
        loan_negative: filterLoanNegative ? true : undefined,
        loan_zero: filterLoanZero ? true : undefined,
      };
      const response = await axiosInstance.get('/customer/filter', { params });

      setCustomers(Array.isArray(response.data) ? response.data : response.data.results || []);
      setTotalCount(response.data.total || response.data.length || 0);
    } catch (error) {
      setSnackbarMessage('هەڵە ڕوویدا لە بارکردنی زانیاری');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllCustomersForReport = async () => {
  try {
    const params = {
      // all filters here
      search: searchQuery,
      zone_id: filterZoneId,
      category_id: filterCategoryId,
      city_id: filterCityId,
      mandub_id: filterMandubId,
      type: filterType,
      state: filterState,
      currency_id: filterCurrencyId ? Number(filterCurrencyId) : '',
      price_type_id: Number(filterPriceTypeId),
     loan_positive: filterLoanPositive ? true : undefined,
     loan_negative: filterLoanNegative ? true : undefined,
     loan_zero: filterLoanZero ? true : undefined,
      page: 1,
      pageSize: 10000, // large number to get all
    };
    const res = await axiosInstance.get('/customer/filter', { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  } catch {
    return [];
  }
};

  useEffect(() => {
    fetchCustomers(currentPage, rowsPerPage, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [
    searchQuery,
    filterZoneId,
    filterCategoryId,
    filterCityId,
    filterMandubId,
    filterType,
    filterState,
    filterCurrencyId,
    filterPriceTypeId,
    filterLoanPositive,
    filterLoanNegative,
    filterLoanZero,
    currentPage,
    sortBy,
    sortOrder,
  ]);

  const handleSort = (key) => {
    setSortBy(key);
    setSortOrder((prev) => (sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1);
  };

  const getSortIcon = (key) =>
    sortBy === key ? (
      sortOrder === 'asc' ? (
        <ArrowUpward fontSize="small" />
      ) : (
        <ArrowDownward fontSize="small" />
      )
    ) : null;

  const handlePageChange = (_, value) => setCurrentPage(value);
  const handleAddCustomer = () => navigate('/customer/register');
  const handleEditCustomer = (id) => navigate(`/customer/edit/${id}`);
  const handleClearSearch = () => setSearchQuery('');
  const handleDeleteClick = (id) => {
    setSelectedCustomerId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/customer/delete/${selectedCustomerId}`);
      setCustomers((prev) => prev.filter((customer) => customer.id !== selectedCustomerId));
      setSnackbarMessage('کڕیار سڕایەوە بە سەرکەوتوویی');
    } catch (error) {
      setSnackbarMessage('هەڵە ڕوویدا لە سڕینەوەی کڕیار');
    } finally {
      setOpenDialog(false);
      setSnackbarOpen(true);
    }
  };
const handleOpenCustomerInfoPDF = async () => {
  const allCustomers = await fetchAllCustomersForReport();
  setReportCustomers(allCustomers);
  setOpenCustomerInfoPDF(true);
};

  // Handler to open dialog and fetch customer details
  const handleShowCustomer = async (id) => {
    setShowLoading(true);
    setShowDialog(true);
    try {
      const res = await axiosInstance.get(`/customer/show/${id}`);
      setShowCustomer(res.data);
    } catch {
      setShowCustomer(null);
    } finally {
      setShowLoading(false);
    }
  };

    const handleClearAllFilters = () => {
    setSearchQuery('');
    setFilterZoneId('');
    setFilterCategoryId('');
    setFilterCityId('');
    setFilterMandubId('');
    setFilterType('');
    setFilterState('');
    setFilterCurrencyId('');
    setFilterPriceTypeId('0');
    setFilterLoanPositive(false);
    setFilterLoanNegative(false);
    setFilterLoanZero(false);
    setCurrentPage(1);
  };


   // Professional loan summary by currency
  const loanSummaryByCurrency = useMemo(() => {
    const summary = {};
    customers.forEach((c) => {
      const currencyId = c.currency_id;
      const currencyName = currencies.find(cur => cur.id === currencyId)?.name || currencyId || '-';
      const loan = Number(c.loan) || 0;
      if (!summary[currencyId]) {
        summary[currencyId] = {
          currencyName,
          positive: 0,
          negative: 0,
        };
      }
      if (loan > 0) {
        summary[currencyId].positive += loan;
      } else if (loan < 0) {
        summary[currencyId].negative += loan;
      }
    });
    return summary;
  }, [customers, currencies]);

  return (
    <Box
      sx={{
        marginRight: isDrawerOpen ? '250px' : '0',
        transition: 'margin-right 0.3s ease-in-out',
        px: 2,
        py: 3,
      }}
    >
      {/* Header */}
     <Stack
  direction={{ xs: 'column', md: 'row' }}
  justifyContent="space-between"
  alignItems={{ xs: 'stretch', md: 'center' }}
  spacing={2}
  mb={3}
>
  <Typography
    variant="h5"
    fontWeight="bold"
    color="primary.main"
    sx={{ mb: { xs: 2, md: 0 }, textAlign: { xs: 'center', md: 'inherit' } }}
  >
    لیستی کڕیارەکان
  </Typography>
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={1}
    sx={{ width: { xs: '100%', md: 'auto' } }}
  >
    <AddButton
      onClick={handleAddCustomer}
      fullWidth
      sx={{ width: { xs: '100%', sm: 'auto' } }}
    >
      زیادکردنی کڕیار
    </AddButton>
    <ReportButton
      onClick={handleOpenCustomerInfoPDF}
      fullWidth
      sx={{ width: { xs: '100%', sm: 'auto' } }}
    >
      ڕاپۆرت
    </ReportButton>
    <ClearButton
      onClick={handleClearAllFilters}
      fullWidth
      sx={{ width: { xs: '100%', sm: 'auto' } }}
    >
      پاکردنەوە
    </ClearButton>
  </Stack>
</Stack>

      {/* Filter Section */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="گەڕان"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="ناوی کڕیار..."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} size="small">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="زۆن"
              value={filterZoneId}
              onChange={e => { setFilterZoneId(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="">هەموو</MenuItem>
              {zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id}>
                  {zone.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="گرووپ"
              value={filterCategoryId}
              onChange={e => { setFilterCategoryId(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="">هەموو</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="شار"
              value={filterCityId}
              onChange={e => { setFilterCityId(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="">هەموو</MenuItem>
              {cities.map((city) => (
                <MenuItem key={city.id} value={city.id}>
                  {city.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="مەندووب"
              value={filterMandubId}
              onChange={e => { setFilterMandubId(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="">هەموو</MenuItem>
              {mandub.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="جۆر"
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="">هەموو</MenuItem>
              <MenuItem value="هەردووکی">هەردووکی</MenuItem>
              <MenuItem value="کڕین">کڕین</MenuItem>
              <MenuItem value="فرۆشتن">فرۆشتن</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="دراو"
              value={filterCurrencyId}
              onChange={e => { setFilterCurrencyId(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="">هەموو</MenuItem>
              {currencies.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="جۆری نرخ"
              value={filterPriceTypeId}
              onChange={e => { setFilterPriceTypeId(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="0">هەموو</MenuItem>
              {priceTypes.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} md={2}>
              <TextField
                select
                fullWidth
                label="قەرز"
                value={
                  filterLoanPositive
                    ? 'positive'
                    : filterLoanNegative
                    ? 'negative'
                    : filterLoanZero
                    ? 'zero'
                    : ''
                }
                onChange={e => {
                  setFilterLoanPositive(e.target.value === 'positive');
                  setFilterLoanNegative(e.target.value === 'negative');
                  setFilterLoanZero(e.target.value === 'zero');
                  setCurrentPage(1);
                }}
              >
                <MenuItem value="">هەموو</MenuItem>
                <MenuItem value="positive">قەرزەکانم</MenuItem>
                <MenuItem value="negative">قەرزی خەڵک</MenuItem>
                <MenuItem value="zero">قەرزی سفرە</MenuItem>
              </TextField>
            </Grid>    

          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="حاڵەت"
              value={filterState}
              onChange={e => { setFilterState(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="">هەموو</MenuItem>
              <MenuItem value="چالاک">چالاک</MenuItem>
              <MenuItem value="ناچالاک">ناچالاک</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* Table */}
       {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <LoadingSpinner size={40} message="چاوەڕوان بن..." />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table>
        <TableHead>
            <TableRow>
              <TableCell onClick={() => handleSort('id')} sx={{ cursor: 'pointer' }}>
                ID {getSortIcon('id')}
              </TableCell>
              <TableCell onClick={() => handleSort('category_id')} sx={{ cursor: 'pointer' }}>
                گرووپ {getSortIcon('category_id')}
              </TableCell>
              <TableCell onClick={() => handleSort('code')} sx={{ cursor: 'pointer' }}>
                کۆد {getSortIcon('code')}
              </TableCell>
              <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer' }}>
                ناو {getSortIcon('name')}
              </TableCell>
              <TableCell>مۆبایل١</TableCell>
              <TableCell onClick={() => handleSort('type')} sx={{ cursor: 'pointer' }}>
                ج.مامەڵە {getSortIcon('type')}
              </TableCell>
              <TableCell onClick={() => handleSort('city_id')} sx={{ cursor: 'pointer' }}>
                شار {getSortIcon('city_id')}
              </TableCell>
              <TableCell onClick={() => handleSort('zone_id')} sx={{ cursor: 'pointer' }}>
                زۆن {getSortIcon('zone_id')}
              </TableCell>
              <TableCell>ناونیشان</TableCell>
              <TableCell onClick={() => handleSort('mandub_id')} sx={{ cursor: 'pointer' }}>
                مەندووب {getSortIcon('mandub_id')}
              </TableCell>
              <TableCell onClick={() => handleSort('currency_id')} sx={{ cursor: 'pointer' }}>
                دراو {getSortIcon('currency_id')}
              </TableCell>
              <TableCell onClick={() => handleSort('loan')} sx={{ cursor: 'pointer' }}>
                قەرز {getSortIcon('loan')}
              </TableCell>
              <TableCell align="center">کردار</TableCell>
            </TableRow>
          </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} hover>
                    <TableCell>{customer.id}</TableCell>
                  <TableCell>
                    {categories.find(cat => cat.id === customer.category_id)?.name || customer.category_id || '-'}
                  </TableCell>
                   <TableCell>{customer.code}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.phone_1}</TableCell>
                  <TableCell>{customer.type}</TableCell>
                  <TableCell>
                    {cities.find(c => c.id === customer.city_id)?.name || customer.city_id || '-'}
                  </TableCell>
                  <TableCell>
                    {zones.find(z => z.id === customer.zone_id)?.name || customer.zone_id || '-'}
                  </TableCell>
                  
                 
                  <TableCell>{customer.address}</TableCell>
                  <TableCell>
                    {mandub.find(m => m.id === customer.mandub_id)?.name || customer.mandub_id || '-'}
                  </TableCell>
                  <TableCell>
                    {currencies.find(cur => cur.id === customer.currency_id)?.name || customer.currency_id || '-'}
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color:
                          Number(customer.loan) > 0
                            ? 'green'
                            : Number(customer.loan) < 0
                            ? 'red'
                            : 'inherit',
                      }}
                    >
                      {Number(customer.loan || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
              
                  <TableCell align="center">
                     <IconButton color="info" onClick={() => handleShowCustomer(customer.id)}>
                        <VisibilityIcon />
                      </IconButton>
                    <IconButton color="primary" onClick={() => handleEditCustomer(customer.id)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteClick(customer.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!customers.length && (
                <TableRow>
                  <TableCell colSpan={13} align="center">
                    هیچ زانیارییەک نەدۆزرایەوە.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
     <TableFooter>
        <TableRow>
            <TableCell
              colSpan={13}
              align="right"
              sx={{
                background: '#f5f5f5',
                fontWeight: 'bold',
                fontSize: { xs: 14, sm: 16 },
                px: 2,
                py: 2,
                borderTop: '2px solid #e0e0e0',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', md: 'flex-end' },
                  gap: 2,
                }}
              >
                <span style={{ marginInlineEnd: 12 }}>کۆی قەرز:</span>
                {Object.values(loanSummaryByCurrency).map((row) => (
                  <Box
                    key={row.currencyName}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: '#e3f2fd',
                      borderRadius: 2,
                      px: 1.5,
                      py: 0.5,
                      mx: 0.5,
                      minWidth: 120,
                      mb: { xs: 1, md: 0 },
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        color: '#388e3c',
                        fontWeight: 'bold',
                        fontSize: { xs: 13, sm: 15 },
                        mr: 0.5,
                      }}
                    >
                      +{row.positive.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        color: '#d32f2f',
                        fontWeight: 'bold',
                        fontSize: { xs: 13, sm: 15 },
                        mx: 0.5,
                      }}
                    >
                      {row.negative.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        color: '#555',
                        fontWeight: 500,
                        fontSize: { xs: 12, sm: 14 },
                        ml: 0.5,
                      }}
                    >
                      {row.currencyName}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </TableCell>
          </TableRow>
        </TableFooter>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={Math.ceil(totalCount / rowsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDialog}
        onClose={setOpenDialog}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی کڕیار"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم کڕیارە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

{/* Customer pdf dialog */}

<DialogPdf
  open={openCustomerInfoPDF}
  onClose={() => setOpenCustomerInfoPDF(false)}
  document={
     <CustomerInfoPDF
      customers={reportCustomers}
      categories={categories}
      zones={zones}
      currencies={currencies}
      cities={cities}
      mandub={mandub}
      company={company}
      priceTypes={priceTypes} // <-- add this
      filters={{
        category_id: filterCategoryId,
        zone_id: filterZoneId,
        city_id: filterCityId,
        mandub_id: filterMandubId,
        price_type_id: filterPriceTypeId,
        type: filterType,
        state: filterState,
        currency_id: filterCurrencyId,
        loan_positive: filterLoanPositive,
        loan_negative: filterLoanNegative,
        loan_zero: filterLoanZero,
        search: searchQuery,
      }}
    />
  }

  fileName="customer_info_report.pdf"
/>


      {/* Customer Details Dialog */}

     <CustomerDialogInfo
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          setShowCustomer(null);
        }}
        customer={showCustomer}
        loading={showLoading}
        categories={categories}
        zones={zones}
        currencies={currencies}
        priceTypes={priceTypes}
        cities={cities}
        mandub={mandub}
        />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="info" onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CustomerList;