import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function AddButton({ onClick, fullWidth = true, children = 'زیادکردن', ...props }) {
  return (
    <Button
      type="button"
      variant="contained"
      color="success"
      startIcon={<AddIcon />}
      fullWidth={fullWidth}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
}

export default AddButton;