import React, { useState, useEffect, forwardRef } from 'react';
import { TextField, CircularProgress, Autocomplete } from '@mui/material';
import axiosInstance from '../service/axiosInstance';

const ItemAutocomplete = forwardRef(
  ({ value, onChange, label = "کاڵا", error, helperText, autoFocus, onKeyDown }, ref) => {
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (value && typeof value === 'object' && value.name) {
        setInputValue(value.name);
      } else if (!value) {
        setInputValue('');
      }
    }, [value]);

    useEffect(() => {
      if (!open || inputValue.length < 2) {
        setOptions([]);
        return;
      }
      let active = true;
      setLoading(true);

      axiosInstance
        .get('/item/search', { params: { q: inputValue } })
        .then(res => {
          if (active) setOptions(res.data || []);
        })
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));

      return () => {
        active = false;
      };
    }, [inputValue, open]);

    const getOptionLabel = (option) => {
      if (!option) return '';
      if (typeof option === 'object') {
        if (option.name) return option.name;
        if (option.code) return option.code;
        if (option.barcode) return option.barcode;
      }
      return '';
    };

    const renderOption = (props, option) => (
      <li {...props}>
        {(option.code ? option.code + ' - ' : '') +
          (option.name || '') +
          (option.barcode ? ' - ' + option.barcode : '')}
      </li>
    );

    return (
      <Autocomplete
        open={open}
        autoFocus={autoFocus}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        filterOptions={(x) => x}
        isOptionEqualToValue={(option, val) => option?.id === val?.id}
        getOptionLabel={getOptionLabel}
        renderOption={renderOption}
        options={options}
        loading={loading}
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={ref}
            label={label}
            error={!!error}
            helperText={helperText}
            onKeyDown={onKeyDown} // <-- Forward onKeyDown!
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        noOptionsText={
          inputValue.length < 2
            ? "بۆ گەڕان دوو پیت بنووسە"
            : "هیچ کاڵایەک نەدۆزرایەوە"
        }
      />
    );
  }
);

export default ItemAutocomplete;