import React, { useState, useEffect } from 'react';
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
  Button,
  IconButton,
  Pagination,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  Typography,
  Grid,
  Stack,
  Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowUpward,
  ArrowDownward,
  Clear as ClearIcon,
} from '@mui/icons-material';
import axiosInstance from '../../components/service/axiosInstance';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import ReportButton from '../../components/common/ReportButton';
import DialogPdf from '../../components/utils/DialogPdf';
import DriverInfoPDF from '../../components/reports/driver/driverInfoPDF';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';

import { BASE_URL } from '../../config/constants';

function DriverList({ isDrawerOpen }) {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [totalCount, setTotalCount] = useState(0);

  const rowsPerPage = 20;

  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const [reportDrivers, setReportDrivers] = useState([]);
  const { company, fetchCompanyInfo } = useCompanyInfo();
  // Fetch drivers with filters, sort, pagination
  const fetchDrivers = async (
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
        name: searchQuery,
      };
      const response = await axiosInstance.get('/driver/index', { params });
      setDrivers(response.data || []);
      setTotalCount(Array.isArray(response.data) ? response.data.length : 0);
    } catch (error) {
      setSnackbarMessage('هەڵە ڕوویدا لە بارکردنی زانیاری');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers(currentPage, rowsPerPage, sortBy, sortOrder);
     fetchCompanyInfo();
    // eslint-disable-next-line
  }, [searchQuery, currentPage, sortBy, sortOrder]);

  const handleSort = (key) => {
    setSortBy(key);
    setSortOrder((prev) => (sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1);
  };

  const getSortIcon = (key) =>
    sortBy === key ? (
      sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
    ) : null;

  const handlePageChange = (_, value) => setCurrentPage(value);
  const handleAddDriver = () => navigate('/driver/register');
  const handleEditDriver = (id) => navigate(`/driver/edit/${id}`);
  const handleClearSearch = () => setSearchQuery('');
  const handleDeleteClick = (id) => {
    setSelectedDriverId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/driver/delete/${selectedDriverId}`);
      setDrivers((prev) => prev.filter((driver) => driver.id !== selectedDriverId));
      setSnackbarMessage('شۆفێر سڕایەوە بە سەرکەوتوویی');
    } catch (error) {
      setSnackbarMessage('هەڵە ڕوویدا لە سڕینەوەی شۆفێر');
    } finally {
      setOpenDialog(false);
      setSnackbarOpen(true);
    }
  };

  const fetchAllDriversForReport = async () => {
    try {
      const params = { name: searchQuery, sortBy, sortOrder };
      const response = await axiosInstance.get('/driver/index', { params });
      return response.data || [];
    } catch (error) {
      setSnackbarMessage('هەڵە ڕوویدا لە بارکردنی هەموو داتا');
      setSnackbarOpen(true);
      return [];
    }
  };

  const handleOpenPdfPreview = async () => {
    const allDrivers = await fetchAllDriversForReport();
    setReportDrivers(allDrivers);
    setOpenPdfPreview(true);
  };

  // Fix: Pagination logic for correct slicing
  const pagedDrivers = drivers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        mb={3}
      >
        <Typography variant="h5" fontWeight="bold" color="primary.main">
          لیستی شۆفێرەکان
        </Typography>
        <Stack direction="row" spacing={2}>
            <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddDriver}
            sx={{ borderRadius: 2, fontWeight: 'bold', px: 3, py: 1 }}
          >
            زیادکردن
           </Button>
          <ReportButton
            onClick={handleOpenPdfPreview}
            sx={{ borderRadius: 2, fontWeight: 'bold', px: 3, py: 1 }}
          />
        
        </Stack>
      </Stack>

      {/* Filter Section */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <TextField
              fullWidth
              label="گەڕان"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="ناوی شۆفێر..."
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
        </Grid>
      </Box>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner message="چاوەڕوان بن..." />
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell onClick={() => handleSort('id')} sx={{ cursor: 'pointer' }}>
                  ID {getSortIcon('id')}
                </TableCell>
                <TableCell>وێنە</TableCell>
                <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer' }}>
                  ناو {getSortIcon('name')}
                </TableCell>
                <TableCell>ژمارەی مۆبایل</TableCell>
                <TableCell>جنس</TableCell>
                <TableCell>ژمارەی مۆڵەت</TableCell>
                <TableCell>بەرواری بەسەرچوونی مۆڵەت</TableCell>
                <TableCell>ژمارەی ناسنامە</TableCell>
                <TableCell>ناونیشان</TableCell>
                <TableCell>دۆخ</TableCell>
                <TableCell>بەرواری دامەزراندن</TableCell>
                <TableCell>مووچە</TableCell>
                <TableCell>ژمارەی پەیوەندی فۆرسەت</TableCell>
                <TableCell>ژمارەی ئۆتۆمبێل</TableCell>
                <TableCell>ناوی ئۆتۆمبێل</TableCell>
                <TableCell>تێبینی</TableCell>
                <TableCell align="center">کردار</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedDrivers.map((driver) => (
                <TableRow key={driver.id} hover>
                  <TableCell>{driver.id}</TableCell>
                  <TableCell>
                    {driver.photo ? (
                      <Avatar
                        src={
                          driver.photo.startsWith('http')
                            ? driver.photo
                            : `${BASE_URL}${driver.photo}`
                        }
                        alt={driver.name}
                      />
                    ) : (
                      <Avatar>{driver.name?.charAt(0) || '?'}</Avatar>
                    )}
                  </TableCell>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{driver.gender}</TableCell>
                  <TableCell>{driver.license_number}</TableCell>
                  <TableCell>{driver.license_expiry}</TableCell>
                  <TableCell>{driver.national_id}</TableCell>
                  <TableCell>{driver.address}</TableCell>
                  <TableCell>{driver.status}</TableCell>
                  <TableCell>{driver.hired_date}</TableCell>
                  <TableCell>{driver.salary}</TableCell>
                  <TableCell>{driver.emergency_contact}</TableCell>
                  <TableCell>{driver.car_number}</TableCell>
                  <TableCell>{driver.car_name}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 120,
                      }}
                    >
                      {driver.note}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleEditDriver(driver.id)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteClick(driver.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!pagedDrivers.length && (
                <TableRow>
                  <TableCell colSpan={17} align="center">
                    هیچ زانیارییەک نەدۆزرایەوە.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={17} align="center" sx={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: 16 }}>
                  کۆی گشتی شۆفێرەکان: <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{drivers.length}</span>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={Math.ceil(drivers.length / rowsPerPage)}
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
        title="سڕینەوەی شۆفێر"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم شۆفێرە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* PDF Dialog */}
      <DialogPdf
        open={openPdfPreview}
        onClose={() => setOpenPdfPreview(false)}
        document={
          <DriverInfoPDF
            drivers={reportDrivers}
            company={company}
            filters={{
              name: searchQuery,
            }}
          />
        }
        fileName="driver_report.pdf"
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

export default DriverList;