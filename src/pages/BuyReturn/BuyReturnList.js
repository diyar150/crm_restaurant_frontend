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
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddButton from '../../components/common/AddButton';
import ReportButton from '../../components/common/ReportButton';
import ClearButton from '../../components/common/ClearButton';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import DialogPdf from '../../components/utils/DialogPdf';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../components/service/axiosInstance';
import DateRangeSelector from '../../components/utils/DateRangeSelector';
import CustomerAutocomplete from '../../components/Autocomplete/CustomerAutocomplete';
import BuyReturnInvoicePDF from '../../components/reports/buyreturn/buyReturnInvoicePDF';
import BuyReturnInvoiceDetailsPDF from '../../components/reports/buyreturn/buyReturnInvoiceDetailsPDF';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';

const rowsPerPage = 20;

function BuyReturnList({ isDrawerOpen }) {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCurrencyId, setFilterCurrencyId] = useState('');
  const [filterCustomer, setFilterCustomer] = useState(null);
  const [filterDateRange, setFilterDateRange] = useState(() => {
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    return { mode: 'today', start: today, end: today };
  });

  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalCount, setTotalCount] = useState(0);
  const { company, fetchCompanyInfo } = useCompanyInfo();

  // PDF dialog state
  const [pdfDialogType, setPdfDialogType] = useState(null); // 'single' | 'report' | null
  const [pendingDialogType, setPendingDialogType] = useState(null); // for robust switch
  const [pdfDialogKey, setPdfDialogKey] = useState(0); // force remount
  const [showInvoiceItems, setShowInvoiceItems] = useState([]);
  const [showInvoice, setShowInvoice] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [reportInvoices, setReportInvoices] = useState([]);

  // Fetch company info on mount
  useEffect(() => {
    fetchCompanyInfo();
    // eslint-disable-next-line
  }, []);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [branchRes, warehouseRes, currencyRes] = await Promise.all([
          axiosInstance.get('/branch/index'),
          axiosInstance.get('/warehouse/index'),
          axiosInstance.get('/currency/index'),
        ]);
        setBranches(branchRes.data || []);
        setWarehouses(warehouseRes.data || []);
        setCurrencies(currencyRes.data || []);
      } catch {
        // ignore dropdown errors
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch employees
  useEffect(() => {
    axiosInstance.get('/user/index').then(res => setEmployees(res.data || []));
  }, []);

  // Fetch invoices with filters, sort, pagination
  const fetchInvoices = async (
    page = currentPage,
    pageSize = rowsPerPage,
    sortField = sortBy,
    sortDirection = sortOrder
  ) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        sortBy: sortField,
        sortOrder: sortDirection,
        search: searchQuery,
        branch_id: filterBranchId,
        warehouse_id: filterWarehouseId,
        type: filterType,
        currency_id: filterCurrencyId,
        customer_id: filterCustomer?.id || '',
        startDate: filterDateRange.start,
        endDate: filterDateRange.end,
      };
      const response = await axiosInstance.get('/buy-return-invoice/filter', { params });
      const data = response.data.invoices || [];
      setInvoices(Array.isArray(data) ? data : []);
      setTotalCount(response.data.total || data.length || 0);
    } catch (error) {
      setSnackbarMessage('هەڵە ڕوویدا لە بارکردنی زانیاری');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch invoices when filters change
  useEffect(() => {
    fetchInvoices(currentPage, rowsPerPage, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [
    searchQuery,
    filterBranchId,
    filterWarehouseId,
    filterType,
    filterCurrencyId,
    filterCustomer,
    filterDateRange,
    currentPage,
    sortBy,
    sortOrder,
  ]);

  // Sorting
  const handleSort = (key) => {
    setSortBy(key);
    setSortOrder((prev) => (sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1);
  };

  const getSortIcon = (key) =>
    sortBy === key ? (
      sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
    ) : null;

  // Pagination
  const handlePageChange = (_, value) => setCurrentPage(value);

  // CRUD Handlers
  const handleAddInvoice = () => navigate('/buy-return-invoice/create');
  const handleEditInvoice = (id) => navigate(`/buy-return-invoice/edit/${id}`);

  const handleDeleteClick = (id) => {
    setSelectedInvoiceId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/buy-return-invoice/delete/${selectedInvoiceId}`);
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== selectedInvoiceId));
      setSnackbarMessage('وەسڵ سڕایەوە بە سەرکەوتوویی');
    } catch (error) {
      setSnackbarMessage('هەڵە ڕوویدا لە سڕینەوەی وەسڵ');
    } finally {
      setOpenDialog(false);
      setSnackbarOpen(true);
    }
  };

  // --- Robust PDF Dialog Switch ---
  const switchPdfDialog = (type) => {
    setPdfDialogType(null); // Unmount DialogPdf
    setPendingDialogType(type); // Remember what to open next
  };

  useEffect(() => {
    if (pdfDialogType === null && pendingDialogType) {
      const t = setTimeout(() => {
        setPdfDialogType(pendingDialogType);
        setPdfDialogKey(prev => prev + 1);
        setPendingDialogType(null);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [pdfDialogType, pendingDialogType]);

  // Show invoice details and items
  const handleShowInvoice = async (id) => {
    setShowLoading(true);
    try {
      const [invoiceRes, itemsRes] = await Promise.all([
        axiosInstance.get(`/buy-return-invoice/show/${id}`),
        axiosInstance.get(`/buy-return-item/index?buy_return_invoice_id=${id}`)
      ]);
      setShowInvoice(invoiceRes.data);
      setShowInvoiceItems(itemsRes.data || []);
      switchPdfDialog('single');
    } catch {
      setShowInvoice(null);
      setShowInvoiceItems([]);
      switchPdfDialog('single');
    } finally {
      setShowLoading(false);
    }
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setFilterBranchId('');
    setFilterWarehouseId('');
    setFilterType('');
    setFilterCurrencyId('');
    setFilterCustomer(null);

    // Reset date range to today
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    setFilterDateRange({ mode: 'today', start: today, end: today });

    setCurrentPage(1);
  };

  // For report (fetch all invoices with current filters)
  const fetchAllInvoicesForReport = async () => {
    try {
      const params = {
        search: searchQuery,
        branch_id: filterBranchId,
        warehouse_id: filterWarehouseId,
        type: filterType,
        currency_id: filterCurrencyId,
        customer_id: filterCustomer?.id || '',
        startDate: filterDateRange.start,
        endDate: filterDateRange.end,
        page: 1,
        limit: 10000,
      };
      const res = await axiosInstance.get('/buy-return-invoice/filter', { params });
      return Array.isArray(res.data.invoices) ? res.data.invoices : [];
    } catch {
      return [];
    }
  };

  const handleOpenInvoiceInfoPDF = async () => {
    const allInvoices = await fetchAllInvoicesForReport();
    setReportInvoices(allInvoices);
    switchPdfDialog('report');
  };

  // PDF dialog close handler (handles both types)
  const handleClosePdfDialog = () => {
    setPdfDialogType(null);
    setShowInvoice(null);
    setShowInvoiceItems([]);
    setReportInvoices([]);
    setPdfDialogKey(prev => prev + 1); // force remount
  };

  // Modern summary by currency
  const totalByCurrency = useMemo(() => {
    const summary = {};
    invoices.forEach((inv) => {
      const currencyId = inv.currency_id;
      const currencyName = currencies.find(cur => cur.id === currencyId)?.name || currencyId || '-';
      const total = Number(inv.total_amount) || 0;
      if (!summary[currencyId]) {
        summary[currencyId] = {
          currencyName,
          total: 0,
        };
      }
      summary[currencyId].total += total;
    });
    return summary;
  }, [invoices, currencies]);

  // Only one PDF dialog is ever mounted at a time
  let pdfDialog = null;
  if (pdfDialogType === 'single') {
    pdfDialog = (
      <DialogPdf
        key={`single_${pdfDialogKey}`}
        open={true}
        onClose={handleClosePdfDialog}
        document={
          showInvoice && showInvoiceItems.length > 0 ? (
            <BuyReturnInvoicePDF
              invoice={showInvoice}
              items={showInvoiceItems}
              currencies={currencies}
              branches={branches}
              warehouses={warehouses}
              employees={employees}
              company={company}
            />
          ) : (
            <div style={{ padding: 40, textAlign: 'center' }}>هیچ زانیارییەک بوونی نییە</div>
          )
        }
        fileName={`buy_return_invoice_${showInvoice?.invoice_number || showInvoice?.id || ''}.pdf`}
      />
    );
  } else if (pdfDialogType === 'report') {
    pdfDialog = (
      <DialogPdf
        key={`report_${pdfDialogKey}`}
        open={true}
        onClose={handleClosePdfDialog}
        document={
          reportInvoices.length > 0 ? (
            <BuyReturnInvoiceDetailsPDF
              invoices={reportInvoices}
              currencies={currencies}
              branches={branches}
              warehouses={warehouses}
              employees={employees}
              company={company}
            />
          ) : (
            <div style={{ padding: 40, textAlign: 'center' }}>هیچ زانیارییەک بوونی نییە</div>
          )
        }
        fileName="buy_return_invoices_report.pdf"
      />
    );
  }

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
          لیستی گەڕانەوەی کاڵا
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <AddButton
            onClick={handleAddInvoice}
            fullWidth
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            زیادکردن
          </AddButton>
          <ReportButton
            onClick={handleOpenInvoiceInfoPDF}
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
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="گەڕان"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="ژمارە/تێبینی..."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => { setSearchQuery(''); setCurrentPage(1); }} size="small">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <CustomerAutocomplete
              value={filterCustomer}
              onChange={customer => {
                setFilterCustomer(customer);
                setCurrentPage(1);
              }}
              label="کڕیار"
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="لق"
              value={filterBranchId}
              onChange={e => { setFilterBranchId(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="">هەموو</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="کۆگا"
              value={filterWarehouseId}
              onChange={e => { setFilterWarehouseId(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="">هەموو</MenuItem>
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
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
              <MenuItem value="نەقد">نەقد</MenuItem>
              <MenuItem value="قەرز">قەرز</MenuItem>
              <MenuItem value="ڕاستەوخۆ">ڕاستەوخۆ</MenuItem>
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
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <DateRangeSelector
              value={filterDateRange}
              onChange={setFilterDateRange}
              fullWidth
            />
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
                <TableCell>کڕیار</TableCell>
                <TableCell onClick={() => handleSort('invoice_number')} sx={{ cursor: 'pointer' }}>
                  ژمارەی وەسڵ {getSortIcon('invoice_number')}
                </TableCell>
                <TableCell onClick={() => handleSort('type')} sx={{ cursor: 'pointer' }}>
                  جۆر {getSortIcon('type')}
                </TableCell>
                <TableCell onClick={() => handleSort('branch_id')} sx={{ cursor: 'pointer' }}>
                  لق {getSortIcon('branch_id')}
                </TableCell>
                <TableCell onClick={() => handleSort('warehouse_id')} sx={{ cursor: 'pointer' }}>
                  کۆگا {getSortIcon('warehouse_id')}
                </TableCell>
                <TableCell onClick={() => handleSort('currency_id')} sx={{ cursor: 'pointer' }}>
                  دراو {getSortIcon('currency_id')}
                </TableCell>
                <TableCell onClick={() => handleSort('total_amount')} sx={{ cursor: 'pointer' }}>
                  کۆی گشتی {getSortIcon('total_amount')}
                </TableCell>
                <TableCell>تێبینی</TableCell>
                <TableCell align="center">کردار</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>{invoice.id}</TableCell>
                  <TableCell>
                    {invoice.customer_name || (invoice.customer_id === 0 ? '-' : invoice.customer_id)}
                  </TableCell>
                  <TableCell>{invoice.invoice_number || '-'}</TableCell>
                  <TableCell>{invoice.type}</TableCell>
                  <TableCell>
                    {branches.find(b => b.id === invoice.branch_id)?.name || invoice.branch_id || '-'}
                  </TableCell>
                  <TableCell>
                    {warehouses.find(w => w.id === invoice.warehouse_id)?.name || invoice.warehouse_id || '-'}
                  </TableCell>
                  <TableCell>
                    {currencies.find(cur => cur.id === invoice.currency_id)?.name || invoice.currency_id || '-'}
                  </TableCell>
                  <TableCell>
                    {Number(invoice.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {invoice.note}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="info" onClick={() => handleShowInvoice(invoice.id)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handleEditInvoice(invoice.id)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteClick(invoice.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!invoices.length && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    هیچ زانیارییەک نەدۆزرایەوە.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={10}
                  align="center"
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
                      justifyContent: { xs: 'center' },
                      gap: 2,
                    }}
                  >
                    <span style={{ marginInlineEnd: 12 }}>کۆی گشتی:</span>
                    {Object.values(totalByCurrency).map((row) => (
                      <Box
                        key={row.currencyName}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          bgcolor: '#e8f5e9',
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.5,
                          mx: 0.5,
                          minWidth: 90,
                          mb: { xs: 1, md: 0 },
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            color: '#000000ff',
                            fontWeight: 'bold',
                            fontSize: { xs: 13, sm: 15 },
                            mr: 0.5,
                          }}
                        >
                          {row.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
        onClose={() => setOpenDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی وەسڵ"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم وەسڵە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* Only one PDF dialog is ever mounted at a time */}
      {pdfDialog}

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

export default BuyReturnList;