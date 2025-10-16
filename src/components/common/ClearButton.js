import { Button } from '@mui/material';

function ClearButton({ onClick, fullWidth = true, children = 'پاکردنەوە', ...props }) {
  return (
    <Button
      variant="contained"
      color="info"
      fullWidth={fullWidth}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
}

export default ClearButton;