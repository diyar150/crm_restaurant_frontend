import React, { useState, useEffect } from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, Collapse, IconButton, Divider, Box,
} from '@mui/material';
import {
  Home,
  ContactMail,
  ExpandLess,
  ExpandMore,
  Menu,
  People,
  Settings,
  Logout,
  Category,
  AccountBalanceWallet,
  SellOutlined,
  PersonOutline,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [nestedOpen, setNestedOpen] = useState(false);
  const [nestedCompanyOpen, setCompanyNestedOpen] = useState(false);
  const [nestedEmployeeOpen, setEmployeeNestedOpen] = useState(false);
  const [nestedItemOpen, setItemNestedOpen] = useState(false);
  const [nestedExpensesOpen, setExpensesNestedOpen] = useState(false);
  const [nestedSellOpen, setSellNestedOpen] = useState(false);

  const toggleDrawer = () => setOpen((prev) => !prev);
  const handleNestedToggle = () => setNestedOpen((prev) => !prev);
  const handleCompanyNestedToggle = () => setCompanyNestedOpen((prev) => !prev);
  const handleEmployeeNestedToggle = () => setEmployeeNestedOpen((prev) => !prev);
  const handleExpensesNestedToggle = () => setExpensesNestedOpen((prev) => !prev);
  const handleItemNestedToggle = () => setItemNestedOpen((prev) => !prev);
  const handleSellNestedToggle = () => setSellNestedOpen((prev) => !prev);

  const hideToggle = location.pathname === '/' || location.pathname === '/login';

  const getTextStyles = () => ({
    color: 'white',
    '&:hover': { color: '#ffcc00' },
    cursor: 'pointer',
  });

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTokenExpiry');
    navigate('/');
  };


  // open and close the sidebar by space button
    useEffect(() => {
    const handleKeyDown = (e) => {
      // Only toggle if spacebar is pressed and no input/textarea is focused
      if (
        e.code === 'Space' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey
      ) {
        e.preventDefault();
        toggleDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {!hideToggle && (
        <IconButton
          onClick={toggleDrawer}
          sx={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 1200,
            backgroundColor: 'white',
            '&:hover': { backgroundColor: '#e0e0e0' },
            color: '#000',
            borderRadius: '50%',
            boxShadow: 2,
          }}
          aria-label="Toggle menu"
        >
          <Menu />
        </IconButton>
      )}
      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: 250,
            backgroundColor: '#002147',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ flexGrow: 1, overflowX: 'hidden' }}>
          <List sx={{ width: 250, overflowX: 'hidden' }}>
            <ListItem button component={Link} to="/dashboard">
              <ListItemIcon sx={{ color: 'white' }}>
                <Home />
              </ListItemIcon>
              <ListItemText primary="داشبۆرد" sx={getTextStyles()} />
            </ListItem>


               {/* Sell Invoice */}

                 <ListItem button onClick={handleSellNestedToggle} aria-expanded={nestedSellOpen}>
              <ListItemIcon sx={{ color: 'white' }}>
                <SellOutlined />
              </ListItemIcon>
              <ListItemText primary="بەشی فرۆشتن" sx={getTextStyles()} />
              {nestedSellOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
            </ListItem>
            <Collapse in={nestedSellOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem button component={Link} to="/sell-invoice">
                  <ListItemText inset primary="فرۆشتنەکان" sx={getTextStyles()} />
                </ListItem>

              </List>
              <Divider sx={{ backgroundColor: 'white' }} />
            </Collapse>


            {/* Customer Section */}
            <ListItem button onClick={handleNestedToggle} aria-expanded={nestedOpen}>
              <ListItemIcon sx={{ color: 'white' }}>
                <PersonOutline />
              </ListItemIcon>
              <ListItemText primary="کڕیار" sx={getTextStyles()} />
              {nestedOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
            </ListItem>
            <Collapse in={nestedOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem button component={Link} to="/customer">
                  <ListItemText inset primary="ناساندن" sx={getTextStyles()} />
                </ListItem>
                <ListItem button component={Link} to="/customer/payment">
                  <ListItemText inset primary="واصڵكردن پارە" sx={getTextStyles()} />
                </ListItem>
                <ListItem button component={Link} to="/customer/kash">
                  <ListItemText inset primary="کەشف حساب" sx={getTextStyles()} />
                </ListItem>
                <ListItem button component={Link} to="/customer_category">
                  <ListItemText inset primary="گرووپ" sx={getTextStyles()} />
                </ListItem>
              </List>
              <Divider sx={{ backgroundColor: 'white' }} />
            </Collapse>

            <ListItem button component={Link} to="/contact">
              <ListItemIcon sx={{ color: 'white' }}>
                <ContactMail />
              </ListItemIcon>
              <ListItemText primary="Contact" sx={getTextStyles()} />
            </ListItem>
            <Divider sx={{ backgroundColor: 'white' }} />

            {/* Item Section */}
            <ListItem button onClick={handleItemNestedToggle} aria-expanded={nestedItemOpen}>
              <ListItemIcon sx={{ color: 'white' }}>
                <Category />
              </ListItemIcon>
              <ListItemText primary="زانیاری کاڵا" sx={getTextStyles()} />
              {nestedItemOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
            </ListItem>
            <Collapse in={nestedItemOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem button component={Link} to="/item">
                  <ListItemText inset primary=" کاڵا" sx={getTextStyles()} />
                </ListItem>
                <ListItem button component={Link} to="/item/category">
                  <ListItemText inset primary=" گرووپەکان" sx={getTextStyles()} />
                </ListItem>

                <ListItem button component={Link} to="/item/unit">
                  <ListItemText inset primary=" یەکەکان" sx={getTextStyles()} />
                </ListItem>
                <ListItem button component={Link} to="/item/price/type">
                  <ListItemText inset primary="جۆری نرخەکان" sx={getTextStyles()} />
                </ListItem>

              </List>
              <Divider sx={{ backgroundColor: 'white' }} />
            </Collapse>

            {/* Employee Section */}
            <ListItem button onClick={handleEmployeeNestedToggle} aria-expanded={nestedEmployeeOpen}>
              <ListItemIcon sx={{ color: 'white' }}>
                <People />
              </ListItemIcon>
              <ListItemText primary="بەڕێوبەرایەتی" sx={getTextStyles()} />
              {nestedEmployeeOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
            </ListItem>
            <Collapse in={nestedEmployeeOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem button component={Link} to="/user">
                  <ListItemText inset primary=" کارمەندەکان" sx={getTextStyles()} />
                </ListItem>
                <ListItem button component={Link} to="/salary">
                  <ListItemText inset primary=" مووچەدان" sx={getTextStyles()} />
                </ListItem>
    
              </List>
              <Divider sx={{ backgroundColor: 'white' }} />
            </Collapse>

            {/* Expenses Section */}
            <ListItem button onClick={handleExpensesNestedToggle} aria-expanded={nestedExpensesOpen}>
              <ListItemIcon sx={{ color: 'white' }}>
                <AccountBalanceWallet />
              </ListItemIcon>
              <ListItemText primary="مەسرووفات" sx={getTextStyles()} />
              {nestedExpensesOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
            </ListItem>
            <Collapse in={nestedExpensesOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem button component={Link} to="/expenses">
                  <ListItemText inset primary="تۆمارکردن" sx={getTextStyles()} />
                </ListItem>
                <ListItem button component={Link} to="/expenses/category">
                  <ListItemText inset primary="گرووپەکان" sx={getTextStyles()} />
                </ListItem>
              </List>
              <Divider sx={{ backgroundColor: 'white' }} />
            </Collapse>


            {/* Company Section */}
            <ListItem button onClick={handleCompanyNestedToggle} aria-expanded={nestedCompanyOpen}>
              <ListItemIcon sx={{ color: 'white' }}>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="ڕێکخستن" sx={getTextStyles()} />
              {nestedCompanyOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
            </ListItem>
            <Collapse in={nestedCompanyOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem button component={Link} to="/company/">
                  <ListItemText inset primary="زانیاری کۆمپانیا" sx={getTextStyles()} />
                </ListItem>
                <ListItem button component={Link} to="/city/">
                  <ListItemText inset primary="شارەکان" sx={getTextStyles()} />
                </ListItem>
  
   
                <ListItem button component={Link} to="/branch/">
                  <ListItemText inset primary="لقەکان" sx={getTextStyles()} />
                </ListItem>
                <ListItem button component={Link} to="/table/">
                  <ListItemText inset primary="مێزەکان" sx={getTextStyles()} />
                </ListItem>
                  <ListItem button component={Link} to="/printer/">
                  <ListItemText inset primary="پرینتەرەکان" sx={getTextStyles()} />
                </ListItem>
                   <ListItem button component={Link} to="/company-delivery/">
                  <ListItemText inset primary="کۆمپانیاکانی گەیاندن" sx={getTextStyles()} />
                </ListItem>
  
              </List>
              <Divider sx={{ backgroundColor: 'white' }} />
            </Collapse>
          </List>
        </Box>
        <ListItem button onClick={handleLogout} sx={{ cursor: 'pointer' }}>
          <ListItemIcon sx={{ color: 'white' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="چوونەدەرەوە" sx={{ color: 'white' }} />
        </ListItem>
      </Drawer>
    </>
  );
};

export default Sidebar;