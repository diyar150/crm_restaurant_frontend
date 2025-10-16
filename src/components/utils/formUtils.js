// Utility function to clear a specific text field in the form
export const clearTextField = (setFormData, fieldName) => {
  setFormData((prevData) => ({
    ...prevData,
    [fieldName]: '', // Use empty string to clear the field
  }));
};
  
  // Utility function to handle form field changes
  export const handleChange = (e, setFormData) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value !== undefined ? value : '', // Default to empty string
    }));
  };
  
  // Utility function to reset form data
  export const resetForm = (setFormData, initialData) => {
    setFormData({ ...initialData });
  };


  