import { Routes, Route } from 'react-router-dom';
import Login from './Admin/Login/Login';
import Inventory from './Admin/Inventory/Inventory';
import List from './Admin/List/List';
import { ProtectedRoute, AdminOnlyRoute } from './ProtectedRoute';
import Godown from './Admin/Godown/Godown';
import ViewStock from './Admin/Godown/ViewStock';
import GodownDetail from './Admin/Godown/GodownDetail';
import Analysis from './Admin/Analysis/Analysis';
import Search from './Admin/Search/Search';
import GodownAnalytics from './Admin/Godownanalytics/GodownAnalytics';
import Profile from './Admin/Login/Profile';
import Booking from './Admin/Booking/Booking';
import AllBookings from './Admin/Booking/Allbookings';
import Ledger from './Admin/Ledger/Ledger'
import Admin from './Admin/Ledger/Admin'
import Dispatch from './Admin/Ledger/Dispatchs'
import Pendingpayments from './Admin/Ledger/Pendingpayments'

const AllRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />

      {/* Any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/listing" element={<List />} />
        <Route path="/godown" element={<Godown />} />
        <Route path="/viewstock" element={<ViewStock />} />
        <Route path="/view-stocks/:godownId" element={<GodownDetail />} />
        <Route path="/search" element={<Search />} />
      </Route>

      {/* Admin only */}
      <Route element={<AdminOnlyRoute />}>
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/analytics" element={<GodownAnalytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/book" element={<Booking />} />
        <Route path="/allbookings" element={<AllBookings />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/adm" element={<Admin />} />
        <Route path="/payments" element={<Pendingpayments />} />
        <Route path="/dispatch" element={<Dispatch />} />
      </Route>
    </Routes>
  );
};

export default AllRoutes;