import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/service/ProtectedRoute';

// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Login = lazy(() => import('./pages/Authentication/Login'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

// User management
const UserManagment = lazy(() => import('./pages/User/UserManagment'));
const SalaryManagment = lazy(() => import('./pages/Salary/SalaryManagment'));

// Expenses managment
const ExpensesManagment = lazy(() => import('./pages/Expenses/ExpensesManagment'));
const ExpensesCategoryManagment = lazy(() => import('./pages/Expenses/ExpensesCategoryManagment'));

// Customer management
const CustomerList = lazy(() => import('./pages/Customer/CustomerList'));
const CustomerRegister = lazy(() => import('./pages/Customer/CustomerRegister'));
const CustomerCategoryManagment = lazy(() => import('./pages/Customer/CustomerCategoryManagment'));
const PaymentManagment = lazy(() => import('./pages/Payment/PaymentManagment'));

// Company management
const CompanyManagment = lazy(() => import('./pages/Company/CompanyManagment'));

// City managment
const CityManagment = lazy(() => import('./pages/City/CityManagment'));
const BranchManagment = lazy(() => import('./pages/Branch/BranchRegister'));
const BranchList = lazy(() => import('./pages/Branch/BranchList'));

// Sell invoice

const SellCreate = lazy(() => import('./pages/Sell/SellCreate'));
const SellList = lazy(() => import('./pages/Sell/SellList'));

// item management

const ItemManagment = lazy(() => import('./pages/Item/ItemManagment'));
const ItemCategoryManagment = lazy(() => import('./pages/Item/ItemCategoryManagment'));
const ItemUnitManagment = lazy(() => import('./pages/Item/ItemUnitManagment'));
const ItemTypePriceManagment = lazy(() => import('./pages/Item/ItemTypePriceManagment'));
const ItemDamage = lazy(() => import('./pages/Item/ItemDamageManagment'));


const RoutesComponent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />

        {/* Company management */}
        <Route path="/company" element={<ProtectedRoute element={<CompanyManagment />} />} />
        <Route path="/city" element={<ProtectedRoute element={<CityManagment />} />} />
        <Route path="/branch/register" element={<ProtectedRoute element={<BranchManagment />} />} />
        <Route path="/branch/edit/:id" element={<ProtectedRoute element={<BranchManagment />} />} />

        <Route path="/branch" element={<ProtectedRoute element={<BranchList />} />} />


        {/* Customer category */}
        <Route path="/customer_category" element={<ProtectedRoute element={<CustomerCategoryManagment />} />} />

        {/* Customer management */}
        <Route path="/customer" element={<ProtectedRoute element={<CustomerList />} />} />
        <Route path="/customer/register" element={<ProtectedRoute element={<CustomerRegister />} />} />
        <Route path="/customer/edit/:id" element={<ProtectedRoute element={<CustomerRegister />} />} />
        <Route path="/customer/payment" element={<ProtectedRoute element={<PaymentManagment />} />} />

        {/* Employee management */}
        <Route path="/user" element={<ProtectedRoute element={<UserManagment />} />} />
        {/* Salary management */}
        <Route path="/salary" element={<ProtectedRoute element={<SalaryManagment />} />} />

    {/* Expenses managment */}

        <Route path="/expenses" element={<ProtectedRoute element={<ExpensesManagment />} />} />
        <Route path="/expenses/category" element={<ProtectedRoute element={<ExpensesCategoryManagment />} />} />

        {/* Item management */}
        <Route path="/item" element={<ProtectedRoute element={<ItemManagment />} />} />
        <Route path="/item/category" element={<ProtectedRoute element={<ItemCategoryManagment />} />} />
        <Route path="/item/unit" element={<ProtectedRoute element={<ItemUnitManagment />} />} />
        <Route path="/item/price/type" element={<ProtectedRoute element={<ItemTypePriceManagment />} />} />
        <Route path="/item/damage" element={<ProtectedRoute element={<ItemDamage />} />} />


    {/* Sell Invoice */}

      <Route path="/Sell-invoice/create" element={<ProtectedRoute element={<SellCreate />} />} />
      <Route path="/Sell-invoice/edit/:id" element={<ProtectedRoute element={<SellCreate />} />} />
      <Route path="/Sell-invoice/" element={<ProtectedRoute element={<SellList />} />} />



        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default RoutesComponent;
