// import React from 'react';
// import { Box, CircularProgress } from '@mui/material';

// const LoadingSpinner = ({ size = 48, fullScreen = false, message }) => (
//   <Box
//     sx={{
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'center',
//       justifyContent: 'center',
//       ...(fullScreen
//         ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1300 }
//         : { width: '100%', minHeight: 120 }
//       ),
//     }}
//   >
//     <CircularProgress size={size} />
//     {message && (
//       <Box mt={2} color="text.secondary">
//         {message}
//       </Box>
//     )}
//   </Box>
// );

// export default LoadingSpinner;

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ size = 48, fullScreen = false, message }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      ...(fullScreen
        ? { 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            bgcolor: 'rgba(255,255,255,0.4)', 
            backdropFilter: 'blur(6px)', 
            zIndex: 1300 
          }
        : { width: '100%', minHeight: 120, borderRadius: 2, bgcolor: 'background.paper' }
      ),
      transition: 'opacity 0.3s, transform 0.3s',
      opacity: 1,
      transform: 'scale(1)',
    }}
  >
    <CircularProgress size={size} sx={{ color: 'primary.main' }} />
    {message && (
      <Typography variant="body2" mt={2} color="text.secondary" fontWeight={500}>
        {message}
      </Typography>
    )}
  </Box>
);

export default LoadingSpinner;
