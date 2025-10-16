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
  MenuItem,
  Grid,
  Stack,
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
import BranchInfoPDF from '../../components/reports/branch/branchInfoPDF'; // Make sure this exists and is implemented like RegionInfoPDF
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import LoadingSpinner from '../../components/common/LoadingSpinner'; // <-- Add this import


function BranchList({ isDrawerOpen }) {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [filterCityId, setFilterCityId] = useState('');
  const [filterRegionId, setFilterRegionId] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const rowsPerPage = 10;

  // For filter dropdowns (fetch these from your API)
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const { company, fetchCompanyInfo } = useCompanyInfo();

  // For PDF report
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const [reportBranches, setReportBranches] = useState([]);

  // Fetch filter dropdown data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [cityRes, regionRes] = await Promise.all([
          axiosInstance.get('/city/index'),
          axiosInstance.get('/region/index'),
        ]);
        setCities(cityRes.data || []);
        setRegions(regionRes.data || []);
      } catch {
        // ignore dropdown errors
      }
    };
    fetchDropdowns();
    fetchCompanyInfo();
    // eslint-disable-next-line
  }, []);


  // Fetch branches with filters, sort, pagination
  const fetchBranches = async (
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
        branch_name: searchQuery,
        city_id: filterCityId,
        region_id: filterRegionId,
        user_id: filterUserId,
      };
      const response = await axiosInstance.get('/branch/filter', { params });
      setBranches(response.data.branches || []);
      setTotalCount(response.data.total || 0);
    } catch (error) {
      setSnackbarMessage('هەڵە ڕوویدا لە بارکردنی زانیاری');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches(currentPage, rowsPerPage, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [searchQuery, filterCityId, filterRegionId, filterUserId, currentPage, sortBy, sortOrder]);

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

  // Calculate sum of wallet and count for current page
  const totalWallet = branches.reduce(
    (sum, branch) => sum + Number(branch.wallet || 0),
    0
  );
  const totalBranchCount = branches.length;

  const handlePageChange = (_, value) => setCurrentPage(value);
  const handleAddBranch = () => navigate('/branch/register');
  const handleEditBranch = (id) => navigate(`/branch/edit/${id}`);
  const handleClearSearch = () => setSearchQuery('');
  const handleDeleteClick = (id) => {
    setSelectedBranchId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/branch/delete/${selectedBranchId}`);
      setBranches((prev) => prev.filter((branch) => branch.id !== selectedBranchId));
      setSnackbarMessage('لق سڕایەوە بە سەرکەوتوویی');
    } catch (error) {
      setSnackbarMessage('هەڵە ڕوویدا لە سڕینەوەی شعبە');
    } finally {
      setOpenDialog(false);
      setSnackbarOpen(true);
    }
  };

  // Fetch all branches for report (no pagination)
  const fetchAllBranchesForReport = async () => {
    try {
      const params = {
        branch_name: searchQuery,
        city_id: filterCityId,
        region_id: filterRegionId,
        user_id: filterUserId,
        sortBy,
        sortOrder,
      };
      const response = await axiosInstance.get('/branch/filter', { params });
      return response.data.branches || [];
    } catch (error) {
      setSnackbarMessage('هەڵە ڕوویدا لە بارکردنی هەموو داتا');
      setSnackbarOpen(true);
      return [];
    }
  };

  const handleOpenPdfPreview = async () => {
    const allBranches = await fetchAllBranchesForReport();
    setReportBranches(allBranches);
    setOpenPdfPreview(true);
  };

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
          لیستی لقەکان
        </Typography>
        <Stack direction="row" spacing={2}>
          <ReportButton
            onClick={handleOpenPdfPreview}
            sx={{ borderRadius: 2, fontWeight: 'bold', px: 3, py: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddBranch}
            sx={{ borderRadius: 2, fontWeight: 'bold', px: 3, py: 1 }}
          >
            زیادکردن
          </Button>
        </Stack>
      </Stack>

      {/* Filter Section */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="گەڕان"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="ناوی لق..."
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="ناوچە"
              value={filterRegionId}
              onChange={e => { setFilterRegionId(e.target.value); setCurrentPage(1); }}
            >
              <MenuItem value="">هەموو</MenuItem>
              {regions.map((region) => (
                <MenuItem key={region.id} value={region.id}>
                  {region.name}
                </MenuItem>
              ))}
            </TextField>
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
                 <TableCell onClick={() => handleSort('company_id')} sx={{ cursor: 'pointer' }}>
                  کۆمپانیا {getSortIcon('company_id')}
                </TableCell>
                <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer' }}>
                  ناوی لق {getSortIcon('name')}
                </TableCell>

                <TableCell onClick={() => handleSort('city_id')} sx={{ cursor: 'pointer' }}>
                  شار {getSortIcon('city_id')}
                </TableCell>
                <TableCell onClick={() => handleSort('region_id')} sx={{ cursor: 'pointer' }}>
                  ناوچە {getSortIcon('region_id')}
                </TableCell>
                <TableCell>بەڕێوەبەر</TableCell>
                <TableCell onClick={() => handleSort('wallet')} sx={{ cursor: 'pointer' }}>
                  قاصە {getSortIcon('wallet')}
                </TableCell>
                <TableCell>جۆر</TableCell>
                <TableCell>ژمارەی مۆبایل</TableCell>
                <TableCell>دۆخ</TableCell>
                <TableCell>ناونیشان</TableCell>
                <TableCell align="center">کردار</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id} hover>
                  <TableCell>{branch.id}</TableCell>
                  <TableCell>{branch.company_name || '-'}</TableCell>
                  <TableCell>{branch.name}</TableCell>
                  
                  <TableCell>{branch.city_name || '-'}</TableCell>
                  <TableCell>{branch.region_name || '-'}</TableCell>
                  <TableCell>{branch.user_name || '-'}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color: branch.wallet > 0 ? 'green' : branch.wallet < 0 ? 'red' : 'inherit',
                      }}
                    >
                      {Number(branch.wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell>{branch.type || '-'}</TableCell>
                  <TableCell>{branch.phone_1 || '-'}</TableCell>
                  <TableCell>{branch.state || '-'}</TableCell>
                  <TableCell
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 150,
                    }}
                  >
                    {branch.address || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleEditBranch(branch.id)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteClick(branch.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!branches.length && (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    هیچ زانیارییەک نەدۆزرایەوە.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: 16 }}>
                  <span style={{ margin: '0 12px', color: '#222' }}>
                    کۆی گشتی لقەکان: <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{totalBranchCount}</span>
                  </span>
                  <span style={{ margin: '0 12px', color: '#222' }}>
                    کۆی گشتی قاصەکان: <span style={{ fontWeight: 'bold', color: totalWallet > 0 ? '#388e3c' : totalWallet < 0 ? '#d32f2f' : '#222' }}>
                      {totalWallet.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </span>
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
        title="سڕینەوەی لق"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم لقە ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* PDF Dialog */}
      <DialogPdf
        open={openPdfPreview}
        onClose={() => setOpenPdfPreview(false)}
        document={
          <BranchInfoPDF
            branches={reportBranches}
            cities={cities}
            regions={regions}
            company={company}
            filters={{
              branch_name: searchQuery,
              city_id: filterCityId,
              region_id: filterRegionId,
              user_id: filterUserId,
            }}
          />
        }
        fileName="branch_report.pdf"
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

export default BranchList;