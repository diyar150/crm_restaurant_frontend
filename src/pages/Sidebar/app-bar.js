import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const Appbar = () => {

  return (
    <>
      <AppBar position="fixed" sx={{ backgroundColor: '#002147' }}>
        <Toolbar>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'right' }}>
            Hiload System
          </Typography>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Appbar;
