import React from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

function ReportButton({ onClick, children = 'چاپکردن', ...props }) {
  return (
    <Tooltip title="دابەزاندنی ڕاپۆرت PDF">
      <Button
        variant="contained"
        color="secondary"
        startIcon={<PictureAsPdfIcon />}
        onClick={onClick}
        sx={{ minWidth: 140, fontWeight: 'normal', letterSpacing: 1 }}
        {...props}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

ReportButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default ReportButton;
