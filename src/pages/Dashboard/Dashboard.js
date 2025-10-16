import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
// import LoadingSpinner from '../../components/common/LoadingSpinner'; // <-- Add this import

// function DashboardRow(loading=false ) {
function DashboardRow() {

  //  if (loading) {
  //   return <LoadingSpinner fullScreen message="چاوەڕوان بن..." />;
  // }
  return (
    <Grid container spacing={3}>
      {/* First Column */}
      <Grid item xs={12} md={6} xl={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between">
              {/* Replace this div with chart */}
              <div id="total-revenue-chart" style={{ marginTop: '16px' }}></div>
              <Box>
                <Typography variant="h4" mt={1} mb={1}>
                  $34,152
                </Typography>
                <Typography color="textSecondary">Total Revenue</Typography>
              </Box>
            </Box>
            <Typography color="success.main" mt={3} mb={0}>
              <ArrowUpwardIcon fontSize="small" /> 2.65% since last week
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Second Column */}
      <Grid item xs={12} md={6} xl={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between">
              {/* Replace this div with chart */}
              <div id="orders-chart" style={{ marginTop: '16px' }}></div>
              <Box>
                <Typography variant="h4" mt={1} mb={1}>
                  5,643
                </Typography>
                <Typography color="textSecondary">Orders</Typography>
              </Box>
            </Box>
            <Typography color="error.main" mt={3} mb={0}>
              <ArrowDownwardIcon fontSize="small" /> 0.82% since last week
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Third Column */}
      <Grid item xs={12} md={6} xl={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between">
              {/* Replace this div with chart */}
              <div id="customers-chart" style={{ marginTop: '16px' }}></div>
              <Box>
                <Typography variant="h4" mt={1} mb={1}>
                  45,254
                </Typography>
                <Typography color="textSecondary">Customers</Typography>
              </Box>
            </Box>
            <Typography color="error.main" mt={3} mb={0}>
              <ArrowDownwardIcon fontSize="small" /> 6.24% since last week
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Fourth Column */}
      <Grid item xs={12} md={6} xl={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between">
              {/* Replace this div with chart */}
              <div id="growth-chart" style={{ marginTop: '16px' }}></div>
              <Box>
                <Typography variant="h4" mt={1} mb={1}>
                  +12.58%
                </Typography>
                <Typography color="textSecondary">Growth</Typography>
              </Box>
            </Box>
            <Typography color="success.main" mt={3} mb={0}>
              <ArrowUpwardIcon fontSize="small" /> 10.51% since last week
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default DashboardRow;
