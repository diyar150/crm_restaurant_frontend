import { Button } from '@mui/material';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';

function RegisterButton({ onClick, loading = false, fullWidth = true, children = 'تۆمارکردن', ...props }) {
  return (
    <Button
      type="submit"
      variant="contained"
      color="success"
      startIcon={<AppRegistrationIcon />}
      fullWidth={fullWidth}
      onClick={onClick}
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </Button>
  );
}

export default RegisterButton;