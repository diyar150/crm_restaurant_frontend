import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, IconButton
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axiosInstance from '../../components/service/axiosInstance';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ItemPriceModal = ({
  open,
  onClose,
  item,
  priceTypes,
  units
}) => {
  const [itemPrices, setItemPrices] = useState([]);
  const [priceForm, setPriceForm] = useState({ id: null, price_type_id: '', unit_id: '', price: '' });
  const [priceFormErrors, setPriceFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && item) {
      fetchItemPrices();
      setPriceForm({ id: null, price_type_id: '', unit_id: '', price: '' });
      setPriceFormErrors({});
    }
    // eslint-disable-next-line
  }, [open, item]);

  const fetchItemPrices = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/item-price/index?item_id=${item.id}`);
      setItemPrices(res.data || []);
    } catch {
      setItemPrices([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceFormChange = (e) => {
    const { name, value } = e.target;
    setPriceFormErrors(prev => ({ ...prev, [name]: '' }));
    setPriceForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceEdit = (row) => {
    setPriceForm({
      id: row.id,
      price_type_id: row.price_type_id,
      unit_id: row.unit_id,
      price: row.price
    });
    setPriceFormErrors({});
  };

  const handlePriceDelete = async (id) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/item-price/delete/${id}`);
      setItemPrices(prev => prev.filter(p => p.id !== id));
    } catch {}
    setLoading(false);
  };

  const handlePriceFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!priceForm.price_type_id) errors.price_type_id = 'جۆری نرخ پێویستە';
    if (!priceForm.unit_id) errors.unit_id = 'یەکە پێویستە';
    if (priceForm.price === '' || isNaN(Number(priceForm.price))) errors.price = 'نرخ پێویستە';

    setPriceFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      if (priceForm.id) {
        await axiosInstance.put(`/item-price/update/${priceForm.id}`, {
          item_id: item.id,
          ...priceForm
        });
      } else {
        await axiosInstance.post('/item-price/store', {
          item_id: item.id,
          ...priceForm
        });
      }
      fetchItemPrices();
      setPriceForm({ id: null, price_type_id: '', unit_id: '', price: '' });
    } catch {}
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>ناو: {item?.name}</DialogTitle>
      <DialogContent>
        <form onSubmit={handlePriceFormSubmit}>
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <TextField
                select
                fullWidth
                label="جۆری نرخ"
                name="price_type_id"
                value={priceForm.price_type_id}
                onChange={handlePriceFormChange}
                error={!!priceFormErrors.price_type_id}
                helperText={priceFormErrors.price_type_id}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">هیچ</MenuItem>
                {priceTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                select
                fullWidth
                label="یەکە"
                name="unit_id"
                value={priceForm.unit_id}
                onChange={handlePriceFormChange}
                error={!!priceFormErrors.unit_id}
                helperText={priceFormErrors.unit_id}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">هیچ</MenuItem>
                {units.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>{unit.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="نرخ"
                name="price"
                type="number"
                value={priceForm.price}
                onChange={handlePriceFormChange}
                error={!!priceFormErrors.price}
                helperText={priceFormErrors.price}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
          <DialogActions>
            <Button onClick={onClose}>داخستن</Button>
            <Button type="submit" variant="contained" color="success" disabled={loading}>
              {priceForm.id ? 'نوێکردنەوە' : 'تۆمارکردن'}
            </Button>
          </DialogActions>
        </form>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>جۆری نرخ</TableCell>
                <TableCell>یەکە</TableCell>
                <TableCell>نرخ</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
               {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                  </TableCell>
                </TableRow>
              ) : itemPrices.length > 0 ? (
                itemPrices.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{priceTypes.find(p => p.id === row.price_type_id)?.name || row.price_type_id}</TableCell>
                    <TableCell>{units.find(u => u.id === row.unit_id)?.name || row.unit_id}</TableCell>
                    <TableCell>{row.price}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handlePriceEdit(row)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="secondary" onClick={() => handlePriceDelete(row.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    هیچ نرخێک نەدۆزرایەوە
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

export default ItemPriceModal;