import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, Typography, TextField, IconButton, InputAdornment,
  Snackbar, Alert, MenuItem, Tooltip, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, Paper, Pagination, TableFooter
} from '@mui/material';


import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon
} from '@mui/icons-material';

import axiosInstance from '../../components/service/axiosInstance';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ReportButton from '../../components/common/ReportButton';
import DialogPdf from '../../components/utils/DialogPdf';
import RegionInfoPDF from '../../components/reports/region/regionInfoPDF';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function RegionManagement({ isDrawerOpen }) {
  const initialFormData = {
    name: '',
    zone_id: '',
    city_id: '',
    description: '',
  };

  const rowsPerPage = 10;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [zones, setZones] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalCount, setTotalCount] = useState(0);
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
const { company, fetchCompanyInfo } = useCompanyInfo();
const [reportRegions, setReportRegions] = useState([]);


  const [filter, setFilter] = useState({
    zone_id: '',
    city_id: '',
    region_name: '', // match backend param
  });



  // Fetch zones and cities only once
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [zoneRes, cityRes] = await Promise.all([
          axiosInstance.get('/zone/index'),
          axiosInstance.get('/city/index'),
        ]);
        setZones(zoneRes.data || []);
        setCities(cityRes.data || []);
      } catch (err) {
        setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتا');
      }
    };
    fetchMeta();
  }, []);



const fetchAllRegionsForReport = async () => {
  try {
    const params = {
      ...filter,
      sortBy,
      sortOrder,
    };
    // fetch all, no pagination
    const response = await axiosInstance.get('/region/filter', { params });
    return response.data.regions || [];
  } catch (error) {
    setErrorMessage('هەڵە ڕوویدا لە بارکردنی هەموو داتا');
    return [];
  }
};

const handleOpenPdfPreview = async () => {
    await fetchCompanyInfo(); // fetch company info before opening PDF

  const allRegions = await fetchAllRegionsForReport();
  setReportRegions(allRegions);
  setOpenPdfPreview(true);
};

  // Fetch regions when filter, page, or sort changes
  useEffect(() => {
    fetchRegions(filter, currentPage, rowsPerPage, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [filter, currentPage, sortBy, sortOrder]);

  // Fetch regions with filters, pagination, sorting
  const fetchRegions = async (
    filterParams = filter,
    page = currentPage,
    pageSize = rowsPerPage,
    sortField = sortBy,
    sortDirection = sortOrder
  ) => {
    setFetching(true);
    try {
      const params = {
        ...filterParams,
        page,
        pageSize,
        sortBy: sortField,
        sortOrder: sortDirection,
      };
      const response = await axiosInstance.get('/region/filter', { params });
            
      setRegions(response.data.regions || []);
      setTotalCount(response.data.total || 0);
    } catch {
      setErrorMessage('هەڵە ڕوویدا لە گەڕان');
    } finally {
      setFetching(false);
    }
  };


  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const errors = {};
    if (!formData.name.trim()) errors.name = 'ناوی گەڕەک پێویستە';
    if (!formData.zone_id) errors.zone_id = 'زۆن دیاری بکە';
    if (!formData.city_id) errors.city_id = 'شار دیاری بکە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const response = selectedRegionId
        ? await axiosInstance.put(`/region/update/${selectedRegionId}`, formData)
        : await axiosInstance.post('/region/store', formData);

      if ([200, 201].includes(response.status)) {
        setSuccess(true);
        setFormData(initialFormData);
        setSelectedRegionId(null);
        setFormErrors({});
        fetchRegions(filter, currentPage, rowsPerPage, sortBy, sortOrder);
      } else {
        setErrorMessage(response.data.message || 'هەڵە ڕوویدا');
      }
    } catch (err) {
      setErrorMessage('هەڵە ڕوویدا لە تۆمارکردن');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (region) => {
    setSelectedRegionId(region.id);
    setFormData({
      name: region.name || '',
      zone_id: region.zone_id || '',
      city_id: region.city_id || '',
      description: region.description || '',
    });
    setFormErrors({});
  };

  const handleDeleteClick = (id) => {
    setSelectedRegionId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/region/delete/${selectedRegionId}`);
      setSuccess(true);
      fetchRegions(filter, currentPage, rowsPerPage, sortBy, sortOrder);
    } catch (err) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    } finally {
      setOpenDialog(false);
      setSelectedRegionId(null);
    }
  };

  // Filter by zone, name, city
  const handleSearchChange = (e) => {
    const value = e.target.value;
    const newFilter = { ...filter, region_name: value };
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // Filter by zone or city select
  const handleZoneCityFilter = (field, value) => {
    const newFilter = { ...filter, [field]: value };
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (_, value) => {
    setCurrentPage(value);
  };

  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);

  const handleChangeWithErrorReset = (e) => {
    const { name, value } = e.target;
    setErrorMessage('');
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortBy(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const clearSelectField = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleClearForm = () => {
  setFormData(initialFormData);
  setFormErrors({});
  setSelectedRegionId(null);
  setErrorMessage('');
  setFilter({ zone_id: '', city_id: '', region_name: '' }); // Reset filter
  setCurrentPage(1); // Go to first page
};

  return (
  <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s', p: 2 }}>
    <Grid container spacing={2}>
      {/* Form Section */}
      <Grid item xs={12} md={4}>
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedRegionId ? 'گۆڕینی گەڕەک' : 'زیادکردنی گەڕەک'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ناوی گەڕەک"
                    name="name"
                    value={formData.name}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
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
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="زۆن"
                    name="zone_id"
                    value={formData.zone_id}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.zone_id}
                    helperText={formErrors.zone_id}
                    InputProps={{
                      endAdornment: formData.zone_id && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearSelectField('zone_id')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  >
                    {zones.map(option => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="شار"
                    name="city_id"
                    value={formData.city_id}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.city_id}
                    helperText={formErrors.city_id}
                    InputProps={{
                      endAdornment: formData.city_id && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearSelectField('city_id')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  >
                    {cities.map(option => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="وەسف"
                    name="description"
                    value={formData.description}
                    onChange={handleChangeWithErrorReset}
                    InputProps={{
                      endAdornment: formData.description && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearSelectField('description')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={8}>
                  <RegisterButton
                    loading={loading}
                    fullWidth
                    children={selectedRegionId ? 'نوێکردنەوە' : 'تۆمارکردن'}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <ClearButton
                    onClick={handleClearForm}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </form>
          </Box>
        </Card>
      </Grid>

      {/* Filter & Table Section */}
    <Grid item xs={12} md={8}>
  <Card sx={{ p: 0 }}>
    {/* Filter Section */}
    <Box sx={{ px: 3, py: 3, borderBottom: '1px solid #e0e0e0' }}>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="زۆن"
            name="zone_id"
            value={filter.zone_id}
            onChange={e => handleZoneCityFilter('zone_id', e.target.value)}
          >
            <MenuItem value="">هەموو</MenuItem>
            {zones.map(option => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="شار"
            name="city_id"
            value={filter.city_id}
            onChange={e => handleZoneCityFilter('city_id', e.target.value)}
          >
            <MenuItem value="">هەموو</MenuItem>
            {cities.map(option => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={8} md={4}>
          <TextField
            fullWidth
            label="ناوی گەڕەک"
            name="region_name"
            value={filter.region_name}
            onChange={handleSearchChange}
            placeholder="گەڕەک..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="هەموو داتاکان">
                    <IconButton onClick={() => setFilter({ zone_id: '', city_id: '', region_name: '' })}>
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <ReportButton
            onClick={handleOpenPdfPreview}
            fullWidth
            sx={{ height: '100%', whiteSpace: 'nowrap' }}
          />
        </Grid>
      </Grid>
    </Box>

    {/* Table Section */}
    <TableContainer component={Paper} sx={{ borderRadius: 0, boxShadow: 'none' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell onClick={() => handleSort('id')} sx={{ cursor: 'pointer' }}>
              #
              {sortBy === 'id' &&
                (sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
            </TableCell>
            <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer' }}>
              ناوی گەڕەک
              {sortBy === 'name' &&
                (sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
            </TableCell>
            <TableCell onClick={() => handleSort('zone_id')} sx={{ cursor: 'pointer' }}>
              زۆن
              {sortBy === 'zone_id' &&
                (sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
            </TableCell>
            <TableCell onClick={() => handleSort('city_id')} sx={{ cursor: 'pointer' }}>
              شار
              {sortBy === 'city_id' &&
                (sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
            </TableCell>
            <TableCell>وەسف</TableCell>
            <TableCell>ئیش</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {fetching ? (
            <TableRow>
                      <TableCell colSpan={5} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
          ) : regions.length > 0 ? (
            regions.map(region => (
              <TableRow key={region.id}>
                <TableCell>{region.id}</TableCell>
                <TableCell>{region.name}</TableCell>
                <TableCell>{zones.find(z => z.id === region.zone_id)?.name || region.zone_id}</TableCell>
                <TableCell>{cities.find(c => c.id === region.city_id)?.name || region.city_id}</TableCell>
                <TableCell>{region.description}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEditClick(region)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="secondary" onClick={() => handleDeleteClick(region.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                {filter.region_name
                  ? 'هیچ داتایەک بە گەڕانەکەت نەدۆزرایەوە'
                  : 'هیچ داتایەک نەدۆزرایەوە'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
              ژمارەی گشتی :
            </TableCell>
            <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
              {totalCount}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>

    {totalCount > rowsPerPage && (
      <Box display="flex" justifyContent="center" sx={{ py: 2 }}>
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

    {/* Confirm Delete Dialog */}
    <ConfirmDialog
      open={openDialog}
      onClose={handleDialogClose}
      onConfirm={handleDeleteConfirm}
      title="سڕینەوەی گەڕەک"
      description="ئایە دڵنیایت لە سڕینەوەی ئەم گەڕەک؟ ئەم کردارە گەرێنەوە نییە."
      confirmText="سڕینەوە"
      cancelText="پاشگەزبوونەوە"
    />

    {/* PDF Dialog */}
    <DialogPdf
      open={openPdfPreview}
      onClose={() => setOpenPdfPreview(false)}
      document={
        <RegionInfoPDF
          regions={reportRegions}
          zones={zones}
          cities={cities}
          company={company}
          filters={filter}
        />
      }
      fileName="region_report.pdf"
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

export default RegionManagement;