import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, TableFooter, Paper, IconButton
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axiosInstance from '../../components/service/axiosInstance';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ItemQuantityModal = ({
  open,
  onClose,
  item,
  warehouses
}) => {
  const [quantities, setQuantities] = useState([]);
  const [quantityForm, setQuantityForm] = useState({ id: null, warehouse_id: '', quantity_start: '', quantity: '' });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && item) {
      fetchQuantities();
      setQuantityForm({ id: null, warehouse_id: '', quantity_start: 0, quantity: 0 });
      setFormErrors({});
    }
    // eslint-disable-next-line
  }, [open, item]);

  const fetchQuantities = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/item-quantity/index`);
      // Filter for this item only
      setQuantities((res.data || []).filter(q => String(q.item_id) === String(item.id)));
    } catch {
      setQuantities([]);
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = quantities.reduce((sum, row) => sum + Number(row.quantity || 0), 0);


  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    setQuantityForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (row) => {
    setQuantityForm({
      id: row.id,
      warehouse_id: row.warehouse_id,
      quantity_start: row.quantity_start,
      quantity: row.quantity
    });
    setFormErrors({});
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/item-quantity/delete/${id}`);
      setQuantities(prev => prev.filter(q => q.id !== id));
    } catch {}
    setLoading(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!quantityForm.warehouse_id) errors.warehouse_id = 'کۆگا پێویستە';
    if (quantityForm.quantity === '' || isNaN(Number(quantityForm.quantity))) errors.quantity = 'بڕ پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const payload = {
        warehouse_id: quantityForm.warehouse_id,
        item_id: item.id,
        quantity_start: quantityForm.quantity_start || quantityForm.quantity,
        quantity: quantityForm.quantity,
      };
      if (quantityForm.id) {
        await axiosInstance.put(`/item-quantity/update/${quantityForm.id}`, payload);
      } else {
        await axiosInstance.post('/item-quantity/store', payload);
      }
      fetchQuantities();
      setQuantityForm({ id: null, warehouse_id: '', quantity_start: 0, quantity: 0 });
    } catch {}
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>ناو: {item?.name}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleFormSubmit}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <TextField
                select
                fullWidth
                label="کۆگا"
                name="warehouse_id"
                value={quantityForm.warehouse_id}
                onChange={handleFormChange}
                error={!!formErrors.warehouse_id}
                helperText={formErrors.warehouse_id}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">هیچ</MenuItem>
                {warehouses.map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
              disabled
                fullWidth
                label="بڕی سەرەتایی"
                name="quantity_start"
                type="number"
                value={quantityForm.quantity_start}
                onChange={handleFormChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
              disabled
                fullWidth
                label="بڕی ئێستا"
                name="quantity"
                type="number"
                value={quantityForm.quantity}
                onChange={handleFormChange}
                error={!!formErrors.quantity}
                helperText={formErrors.quantity}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
          <DialogActions>
            <Button onClick={onClose}>داخستن</Button>
            <Button type="submit" variant="contained" color="success" disabled={loading}>
              {quantityForm.id ? 'نوێکردنەوە' : 'تۆمارکردن'}
            </Button>
          </DialogActions>
        </form>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>کۆگا</TableCell>
                <TableCell>بڕی سەرەتایی</TableCell>
                <TableCell>بڕی ئێستا</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                  <TableRow>
                      <TableCell colSpan={8} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
              ) : quantities.length > 0 ? (
                quantities.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{warehouses.find(w => w.id === row.warehouse_id)?.name || row.warehouse_id}</TableCell>
                    <TableCell>{row.quantity_start}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleEdit(row)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="secondary" onClick={() => handleDelete(row.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    هیچ بڕێک نەدۆزرایەوە
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
             <TableFooter>
              <TableRow>
               <TableCell colSpan={3} align="right"><b>کۆی گشتی</b></TableCell>
                <TableCell colSpan={2}><b>{totalQuantity}</b></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

export default ItemQuantityModal;