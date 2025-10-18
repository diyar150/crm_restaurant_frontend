import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../components/service/axiosInstance';
import {
  Card, Typography, Box, TextField, Button, MenuItem, IconButton, InputAdornment,
  Grid, Snackbar, Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import { clearTextField, handleChange as handleChangeUtil, resetForm } from '../../components/utils/formUtils';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const initialFormData = {
  company_id: '0',
  name: '',
  address: '',
  city_id: '0',
  latitude: '',
  longitude: '',
  radius_meters: '',
  state: 'چالاک'
};

function BranchRegister({ isDrawerOpen }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch dropdown options and branch data if editing
  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      const [companyRes, cityRes] = await Promise.all([
        axiosInstance.get('/company/index'),
        axiosInstance.get('/city/index'),
      ]);
      setCompanies(companyRes.data || []);
      setCities(cityRes.data || []);
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage('هەڵە لە بارکردنی داتای سەرەکی');
      setOpenSnackbar(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchBranch = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/branch/show/${id}`);
        if (!ignore && response.data) {
          const data = response.data;
          setFormData({
            company_id: String(data.company_id || '0'),
            name: data.name || '',
            address: data.address || '',
            city_id: String(data.city_id || '0'),
            latitude: data.latitude || '',
            longitude: data.longitude || '',
            radius_meters: data.radius_meters || '',
            state: data.state || 'چالاک',
          });
        }
      } catch (error) {
        setSnackbarSeverity('error');
        setSnackbarMessage('هەڵە لە بارکردنی زانیاری بەش');
        setOpenSnackbar(true);
      }
      setLoading(false);
    };

    fetchOptions();
    if (id) {
      fetchBranch();
    } else {
      setFormData(initialFormData);
      setLoading(false);
    }
    return () => { ignore = true; };
  }, [id, fetchOptions]);

  const handleChange = useCallback((e) => handleChangeUtil(e, setFormData), []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.company_id || formData.company_id === '0') newErrors.company_id = 'ناوی کۆمپانیا پێویستە بنووسرێت';
    if (!formData.name.trim()) newErrors.name = 'ناوی بەش پێویستە بنووسرێت';
    if (!formData.city_id || formData.city_id === '0') newErrors.city_id = 'ناوی شار پێویستە بنووسرێت';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setSnackbarSeverity('error');
      setSnackbarMessage('تکایە هەموو خانەکان پڕبکەوە بە دروستی');
      setOpenSnackbar(true);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        company_id: formData.company_id,
        name: formData.name.trim(),
        address: formData.address || null,
        latitude: formData.latitude ? Number(formData.latitude) : 0,
        longitude: formData.longitude ? Number(formData.longitude) : 0,
        radius_meters: formData.radius_meters ? Number(formData.radius_meters) : 0,
        city_id: formData.city_id,
        state: formData.state,
      };

      if (id) {
        await axiosInstance.put(`/branch/update/${id}`, payload);
        setSnackbarSeverity('success');
        setSnackbarMessage('زانیاری بەشەکە نوێکرایەوە');
        navigate('/branch');
      } else {
        await axiosInstance.post('/branch/store', payload);
        setSnackbarSeverity('success');
        setSnackbarMessage('بەشەکە بە سەرکەوتوویی تۆمارکرا');
        resetForm(setFormData, initialFormData);
      }
      setOpenSnackbar(true);
    } catch (error) {
      // Prefer backend-provided message (may be localized). Fall back to heuristics otherwise.
      console.error('Branch submit error:', error);
      const backendErrorRaw = error.response?.data?.error || error.response?.data?.message || error.message || '';
      const backendErrorLower = String(backendErrorRaw).toLowerCase();

      if (backendErrorRaw) {
        setSnackbarSeverity('error');
        setSnackbarMessage(backendErrorRaw);
      } else if (
        backendErrorLower.includes('unique') ||
        backendErrorLower.includes('duplicate') ||
        backendErrorLower.includes('branch name') ||
        backendErrorLower.includes('already exists')
      ) {
        setSnackbarSeverity('error');
        setSnackbarMessage('ناوی بەش پێشتر تۆمارکراوە!');
      } else {
        setSnackbarSeverity('error');
        setSnackbarMessage('هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدە.');
      }
      setOpenSnackbar(true);
    }
    setLoading(false);
  };

  const handleClose = () => {
    navigate('/branch');
  };

  if (loading) {
    return <LoadingSpinner message="چاوەڕوان بن..." />;
  }
  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Card sx={{ margin: 1 }}>
        <Box sx={{ padding: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{id ? 'گۆڕینی زانیاری لق' : 'زانیاری لق'}</Typography>
            <IconButton onClick={handleClose}><CloseIcon /></IconButton>
          </Box>
          <form onSubmit={handleSubmit} autoComplete="off">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth select label="کۆمپانیا" name="company_id" value={formData.company_id}
                  onChange={handleChange} error={!!errors.company_id} helperText={errors.company_id}
                >
                  <MenuItem value="0" disabled>کۆمپانیا هەڵبژێرە</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="ناوی بەش" name="name" value={formData.name}
                  onChange={handleChange} error={!!errors.name} helperText={errors.name}
                  InputProps={{
                    endAdornment: formData.name && (
                      <InputAdornment position="end">
                        <IconButton aria-label="clear name" onClick={() => clearTextField(setFormData, 'name')} edge="end">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="ناونیشان" name="address" value={formData.address}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: formData.address && (
                      <InputAdornment position="end">
                        <IconButton aria-label="clear address" onClick={() => clearTextField(setFormData, 'address')} edge="end">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth select label="شار" name="city_id" value={formData.city_id}
                  onChange={handleChange} error={!!errors.city_id} helperText={errors.city_id}
                >
                  <MenuItem value="0" disabled>شار هەڵبژێرە</MenuItem>
                  {cities.map((city) => (
                    <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth select label="دۆخی بەش" name="state" value={formData.state}
                  onChange={handleChange}
                >
                  <MenuItem value="چالاک">چالاک</MenuItem>
                  <MenuItem value="ناچالاک">ناچالاک</MenuItem>
                </TextField>
              </Grid>
                <Grid item xs={12} md={3}>
    <TextField
      fullWidth label="Latitude" name="latitude" value={formData.latitude}
      onChange={handleChange}
      type="number"
      InputProps={{
        endAdornment: formData.latitude && (
          <InputAdornment position="end">
            <IconButton aria-label="clear latitude" onClick={() => clearTextField(setFormData, 'latitude')} edge="end">
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  </Grid>
  <Grid item xs={12} md={3}>
    <TextField
      fullWidth label="Longitude" name="longitude" value={formData.longitude}
      onChange={handleChange}
      type="number"
      InputProps={{
        endAdornment: formData.longitude && (
          <InputAdornment position="end">
            <IconButton aria-label="clear longitude" onClick={() => clearTextField(setFormData, 'longitude')} edge="end">
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  </Grid>
  <Grid item xs={12} md={3}>
    <TextField
      fullWidth label="Radius (meters)" name="radius_meters" value={formData.radius_meters}
      onChange={handleChange}
      type="number"
      InputProps={{
        endAdornment: formData.radius_meters && (
          <InputAdornment position="end">
            <IconButton aria-label="clear radius_meters" onClick={() => clearTextField(setFormData, 'radius_meters')} edge="end">
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  </Grid>
              <Grid item xs={9}>
                <Button fullWidth type="submit" color="success" variant="contained" disabled={loading}>
                  {id ? 'نوێکردنەوە' : 'تۆمارکردن'}
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="contained" color="warning"
                  onClick={() => resetForm(setFormData, initialFormData)} disabled={loading}>
                  پاککردنەوە
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Card>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default BranchRegister;