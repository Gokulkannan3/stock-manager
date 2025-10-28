// src/Components/Godown/Godown.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaSpinner } from 'react-icons/fa';

export default function Godown() {
  const [godowns, setGodowns] = useState([]);
  const [newGodownName, setNewGodownName] = useState('');
  const [selectedGodown, setSelectedGodown] = useState('');
  const [productTypes, setProductTypes] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [casesAdded, setCasesAdded] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = {
    input: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))",
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(2,132,199,0.3)",
      borderDark: "1px solid rgba(59,130,246,0.4)",
    },
    button: {
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(125,211,252,0.4)",
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
    },
  };

  // Safe capitalize function
  const capitalize = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const fetchGodowns = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns`);
      if (!response.ok) throw new Error('Failed to fetch godowns');
      const data = await response.json();
      setGodowns(data);
    } catch (err) {
      setError('Failed to load godowns');
    }
  }, []);

  const fetchProductTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-types`);
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setProductTypes(data.map(item => item.product_type).filter(Boolean));
    } catch (err) {
      setError('Failed to load types');
    }
  }, []);

  const fetchProductsByType = async (type) => {
    if (!type) {
      setProducts([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${type}`);
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
    }
  };

  useEffect(() => {
    fetchGodowns();
    fetchProductTypes();
  }, [fetchGodowns, fetchProductTypes]);

  const handleCreateGodown = async () => {
    if (!newGodownName.trim()) return setError('Name required');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGodownName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Godown created');
      setNewGodownName('');
      await fetchGodowns();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedGodown || !selectedProductType || !selectedProduct || !casesAdded) {
      return setError('All fields required');
    }
    const casesNum = parseInt(casesAdded, 10);
    if (isNaN(casesNum) || casesNum <= 0) return setError('Valid cases required');

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { productname, brand } = JSON.parse(selectedProduct);
      const res = await fetch(`${API_BASE_URL}/api/godowns/${selectedGodown}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          godown_id: selectedGodown,
          product_type: selectedProductType,
          productname,
          brand,
          cases_added: casesNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccess('Stock added!');
      setCasesAdded('');
      setSelectedProduct('');
      await fetchGodowns();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalItems = () => {
    if (!selectedProduct || !casesAdded) return '—';
    const cases = parseInt(casesAdded, 10);
    if (isNaN(cases) || cases <= 0) return '—';
    try {
      const { productname, brand } = JSON.parse(selectedProduct);
      const product = products.find(p => p.productname === productname && p.brand === brand);
      return product ? product.per_case * cases : '—';
    } catch {
      return '—';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-4 pt-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">Godown & Stock</h2>

          {/* Messages */}
          {error && <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-xs text-center">{error}</div>}
          {success && <div className="mb-3 p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-xs text-center">{success}</div>}

          <div className="space-y-6">

            {/* Create Godown */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-md font-semibold mb-2 text-black dark:text-white">Create Godown</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGodownName}
                  onChange={(e) => setNewGodownName(e.target.value)}
                  placeholder="Name"
                  className="flex-1 rounded px-2 py-1.5 text-xs border"
                  style={styles.input}
                  disabled={loading}
                />
                <button
                  onClick={handleCreateGodown}
                  disabled={loading}
                  className="px-3 py-1.5 rounded text-white text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                  style={styles.button}
                >
                  {loading ? <FaSpinner className="animate-spin h-3 w-3" /> : <FaPlus className="h-3 w-3" />}
                  Add
                </button>
              </div>
            </div>

            {/* Add Stock Form */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-md font-semibold mb-3 text-black dark:text-white">Add Stock</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block mb-1 text-black dark:text-white">Godown</label>
                  <select
                    value={selectedGodown}
                    onChange={(e) => setSelectedGodown(e.target.value)}
                    className="w-full rounded px-2 py-1.5 border text-sm"
                    style={styles.input}
                    disabled={loading}
                  >
                    <option value="">Select</option>
                    {godowns.map(g => (
                      <option key={g.id} value={g.id}>{capitalize(g.name || '')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-black dark:text-white">Type</label>
                  <select
                    value={selectedProductType}
                    onChange={(e) => {
                      setSelectedProductType(e.target.value);
                      setSelectedProduct('');
                      fetchProductsByType(e.target.value);
                    }}
                    className="w-full rounded px-2 py-1.5 border text-sm"
                    style={styles.input}
                    disabled={loading}
                  >
                    <option value="">Select</option>
                    {productTypes.map(t => (
                      <option key={t} value={t}>{capitalize(t)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-black dark:text-white">Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full rounded px-2 py-1.5 border text-sm"
                    style={styles.input}
                    disabled={loading || !selectedProductType}
                  >
                    <option value="">Select</option>
                    {products.map(p => (
                      <option
                        key={`${p.productname}-${p.brand}`}
                        value={JSON.stringify({ productname: p.productname, brand: p.brand })}
                      >
                        {p.productname} ({capitalize(p.brand || '')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-black dark:text-white">Cases</label>
                  <input
                    type="number"
                    value={casesAdded}
                    onChange={(e) => setCasesAdded(e.target.value)}
                    placeholder="10"
                    min="1"
                    className="w-full rounded px-2 py-1.5 border text-sm"
                    style={styles.input}
                    disabled={loading}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1 text-black dark:text-white">Total Items</label>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{calculateTotalItems()}</p>
                </div>
              </div>

              <button
                onClick={handleAddStock}
                disabled={loading || !selectedGodown || !selectedProduct}
                className="mt-3 w-full px-4 py-2 rounded text-white text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                style={styles.button}
              >
                {loading ? (
                  <>Adding... <FaSpinner className="animate-spin h-3 w-3" /></>
                ) : (
                  'Add Stock'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}