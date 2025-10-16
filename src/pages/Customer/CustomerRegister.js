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
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '../../components/service/axiosInstance';
import CustomerLocationMap from './CustomerLocationMap';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Utility to clear a field
const clearTextField = (setFormData, field) => {
  setFormData(prev => ({ ...prev, [field]: '' }));
};

// Utility to reset form
const resetForm = (setFormData, initialFormData) => {
  setFormData(initialFormData);
};

// Utility to handle number input
const handleChangeNumber = (e, setFormData, setFormErrors) => {
  const { name, value } = e.target;
  const numValue = value.replace(/[^0-9]/g, '');
  setFormErrors(prev => ({ ...prev, [name]: '' }));
  setFormData(prev => ({
    ...prev,
    [name]: numValue,
  }));
};

function CustomerRegister({ isDrawerOpen }) {
  const initialFormData = {
    category_id: 0,
    zone_id: 0,
    code: '',
    name: '',
    phone_1: '',
    phone_2: '',
    type: 'هەردووکی',
    note: '',
    city_id: 0,
    kafyl_name: '',
    kafyl_phone: '',
    state: 'چالاک',
    address: '',
    cobon: '',
    limit_loan_price: '',
    limit_loan_day: '',
    latitude: 0,
    longitude: 0,
    currency_id: 0,
    price_type_id: 0,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [mandubs, setMandubs] = useState([]);
    const [currencies, setCurrencies] = useState([]);
  const [priceTypes, setPriceTypes] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();

  // Snackbar close handler
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // Location select handler from map modal
  const handleLocationSelect = (pos) => {
    setFormData((prev) => ({
      ...prev,
      latitude: pos.lat,
      longitude: pos.lng,
    }));
  };

  // Fetch categories, zones, cities, and customer data (if editing)
  useEffect(() => {
    axiosInstance.get('/customer-category/index')
      .then((response) => {
        if (Array.isArray(response.data)) setCategories(response.data);
        else setCategories(response.data.results || []);
      })
      .catch(() => setCategories([]));

    axiosInstance.get('/zone/index')
      .then((response) => {
        if (Array.isArray(response.data)) setZones(response.data);
        else setZones(response.data.results || []);
      })
      .catch(() => setZones([]));

    axiosInstance.get('/city/index')
      .then((response) => {
        if (Array.isArray(response.data)) setCities(response.data);
        else setCities(response.data.results || []);
      })
      .catch(() => setCities([]));

       // Fetch currencies
    axiosInstance.get('/currency/index')
      .then((response) => {
        if (Array.isArray(response.data)) setCurrencies(response.data);
        else setCurrencies(response.data.results || []);
      })
      .catch(() => setCurrencies([]));

        // Fetch price types
    axiosInstance.get('/item-price-type/index')
      .then((response) => {
        if (Array.isArray(response.data)) setPriceTypes(response.data);
        else setPriceTypes(response.data.results || []);
      })
      .catch(() => setPriceTypes([]));


       // Fetch mandubs (employees)
    axiosInstance.get('/user/index')
      .then((response) => {
        if (Array.isArray(response.data)) setMandubs(response.data);
        else setMandubs(response.data.results || []);
      })
      .catch(() => setMandubs([]));

    if (id) {
      axiosInstance.get(`/customer/show/${id}`)
        .then((response) => {
          setFormData({
            ...initialFormData,
            ...response.data,
            category_id: response.data.category_id || 0,
            zone_id: response.data.zone_id || 0,
            city_id: response.data.city_id || 0,
            mandub_id: response.data.mandub_id || 0,
            latitude: response.data.latitude ?? 0,
            longitude: response.data.longitude ?? 0,
            currency_id: response.data.currency_id || 0,
            price_type_id: response.data.price_type_id || 0,

          });
        })
        .catch(() => {});
    }
    // eslint-disable-next-line
  }, [id]);

  // Validation
  const validateForm = (data) => {
    const errors = {};
    if (!data.category_id || data.category_id === 0) errors.category_id = 'گرووپ پێویستە';
    if (!data.zone_id || data.zone_id === 0) errors.zone_id = 'زون پێویستە';
    if (!data.city_id || data.city_id === 0) errors.city_id = 'شار پێویستە';
    if (!data.name) errors.name = 'ناو پێویستە';
    if (!data.phone_1) errors.phone_1 = 'مۆبایلی١ پێویستە';
    if (!data.type) errors.type = 'جۆری مامەڵە پێویستە';
    if (!data.state) errors.state = 'حاڵەت پێویستە';
        if (!data.currency_id || data.currency_id === 0) errors.currency_id = 'دراو پێویستە';

    return errors;
  };

  // Handle change with error reset
  const handleChangeWithErrorReset = (e) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({
      ...prev,
      [name]: [
        'category_id',
        'zone_id',
        'city_id',
        'limit_loan_day',
        'cobon',
        'mandub_id',
        'currency_id',
        'price_type_id'
      ].includes(name) ? Number(value) : value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    const dataToSubmit = {
      ...formData,
      category_id: Number(formData.category_id) || 0,
      zone_id: Number(formData.zone_id) || 0,
      city_id: Number(formData.city_id) || 0,
      mandub_id: Number(formData.mandub_id) || 0,
      limit_loan_price: formData.limit_loan_price ? parseFloat(formData.limit_loan_price) : 0,
      limit_loan_day: formData.limit_loan_day ? parseInt(formData.limit_loan_day, 10) : 0,
      cobon: formData.cobon ? parseInt(formData.cobon, 10) : 0,
      latitude: formData.latitude ?? 0,
      longitude: formData.longitude ?? 0,
      currency_id: Number(formData.currency_id) || 0,
      price_type_id: Number(formData.price_type_id) || 0,
    };



    const request = id
      ? axiosInstance.put(`/customer/update/${id}`, dataToSubmit)
      : axiosInstance.post('/customer/store', dataToSubmit);

    request
      .then((response) => {
        if (
          response.data.success ||
          response.status === 200 ||
          response.status === 201
        ) {
          setSnackbarMessage(id ? 'زانیاری کڕیار نوێکرایەوە' : 'کڕیاری نوێ زیادکرا');
          setSnackbarOpen(true);

          if (!id) {
            resetForm(setFormData, initialFormData);
            setFormErrors({});
          } else {
            navigate('/customer');
          }
        } else {
          setError(response.data.message || 'هەڵە ڕوویدا لە تۆمارکردنی کڕیار.');
        }
      })
      .catch((error) => {
         setError(
            error.response?.data?.error || // <-- use .error for backend validation
            error.response?.data?.message || // fallback to .message
            error.message ||
            'هەڵە ڕوویدا لە تۆمارکردنی کڕیار.'
          );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Handle form cancel/close
  const handleClose = () => {
    navigate('/customer');
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
                {id ? 'گۆڕینی زانیاری کڕیار' : 'زانیاری کڕیار'}
              </Typography>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>

            <form onSubmit={handleSubmit}>


            <Grid container spacing={2} sx={{ p: 2 }}>

                    {/* Group 1: Location Info */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="گرووپ"
                        name="category_id"
                        select
                        value={formData.category_id}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.category_id}
                        helperText={formErrors.category_id}
                       
                      >
                        <MenuItem value={0}>هەڵبژێرە</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="زون"
                        name="zone_id"
                        select
                        value={formData.zone_id}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.zone_id}
                        helperText={formErrors.zone_id}
                       
                      >
                        <MenuItem value={0}>هەڵبژێرە</MenuItem>
                        {zones.map((zone) => (
                          <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="مەندووب"
                        name="mandub_id"
                        select
                    value={formData.mandub_id || 0}
                    onChange={handleChangeWithErrorReset}
                    error={!!formErrors.mandub_id}
                    helperText={formErrors.mandub_id}
                  >
                    <MenuItem value={0}>مەندووب</MenuItem>
                    {mandubs.map((m) => (
                      <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="شار"
                        name="city_id"
                        select
                        value={formData.city_id}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.city_id}
                        helperText={formErrors.city_id}
                       
                      >
                        <MenuItem value={0}>هەڵبژێرە</MenuItem>
                        {cities.map((city) => (
                          <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* Group 2: Basic Info */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="کۆد"
                        name="code"
                        value={formData.code}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.code}
                        helperText={formErrors.code}
                     
                        InputProps={{
                          endAdornment: formData.code && (
                            <InputAdornment position="end">
                              <IconButton onClick={() => clearTextField(setFormData, 'code')} edge="end">
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
                        label="ناو"
                        name="name"
                        value={formData.name}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                       
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
                      <TextField
                        fullWidth
                        label="جۆری مامەڵە"
                        name="type"
                        select
                        value={formData.type}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.type}
                        helperText={formErrors.type}
                        required
                       
                      >
                        <MenuItem value="هەردووکی">هەردووکی</MenuItem>
                        <MenuItem value="کڕین">کڕین</MenuItem>
                        <MenuItem value="فرۆشتن">فرۆشتن</MenuItem>
                      </TextField>
                    </Grid>

                    {/* Group 3: Contact Info */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="مۆبایلی١"
                        name="phone_1"
                        value={formData.phone_1}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.phone_1}
                        helperText={formErrors.phone_1}
                       
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
                      <TextField
                        fullWidth
                        label="مۆبایلی٢"
                        name="phone_2"
                        value={formData.phone_2}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.phone_2}
                        helperText={formErrors.phone_2}
                     
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
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="ناونیشان"
                        name="address"
                        value={formData.address}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.address}
                        helperText={formErrors.address}
                       
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

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="دراو"
                      name="currency_id"
                      select
                      value={formData.currency_id || 0}
                      onChange={handleChangeWithErrorReset}
                      error={!!formErrors.currency_id}
                      helperText={formErrors.currency_id}
                    >
                      <MenuItem value={0}>دراو</MenuItem>
                      {(currencies || []).map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="جۆری نرخ"
                      name="price_type_id"
                      select
                      value={Number(formData.price_type_id) || 0}
                      onChange={handleChangeWithErrorReset}
                      error={!!formErrors.price_type_id}
                      helperText={formErrors.price_type_id}
                    >
                      <MenuItem value={0}>جۆری نرخ</MenuItem>
                      {(priceTypes || []).map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                    {/* Group 4: Loan Fields */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="حاڵەت"
                        name="state"
                        select
                        value={formData.state}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.state}
                        helperText={formErrors.state}
                       
                      >
                        <MenuItem value="چالاک">چالاک</MenuItem>
                        <MenuItem value="ناچالاک">ناچالاک</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="مۆڵەتی قەرز"
                        name="limit_loan_day"
                        value={formData.limit_loan_day}
                        onChange={(e) => handleChangeNumber(e, setFormData, setFormErrors)}
                        error={!!formErrors.limit_loan_day}
                        helperText={formErrors.limit_loan_day}
                      
                        InputProps={{
                          endAdornment: formData.limit_loan_day && (
                            <InputAdornment position="end">
                              <IconButton onClick={() => clearTextField(setFormData, 'limit_loan_day')} edge="end">
                                <ClearIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="سنوری قەرز"
                        name="limit_loan_price"
                        value={formData.limit_loan_price}
                        onChange={(e) => handleChangeNumber(e, setFormData, setFormErrors)}
                        error={!!formErrors.limit_loan_price}
                        helperText={formErrors.limit_loan_price}
                     
                        InputProps={{
                          endAdornment: formData.limit_loan_price && (
                            <InputAdornment position="end">
                              <IconButton onClick={() => clearTextField(setFormData, 'limit_loan_price')} edge="end">
                                <ClearIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* Group 5: Cobon & Guarantor */}
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="کۆبۆن"
                        name="cobon"
                        value={formData.cobon}
                        onChange={(e) => handleChangeNumber(e, setFormData, setFormErrors)}
                        error={!!formErrors.cobon}
                        helperText={formErrors.cobon}
                      
                        InputProps={{
                          endAdornment: formData.cobon && (
                            <InputAdornment position="end">
                              <IconButton onClick={() => clearTextField(setFormData, 'cobon')} edge="end">
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
                        label="ناوی کەفیل"
                        name="kafyl_name"
                        value={formData.kafyl_name}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.kafyl_name}
                        helperText={formErrors.kafyl_name}
                       
                        InputProps={{
                          endAdornment: formData.kafyl_name && (
                            <InputAdornment position="end">
                              <IconButton onClick={() => clearTextField(setFormData, 'kafyl_name')} edge="end">
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
                        label="مۆبایلی کەفیل"
                        name="kafyl_phone"
                        value={formData.kafyl_phone}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.kafyl_phone}
                        helperText={formErrors.kafyl_phone}
                  
                        InputProps={{
                          endAdornment: formData.kafyl_phone && (
                            <InputAdornment position="end">
                              <IconButton onClick={() => clearTextField(setFormData, 'kafyl_phone')} edge="end">
                                <ClearIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* Note */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="تێبینی"
                        name="note"
                        value={formData.note}
                        onChange={handleChangeWithErrorReset}
                        error={!!formErrors.note}
                        helperText={formErrors.note}
                        multiline
                        rows={2}
                    
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

                    {/* GPS & Location */}
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="contained"
                        color="info"
                        onClick={() => setMapOpen(true)}
                       
                      >
                        شوێن دیاری بکە (GPS)
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Latitude"
                        name="latitude"
                        value={formData.latitude}
                        disabled
                   
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Longitude"
                        name="longitude"
                        value={formData.longitude}
                        disabled
                       
                      />
                    </Grid>
                  </Grid>



              <Box marginTop={2}>
                <Grid container spacing={2}>
                  <Grid item xs={9}>
                    <RegisterButton
                      loading={loading}
                      fullWidth
                      children={id ? 'نوێکردنەوە' : 'تۆمارکردن'}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <ClearButton
                      onClick={() => { resetForm(setFormData, initialFormData); setFormErrors({}); }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>
            </form>
          </Box>
        </Card>
      </Box>

      {/* Map Modal for Location Selection */}
      <CustomerLocationMap
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onLocationSelect={handleLocationSelect}
      />

      {/* Snackbar for Success Message */}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      {/* Error Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default CustomerRegister;