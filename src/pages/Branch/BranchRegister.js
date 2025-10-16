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

const today = new Date().toISOString().split('T')[0];

const initialFormData = {
  company_id: '0',
  name: '',
  type: '',
  address: '',
  city_id: '0',
  region_id: '0',
  phone_1: '',
  phone_2: '',
  user_id: '0',
  opening_date: today,
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
  const [regions, setRegions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch dropdown options and branch data if editing
  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      const [companyRes, cityRes, regionRes, userRes] = await Promise.all([
        axiosInstance.get('/company/index'),
        axiosInstance.get('/city/index'),
        axiosInstance.get('/region/index'),
        axiosInstance.get('/user/index')
      ]);
      setCompanies(companyRes.data || []);
      setCities(cityRes.data || []);
      setRegions(regionRes.data || []);
      setUsers(userRes.data || []);
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
            type: data.type || '',
            address: data.address || '',
            city_id: String(data.city_id || '0'),
            region_id: String(data.region_id || '0'),
            phone_1: data.phone_1 || '',
            phone_2: data.phone_2 || '',
            user_id: String(data.user_id || '0'),
            opening_date: data.opening_date ? new Date(data.opening_date).toISOString().split('T')[0] : today,
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
    if (!formData.phone_1.trim()) newErrors.phone_1 = 'ژمارەی مۆبایل١ پێویستە بنووسرێت';
    if (!formData.city_id || formData.city_id === '0') newErrors.city_id = 'ناوی شار پێویستە بنووسرێت';
    if (!formData.region_id || formData.region_id === '0') newErrors.region_id = 'ناوی ناوچە پێویستە بنووسرێت';
    if (!formData.user_id || formData.user_id === '0') newErrors.user_id = 'ناوی بەکارهێنەر پێویستە بنووسرێت';
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
      let response;
      if (id) {
        response = await axiosInstance.put(`/branch/update/${id}`, formData);
        setSnackbarSeverity('success');
        setSnackbarMessage('زانیاری بەشەکە نوێکرایەوە');
        navigate('/branch');
      } else {
        response = await axiosInstance.post('/branch/store', formData);
        setSnackbarSeverity('success');
        setSnackbarMessage('بەشەکە بە سەرکەوتوویی تۆمارکرا');
        resetForm(setFormData, initialFormData);
      }
      setOpenSnackbar(true);
    } catch (error) {
      const backendError = error.response?.data?.error?.toLowerCase() || '';
      if (
        backendError.includes('unique') ||
        backendError.includes('duplicate') ||
        backendError.includes('branch name') ||
        backendError.includes('already exists')
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
              <Grid item xs={12} md={4}>
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
              <Grid item xs={12} md={4}>
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
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="جۆری بەش" name="type" value={formData.type}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: formData.type && (
                      <InputAdornment position="end">
                        <IconButton aria-label="clear type" onClick={() => clearTextField(setFormData, 'type')} edge="end">
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
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="ژمارەی مۆبایل١" name="phone_1" value={formData.phone_1}
                  onChange={handleChange} error={!!errors.phone_1} helperText={errors.phone_1}
                  InputProps={{
                    endAdornment: formData.phone_1 && (
                      <InputAdornment position="end">
                        <IconButton aria-label="clear phone_1" onClick={() => clearTextField(setFormData, 'phone_1')} edge="end">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="ژمارەی مۆبایل٢" name="phone_2" value={formData.phone_2}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: formData.phone_2 && (
                      <InputAdornment position="end">
                        <IconButton aria-label="clear phone_2" onClick={() => clearTextField(setFormData, 'phone_2')} edge="end">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
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
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="ناوچە" name="region_id" value={formData.region_id}
                  onChange={handleChange} error={!!errors.region_id} helperText={errors.region_id}
                >
                  <MenuItem value="0" disabled>ناوچە هەڵبژێرە</MenuItem>
                  {regions.map((region) => (
                    <MenuItem key={region.id} value={region.id}>{region.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="بەڕێوبەر" name="user_id" value={formData.user_id}
                  onChange={handleChange} error={!!errors.user_id} helperText={errors.user_id}
                >
                  <MenuItem value="0" disabled>بەڕێوبەر هەڵبژێرە</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="رێکەوتی کرانەوە" name="opening_date" type="date"
                  InputLabelProps={{ shrink: true }} value={formData.opening_date}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="دۆخی بەش" name="state" value={formData.state}
                  onChange={handleChange}
                >
                  <MenuItem value="چالاک">چالاک</MenuItem>
                  <MenuItem value="ناچالاک">ناچالاک</MenuItem>
                </TextField>
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