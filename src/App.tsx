import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { FinanceProvider, useFinance } from './store/FinanceContext';
import { Layout } from './components/Layout';
import { AddTransactionModal } from './components/AddTransactionModal';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { Transactions } from './pages/Transactions';
import { CashFlow } from './pages/CashFlow';
import { Reports } from './pages/Reports';
import { Budget } from './pages/Budget';
import { Recurring } from './pages/Recurring';
import { Goals } from './pages/Goals';
import { Investments } from './pages/Investments';
import { Settings } from './pages/Settings';

function ProtectedApp() {
  const { authed } = useFinance();
  const [showAdd, setShowAdd] = useState(false);

  if (!authed) return <Navigate to="/login" replace />;

  return (
    <>
      <Routes>
        <Route element={<Layout onAddTransaction={() => setShowAdd(true)} />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="cash-flow" element={<CashFlow />} />
          <Route path="reports" element={<Reports />} />
          <Route path="budget" element={<Budget />} />
          <Route path="recurring" element={<Recurring />} />
          <Route path="goals" element={<Goals />} />
          <Route path="investments" element={<Investments />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showAdd ? <AddTransactionModal onClose={() => setShowAdd(false)} /> : null}
    </>
  );
}

function AppRoutes() {
  const { authed } = useFinance();
  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppRoutes />
    </FinanceProvider>
  );
}
