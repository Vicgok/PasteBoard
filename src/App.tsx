import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login, Dashboard, Billing } from './pages';
import AppLayoutWrapper from './components/layout/AppLayoutWrapper';

const App = () => {
  return (
    <BrowserRouter>
      <AppLayoutWrapper>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<Billing />} />
        </Routes>
      </AppLayoutWrapper>
    </BrowserRouter>
  );
};

export default App;
