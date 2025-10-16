import React, { useState, useEffect } from 'react';
import axiosInstance from '../../components/service/axiosInstance';
import {
  Card,
  Typography,
  Box,
  TextField,
  Button,
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
  Paper,
  Pagination,
  MenuItem,
  Tooltip,
  Avatar,FormControlLabel,Checkbox
} from '@mui/material';
import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import { BASE_URL } from '../../config/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';


function UserManagment({ isDrawerOpen }) {

 const initialFormData = {
  name: '',
  username: '',
  phone: '',
  image: '',
  branch_id: '',
  password: '',
  is_system_user: 0,
  is_agent: 0,
  search: '',
  salary: 0
};


  const rowsPerPage = 5;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  const [fetching, setFetching] = useState(false);

  const [imageFile, setImageFile] = useState(null);

    // Handle image file selection and preview
    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData((prev) => ({
            ...prev,
            image: e.target.result, // base64 for preview
          }));
        };
        reader.readAsDataURL(file);
      }
    };


    

    // Clear image
    const handleClearImage = () => {
      setImageFile(null);
      setFormData((prev) => ({ ...prev, image: '' }));
    };

        const handleSystemUserCheckbox = (e) => {
      const checked = e.target.checked;
      setFormData((prev) => ({
        ...prev,
        is_system_user: checked ? 1 : 0,
        password: checked ? prev.password : '', // Clear password if unchecked
      }));
      setFormErrors((prev) => ({
        ...prev,
        password: '', // Clear password error when toggling
      }));
};

function formatNumberWithCommas(value) {
  if (!value) return '';
  const parts = value.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

 const handleChangeWithErrorReset = (e) => {
  setErrorMessage('');
  setFormErrors((prev) => ({ ...prev, [e.target.name]: '' }));

  // Special handling for salary field
  if (e.target.name === 'salary') {
    // Remove commas for storing the raw value
    const rawValue = e.target.value.replace(/,/g, '');
    // Only allow numbers and decimals
    if (!/^\d*\.?\d*$/.test(rawValue)) return;
    setFormData((prev) => ({ ...prev, salary: rawValue }));
  } else {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }
};


  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setFetching(true);
    try {
      const [branchRes, userRes] = await Promise.all([
        axiosInstance.get('/branch/index'),
        axiosInstance.get('/user/index'),
      ]);
      setBranches(branchRes.data || []);
      setUsers(userRes.data || []);
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتا');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const errors = {};
    if (!formData.name.trim()) errors.name = 'ناوی کارمەند پێویستە';
    if (!formData.username.trim()) errors.username = 'ناوی بەکارهێنان پێویستە';
    if (!formData.phone.trim()) errors.phone = 'ژمارەی تەلەفۆن پێویستە';
    if (!formData.branch_id) errors.branch_id = 'لق دیاری بکە';
   // Only require password if is_system_user is checked and (on create or changing password)
    if (formData.is_system_user && !formData.password.trim() && !selectedUserId) {
      errors.password = 'وشەی نهێنی پێویستە';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

     try {
    let payload;
    let config = {};
    if (imageFile) {
      payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'image') payload.append(key, value);
      });
      payload.append('image', imageFile);
      config.headers = { 'Content-Type': 'multipart/form-data' };
    } else {
      payload = { ...formData };
    }

    if (selectedUserId && !formData.password) {
      if (payload instanceof FormData) {
        payload.delete('password');
      } else {
        delete payload.password;
      }
    }

    const response = selectedUserId
      ? await axiosInstance.put(`/user/update/${selectedUserId}`, payload, config)
      : await axiosInstance.post('/user/store', payload, config);

    if (response.status === 200 || response.status === 201) {
      setSuccess(true);
      setErrorMessage('');
      setFormData(initialFormData);
      setImageFile(null);
      setSelectedUserId(null);
      setFormErrors({});
    
      fetchAllData();

    }
    // ...rest of your logic...
  }catch (error) {
  if (error.response && error.response.data && error.response.data.error) {
    setErrorMessage(error.response.data.error);
  } else {
    setErrorMessage('هەڵە ڕوویدا لە تۆمارکردن');
  }
} finally {
    setLoading(false);
  }
  };

const handleEditClick = async (user) => {
  setSelectedUserId(user.id);
  setFormErrors({});
  setLoading(true);
  try {
    const response = await axiosInstance.get(`/user/show/${user.id}`); 
    const data = response.data;
    setFormData({
      name: data.name || '',
      username: data.username || '',
      phone: data.phone || '',
      image: data.image || '',
      branch_id: data.branch_id || '',
      password: '',
      is_system_user: Number(data.is_system_user) || 0, // Always a number
      is_agent: Number(data.is_agent) || 0,
      salary: data.salary !== undefined ? data.salary : 0, // <-- Add this line

    });
  } catch (error) {
    setErrorMessage('هەڵە ڕوویدا لە دۆزینەوەی زانیاری');
  } finally {
    setLoading(false);
  }
};

  const handleDeleteClick = (id) => {
    setSelectedUserId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
  try {
    const response = await axiosInstance.delete(`/user/delete/${selectedUserId}`);

    if ([200, 201, 204].includes(response.status)) {
      setUsers((prev) => prev.filter((user) => user.id !== selectedUserId));
      setOpenDialog(false);
      setSuccess(true);
      setErrorMessage('');
      setFormData(initialFormData);
      setImageFile(null);
      setSelectedUserId(null);
      setFormErrors({});
      fetchAllData();
    }
  } catch (error) {
    setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    console.error('Delete error:', error);
  }
};


const handleSearchChange = async (e) => {
  const value = e.target.value;
  setFormData((prev) => ({ ...prev, search: value }));

  if (!value.trim()) {
    fetchAllData();
    return;
  }

  setFetching(true);
  try {
    const response = await axiosInstance.get('/user/filter', {
      params: {
        search: value,
      },
    });

    setUsers(response.status === 200 ? response.data : []);
  } catch (error) {
    console.error('Search error:', error);
    setErrorMessage('هەڵە ڕوویدا لە گەڕان');
  } finally {
    setFetching(false);
  }
};


  const currentUsers = users.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePageChange = (_, value) => setCurrentPage(value);
  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);


  const clearSelectField = (field) => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
    setFormErrors((prevErrors) => ({ ...prevErrors, [field]: '' }));
  };

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ margin: 1, padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedUserId ? 'گۆڕینی بەکارهێنەر' : 'زیادکردنی بەکارهێنەر'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="ناوی تەواوی کارمەند"
                name="name"
                value={formData.name}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.name}
                helperText={formErrors.name}
                sx={{ mb: 2 }}
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

              <TextField
                fullWidth
                label="ناوی بەکارهێنەر"
                name="username"
                value={formData.username}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.username}
                helperText={formErrors.username}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.username && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('username')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="ژمارەی تەلەفۆن"
                name="phone"
                value={formData.phone}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.phone && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('phone')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

             <TextField
                fullWidth
                label="مووچە"
                name="salary"
                type="text"
                value={formatNumberWithCommas(formData.salary)}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
              />

           

              <TextField
                select
                fullWidth
                label="لق"
                name="branch_id"
                value={formData.branch_id}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.branch_id}
                helperText={formErrors.branch_id}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.branch_id && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('branch_id')}>
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!formData.is_agent}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        is_agent: e.target.checked ? 1 : 0
                      }))}
                      name="is_agent"
                      color="primary"
                    />
                  }
                  label="بتوانێت وەک مەندووب کار بکات"
                />

               <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!formData.is_system_user}
                      onChange={handleSystemUserCheckbox}
                      name="is_system_user"
                      color="primary"
                    />
                  }
                  label="بتوانێت سیستەم بەکاربهێنێت"
                />

              {formData.is_system_user ? (
  <TextField
    fullWidth
    label="وشەی نهێنی"
    name="password"
    type="password"
    value={formData.password}
    onChange={handleChangeWithErrorReset}
    error={!!formErrors.password}
    helperText={
      selectedUserId
        ? 'بۆ گۆڕینی وشەی نهێنی نوێ بنووسە، بەتاڵ جێبهێڵە بۆ نەگۆڕین.'
        : formErrors.password
    }
    sx={{ mb: 2 }}
    InputProps={{
      endAdornment: formData.password && (
        <InputAdornment position="end">
          <IconButton onClick={() => clearSelectField('password')}>
            <ClearIcon />
          </IconButton>
        </InputAdornment>
      ),
    }}
  />
) : null}

               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button variant="contained" component="label">
                هەڵبژاردنی وێنە
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
             <Avatar
                  src={
                    formData.image
                      ? formData.image.startsWith('http') || formData.image.startsWith('data:')
                        ? formData.image
                        : `${BASE_URL}${formData.image}`
                      : ''
                  }
                  alt="User"
                  sx={{ width: 56, height: 56 }}
                />
              {formData.image && (
                <IconButton onClick={handleClearImage}>
                  <ClearIcon />
                </IconButton>
              )}
            </Box>

              <Button type="submit" fullWidth variant="contained" color="success" disabled={loading}>
                {loading ? 'Loading...' : selectedUserId ? 'نوێکردنەوە' : 'تۆمارکردن'}
              </Button>
            </form>
          </Card>
        </Grid>

        {/* Table Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ margin: 1, padding: 2 }}>
          <TextField
              fullWidth
              label="گەڕان"
              name="search"
              value={formData.search || ''}
              onChange={handleSearchChange}
              placeholder="ناو، ناوی بەکارهێنەر ژمارەی تەلەفۆن،لق..."
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {formData.search && (
                      <Tooltip title="پاککردنەوە">
                        <IconButton
                          onClick={() =>
                            handleSearchChange({ target: { name: 'search', value: '' } })
                          }
                        >
                          <ClearIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="هەموو داتاکان">
                      <IconButton onClick={fetchAllData}>
                        <SearchIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>وێنە</TableCell>
                    <TableCell>ناو</TableCell>
                    <TableCell>ناوی بەکارهێنەر</TableCell>
                    <TableCell>ژمارەی تەلەفۆن</TableCell>
                    <TableCell>مووچە</TableCell>
                    <TableCell>مەندووب</TableCell>

                    <TableCell>لق</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fetching ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  ) : currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                       <TableCell>
                        {user.image ? (
                          <Avatar src={`${BASE_URL}${user.image}`} alt={user.name} />
                        ) : (
                          <Avatar>{user.name?.charAt(0) || '?'}</Avatar>
                        )}
                      </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>
                          {formatNumberWithCommas(Number(user.salary).toFixed(0))}
                        </TableCell>
                       <TableCell>
                            <span style={{ color: user.is_agent ? 'green' : 'inherit', fontWeight: user.is_agent ? 'bold' : 'normal' }}>
                              {user.is_agent ? 'بەڵێ' : 'نەخێر'}
                            </span>
                          </TableCell>
                        <TableCell>
                          {branches.find((b) => b.id === user.branch_id)?.name || user.branch_id}
                        </TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(user)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(user.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        {formData.search
                          ? "هیچ بەکارهێنەرێک بە گەڕانەکەت نەدۆزرایەوە"
                          : "هیچ بەکارهێنەرێک نەدۆزرایەوە"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="center">
              {users.length > 0 && (
                <Pagination
                  count={Math.ceil(users.length / rowsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Dialog */}
     <ConfirmDialog
        open={openDialog}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی بەکارهێنەر"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* Snackbars */}
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

export default UserManagment;