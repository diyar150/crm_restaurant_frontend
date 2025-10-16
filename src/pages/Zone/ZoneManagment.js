import React, { useState, useEffect } from 'react';
import axiosInstance from '../../components/service/axiosInstance';
import {
  Card,
  Typography,
  Box,
  TextField,
  MenuItem,
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
} from '@mui/material';
import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon
} from '@mui/icons-material';
import { clearTextField, handleChange, resetForm } from '../../components/utils/formUtils';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ReportButton from '../../components/common/ReportButton';
import DialogPdf from '../../components/utils/DialogPdf';
import ZoneInfoPDF from '../../components/reports/zone/ZoneInfoPDF';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import LoadingSpinner from '../../components/common/LoadingSpinner';



function ZoneManagement({ isDrawerOpen }) {
const initialFormData = { name: '', description: '', city_id: '', sales_target: 0 };  


const rowsPerPage = 10;

  // States
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [cities, setCities] = useState([]); // <-- Add this
  const [filter, setFilter] = useState({ zone_name: '', city_id: '' });
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const { company, fetchCompanyInfo } = useCompanyInfo();
  const [reportZones, setReportZones] = useState([]);


  const fetchZones = async (
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
        const response = await axiosInstance.get('/zone/filter', { params });
        setZones(response.data.zones || []);
        setTotalCount(response.data.total || 0);
      } catch {
        setErrorMessage('هەڵە ڕوویدا لە گەڕان');
      } finally {
        setFetching(false);
      }
    };

    const fetchAllZonesForReport = async () => {
  try {
    const params = {
      ...filter,
      sortBy,
      sortOrder,
    };
    const response = await axiosInstance.get('/zone/filter', { params });
    return response.data.zones || [];
  } catch {
    setErrorMessage('هەڵە ڕوویدا لە بارکردنی هەموو داتا');
    return [];
  }
};

    useEffect(() => {
      fetchZones(filter, currentPage, rowsPerPage, sortBy, sortOrder);
      // eslint-disable-next-line
    }, [filter, currentPage, sortBy, sortOrder]);

  // Fetch zones
   useEffect(() => {
    const fetchZones = async () => {
      setFetching(true);
      try {
        const response = await axiosInstance.get('/zone/index');
        if (response.status === 200) {
          setZones(response.data || []);
        }
      } catch (error) {
        setErrorMessage('هەڵە ڕوویدا لە بارکردنی زانیاری');
      } finally {
        setFetching(false);
      }
    };

    const fetchCities = async () => {
      try {
        const response = await axiosInstance.get('/city/index');
        if (response.status === 200) {
          setCities(response.data || []);
        }
      } catch (error) {
        setErrorMessage('هەڵە ڕوویدا لە بارکردنی شارەکان');
      }
    };

    fetchZones();
    fetchCities();
  }, []);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Validate form fields
   const errors = {};
      if (!formData.name.trim()) {
        errors.name = 'ناوی زۆن پێویستە بنووسرێت';
      }
      if (!formData.city_id) {
        errors.city_id = 'شار پێویستە هەڵبژێرێت';
      }
      if (formData.sales_target === '' || isNaN(formData.sales_target)) {
        errors.sales_target = 'ئامانجی فرۆشتن پێویستە ژمارە بێت';
      } else if (Number(formData.sales_target) < 0) {
        errors.sales_target = 'ئامانجی فرۆشتن نابێت منفی بێت';
      }
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        setLoading(false);
        return;
      }

    try {
      let response;
      if (selectedZoneId) {
        response = await axiosInstance.put(`/zone/update/${selectedZoneId}`, formData);
      } else {
        response = await axiosInstance.post('/zone/store', formData);
      }

      if (response.status === 200 || response.status === 201) {
        const updatedZones = await axiosInstance.get('/zone/index');
        setZones(updatedZones.data);
        setSuccess(true);
        resetForm(setFormData, initialFormData);
        setSelectedZoneId(null);
        setFormErrors({});
      } else {
        setErrorMessage(response.data.message || 'هەڵە ڕوویدا لە جێبەجێکردندا');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.data?.error) {
        if (error.response.data.error === 'ناوی زۆن پێشتر تۆمارکراوە') {
          setFormErrors({ name: error.response.data.error });
        } else {
          setErrorMessage(error.response.data.error);
        }
      } else {
        setErrorMessage('هەڵە ڕوویدا لەپەیوەست بوون بەسێرفەرەوە');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
  setFilter({ ...filter, zone_name: e.target.value });
  setCurrentPage(1);
};

const handleCityFilter = (e) => {
  setFilter({ ...filter, city_id: e.target.value });
  setCurrentPage(1);
};

const handleSort = (field) => {
  const isAsc = sortBy === field && sortOrder === 'asc';
  setSortBy(field);
  setSortOrder(isAsc ? 'desc' : 'asc');
  setCurrentPage(1);
};

const handlePageChange = (_, value) => {
  setCurrentPage(value);
};

  // Handle Edit
 const handleEditClick = (zone) => {
  setSelectedZoneId(zone.id);
  setFormData({
    name: zone.name,
    description: zone.description,
    city_id: zone.city_id || '',
    sales_target: zone.sales_target || '',
  });
  setFormErrors({});
};

  // Handle Delete
  const handleDeleteClick = (id) => {
    setSelectedZoneId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/zone/delete/${selectedZoneId}`);
      setZones((prev) => prev.filter((zone) => zone.id !== selectedZoneId));
      setOpenDialog(false);
      setSelectedZoneId(null);
      setSuccess(true);
    } catch (error) {
      console.error('Error deleting zone:', error.response || error.message || error);
      setErrorMessage('هەڵە ڕوویدا لەسڕینەوە');
    }
  };

  // Pagination
  const indexOfLastZone = currentPage * rowsPerPage;
  const indexOfFirstZone = indexOfLastZone - rowsPerPage;
  const currentZones = zones.slice(indexOfFirstZone, indexOfLastZone);


  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);
  const handleChangeWithErrorReset = (e, setFormData) => {
    setErrorMessage('');
    setFormErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: '' }));
    handleChange(e, setFormData);
  };

const handleOpenPdfPreview = async () => {
  await fetchCompanyInfo();
  const allZones = await fetchAllZonesForReport();
  setReportZones(allZones);
  setOpenPdfPreview(true);
};

  // Clear form handler
  const handleClearForm = () => {
    resetForm(setFormData, initialFormData);
    setFormErrors({});
    setSelectedZoneId(null);
    setErrorMessage('');
  };

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s ease-in-out' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ margin: 1 }}>
            <Box sx={{ padding: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedZoneId ? 'گۆڕینی زۆن' : 'زیادکردنی زۆن'}
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="ناوی زۆن"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleChangeWithErrorReset(e, setFormData)}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  sx={{ marginBottom: 2 }}
                  InputProps={{
                    endAdornment: formData.name && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => clearTextField(setFormData, 'name')} edge="end">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
             <TextField
                select
                fullWidth
                label="شار"
                name="city_id"
                value={formData.city_id}
                onChange={(e) => handleChangeWithErrorReset(e, setFormData)}
                error={!!formErrors.city_id}
                helperText={formErrors.city_id}
                sx={{ marginBottom: 2 }}
              >
                <MenuItem value="">شار هەڵبژێرە</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>
                    {city.name}
                  </MenuItem>
                ))}
              </TextField>

               <TextField
                  fullWidth
                  label="ئامانجی فرۆشتن"
                  name="sales_target"
                  type="number"
                  value={formData.sales_target}
                  onChange={(e) => handleChangeWithErrorReset(e, setFormData)}
                  error={!!formErrors.sales_target}
                  helperText={formErrors.sales_target}
                  sx={{ marginBottom: 2 }}
                />

                <TextField
                  fullWidth
                  label="وەسف"
                  name="description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange(e, setFormData)}
                  sx={{ marginBottom: 2 }}
                />
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={8}>
                    <RegisterButton
                      loading={loading}
                      fullWidth
                      children={selectedZoneId ? 'نوێکردنەوە' : 'تۆمارکردن'}
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

        {/* List Section */}
        <Grid item xs={12} md={8}>

  <Box sx={{ px: 3, py: 3, borderBottom: '1px solid #e0e0e0' }}>
    <Grid container spacing={2} alignItems="flex-end">

       <Grid item xs={12} sm={6} md={6}>
        <TextField
          select
          fullWidth
          label="شار"
          name="city_id"
          value={filter.city_id}
          onChange={handleCityFilter}
        >
          <MenuItem value="">هەموو</MenuItem>
          {cities.map((city) => (
            <MenuItem key={city.id} value={city.id}>
              {city.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>


      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="ناوی زۆن"
          name="zone_name"
          value={filter.zone_name}
          onChange={handleSearchChange}
          placeholder="گەڕان..."
        />
      </Grid>

      <Grid item xs={12} sm={12} md={2}>
        <ReportButton
          onClick={handleOpenPdfPreview}
          fullWidth
        />
      </Grid>
    </Grid>
  </Box>       


          <Card sx={{ margin: 1 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell onClick={() => handleSort('id')} sx={{ cursor: 'pointer' }}>
                      #
                      {sortBy === 'id' && (sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    </TableCell>
                    <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer' }}>
                      ناوی زۆن
                      {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    </TableCell>
                    <TableCell onClick={() => handleSort('city_id')} sx={{ cursor: 'pointer' }}>
                      شار
                      {sortBy === 'city_id' && (sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    </TableCell>
                    <TableCell>ئامانجی فرۆشتن</TableCell>
                    <TableCell>وەسف</TableCell>
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
                  ) : currentZones.length > 0 ? (
                    currentZones.map((zone) => (
                      <TableRow key={zone.id}>
                        <TableCell>{zone.id}</TableCell>
                        <TableCell>{zone.name}</TableCell>
                            <TableCell>
                          {cities.find((c) => c.id === zone.city_id)?.name || zone.city_id}
                        </TableCell>
                            <TableCell>{zone.sales_target}</TableCell>
                        <TableCell>{zone.description}</TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(zone)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(zone.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        هیچ داتایەک نەدۆزرایەوە
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                      ژمارەی گشتی :
                    </TableCell>
                    <TableCell colSpan={2} align="left" sx={{ fontWeight: 'bold' }}>
                      {zones.length}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="center">
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
            </Box>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={openDialog}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی زۆن"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم زۆنە ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      

      {/* Success Snackbar */}
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

     <DialogPdf
        open={openPdfPreview}
        onClose={() => setOpenPdfPreview(false)}
        document={
          <ZoneInfoPDF
            zones={reportZones}
            cities={cities}
            company={company}
            filters={filter}
    />
  }
  fileName="zone_report.pdf"
/>

      {/* Error Snackbar */}
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

export default ZoneManagement;