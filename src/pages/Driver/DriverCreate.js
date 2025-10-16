import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  Grid,
  Avatar,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import AddButton from '../../components/common/AddButton';
import ClearButton from '../../components/common/ClearButton';
import axiosInstance from '../../components/service/axiosInstance';
import LoadingSpinner from '../../components/common/LoadingSpinner';
const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:3001';

const initialFormData = {
  name: '',
  phone: '',
  gender: '',
  license_number: '',
  license_expiry: '',
  national_id: '',
  address: '',
  birthday: '',
  status: '',
  hired_date: '',
  salary: '',
  emergency_contact: '',
  photo: '',
  car_number: '',
  car_name: '',
  note: '',
};

const genderOptions = [
  { value: 'نێر', label: 'نێر' },
  { value: 'مێ', label: 'مێ' },
];

const statusOptions = [
  { value: 'چالاک', label: 'چالاک' },
  { value: 'ناچالاک', label: 'ناچالاک' },
];

function DriverCreate({ isDrawerOpen }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [photoFile, setPhotoFile] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Validation: only name and phone are required
    const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'ناوی شۆفێر پێویستە بنووسرێت';
    if (!formData.phone.trim()) newErrors.phone = 'ژمارەی مۆبایل پێویستە بنووسرێت';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

   const handleChangeWithErrorReset = (e) => {
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    handleChange(e);
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      axiosInstance
        .get(`/driver/show/${id}`)
        .then((res) => {
          setFormData({
            ...initialFormData,
            ...res.data,
            license_expiry: res.data.license_expiry ? res.data.license_expiry.slice(0, 10) : '',
            birthday: res.data.birthday ? res.data.birthday.slice(0, 10) : '',
            hired_date: res.data.hired_date ? res.data.hired_date.slice(0, 10) : '',
            photo: res.data.photo
              ? (res.data.photo.startsWith('http') || res.data.photo.startsWith('data:')
                ? res.data.photo
                : `${BASE_URL}${res.data.photo}`)
              : '',
          });
          setPhotoFile(null); // Clear file state on edit
          setDriverId(res.data.id);
        })
        .catch(() => {
          setSnackbarMessage('هەڵە لە بارکردنی زانیاری شۆفێر');
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line
  }, [id]);

const getPhotoPreview = () => {
  if (photoFile) {
    return URL.createObjectURL(photoFile);
  }
  if (formData.photo) {
    // If photo is a full URL, use it; else, prepend BASE_URL
    if (formData.photo.startsWith('http')) {
      return formData.photo;
    }
    if (formData.photo.startsWith('/')) {
      return `${BASE_URL}${formData.photo}`;
    }
  }
  return ''; // fallback: no image
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearTextField = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setPhotoFile(null);
    setDriverId(null);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSnackbarSeverity('error');
      return;
    }

    setLoading(true);

    // Clean form data: convert null/undefined to empty string
    const cleanFormData = { ...formData };
    Object.keys(cleanFormData).forEach((key) => {
      if (cleanFormData[key] === null || cleanFormData[key] === undefined) {
        cleanFormData[key] = '';
      }
    });

    // Prepare FormData for file upload
    const formDataToSend = new FormData();
    Object.entries(cleanFormData).forEach(([key, value]) => {
      if (key !== 'photo') formDataToSend.append(key, value);
    });
    if (photoFile) {
      formDataToSend.append('photo', photoFile);
    }

    try {
      let response;
      if (driverId || id) {
        response = await axiosInstance.put(`/driver/update/${driverId || id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSnackbarMessage('زانیاری شۆفێر نوێکرایەوە');
      } else {
        response = await axiosInstance.post('/driver/store', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setDriverId(response.data.id);
        setSnackbarMessage('شۆفێر تۆمارکرا');
      }
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setErrors({});
      setPhotoFile(null);
      if (!driverId && !id) resetForm();
      setTimeout(() => navigate('/driver'));
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          const serverErrors = error.response.data.error;
          const newErrors = {};
          if (serverErrors.includes('driver_name')) newErrors.name = 'ناوی شۆفێر پێویستە بنووسرێت';
          if (serverErrors.includes('phone')) newErrors.phone = 'ژمارەی مۆبایل پێویستە بنووسرێت';
          setErrors(newErrors);
          setSnackbarMessage('هەڵە لە فۆرمەکەدا هەیە');
        } else if (error.response.status === 404) {
          setSnackbarMessage('شۆفێر نەدۆزرایەوە');
        } else {
          setSnackbarMessage('هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدە.');
        }
      } else {
        setSnackbarMessage('هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدە.');
      }
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
    setLoading(false);
  };

  const handleClose = () => {
    navigate('/driver');
  };

  if (loading) {
    return <LoadingSpinner message="چاوەڕوان بن..." />;
  }

  return (
    <>
      <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s ease-in-out' }}>
        <Card sx={{ margin: 1 }}>
          <Box sx={{ padding: 2, textAlign: 'right' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Typography variant="h6" gutterBottom>
                {driverId || id ? 'گۆڕینی زانیاری شۆفێر' : 'تۆمارکردنی شۆفێر'}
              </Typography>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="ناو"
              name="name"
              value={formData.name}
              onChange={handleChangeWithErrorReset}
              error={!!errors.name}
              helperText={errors.name}
              
              sx={{ marginBottom: 2 }}
              InputProps={{
                endAdornment: formData.name && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => clearTextField('name')} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
                   <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="ژمارەی مۆبایل"
              name="phone"
              value={formData.phone}
              onChange={handleChangeWithErrorReset}
              error={!!errors.phone}
               helperText={errors.phone}
              sx={{ marginBottom: 2 }}
              InputProps={{
                endAdornment: formData.phone && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => clearTextField('phone')} edge="end">
                      <ClearIcon />
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
                    label="ڕەگەز"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    sx={{ marginBottom: 2 }}
                  >
                    <MenuItem value="">---</MenuItem>
                    {genderOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="ژمارەی مۆڵەت"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="بەرواری بەسەرچوونی مۆڵەت"
                    name="license_expiry"
                    type="date"
                    value={formData.license_expiry || ''}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="ژمارەی ناسنامە"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleChange}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="ناونیشان"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="بەرواری لەدایکبوون"
                    name="birthday"
                    type="date"
                    value={formData.birthday || ''}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="دۆخ"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    sx={{ marginBottom: 2 }}
                  >
                    <MenuItem value="">---</MenuItem>
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="بەرواری دامەزراندن"
                    name="hired_date"
                    type="date"
                    value={formData.hired_date || ''}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="مووچە"
                    name="salary"
                    type="number"
                    value={formData.salary}
                    onChange={handleChange}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="ژمارەی پەیوەندی ناکاو"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="ژمارەی ئۆتۆمبێل"
                    name="car_number"
                    value={formData.car_number}
                    onChange={handleChange}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="ناوی ئۆتۆمبێل"
                    name="car_name"
                    value={formData.car_name}
                    onChange={handleChange}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="تێبینی"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    multiline
                    rows={2}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="contained" component="label">
                      هەڵبژاردنی وێنە
                      <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </Button>
                     <Avatar alt="Driver" src={getPhotoPreview()} sx={{ width: 80, height: 80 }} />

                    {formData.photo && (
                      <IconButton onClick={() => clearTextField('photo')} edge="end">
                        <ClearIcon />
                      </IconButton>
                    )}
                  </Box>
                </Grid>
               <Grid item xs={9}>
                  <AddButton
                    fullWidth
                    type="submit"
                    onClick={handleSubmit}
                    sx={{ mt: 1 }}
                  >
                    {driverId || id ? 'گۆڕانکاری' : 'تۆمارکردن'}
                  </AddButton>
                </Grid>
                <Grid item xs={3}>
                  <ClearButton
                    fullWidth
                    onClick={resetForm}
                    sx={{ mt: 1 }}
                  >
                    پاکردنەوە
                  </ClearButton>
                </Grid>
              </Grid>
            </form>
          </Box>
        </Card>
      </Box>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default DriverCreate;