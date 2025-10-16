import React, { useState, useEffect } from 'react';
import axiosInstance from '../../components/service/axiosInstance';
import { Card, Typography, Box, TextField, Button, IconButton, InputAdornment, Avatar, Snackbar, Alert, Grid } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { clearTextField, handleChange, resetForm } from '../../components/utils/formUtils';
import { BASE_URL } from '../../config/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner'; // <-- Add this line


function CompanyRegister({ isDrawerOpen }) {
const initialFormData = {
    name: '',
    phone_1: '',
    phone_2: '',
    address: '',
    tagline: '',
    logo: '',
    email: '',
    note: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [logoFile, setLogoFile] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true); // <-- Add loading state


  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'ناوی کۆمپانیا پێویستە بنووسرێت';
    if (!formData.phone_1.trim()) newErrors.phone_1 = 'ژمارەی مۆبایل١ پێویستە بنووسرێت';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    fetchLatestCompany();

    
  }, []);

 
  const fetchLatestCompany = async () => {
    setLoading(true); // <-- Start loading
    try {
      const response = await axiosInstance.get('company/last-insert-id');
      if (response.data.id) {
        const companyResponse = await axiosInstance.get(`company/show/${response.data.id}`);
        const logoUrl = companyResponse.data.logo_1
          ? `${BASE_URL}${companyResponse.data.logo_1}`
          : '';
        setFormData({
          ...companyResponse.data,
          logo: logoUrl,
        });
        setCompanyId(response.data.id);
      }
    } catch (error) {
      console.error('Error fetching company data:', error.response?.data || error.message);
    }
    setLoading(false); // <-- End loading
  };


  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prevData) => ({
          ...prevData,
          logo: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const cleanFormData = { ...formData };
    Object.keys(cleanFormData).forEach((key) => {
      if (cleanFormData[key] === null || cleanFormData[key] === undefined) {
        cleanFormData[key] = '';
      }
    });

    const formDataToSend = new FormData();
    Object.entries(cleanFormData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    if (logoFile) {
      formDataToSend.append('logo_1', logoFile);
    }
    setLoading(true); 
    try {

      
      let response;
      if (companyId) {
        console.log('Updating company with ID:', companyId); // Debugging
        response = await axiosInstance.put(`company/update/${companyId}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSnackbarMessage('گۆڕانکارییەکان جێبەجێکرا');
      } else {
        response = await axiosInstance.post('company/store', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      
        setCompanyId(response.id);
        setSnackbarMessage('زانیاری کۆمپانیا تۆمارکرا');
      }

      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      fetchLatestCompany();
      resetForm(setFormData, initialFormData);
      setErrors({});
      setLogoFile(null);
    } catch (error) {
      console.error('Error submitting company data:', error.response?.data || error.message);

      if (error.response) {

            if (error.response.status === 400) {
          const serverErrors = error.response.data.error;
          const newErrors = {};
          if (serverErrors.includes('company_name')) newErrors.name = 'ناوی کۆمپانیا پێویستە بنووسرێت';
          if (serverErrors.includes('phone_1')) newErrors.phone_1 = 'ژمارەی مۆبایل١ پێویستە بنووسرێت';
          setErrors(newErrors);
          setSnackbarMessage('هەڵە لە فۆرمەکەدا هەیە');
        } else if (error.response.status === 404 ) {
          setSnackbarMessage('کۆمپانیا نەدۆزرایەوە');
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

   if (loading) {
    return <LoadingSpinner message="چاوەڕوان بن..." />;
  }

  return (
    <>
      <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s ease-in-out' }}>
        <Card sx={{ margin: 1 }}>
          <Box sx={{ padding: 2, textAlign: 'right' }}>
            <Typography variant="h6" gutterBottom>
              زانیاری کۆمپانیا
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {/* Basic Info Fields */}
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="ناو" name="name" value={formData.name}
                    onChange={(e) => handleChange(e, setFormData)}
                    error={!!errors.name}
                    helperText={errors.name}
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
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="ژمارەی مۆبایل١" name="phone_1" value={formData.phone_1}
                    onChange={(e) => handleChange(e, setFormData)}
                    error={!!errors.phone_1}
                    helperText={errors.phone_1}
                    InputProps={{
                      endAdornment: formData.phone_1 && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearTextField(setFormData, 'phone_1')} edge="end">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="ژمارەی مۆبایل٢" name="phone_2" value={formData.phone_2}
                    onChange={(e) => handleChange(e, setFormData)}
                    InputProps={{
                      endAdornment: formData.phone_2 && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearTextField(setFormData, 'phone_2')} edge="end">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Address and Tagline */}
                <Grid item xs={12} md={12}>
                  <TextField fullWidth label="ناونیشان" name="address" value={formData.address}
                    onChange={(e) => handleChange(e, setFormData)}
                    InputProps={{
                      endAdornment: formData.address && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearTextField(setFormData, 'address')} edge="end">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="تێبینی سەر وەصڵ" name="tagline" value={formData.tagline}
                    onChange={(e) => handleChange(e, setFormData)}
                    InputProps={{
                      endAdornment: formData.tagline && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearTextField(setFormData, 'tagline')} edge="end">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField fullWidth type="text" label="ئیمەیڵ" name="email" value={formData.email}
                    onChange={(e) => handleChange(e, setFormData)}
                    InputProps={{
                      endAdornment: formData.email && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearTextField(setFormData, 'email')} edge="end">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Note and Logo */}
                <Grid item xs={12} md={8}>
                  <TextField fullWidth label="تێبینی" name="note" value={formData.note}
                    onChange={(e) => handleChange(e, setFormData)} multiline rows={2}
                    InputProps={{
                      endAdornment: formData.note && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => clearTextField(setFormData, 'note')} edge="end">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="contained" component="label">
                      هەڵبژاردنی لۆگۆ
                      <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </Button>
                    <Avatar alt="Logo" src={formData.logo || ''} sx={{ width: 80, height: 80 }} />
                    {formData.logo && (
                      <IconButton onClick={() => clearTextField(setFormData, 'logo')} edge="end">
                        <ClearIcon />
                      </IconButton>
                    )}
                  </Box>
                </Grid>

                {/* Buttons */}
                <Grid item xs={9}>
                  <Button fullWidth type="submit" color="success" variant="contained">
                    {companyId ? 'دەستکاری' : 'تۆمارکردن'}
                  </Button>
                </Grid>

                <Grid item xs={3}>
                  <Button fullWidth variant="contained" color="warning" onClick={() => resetForm(setFormData, initialFormData)}>
                    پاکردنەوە
                  </Button>
                </Grid>

              </Grid>
            </form>
          </Box>
        </Card>
      </Box>

      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default CompanyRegister;
