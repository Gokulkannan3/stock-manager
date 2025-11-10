// src/Components/Godown/Godown.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaSpinner } from 'react-icons/fa';
import Select from 'react-select';

export default function Godown() {
  const [godowns, setGodowns] = useState([]);
  const [newGodownName, setNewGodownName] = useState('');
  const [selectedGodown, setSelectedGodown] = useState(null);
  const [allProducts, setAllProducts] = useState([]);   // <-- all products
  const [selectedProduct, setSelectedProduct] = useState(null);
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

  const capitalize = (str) =>
    str ? str
      .toLowerCase()
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') : '';

  /* ---------- FETCH DATA ---------- */
  const fetchGodowns = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns`);
      if (!res.ok) throw new Error('Failed to fetch godowns');
      const data = await res.json();
      setGodowns(data);
    } catch {
      setError('Failed to load godowns');
    }
  }, []);

  // NEW: fetch **all** products in one call
  const fetchAllProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);   // <-- endpoint that returns everything
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAllProducts(data);
    } catch {
      setError('Failed to load products');
    }
  }, []);

  useEffect(() => {
    fetchGodowns();
    fetchAllProducts();
  }, [fetchGodowns, fetchAllProducts]);

  /* ---------- CREATE GODOWN ---------- */
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
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- ADD STOCK ---------- */
  const handleAddStock = async () => {
    if (!selectedGodown || !selectedProduct || !casesAdded) {
      return setError('All fields required');
    }
    const cases = parseInt(casesAdded, 10);
    if (isNaN(cases) || cases <= 0) return setError('Valid cases required');

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/${selectedGodown.value}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          godown_id: selectedGodown.value,
          product_type: selectedProduct.product_type,   // still needed by backend
          productname: selectedProduct.productname,
          brand: selectedProduct.brand,
          cases_added: cases,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccess('Stock added!');
      setCasesAdded('');
      setSelectedProduct(null);
      await fetchGodowns();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalItems = () => {
    if (!selectedProduct || !casesAdded) return '—';
    const cases = parseInt(casesAdded, 10);
    if (isNaN(cases) || cases <= 0) return '—';
    return selectedProduct.per_case * cases;
  };

  /* ---------- react-select styles ---------- */
  const customSelectStyles = {
    control: (p, s) => ({
      ...p,
      background: styles.input.background,
      border: `1px solid ${s.isFocused ? 'rgba(59,130,246,0.8)' : styles.input.border}`,
      boxShadow: s.isFocused ? '0 0 0 1px rgba(59,130,246,0.8)' : 'none',
      backdropFilter: 'blur(10px)',
      borderRadius: '0.5rem',
      minHeight: '38px',
      fontSize: '0.875rem',
      '&:hover': { borderColor: 'rgba(59,130,246,0.8)' },
    }),
    menu: (p) => ({
      ...p,
      background: styles.input.background,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${styles.input.border}`,
      borderRadius: '0.5rem',
      marginTop: '4px',
      zIndex: 50,
    }),
    option: (p, s) => ({
      ...p,
      backgroundColor: s.isSelected
        ? 'rgba(2,132,199,0.2)'
        : s.isFocused
        ? 'rgba(2,132,199,0.1)'
        : 'transparent',
      color: s.isSelected ? '#1e40af' : 'inherit',
      fontSize: '0.875rem',
      padding: '8px 12px',
    }),
    singleValue: (p) => ({ ...p, color: 'inherit' }),
    placeholder: (p) => ({ ...p, color: '#9ca3af' }),
    dropdownIndicator: (p) => ({
      ...p,
      color: '#6b7280',
      '&:hover': { color: '#374151' },
    }),
  };

  /* ---------- Options for react-select ---------- */
  const godownOptions = godowns.map(g => ({
    value: g.id,
    label: capitalize(g.name || ''),
  }));

  const productOptions = allProducts.map(p => ({
    value: p.id,
    label: `${p.productname} (${capitalize(p.brand || '')})`,
    productname: p.productname,
    brand: p.brand,
    per_case: p.per_case,
    product_type: p.product_type,   // keep for payload
  }));

  /* ---------- JSX ---------- */
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-4 pt-16">
        <div className="max-w-4xl mx-auto">

          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
            Godown & Stock
          </h2>

          {error && (
            <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-xs text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-xs text-center">
              {success}
            </div>
          )}

          <div className="space-y-6">

            {/* ---- CREATE GODOWN ---- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-md font-semibold mb-2 text-black dark:text-white">
                Create Godown
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGodownName}
                  onChange={e => setNewGodownName(e.target.value)}
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

            {/* ---- ADD STOCK FORM ---- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-md font-semibold mb-3 text-black dark:text-white">
                Add Stock
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">

                {/* Godown */}
                <div>
                  <label className="block mb-1 font-medium text-black dark:text-white">Godown</label>
                  <Select
                    value={selectedGodown}
                    onChange={setSelectedGodown}
                    options={godownOptions}
                    placeholder="Search godown..."
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                    isDisabled={loading}
                  />
                </div>

                {/* Product (searchable, shows brand) */}
                <div>
                  <label className="block mb-1 font-medium text-black dark:text-white">Product</label>
                  <Select
                    value={selectedProduct}
                    onChange={setSelectedProduct}
                    options={productOptions}
                    placeholder="Search product..."
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                    isDisabled={loading}
                    noOptionsMessage={() => 'No products found'}
                  />
                </div>

                {/* Cases */}
                <div>
                  <label className="block mb-1 font-medium text-black dark:text-white">Cases</label>
                  <input
                    type="number"
                    value={casesAdded}
                    onChange={e => setCasesAdded(e.target.value)}
                    placeholder="10"
                    min="1"
                    className="w-full rounded px-2 py-1.5 border text-sm"
                    style={styles.input}
                    disabled={loading}
                  />
                </div>

                {/* Total Items */}
                <div className="sm:col-span-2">
                  <label className="block mb-1 font-medium text-black dark:text-white">Total Items</label>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {calculateTotalItems()}
                  </p>
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