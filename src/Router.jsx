import { Routes, Route } from 'react-router-dom';
import Login from './Admin/Login/Login';
import Inventory from './Admin/Inventory/Inventory';
import List from './Admin/List/List';
import ProtectedRoute from './ProtectedRoute';
import Godown from './Admin/Godown/Godown';
import ViewStock from './Admin/Godown/ViewStock';
import GodownDetail from './Admin/Godown/GodownDetail';
import Analysis from './Admin/Analysis/Analysis';
import Search from './Admin/Search/Search';

const AllRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/listing" element={<List />} />
        <Route path="/godown" element={<Godown />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/viewstock" element={<ViewStock />} />
        <Route path="/view-stocks/:godownId" element={<GodownDetail />} />
        <Route path="/search" element={<Search />} />
      </Route>
    </Routes>
  );
};

export default AllRoutes;
