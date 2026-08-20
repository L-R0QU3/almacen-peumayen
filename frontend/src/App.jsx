import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Carga diferida por ruta (Mobile First: bundle inicial pequeño)
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ProductsPage = lazy(() => import('./pages/ProductsPage.jsx'));
const InventoryPage = lazy(() => import('./pages/InventoryPage.jsx'));
const CustomersPage = lazy(() => import('./pages/CustomersPage.jsx'));
const QuotationsPage = lazy(() => import('./pages/QuotationsPage.jsx'));
const ConfigPage = lazy(() => import('./pages/ConfigPage.jsx'));
const ModulesPage = lazy(() => import('./pages/ModulesPage.jsx'));

function withSuspense(node) {
  return <Suspense fallback={<Spinner />}>{node}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={withSuspense(<HomePage />)} />
        <Route path="/products" element={withSuspense(<ProductsPage />)} />
        <Route path="/inventory" element={withSuspense(<InventoryPage />)} />
        <Route path="/customers" element={withSuspense(<CustomersPage />)} />
        <Route path="/quotations" element={withSuspense(<QuotationsPage />)} />
        <Route path="/config" element={withSuspense(<ConfigPage />)} />
        <Route path="/modules" element={withSuspense(<ModulesPage />)} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
