import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, Typography, TextField, Button, IconButton, InputAdornment,
  Snackbar, Alert, Table, TableHead, TableRow, TableFooter,
  TableCell, TableBody, TableContainer, Paper, Pagination, MenuItem, Avatar
} from '@mui/material';
import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PriceCheck as PriceIcon,
  Warehouse as WarehouseIcon
} from '@mui/icons-material';
import TableSortLabel from '@mui/material/TableSortLabel';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import axiosInstance from '../../components/service/axiosInstance';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ReportButton from '../../components/common/ReportButton';
import ItemPriceModal from './ItemPriceModal';
import ItemQuantityModal from './ItemQuantityModal';
import DialogPdf from '../../components/utils/DialogPdf';
import ItemInfoPDF from '../../components/reports/item/ItemInfoPDF';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { BASE_URL } from '../../config/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';


function ItemManagment({ isDrawerOpen }) {
  // --- State ---
  const initialFormData = {
    name: '',
    description: '',
    category_id: '',
    brand_id: '',
    cost: '',
    barcode: '',
    isService: 0,
    image: '',
    allow_zero_sell: 1,
    search: '',
  };
  const rowsPerPage = 10;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceModalItem, setPriceModalItem] = useState(null);
  const [priceTypes, setPriceTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [quantityModalItem, setQuantityModalItem] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterBrandId, setFilterBrandId] = useState('');
  const [filterIsService, setFilterIsService] = useState('');
  const [filterBarcode, setFilterBarcode] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalCount, setTotalCount] = useState(0);
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const [reportItems, setReportItems] = useState([]);
  const { company, fetchCompanyInfo } = useCompanyInfo();

  // --- Effects ---
  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchBrands();
    fetchPriceTypes();
    fetchUnits();
    fetchWarehouses();
    fetchCompanyInfo();
    // eslint-disable-next-line
  }, [filterCategoryId, filterBrandId, filterIsService, filterBarcode, formData.search, currentPage, sortBy, sortOrder]);

  // --- Data Fetching ---
  const fetchItems = async (
    page = currentPage,
    pageSize = rowsPerPage,
    sortField = sortBy,
    sortDirection = sortOrder
  ) => {
    setFetching(true);
    try {
      const params = {
        page,
        pageSize,
        sortBy: sortField,
        sortOrder: sortDirection,
        category_id: filterCategoryId,
        brand_id: filterBrandId,
        isService: filterIsService,
        barcode: filterBarcode,
        name: formData.search,
      };
      const res = await axiosInstance.get('/item/filter', { params });
      setItems(res.data.results || []);
      setTotalCount(res.data.total || 0);
    } catch {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتا');
    } finally {
      setFetching(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get('/item-category/index');
      setCategories(res.data || []);
    } catch {}
  };

  const fetchBrands = async () => {
    try {
      const res = await axiosInstance.get('/item-brand/index');
      setBrands(res.data || []);
    } catch {}
  };

  const fetchPriceTypes = async () => {
    const res = await axiosInstance.get('/item-price-type/index');
    setPriceTypes(res.data || []);
  };

  const fetchUnits = async () => {
    const res = await axiosInstance.get('/item-unit/index');
    setUnits(res.data || []);
  };

  const fetchWarehouses = async () => {
    const res = await axiosInstance.get('/warehouse/index');
    setWarehouses(res.data || []);
  };



  // --- Handlers: Form ---
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          image: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const handleChangeWithErrorReset = (e) => {
    const { name, value } = e.target;
    setErrorMessage('');
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'allow_zero_sell' || name === 'isService') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const clearSelectField = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    const errors = {};
    if (!formData.name.trim()) errors.name = 'ناوی کاڵا پێویستە';
    if (!formData.cost) errors.cost = 'نرخی کاڵا پێویستە';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }
    try {
      const cleanFormData = { ...formData };
      if (!cleanFormData.barcode || cleanFormData.barcode.trim() === '') {
        cleanFormData.barcode = null;
      }
      let payload;
      let config = {};
      if (imageFile) {
        payload = new FormData();
        Object.entries(cleanFormData).forEach(([key, value]) => {
          if (key !== 'image') payload.append(key, value);
        });
        payload.append('image', imageFile);
        config.headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        payload = { ...cleanFormData };
        if (selectedItemId && cleanFormData.image) {
          payload.image_url = cleanFormData.image;
        }
      }
      if (selectedItemId) {
        if (!imageFile && payload instanceof FormData) {
          payload.delete('image');
        }
      }
      let response;
      if (selectedItemId) {
        response = await axiosInstance.put(`/item/update/${selectedItemId}`, payload, config);
      } else {
        response = await axiosInstance.post('/item/store', payload, config);
      }
      if ([200, 201].includes(response.status)) {
        fetchItems();
        setSuccess(true);
        setFormData(initialFormData);
        setImageFile(null);
        setSelectedItemId(null);
        setFormErrors({});
      } else {
        setErrorMessage(response.data.message || 'هەڵە ڕوویدا');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error || 'هەڵە ڕوویدا لە تۆمارکردن'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setSelectedItemId(item.id);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      category_id: item.category_id || '',
      brand_id: item.brand_id || '',
      cost: item.cost || '',
      barcode: item.barcode || '',
      isService: item.isService || 0,
      image: item.image_url || '',
      allow_zero_sell: item.allow_zero_sell !== undefined ? Number(item.allow_zero_sell) : 1,
      search: '',
    });
    setImageFile(null);
    setFormErrors({});
  };

  // --- Handlers: Table, Modals, Delete ---
  const handlePriceClick = (itemId) => {
    setPriceModalItem(items.find(i => i.id === itemId));
    setPriceModalOpen(true);
  };
  const handlePriceModalClose = () => {
    setPriceModalOpen(false);
    setPriceModalItem(null);
  };

  const handleItemWarehouseClick = (itemId) => {
    setQuantityModalItem(items.find(i => i.id === itemId));
    setQuantityModalOpen(true);
  };
  const handleQuantityModalClose = () => {
    setQuantityModalOpen(false);
    setQuantityModalItem(null);
  };

  const handleDeleteClick = (id) => {
    setSelectedItemId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/item/delete/${selectedItemId}`);
      setItems(prev => prev.filter(i => i.id !== selectedItemId));
      setSuccess(true);
    } catch {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    } finally {
      setOpenDialog(false);
      setSelectedItemId(null);
    }
  };

  // --- Handlers: Filtering, Sorting, Pagination ---
  const handleSearchChange = (e) => {
    setFormData(prev => ({ ...prev, search: e.target.value }));
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortBy(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const handlePageChange = (_, value) => setCurrentPage(value);

  // --- Snackbar & Dialog ---
  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);

  // --- Filtering Controls ---
  const filterControls = (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          select
          fullWidth
          label="گرووپ"
          value={filterCategoryId}
          onChange={e => { setFilterCategoryId(e.target.value); setCurrentPage(1); }}
        >
          <MenuItem value="">هەموو گرووپەکان</MenuItem>
          {categories.map(cat => (
            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          select
          fullWidth
          label="براند"
          value={filterBrandId}
          onChange={e => { setFilterBrandId(e.target.value); setCurrentPage(1); }}
        >
          <MenuItem value="">هەموو براندەکان</MenuItem>
          {brands.map(brand => (
            <MenuItem key={brand.id} value={brand.id}>{brand.name}</MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          select
          fullWidth
          label="جۆر"
          value={filterIsService}
          onChange={e => { setFilterIsService(e.target.value); setCurrentPage(1); }}
        >
          <MenuItem value="">هەموو</MenuItem>
          <MenuItem value={0}>کاڵا</MenuItem>
          <MenuItem value={1}>خزمەتگوزاری</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="بارکۆد"
          value={filterBarcode}
          onChange={e => { setFilterBarcode(e.target.value); setCurrentPage(1); }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="ناو"
          name="search"
          value={formData.search}
          onChange={handleSearchChange}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
        <ReportButton
      onClick={async () => {
        const params = {
          category_id: filterCategoryId,
          brand_id: filterBrandId,
          isService: filterIsService,
          barcode: filterBarcode,
          name: formData.search,
          sortBy,
          sortOrder,
          page: 1,
          pageSize: 10000
        };
        const res = await axiosInstance.get('/item/filter', { params });
        setReportItems(res.data.results || []);
        setOpenPdfPreview(true);
      }}
      fullWidth
    >
      ڕاپۆرت
    </ReportButton>
      </Grid>
    </Grid>
  );

  // --- Render ---
  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ m: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedItemId ? 'گۆڕینی کاڵا' : 'زیادکردنی کاڵا'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                select
                fullWidth
                label="گرووپ"
                name="category_id"
                value={formData.category_id}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">هیچ</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                label="براند"
                name="brand_id"
                value={formData.brand_id}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">هیچ</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand.id} value={brand.id}>{brand.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="بارکۆد"
                name="barcode"
                value={formData.barcode}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.barcode && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('barcode')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="ناوی کاڵا"
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
                label="نرخ(بچوکترین یەکە)"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.cost}
                helperText={formErrors.cost}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.cost && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('cost')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="جۆری کاڵا"
                    name="isService"
                    value={formData.isService}
                    onChange={handleChangeWithErrorReset}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value={0}>کاڵا</MenuItem>
                    <MenuItem value={1}>خزمەتگوزاری</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="ڕێگە بە فرۆشتنی سفرە"
                    name="allow_zero_sell"
                    value={formData.allow_zero_sell}
                    onChange={handleChangeWithErrorReset}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value={1}>بەڵێ</MenuItem>
                    <MenuItem value={0}>نەخێر</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="وەسف"
                name="description"
                value={formData.description}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
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
                  alt="Item"
                  sx={{ width: 56, height: 56 }}
                />
                {formData.image && (
                  <IconButton onClick={handleClearImage}>
                    <ClearIcon />
                  </IconButton>
                )}
              </Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={9}>
                   <RegisterButton
                        loading={loading}
                        onClick={handleSubmit}
                        fullWidth
                      >
                        {selectedItemId ? 'نوێکردنەوە' : 'تۆمارکردن'}
                      </RegisterButton>
                </Grid>
                <Grid item xs={3}>
                   <ClearButton
                          onClick={() => {
                            setFormData(initialFormData);
                            setFormErrors({});
                            setSelectedItemId(null);
                            setErrorMessage('');
                            setImageFile(null);
                            setFilterCategoryId('');
                            setFilterBrandId('');
                            setFilterIsService('');
                            setFilterBarcode('');
                            setCurrentPage(1);
                            fetchItems(1, rowsPerPage, sortBy, sortOrder);
                          }}
                          fullWidth
                        />
                </Grid>
              </Grid>
            </form>
          </Card>
        </Grid>
        {/* Table Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ m: 1, p: 2 }}>
            {filterControls}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'id'} direction={sortBy === 'id' ? sortOrder : 'asc'} onClick={() => handleSort('id')}>#</TableSortLabel>
                    </TableCell>
                    <TableCell>وێنە</TableCell>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'name'} direction={sortBy === 'name' ? sortOrder : 'asc'} onClick={() => handleSort('name')}>ناوی کاڵا</TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'category_id'} direction={sortBy === 'category_id' ? sortOrder : 'asc'} onClick={() => handleSort('category_id')}>گرووپ</TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'brand_id'} direction={sortBy === 'brand_id' ? sortOrder : 'asc'} onClick={() => handleSort('brand_id')}>براند</TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'barcode'} direction={sortBy === 'barcode' ? sortOrder : 'asc'} onClick={() => handleSort('barcode')}>بارکۆد</TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'cost'} direction={sortBy === 'cost' ? sortOrder : 'asc'} onClick={() => handleSort('cost')}>نرخ</TableSortLabel>
                    </TableCell>
                    <TableCell>جۆر</TableCell>
                    <TableCell>سفر ڕێگەبدات</TableCell>
                    <TableCell>نرخی فرۆشتن</TableCell>
                    <TableCell>کۆگا</TableCell>
                    <TableCell>ئیش</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                    {fetching ? (
                    <TableRow>
                      <TableCell colSpan={12} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  ) : items.length > 0 ? (
                    items.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>
                          {item.image_url ? (
                            <Avatar
                              src={
                                item.image_url.startsWith('http')
                                  ? item.image_url
                                  : `${BASE_URL}${item.image_url}`
                              }
                              alt={item.name}
                            />
                          ) : (
                            <Avatar>{item.name?.charAt(0) || '?'}</Avatar>
                          )}
                        </TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          {categories.find((c) => c.id === item.category_id)?.name || item.category_id}
                        </TableCell>
                        <TableCell>
                          {brands.find((b) => b.id === item.brand_id)?.name || item.brand_id}
                        </TableCell>
                        <TableCell>{item.barcode}</TableCell>
                        <TableCell>{item.cost}</TableCell>
                        <TableCell>{item.isService ? "خزمەتگوزاری" : "کاڵا"}</TableCell>
                        <TableCell sx={{ color: Number(item.allow_zero_sell) ? 'red' : 'green' }}>
                          {Number(item.allow_zero_sell) ? "بەڵێ" : "نەخێر"}
                        </TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handlePriceClick(item.id)}>
                            <PriceIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleItemWarehouseClick(item.id)}>
                            <WarehouseIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(item)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={12} align="center">
                        {formData.search
                          ? 'هیچ کاڵایەک بە گەڕانەکەت نەدۆزرایەوە'
                          : 'هیچ کاڵایەک نەدۆزرایەوە'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>
                      ژمارەی گشتی :
                    </TableCell>
                    <TableCell colSpan={6} align="left" sx={{ fontWeight: 'bold' }}>
                      {totalCount}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
            {totalCount > rowsPerPage && (
              <Box mt={2} display="flex" justifyContent="center">
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
      {/* Modals and Dialogs */}
      <DialogPdf
        open={openPdfPreview}
        onClose={() => setOpenPdfPreview(false)}
        document={
          <ItemInfoPDF
            items={reportItems}
            categories={categories}
            brands={brands}
            company={company}
            filters={{
              category_id: filterCategoryId,
              brand_id: filterBrandId,
              barcode: filterBarcode,
              name: formData.search,
            }}
          />
        }
        fileName="item_report.pdf"
      />
      <ItemPriceModal
        open={priceModalOpen}
        onClose={handlePriceModalClose}
        item={priceModalItem}
        priceTypes={priceTypes}
        units={units}
      />
      <ItemQuantityModal
        open={quantityModalOpen}
        onClose={handleQuantityModalClose}
        item={quantityModalItem}
        warehouses={warehouses}
      />
      <ConfirmDialog
        open={openDialog}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی کاڵا"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم کاڵایە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />
      <Snackbar open={success} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity="success">جێبەجێکرا</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={4000} onClose={handleErrorSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleErrorSnackbarClose} severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
}

export default ItemManagment;