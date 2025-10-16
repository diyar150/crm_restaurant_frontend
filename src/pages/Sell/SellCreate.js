import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Card, Typography, Grid, TextField, MenuItem, Divider,
  IconButton, Snackbar, Alert,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CustomerAutocomplete from '../../components/Autocomplete/CustomerAutocomplete';
import ItemAutocomplete from '../../components/Autocomplete/ItemAutocomplete';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ReportButton from '../../components/common/ReportButton';
import axiosInstance from '../../components/service/axiosInstance';
import { getCurrentUserId } from '../Authentication/auth';
import { formatNumberWithCommas } from '../../components/utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import TransportLaborDialog from '../../components/utils/TransportLaborDialog';
import DiscountDialog from '../../components/utils/DiscountDialog';
import DialogPdf from '../../components/utils/DialogPdf';
import SellInvoicePDF from '../../components/reports/sell/sellInvoicePDF';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { cleanNumber } from '../../components/utils/format';


const paymentTypes = [
  { value: 'نەقد', label: 'نەقد' },
  { value: 'قەرز', label: 'قەرز' },
  { value: 'ڕاستەوخۆ', label: 'ڕاستەوخۆ' },
];

function getQuantitySumsByUnit(items, unitsList) {
  const sums = {};
  items.forEach(item => {
    const unitId = String(item.item_unit_id);
    if (!unitId) return;
    if (!sums[unitId]) sums[unitId] = 0;
    sums[unitId] += Number(item.quantity) || 0;
  });
  return Object.entries(sums).map(([unitId, qty]) => {
    const unit = unitsList.find(u => String(u.id) === unitId);
    return {
      unitId,
      unitName: unit ? unit.name : unitId,
      quantity: qty
    };
  });
}

function SellCreate() {
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const { id } = useParams();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const { company, fetchCompanyInfo } = useCompanyInfo();
  const [currencies, setCurrencies] = useState([]);
  const [units, setUnits] = useState([]);
  const [items, setItems] = useState([]);
  const [itemUnits, setItemUnits] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [openInvoicePdf, setOpenInvoicePdf] = useState(false);
  const [pdfInvoiceId, setPdfInvoiceId] = useState(null);
  const [pdfInvoice, setPdfInvoice] = useState(null);
  const [pdfInvoiceItems, setPdfInvoiceItems] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [agents, setAgents] = useState([]);

  const [form, setForm] = useState({
    customer_id: '',
    branch_id: '',
    warehouse_id: '',
    agent_id: '',
    employee_id: getCurrentUserId() || 0,
    currency_id: '',
    exchange_rate: 1,
    type: '',
    invoice_number: '',
    invoice_date: today,
    due_date: '',
    note: '',
    items: [],
    direct_customer_name: '',      // <-- add
    direct_customer_phone: '',
    payment_type: '',
    payment_status: ''
  });

  const [itemForm, setItemForm] = useState({
    item_id: '',
    item_unit_id: '',
    quantity: '',
    unit_price: '',
    total: '',
    base_unit_price: ''
  });

  const [notePreviewOpen, setNotePreviewOpen] = useState(false);
  const wordCount = form.note.trim().split(/\s+/).filter(Boolean).length;
  const [formErrors, setFormErrors] = useState({});
  const [itemFormErrors, setItemFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingUnits, setEditingUnits] = useState([]);
  const [editingUnitsLoading, setEditingUnitsLoading] = useState(false);
  const [openTransportDialog, setOpenTransportDialog] = useState(false);
  const [openDiscountDialog, setOpenDiscountDialog] = useState(false);
  const [discountType, setDiscountType] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountResult, setDiscountResult] = useState(0);
  
  const itemAutocompleteRef = useRef();
  const itemUnitRef = useRef();
  const itemQuantityRef = useRef();
  const itemPriceRef = useRef();

  useEffect(() => {
    async function fetchData() {
      setLoadingData(true);
      try {
        const [
          itemsRes,
          unitsRes,
          currenciesRes
        ] = await Promise.all([
          axiosInstance.get('/item/index'),
          axiosInstance.get('/item-unit/index'),
          axiosInstance.get('/currency/index')
        ]);
        setItems(itemsRes.data || []);
        setUnits(unitsRes.data || []);
        setCurrencies(currenciesRes.data || []);
      } catch (err) {
        setErrorMessage('هەڵە لە دابەزاندنی زانیاری.');
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);
   useEffect(() => {
      fetchCompanyInfo();
      // eslint-disable-next-line
    }, []);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) return;
    axiosInstance
      .get(`/branch/by-user/${userId}`)
      .then(res => setBranches(res.data || []))
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
  axiosInstance.get('/user/agent')
    .then(res => setAgents(res.data || []))
    .catch(() => setAgents([]));
}, []);

  useEffect(() => {
    if (branches.length > 0 && !form.branch_id) {
      setForm(f => ({ ...f, branch_id: branches[0].id }));
    }
  }, [branches]); // eslint-disable-line

  useEffect(() => {
    if (!form.branch_id) {
      setFilteredWarehouses([]);
      setForm(f => ({ ...f, warehouse_id: '' }));
      return;
    }
    axiosInstance
      .get(`/warehouse/branch/${form.branch_id}`)
      .then(res => {
        setFilteredWarehouses(res.data || []);
        if (!res.data.some(w => w.id === form.warehouse_id)) {
          setForm(f => ({ ...f, warehouse_id: '' }));
        }
      })
      .catch(() => {
        setFilteredWarehouses([]);
        setForm(f => ({ ...f, warehouse_id: '' }));
      });
  }, [form.branch_id]); // eslint-disable-line

  useEffect(() => {
    if (filteredWarehouses.length > 0 && !form.warehouse_id) {
      setForm(f => ({ ...f, warehouse_id: filteredWarehouses[0].id }));
    }
  }, [filteredWarehouses]); // eslint-disable-line

  useEffect(() => {
    if (currencies.length > 0 && !form.currency_id && !isEditing) {
      setForm(f => ({ ...f, currency_id: currencies[0].id }));
    }
  }, [currencies, form.currency_id, isEditing]);

  useEffect(() => {
    if (
      itemUnits.length > 0 &&
      (!itemForm.item_unit_id || !itemUnits.some(u => u.id === itemForm.item_unit_id))
    ) {
      handleItemFormChange('item_unit_id', itemUnits[0].id);
    }
  }, [itemUnits]); // eslint-disable-line

  useEffect(() => {
    if (!id) return;
    setIsEditing(true);
    setLoadingData(true);
    axiosInstance.get(`/sell-invoice/show/${id}`)
      .then(async res => {
        const invoice = res.data;
        setForm(f => ({
        ...f,
        ...invoice,
        customer_id: invoice.customer_id === 0 ? '' : { id: invoice.customer_id, name: invoice.customer_name },
        branch_id: invoice.branch_id,
        warehouse_id: invoice.warehouse_id,
        employee_id: invoice.employee_id,
        currency_id: invoice.currency_id,
        exchange_rate: invoice.exchange_rate,
        type: invoice.type,
        invoice_number: invoice.invoice_number || '',
        invoice_date: invoice.invoice_date ? invoice.invoice_date.slice(0, 10) : today,
        due_date: invoice.due_date ? invoice.due_date.slice(0, 10) : '',
        note: invoice.note || '',
        payment_type: invoice.payment_type || '',
        payment_status: invoice.payment_status || '',
        items: []
      }));

           // --- ADD THIS: Sync discount info to dialog state ---
        setDiscountType(invoice.discount_type || '');
        setDiscountValue(invoice.discount_value || '');
        setDiscountResult(invoice.discount_result || 0);

        const itemsRes = await axiosInstance.get(`/sell-item/index?invoice_id=${id}`);
        setForm(f => ({
          ...f,
          items: (itemsRes.data || []).map(item => ({
            ...item,
            id: item.id,
            item_id: { id: item.item_id, name: item.item_name },
            item_unit_id: item.item_unit_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total_amount,
            base_unit_price: item.base_unit_price || item.unit_price
          }))
        }));
      })
      .catch(() => setErrorMessage('هەڵە لە دابەزاندنی وەسڵ'))
      .finally(() => setLoadingData(false));
  }, [id]); // eslint-disable-line

  const fetchExchangeRate = async (currencyId) => {
    try {
      if (!currencyId) {
        setForm(f => ({ ...f, exchange_rate: 1 }));
        return 1;
      }
      const res = await axiosInstance.get(`/currency/show/${currencyId}`);
      if (res.data && res.data.exchange_rate) {
        setForm(f => ({ ...f, exchange_rate: res.data.exchange_rate }));
        return res.data.exchange_rate;
      } else {
        setForm(f => ({ ...f, exchange_rate: 1 }));
        return 1;
      }
    } catch {
      setForm(f => ({ ...f, exchange_rate: 1 }));
      return 1;
    }
  };

  function getUnitFactor(unitId, itemId) {
    let factor = 1;
    let unit = itemUnits.find(u => u.id === unitId);
    if (!unit) {
      unit = units.find(u => u.id === unitId && (u.item_id === itemId || !u.item_id));
    }
    if (unit && unit.conversion_factor) factor = unit.conversion_factor;
    return factor;
  }

  const handleChange = e => {
    const { name, value } = e.target;

 if (name === 'type') {
    let newPaymentStatus = form.payment_status;
    setForm(f => ({
      ...f,
      type: value,
      customer_id: value === 'ڕاستەوخۆ' ? 0 : f.customer_id,
      direct_customer_name: value === 'ڕاستەوخۆ' ? f.direct_customer_name : '',
      direct_customer_phone: value === 'ڕاستەوخۆ' ? f.direct_customer_phone : '',
      payment_status: newPaymentStatus // <-- set payment_status automatically
    }));
    setFormErrors(prev => ({ ...prev, type: '' }));
    setErrorMessage('');
    return;
  }

    if (name === 'currency_id') {
      if (isEditing) {
        fetchExchangeRate(value).then(newRate => {
          setForm(f => ({
            ...f,
            currency_id: value,
            exchange_rate: newRate
          }));
        });
      } else {
        fetchExchangeRate(value).then(newRate => {
          setForm(f => ({
            ...f,
            currency_id: value,
            exchange_rate: newRate,
            items: f.items.map(item => {
              const factor = getUnitFactor(item.item_unit_id, item.item_id);
              const newUnitPrice = (item.base_unit_price || 0) * factor * newRate;
              return {
                ...item,
                unit_price: newUnitPrice,
                total: (Number(item.quantity) || 0) * newUnitPrice
              };
            })
          }));
        });
      }
      setFormErrors(prev => ({ ...prev, [name]: '' }));
      setErrorMessage('');
      return;
    }

    setForm(f => ({ ...f, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    setErrorMessage('');
  };

   const handleItemFormChange = (field, value) => {
    if (field === 'item_unit_id') {
      const selectedUnit = itemUnits.find(u => u.id === value);
      const factor = selectedUnit?.conversion_factor || 1;
      const baseCost = itemForm.base_unit_price || 0;
      const newUnitPrice = baseCost * factor * form.exchange_rate;

      setItemForm(prev => {
        const updated = { ...prev, [field]: value, unit_price: newUnitPrice };
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0);
        return updated;
      });
      setItemFormErrors(prev => ({ ...prev, [field]: '' }));
      setErrorMessage('');
      return;
    }

    setItemForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0);
      }
      return updated;
    });
    setItemFormErrors(prev => ({ ...prev, [field]: '' }));
    setErrorMessage('');
  };

  const handleItemSelect = async (val) => {
    setItemForm(prev => ({
      ...prev,
      item_id: val,
      item_unit_id: '',
      quantity: '',
      unit_price: '',
      total: '',
      base_unit_price: ''
    }));
    setItemUnits([]);
    if (val?.id) {
      try {
        const res = await axiosInstance.get(`/item/with-units/${val.id}`);
        const item = res.data;
        setItemUnits(item.units || []);
        setItemForm(prev => ({
          ...prev,
          base_unit_price: item.cost,
          unit_price: item.cost,
          item_unit_id: (item.units && item.units.length > 0) ? item.units[0].id : '',
          total: (Number(prev.quantity) || 0) * item.cost
        }));
      } catch {
        setItemForm(prev => ({
          ...prev,
          base_unit_price: '',
          unit_price: '',
          item_unit_id: '',
          total: ''
        }));
        setItemUnits([]);
      }
    }
  };

  const handleAddItem = () => {
    const errors = {};
    if (!itemForm.item_id) errors.item_id = 'کاڵا پێویستە بنووسرێت';
    if (!itemForm.item_unit_id) errors.item_unit_id = 'یەکە پێویستە بنووسرێت';
    if (!itemForm.quantity) errors.quantity = 'بڕ پێویستە بنووسرێت';
    if (!itemForm.unit_price) errors.unit_price = 'نرخی یەکە پێویستە بنووسرێت';
    setItemFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setForm(f => ({
      ...f,
      items: [
        ...f.items,
        {
          item_id: itemForm.item_id?.id || itemForm.item_id,
          item_unit_id: itemForm.item_unit_id,
          quantity: itemForm.quantity,
          unit_price: itemForm.unit_price,
          total: itemForm.total,
          base_unit_price: itemForm.base_unit_price
        }
      ]
    }));
    setItemForm({
      item_id: '',
      item_unit_id: '',
      quantity: '',
      unit_price: '',
      total: '',
      base_unit_price: ''
    });
    setItemFormErrors({});
    setTimeout(() => {
      if (itemAutocompleteRef.current && itemAutocompleteRef.current.focus) {
        itemAutocompleteRef.current.focus();
      }
    }, 100);
  };

  const removeItem = idx => {
    setForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx)
    }));
    if (editingIdx === idx) {
      setEditingIdx(null);
      setEditingItem(null);
    }
  };

  const handleEditRow = async (idx) => {
    setEditingIdx(idx);
    setEditingItem({ ...form.items[idx] });

    const itemId = form.items[idx].item_id?.id || form.items[idx].item_id;
    if (itemId) {
      setEditingUnitsLoading(true);
      try {
        const res = await axiosInstance.get(`/item/with-units/${itemId}`);
        setEditingUnits(res.data.units || []);
        if (
          res.data.units &&
          res.data.units.length > 0 &&
          (!form.items[idx].item_unit_id || !res.data.units.some(u => u.id === form.items[idx].item_unit_id))
        ) {
          setEditingItem(prev => ({ ...prev, item_unit_id: res.data.units[0].id }));
        }
      } catch {
        setEditingUnits([]);
      } finally {
        setEditingUnitsLoading(false);
      }
    } else {
      setEditingUnits([]);
    }
  };

  const handleEditItemChange = (field, value) => {
    if (field === 'item_unit_id') {
      const selectedUnit = editingUnits.find(u => u.id === value);
      const factor = selectedUnit?.conversion_factor || 1;
      const baseCost = editingItem.base_unit_price || 0;
      const newUnitPrice = baseCost * factor * form.exchange_rate;

      setEditingItem(prev => {
        const updated = { ...prev, [field]: value, unit_price: newUnitPrice };
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0);
        return updated;
      });
      return;
    }
    setEditingItem(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0);
      }
      return updated;
    });
  };

  const handleSaveRow = (idx) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => (i === idx ? editingItem : item))
    }));
    setEditingIdx(null);
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingIdx(null);
    setEditingItem(null);
  };

  const invoiceTotal = form.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const transportTotal = Number(form.amount_transport) || 0;
  const laborTotal = Number(form.amount_labor) || 0;
  const discountTotal = Number(discountResult) || 0;
  const grandTotal = invoiceTotal + transportTotal + laborTotal - discountTotal;

  const quantitySumsByUnit = getQuantitySumsByUnit(form.items, units);

  const isQarzType = form.type === 'قەرز';
  const isRastawxoType = form.type === 'ڕاستەوخۆ';

  const handleSubmit = async e => {
    e.preventDefault();

    const errors = {};
    if (!isRastawxoType && !form.customer_id) errors.customer_id = 'کڕیار پێویستە بنووسرێت';
    if (!form.branch_id) errors.branch_id = 'لق پێویستە بنووسرێت';
    if (!form.warehouse_id) errors.warehouse_id = 'کۆگا پێویستە بنووسرێت';
    if (!form.employee_id) errors.employee_id = 'کارمەند پێویستە بنووسرێت';
    if (!form.currency_id) errors.currency_id = 'دراو پێویستە بنووسرێت';
    if (!form.type) errors.type = 'جۆری پارەدان پێویستە بنووسرێت';
    if (!form.invoice_date) errors.invoice_date = 'بەرواری وەسڵ پێویستە بنووسرێت';
    if (form.items.length === 0) errors.items = 'پێویستە بەلایەنی کەم یەک کاڵا زیاد بکەیت';
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setErrorMessage('تکایە خانەیە پێویستەکان پڕبکەوە.');
      return;
    }

    setLoading(true);

    try {
      const invoicePayload = {
      type: form.type,
      invoice_date: form.invoice_date,
      note: form.note,
      customer_id: isRastawxoType ? 0 : (form.customer_id?.id || form.customer_id),
      branch_id: form.branch_id,
      warehouse_id: form.warehouse_id,
      agent_id: form.agent_id || 0,
      employee_id: form.employee_id,
      currency_id: form.currency_id,
      exchange_rate: form.exchange_rate,
      total_amount: invoiceTotal,
      driver_id: form.driver_id || 0,
      amount_transport: cleanNumber(form.amount_transport),
      amount_labor: cleanNumber(form.amount_labor),
      discount_type: form.discount_type || null,
      discount_value: cleanNumber(form.discount_value),
      discount_result: cleanNumber(form.discount_result),
      direct_customer_name: form.direct_customer_name || null,
      direct_customer_phone: form.direct_customer_phone || null,
      payment_type: form.payment_type || null,
       payment_status: form.payment_status || null, // <-- add this

    };

      if (form.invoice_number) {
        invoicePayload.invoice_number = form.invoice_number;
      }
      if (isQarzType && form.due_date) {
        invoicePayload.due_date = form.due_date;
      }

      let sell_invoice_id = id;
      let oldItems = [];
      if (id) {
        await axiosInstance.put(`/sell-invoice/update/${id}`, invoicePayload);
        const oldItemsRes = await axiosInstance.get(`/sell-item/index?invoice_id=${id}`);
        oldItems = (oldItemsRes.data || []).map(item => ({
          ...item,
          item_id: item.item_id?.id || item.item_id,
          item_unit_id: item.item_unit_id,
          id: item.id
        }));
      } else {
        const invoiceRes = await axiosInstance.post('/sell-invoice/store', invoicePayload);
        sell_invoice_id = invoiceRes.data.id;
        setIsEditing(false);
      }

      const oldMapByKey = {};
      oldItems.forEach(item => {
        const key = `${item.item_id}_${item.item_unit_id}`;
        oldMapByKey[key] = item;
      });

      const newMapByKey = {};
      form.items.forEach(item => {
        const key = `${item.item_id?.id || item.item_id}_${item.item_unit_id}`;
        newMapByKey[key] = item;
      });

      for (const item of form.items) {
        const key = `${item.item_id?.id || item.item_id}_${item.item_unit_id}`;
        const oldItem = oldMapByKey[key];
        if (oldItem && oldItem.id) {
          if (
            Number(oldItem.quantity) !== Number(item.quantity) ||
            Number(oldItem.unit_price) !== Number(item.unit_price) ||
            Number(oldItem.total_amount) !== Number(item.total)
          ) {
           await axiosInstance.put(`/sell-item/update/${oldItem.id}`, {
              invoice_id: sell_invoice_id,
              item_id: item.item_id?.id || item.item_id,
              item_unit_id: item.item_unit_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_amount: item.total
            });
          }
        } else {
          await axiosInstance.post('/sell-item/store', {
              invoice_id: sell_invoice_id,
              item_id: item.item_id?.id || item.item_id,
              item_unit_id: item.item_unit_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_amount: item.total
            });
        }
      }

      for (const key in oldMapByKey) {
        if (!newMapByKey[key]) {
          await axiosInstance.delete(`/sell-item/delete/${oldMapByKey[key].id}`);
        }
      }

      setSuccess(true);
      if (!id) {
        setForm({
          customer_id: '',
          branch_id: branches.length > 0 ? branches[0].id : '',
          warehouse_id: filteredWarehouses.length > 0 ? filteredWarehouses[0].id : '',
          employee_id: getCurrentUserId() || 0,
          currency_id: currencies.length > 0 ? currencies[0].id : '',
          exchange_rate: 1,
          type: '',
          invoice_number: '',
          invoice_date: today,
          due_date: '',
          note: '',
          items: []
        });
        setItemForm({
          item_id: '',
          item_unit_id: '',
          quantity: '',
          unit_price: '',
          total: '',
          base_unit_price: ''
        });
      } else {
        navigate('/sell-invoice');
      }
    } catch (err) {
      setErrorMessage('هەڵە لە تۆمارکردنی یان نوێکردنەوەی وەسڵ یان کاڵا.');
    } finally {
      setLoading(false);
    }
  };

 const handlePrintInvoice = async () => {
  setLoading(true);
  let sell_invoice_id = id;
  try {
    // Prepare invoice payload

   // const cleanNumber = v => v === '' || v === undefined ? null : v;

    const invoicePayload = {
      type: form.type,
      invoice_date: form.invoice_date,
      note: form.note,
      customer_id: isRastawxoType ? 0 : (form.customer_id?.id || form.customer_id),
      branch_id: form.branch_id,
      warehouse_id: form.warehouse_id,
      employee_id: form.employee_id,
      currency_id: form.currency_id,
      exchange_rate: form.exchange_rate,
      total_amount: invoiceTotal,
      agent_id: form.agent_id || 0,
      driver_id: form.driver_id || 0,
      amount_transport: cleanNumber(form.amount_transport),
      amount_labor: cleanNumber(form.amount_labor),
      discount_type: form.discount_type || null,
      discount_value: cleanNumber(form.discount_value),
      discount_result: cleanNumber(form.discount_result),
      direct_customer_name: form.direct_customer_name || null,
      direct_customer_phone: form.direct_customer_phone || null,
      payment_type: form.payment_type || null,
      payment_status: form.payment_status || null,
    };
    if (form.invoice_number) invoicePayload.invoice_number = form.invoice_number;
    if (isQarzType && form.due_date) invoicePayload.due_date = form.due_date;


    // Store or update invoice
     let oldItems = [];
    if (id) {
      await axiosInstance.put(`/sell-invoice/update/${id}`, invoicePayload);
      sell_invoice_id = id;
      const oldItemsRes = await axiosInstance.get(`/sell-item/index?invoice_id=${id}`);
      oldItems = (oldItemsRes.data || []).map(item => ({
        ...item,
        item_id: item.item_id?.id || item.item_id,
        item_unit_id: item.item_unit_id,
        id: item.id
      }));
    } else {
      // Fix: get last inserted id from response
      const invoiceRes = await axiosInstance.post('/sell-invoice/store', invoicePayload);
      sell_invoice_id = invoiceRes.data.id;
    }

    // Map old and new items for update/delete logic
    const oldMapByKey = {};
    oldItems.forEach(item => {
      const key = `${item.item_id}_${item.item_unit_id}`;
      oldMapByKey[key] = item;
    });
    const newMapByKey = {};
    form.items.forEach(item => {
      const key = `${item.item_id?.id || item.item_id}_${item.item_unit_id}`;
      newMapByKey[key] = item;
    });

    // Store or update items
    for (const item of form.items) {
      const key = `${item.item_id?.id || item.item_id}_${item.item_unit_id}`;
      const oldItem = oldMapByKey[key];
      if (oldItem && oldItem.id) {
        if (
          Number(oldItem.quantity) !== Number(item.quantity) ||
          Number(oldItem.unit_price) !== Number(item.unit_price) ||
          Number(oldItem.total_amount) !== Number(item.total)
        ) {
          await axiosInstance.put(`/sell-item/update/${oldItem.id}`, {
            invoice_id: sell_invoice_id,
            item_id: item.item_id?.id || item.item_id,
            item_unit_id: item.item_unit_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.total
          });
        }
      } else {
        await axiosInstance.post('/sell-item/store', {
          invoice_id: sell_invoice_id,
          item_id: item.item_id?.id || item.item_id,
          item_unit_id: item.item_unit_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total
        });
      }
    }

    // Delete removed items
    for (const key in oldMapByKey) {
      if (!newMapByKey[key]) {
        await axiosInstance.delete(`/sell-item/delete/${oldMapByKey[key].id}`);
      }
    }

     setSuccess(true);
      if (!id) {
        setForm({
          customer_id: '',
          branch_id: branches.length > 0 ? branches[0].id : '',
          warehouse_id: filteredWarehouses.length > 0 ? filteredWarehouses[0].id : '',
          employee_id: getCurrentUserId() || 0,
          currency_id: currencies.length > 0 ? currencies[0].id : '',
          exchange_rate: 1,
          type: '',
          invoice_number: '',
          invoice_date: today,
          due_date: '',
          note: '',
          items: []
        });
        setItemForm({
          item_id: '',
          item_unit_id: '',
          quantity: '',
          unit_price: '',
          total: '',
          base_unit_price: ''
        });
      } else {
        navigate('/sell-invoice');
      }
    
    // Fetch invoice and items for PDF
      setPdfLoading(true);
    const [invoiceRes, itemsRes] = await Promise.all([
      axiosInstance.get(`/sell-invoice/show/${sell_invoice_id}`),
      axiosInstance.get(`/sell-item/index?invoice_id=${sell_invoice_id}`)
    ]);
    setPdfInvoice(invoiceRes.data);
    setPdfInvoiceItems(itemsRes.data || []);
    setPdfInvoiceId(sell_invoice_id);
    setOpenInvoicePdf(true);
  } catch (err) {
    setErrorMessage('هەڵە لە تۆمارکردنی یان چاپکردنی وەسڵ.');
  } finally {
    setLoading(false);
    setPdfLoading(false);
  }
};



  const handleClearAll = () => {
    setForm({
      customer_id: '',
      branch_id: branches.length > 0 ? branches[0].id : '',
      warehouse_id: filteredWarehouses.length > 0 ? filteredWarehouses[0].id : '',
      employee_id: getCurrentUserId() || 0,
      currency_id: currencies.length > 0 ? currencies[0].id : '',
      exchange_rate: 1,
      type: '',
      invoice_number: '',
      invoice_date: today,
      due_date: '',
      note: '',
      items: []
    });
    setItemForm({
      item_id: '',
      item_unit_id: '',
      quantity: '',
      unit_price: '',
      total: '',
      base_unit_price: ''
    });
    setFormErrors({});
    setItemFormErrors({});
    setErrorMessage('');
  };

  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');

  if (loadingData) {
    return <LoadingSpinner fullScreen message="چاوەڕوان بن..." />;
  }

   return (
    <Box>
      <Card sx={{ p: 3, mb: 3 }}>
      {/* Header with Close Icon */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" gutterBottom>بەشی فرۆشتن</Typography>
              <IconButton onClick={() => navigate('/sell-invoice')}>
                <CloseIcon />
              </IconButton>
            </Box>        
          <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <CustomerAutocomplete
                value={form.customer_id}
                onChange={val => setForm(f => ({ ...f, customer_id: val }))}
                error={!!formErrors.customer_id}
                helperText={formErrors.customer_id}
                disabled={isRastawxoType}
              />
            </Grid>
             <Grid item xs={12} md={2}>
              <TextField
                select
                label="جۆر "
                name="type"
                value={form.type}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.type}
                helperText={formErrors.type}
              >
                {paymentTypes.map(pt => (
                  <MenuItem key={pt.value} value={pt.value}>{pt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="لق"
                name="branch_id"
                value={form.branch_id}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.branch_id}
                helperText={formErrors.branch_id}
              >
                {branches.map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="کۆگا"
                name="warehouse_id"
                value={form.warehouse_id}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.warehouse_id}
                helperText={formErrors.warehouse_id}
              >
                {filteredWarehouses.map(w => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="دراو"
                name="currency_id"
                value={form.currency_id}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.currency_id}
                helperText={formErrors.currency_id}
              >
                {currencies.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            
             {/* --- Show direct customer fields only for 'ڕاستەوخۆ' --- */}
            {form.type === 'ڕاستەوخۆ' && (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="ناوی کڕیار"
                    name="direct_customer_name"
                    value={form.direct_customer_name}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="ژمارەی تەلەفۆنی کڕیار"
                    name="direct_customer_phone"
                    value={form.direct_customer_phone}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
              </>
            )}

            
            <Grid item xs={12} md={2}>
              <TextField
                label="بەرواری وەسڵ"
                name="invoice_date"
                type="date"
                value={form.invoice_date}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.invoice_date}
                helperText={formErrors.invoice_date}
              />
            </Grid>
              <Grid item xs={12} md={2}>
                    <TextField
                      select
                      label="مەندووب"
                      name="agent_id"
                      value={form.agent_id || ''}
                      onChange={handleChange}
                      fullWidth
                      error={!!formErrors.agent_id}
                      helperText={formErrors.agent_id}
                    >
                      <MenuItem value="">-- هەڵبژێرە --</MenuItem>
                      {agents.map(agent => (
                        <MenuItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
           {/* --- Only show due_date if type is 'قەرز' --- */}
            {isQarzType && (
              <Grid item xs={12} md={2}>
                <TextField
                  label="بەرواری قەرزدانەوە"
                  name="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
          <Grid item xs={12} md={1}>
          <Button
            variant="outlined"
            color="info"
            onClick={() => setOpenTransportDialog(true)}
            sx={{ height: 56, width: '100%' }} // 56px is default MUI TextField height

          >
            گواستنەوە
          </Button>
        </Grid>
        <Grid item xs={12} md={1}>
            <Button
            variant="outlined"
            color="warning"
            onClick={() => setOpenDiscountDialog(true)}
            sx={{ height: 56, width: '100%' }}
          >
            داشکاندن
          </Button>

        </Grid>

       {!isQarzType && (
         <Grid item xs={12} sm={2}>
            <TextField
              select
              fullWidth
              label="شێوازی پارەدان"
              name="payment_type"
              value={form.payment_type}
              onChange={handleChange}
            >

              <MenuItem value="">----</MenuItem>
              <MenuItem value="کاش">کاش</MenuItem>
              <MenuItem value="بانک">بانک</MenuItem>
              <MenuItem value="گواستنەوە">گواستنەوە</MenuItem>
            </TextField>
          </Grid>)}
         <Grid item xs={12} sm={2}>
            <TextField
              select
              fullWidth
              label="دۆخی پارەدان"
              name="payment_status"
              value={form.payment_status}
              onChange={handleChange}
            >
              <MenuItem value="واصڵکراوە">واصڵکراوە</MenuItem>
              <MenuItem value="واصڵنەکراوە">واصڵنەکراوە</MenuItem>
              <MenuItem value="بەشێک واصڵکراوە">بەشێک واصڵکراوە</MenuItem>

            </TextField>
          </Grid>


          <Grid item xs={12} md={1}>
            <TextField
              label="ژ.پسوڵە"
              name="invoice_number"
                value={form.invoice_number}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.invoice_number}
                helperText={formErrors.invoice_number}
              />
            </Grid>
              <Grid item xs={12} md={1}>
              <TextField
                label="ن.گۆڕین"
                name="exchange_rate"
                value={Number(form.exchange_rate).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                fullWidth
                disabled
              />
            </Grid>

           
            <Grid item xs={12}>
              <TextField
                label="تێبینی"
                name="note"
                value={form.note}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
                inputProps={{ style: { resize: 'vertical' } }}
                helperText={
                  <>
                    {`وشەکان: ${wordCount}`}
                    {wordCount > 500 && (
                      <span style={{ color: 'orange', marginLeft: 8 }}>وشە زیاتر لە ٥٠٠</span>
                    )}
                    <span
                      style={{ color: '#1976d2', cursor: 'pointer', marginLeft: 16 }}
                      onClick={() => setNotePreviewOpen(true)}
                    >
                      پیشاندانی تێبینی
                    </span>
                  </>
                }
              />
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />

          {/* --- Add item form --- */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <ItemAutocomplete
                ref={itemAutocompleteRef}
                autoFocus
                value={itemForm.item_id}
                onChange={handleItemSelect}
                error={!!itemFormErrors.item_id}
                helperText={itemFormErrors.item_id}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (itemQuantityRef.current) itemQuantityRef.current.focus();
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <TextField
                select
                value={itemForm.item_unit_id}
                onChange={e => handleItemFormChange('item_unit_id', e.target.value)}
                fullWidth
                error={!!itemFormErrors.item_unit_id}
                helperText={itemFormErrors.item_unit_id}
                disabled={itemUnits.length === 0}
                inputRef={itemUnitRef}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (itemQuantityRef.current) itemQuantityRef.current.focus();
                  }
                }}
              >
                {itemUnits.length === 0 && (
                  <MenuItem disabled value="">هیچ یەکەیەک بۆ ئەم کاڵا نییە</MenuItem>
                )}
                {itemUnits.map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="بڕ"
                type="number"
                value={itemForm.quantity}
                onChange={e => handleItemFormChange('quantity', e.target.value)}
                fullWidth
                error={!!itemFormErrors.quantity}
                helperText={itemFormErrors.quantity}
                inputRef={itemQuantityRef}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (itemPriceRef.current) itemPriceRef.current.focus();
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="نرخی یەکە"
                type="number"
                value={itemForm.unit_price}
                onChange={e => handleItemFormChange('unit_price', e.target.value)}
                fullWidth
                error={!!itemFormErrors.unit_price}
                helperText={itemFormErrors.unit_price}
                inputProps={{
                  style: { direction: 'ltr', textAlign: 'left' }
                }}
                inputRef={itemPriceRef}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="کۆی گشتی"
                value={Number(itemForm.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={handleAddItem} color="primary">
                <AddIcon />
              </IconButton>
            </Grid>
          </Grid>

          {/* --- Items table --- */}
          <Divider sx={{ my: 3 }} />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>کاڵا</TableCell>
                <TableCell>یەکە</TableCell>
                <TableCell>بڕ</TableCell>
                <TableCell>نرخی یەکە</TableCell>
                <TableCell>کۆی گشتی</TableCell>
                <TableCell>ئیش</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {form.items.map((item, idx) => {
                const isEditing = editingIdx === idx;
                return (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      {item.item_id && items.find(i => i.id === (item.item_id?.id || item.item_id))?.name}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          select
                          value={editingItem.item_unit_id}
                          onChange={e => handleEditItemChange('item_unit_id', e.target.value)}
                          size="small"
                          sx={{ minWidth: 80 }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveRow(idx);
                            }
                          }}
                        >
                          {editingUnitsLoading && (
                            <MenuItem disabled value="">
                              چاوەڕوان بن...
                            </MenuItem>
                          )}
                          {!editingUnitsLoading && editingUnits.length === 0 && (
                            <MenuItem disabled value="">
                              هیچ یەکەیەک بۆ ئەم کاڵا نییە
                            </MenuItem>
                          )}
                          {editingUnits.map(u => (
                            <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        item.item_unit_id && units.find(u => String(u.id) === String(item.item_unit_id))?.name
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          type="number"
                          value={editingItem.quantity}
                          onChange={e => handleEditItemChange('quantity', e.target.value)}
                          size="small"
                          sx={{ minWidth: 60 }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveRow(idx);
                            }
                          }}
                        />
                      ) : (
                        formatNumberWithCommas(item.quantity)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          type="number"
                          value={editingItem.unit_price}
                          onChange={e => handleEditItemChange('unit_price', e.target.value)}
                          size="small"
                          sx={{ minWidth: 80 }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveRow(idx);
                            }
                          }}
                        />
                      ) : (
                        formatNumberWithCommas(item.unit_price)
                      )}
                    </TableCell>
                    <TableCell>
                      {Number(isEditing ? editingItem.total : item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <>
                          <IconButton color="success" onClick={() => handleSaveRow(idx)}>
                            <SaveIcon />
                          </IconButton>
                          <IconButton color="error" onClick={handleCancelEdit}>
                            <CloseIcon />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton onClick={() => handleEditRow(idx)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => removeItem(idx)} color="error">
                            <RemoveIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {form.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">هیچ کاڵایەک زیاد نەکراوە.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* --- Actions --- */}
          <Divider sx={{ my: 3 }} />
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'center' },
              bgcolor: '#f8fafc',
  
            }}
          >
            {/* Total */}
                 <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      bgcolor: '#f9fafb',
                     p: 2,
               
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', minWidth: 200 }}>
                      کۆی گشتی: <span style={{ color: '#222' }}>{formatNumberWithCommas(Number(invoiceTotal.toFixed(2)))}</span>
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#a26d16ff', minWidth: 120 }}>
                      گواستنەوە: <span>{formatNumberWithCommas(Number(transportTotal.toFixed(2)))}</span>
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#96039bff', minWidth: 120 }}>
                      بارکردن: <span>{formatNumberWithCommas(Number(laborTotal.toFixed(2)))}</span>
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#d32f2f', minWidth: 120 }}>
                      داشکاندن: <span>{formatNumberWithCommas(Number(discountTotal.toFixed(2)))}</span>
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: 'success.main',
                        minWidth: 140,
                        bgcolor: 'rgba(46, 125, 50, 0.08)',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                      }}
                    >
                      ئەنجام: <span style={{ color: '#222' }}>  {formatNumberWithCommas(Number(grandTotal.toFixed(2)))}</span>
                    </Typography>

                    {quantitySumsByUnit.length === 0 ? (
                      <Typography color="text.secondary" sx={{ ml: 2 }}>
                        هیچ بڕێک زیادنەکراوە
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', ml: 2 }}>
                        {quantitySumsByUnit.map(q => (
                          <Typography
                            key={q.unitId}
                            variant="body2"
                            sx={{
                              px: 2,
                              py: 0.8,
                              fontWeight: 600,
                              display: 'inline-block',
                              minWidth: 90,
                              textAlign: 'center',
                              borderRadius: 1,
                              bgcolor: '#f1f5f9',
                              boxShadow: 1,
                            }}
                          >
                            {q.unitName}:{' '}
                            <span style={{ color: '#1976d2', fontWeight: 700 }}>
                              {formatNumberWithCommas(q.quantity)}
                            </span>
                          </Typography>
                        ))}
                      </Box>
                    )}   


                  </Box>

            {/* Actions */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                width: { xs: '100%', sm: 'auto' },
                alignItems: 'stretch',
                justifyContent: { xs: 'stretch', sm: 'flex-end' },
                mt: { xs: 2, sm: 0 },
                gap: 2
              }}
            >
         <ReportButton
            onClick={handlePrintInvoice}
            fullWidth
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            چاپکردن
          </ReportButton>
              <RegisterButton
                loading={loading}
                type="submit"
                sx={{ flex: 1, minWidth: 100, mb: { xs: 2, sm: 0 } }}
              >
                تۆمارکردن
              </RegisterButton>

             {!id && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'row', sm: 'row' },
                    gap: 2,
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  <ClearButton
                    onClick={handleClearAll}
                    sx={{ flex: 1, minWidth: 100 }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </form>
      </Card>
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          وەسڵ بەسەرکەوتوویی تۆمارکرا!
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



      <Dialog open={notePreviewOpen} onClose={() => setNotePreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>پیشاندانی تێبینی</DialogTitle>
        <DialogContent>
          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
            {form.note}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotePreviewOpen(false)}>داخستن</Button>
        </DialogActions>
      </Dialog>


       <TransportLaborDialog
        open={openTransportDialog}
        onClose={() => setOpenTransportDialog(false)}
        onSave={() => setOpenTransportDialog(false)}
        driverId={form.driver_id}
        setDriverId={id => setForm(f => ({ ...f, driver_id: id }))}
        amountTransport={form.amount_transport}
        setAmountTransport={val => setForm(f => ({ ...f, amount_transport: val }))}
        amountLabor={form.amount_labor}
        setAmountLabor={val => setForm(f => ({ ...f, amount_labor: val }))}
      />

      <DiscountDialog
        open={openDiscountDialog}
        onClose={() => setOpenDiscountDialog(false)}
        onSave={() => {
          setForm(f => ({
            ...f,
            discount_type: discountType,
            discount_value: discountValue,
            discount_result: discountResult
          }));
        }}
        invoiceTotal={invoiceTotal}
        discountType={discountType}
        setDiscountType={setDiscountType}
        discountValue={discountValue}
        setDiscountValue={setDiscountValue}
        discountResult={discountResult}
        setDiscountResult={setDiscountResult}
      />

<DialogPdf
  open={openInvoicePdf}
  onClose={() => setOpenInvoicePdf(false)}
  document={
    pdfInvoice && pdfInvoiceItems.length > 0 ? (
      <SellInvoicePDF
        invoice={pdfInvoice}
        items={pdfInvoiceItems}
        currencies={currencies}
        branches={branches}
        warehouses={filteredWarehouses}
        employees={employees}
        company={company}
      />
    ) : (
      <div style={{ padding: 40, textAlign: 'center' }}>هیچ زانیارییەک بوونی نییە</div>
    )
  }
  fileName={`sell_invoice_${pdfInvoice?.invoice_number || pdfInvoice?.id || ''}.pdf`}
/>


    </Box>
  );
}

export default SellCreate; 