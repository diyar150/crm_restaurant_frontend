import React, { useState, useEffect } from 'react';
import { TextField, CircularProgress, Autocomplete } from '@mui/material';
import axiosInstance from '../service/axiosInstance';

function CustomerAutocomplete({ value, onChange, label = "کڕیار", error, helperText }) {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch all customers on open if input is empty
  useEffect(() => {
    if (open && inputValue.length < 2) {
      setLoading(true);
      axiosInstance
        .get('/customer/index')
        .then(res => setOptions(res.data || []))
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    }
  }, [open, inputValue]);

  // Debounced search
  useEffect(() => {
    if (!open || inputValue.length < 2) return;
    let active = true;
    setLoading(true);
    axiosInstance
      .get('/customer/search', { params: { q: inputValue } })
      .then(res => { if (active) setOptions(res.data || []); })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
    return () => { active = false; };
  }, [inputValue, open]);

  const getOptionLabel = (option) => (option && typeof option === 'object' && option.name) ? option.name : '';

  const renderOption = (props, option) => (
    <li {...props}>
      {(option.code ? option.code + ' - ' : '') +
        (option.name || '') +
        (option.phone_1 ? ' - ' + option.phone_1 : '')}
    </li>
  );

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      filterOptions={x => x}
      isOptionEqualToValue={(option, val) => option && val && option.id === val.id}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      options={options}
      loading={loading}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={helperText}
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
      noOptionsText={inputValue.length < 2 ? "بۆ گەڕان دوو پیت بنووسە" : "هیچ کڕیارێک نەدۆزرایەوە"}
    />
  );
}

export default CustomerAutocomplete;


// import React, { useState, useEffect } from 'react';
// import { TextField, CircularProgress, Autocomplete } from '@mui/material';
// import axiosInstance from '../service/axiosInstance';

// function CustomerAutocomplete({ value, onChange, label = "کڕیار", error, helperText }) {
//   const [inputValue, setInputValue] = useState('');
//   const [options, setOptions] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // Debounce input for performance
//   useEffect(() => {
//     if (!open || inputValue.length < 2) {
//       setOptions([]);
//       return;
//     }
//     let active = true;
//     setLoading(true);

//     // Backend API should support searching by code, name, or phone_1
//     axiosInstance
//       .get('/customer/search', { params: { q: inputValue } })
//       .then(res => {
//         if (active) setOptions(res.data || []);
//       })
//       .catch(() => setOptions([]))
//       .finally(() => setLoading(false));

//     return () => {
//       active = false;
//     };
//   }, [inputValue, open]);

//   // Show only name in the input, but full info in dropdown
//   const getOptionLabel = (option) => {
//     if (!option) return '';
//     if (typeof option === 'object' && option.name) {
//       return option.name;
//     }
//     return '';
//   };

//   // Custom render for dropdown options
//   const renderOption = (props, option) => (
//     <li {...props}>
//       {(option.code ? option.code + ' - ' : '') +
//         (option.name || '') +
//         (option.phone_1 ? ' - ' + option.phone_1 : '')}
//     </li>
//   );

//   return (
//     <Autocomplete
//       open={open}
//       onOpen={() => setOpen(true)}
//       onClose={() => setOpen(false)}
//       filterOptions={(x) => x} // Disable client-side filtering for performance
//       isOptionEqualToValue={(option, val) => option.id === val.id}
//       getOptionLabel={getOptionLabel}
//       renderOption={renderOption}
//       options={options}
//       loading={loading}
//       value={value}
//       onChange={(_, newValue) => onChange(newValue)}
//       inputValue={inputValue}
//       onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
//       renderInput={(params) => (
//         <TextField
//           {...params}
//           label={label}
//           error={!!error}
//           helperText={helperText}
//           InputProps={{
//             ...params.InputProps,
//             endAdornment: (
//               <>
//                 {loading ? <CircularProgress color="inherit" size={20} /> : null}
//                 {params.InputProps.endAdornment}
//               </>
//             ),
//           }}
//         />
//       )}
//       noOptionsText={inputValue.length < 2 ? "بۆ گەڕان دوو پیت بنووسە" : "هیچ کڕیارێک نەدۆزرایەوە"}
//     />
//   );
// }

// export default CustomerAutocomplete;