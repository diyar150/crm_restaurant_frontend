// Utility function to format numbers with commas
export const formatNumberWithCommas = (value) => {
    // Remove any commas already in the number
    const cleanedValue = value.replace(/,/g, '');
    // Return the formatted number with commas
    return cleanedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Utility function to handle number change and format
  export const handleChangeNumber = (e, setFormData) => {
    const { name, value } = e.target;
    
    // Remove non-numeric characters except for commas
    const numericValue = value.replace(/[^\d]/g, '');
    
    // Format the value with commas
    const formattedValue = formatNumberWithCommas(numericValue);
  
    // Update the formData with the formatted value
    setFormData((prevState) => ({
      ...prevState,
      [name]: formattedValue,
    }));
  };
  

  