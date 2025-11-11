import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaSpinner, FaTrash } from 'react-icons/fa';
import Select from 'react-select';

export default function Godown() {
  const [godowns, setGodowns] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [rows, setRows] = useState([
    { id: Date.now(), godown: null, product: null, cases: '' }
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [newGodownName, setNewGodownName] = useState('');

  /* ---------- STYLES ---------- */
  const styles = {
    input: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(2,132,199,0.3)",
    },
    button: {
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(125,211,252,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
    },
  };

  const capitalize = (str) =>
    str ? str.toLowerCase().split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : '';

  /* ---------- FETCH ---------- */
  const fetchGodowns = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setGodowns(data.map(g => ({ value: g.id, label: capitalize(g.name) })));
    } catch { setError('Failed to load godowns'); }
  }, []);

  const fetchAllProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAllProducts(data.map(p => ({
        value: p.id,
        label: `${p.productname} (${capitalize(p.brand || '')})`,
        productname: p.productname,
        brand: p.brand,
        per_case: p.per_case,
        product_type: p.product_type,
      })));
    } catch { setError('Failed to load products'); }
  }, []);

  useEffect(() => {
    fetchGodowns();
    fetchAllProducts();
  }, [fetchGodowns, fetchAllProducts]);

  /* ---------- CREATE GODOWN ---------- */
  const handleCreateGodown = async () => {
    if (!newGodownName.trim()) return setError('Name required');
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGodownName.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setSuccess('Godown created');
      setNewGodownName('');
      await fetchGodowns();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  /* ---------- ROW MANAGEMENT ---------- */
  const addRow = () => {
    setRows(prev => [...prev, { id: Date.now(), godown: null, product: null, cases: '' }]);
  };

  const removeRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const calculateItems = (product, cases) => {
    if (!product || !cases) return 0;
    const c = parseInt(cases, 10);
    return isNaN(c) ? 0 : product.per_case * c;
  };

  /* ---------- BULK ADD STOCK ---------- */
  const handleBulkAddStock = async () => {
    const validRows = rows.filter(r => r.godown && r.product && r.cases && parseInt(r.cases, 10) > 0);
    if (validRows.length === 0) return setError('Add at least one valid row');

    setLoading(true); setError(''); setSuccess('');

    const payload = {
      allocations: validRows.map(r => ({
        godown_id: r.godown.value,
        product_type: r.product.product_type,
        productname: r.product.productname,
        brand: r.product.brand,
        per_case: r.product.per_case,
        cases_added: parseInt(r.cases, 10),
      })),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/bulk-allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message ?? 'Failed');
      setSuccess(`Added stock to ${validRows.length} allocation(s)!`);
      setRows([{ id: Date.now(), godown: null, product: null, cases: '' }]);
      await fetchGodowns();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  /* ---------- SELECT STYLES ---------- */
  const customSelectStyles = {
    control: (p, s) => ({
      ...p,
      background: styles.input.background,
      border: `1px solid ${s.isFocused ? 'rgba(59,130,246,0.8)' : styles.input.border}`,
      boxShadow: s.isFocused ? '0 0 0 1px rgba(59,130,246,0.8)' : 'none',
      backdropFilter: 'blur(10px)',
      borderRadius: '0.5rem',
      minHeight: '36px',
      fontSize: '0.875rem',
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
      backgroundColor: s.isSelected ? 'rgba(2,132,199,0.2)' : s.isFocused ? 'rgba(2,132,199,0.1)' : 'transparent',
      color: s.isSelected ? '#1e40af' : 'inherit',
      fontSize: '0.875rem',
      padding: '6px 10px',
    }),
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-4 pt-16 overflow-auto">
        <div className="hundred:max-w-5xl mx-auto mobile:max-w-full">
          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4 mobile:text-lg">
            Godown & Stock Allocation
          </h2>

          {error && (
            <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-xs text-center mobile:text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-xs text-center mobile:text-xs">
              {success}
            </div>
          )}

          <div className="space-y-6">

            {/* ---- CREATE GODOWN ---- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mobile:p-3">
              <h3 className="text-md font-semibold mb-2 text-black dark:text-white mobile:text-sm">Create Godown</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGodownName}
                  onChange={e => setNewGodownName(e.target.value)}
                  placeholder="Name"
                  className="flex-1 rounded px-2 py-1.5 text-xs border mobile:py-2 mobile:text-sm"
                  style={styles.input}
                  disabled={loading}
                />
                <button
                  onClick={handleCreateGodown}
                  disabled={loading}
                  className="px-3 py-1.5 rounded text-white text-xs font-medium flex items-center gap-1 disabled:opacity-50 mobile:justify-center mobile:py-2"
                  style={styles.button}
                >
                  {loading ? <FaSpinner className="animate-spin h-3 w-3" /> : <FaPlus className="h-3 w-3" />}
                  Add
                </button>
              </div>
            </div>

            {/* ---- ALLOCATION CARDS ---- */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold text-black dark:text-white mobile:text-sm">Allocate Stock</h3>
              </div>

              {rows.map((row, idx) => (
                <div
                  key={row.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mobile:p-3"
                >
                  {/* Godown */}
                  <div className="mb-3">
                    <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Godown {rows.length > 1 && `#${idx + 1}`}
                    </label>
                    <Select
                      value={row.godown}
                      onChange={val => updateRow(row.id, 'godown', val)}
                      options={godowns}
                      placeholder="Select godown..."
                      isSearchable
                      styles={customSelectStyles}
                      isDisabled={loading}
                      menuPortalTarget={document.body}
                    />
                  </div>

                  {/* Product */}
                  <div className="mb-3">
                    <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Product
                    </label>
                    <Select
                      value={row.product}
                      onChange={val => updateRow(row.id, 'product', val)}
                      options={allProducts}
                      placeholder="Select product..."
                      isSearchable
                      styles={customSelectStyles}
                      isDisabled={loading}
                      menuPortalTarget={document.body}
                    />
                  </div>

                  {/* Cases & Total */}
                  <div className="grid grid-cols-2 gap-3 mobile:grid-cols-1">
                    <div>
                      <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cases
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={row.cases}
                        onChange={e => updateRow(row.id, 'cases', e.target.value)}
                        placeholder="0"
                        className="w-full rounded px-2 py-1.5 text-md border mobile:text-sm"
                        style={styles.input}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Items
                      </label>
                      <p className="text-md font-bold text-blue-600 dark:text-blue-400 mobile:text-base">
                        {calculateItems(row.product, row.cases).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Remove Button */}
                  {rows.length > 1 && (
                    <div className="mt-3 text-right flex justify-center">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:text-red-800 text-lg flex items-center gap-1"
                        disabled={loading}
                      >
                        <FaTrash className="h-4 w-4 mobile:h-2.5 mobile:w-2.5" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div className='flex justify-center'>
                <button
                  onClick={addRow}
                  className="px-3 py-1.5 rounded text-white text-md font-medium flex items-center gap-1 mobile:px-2 mobile:py-1.5"
                  style={styles.button}
                  disabled={loading}
                >
                  <FaPlus className="h-3 w-3 mobile:h-2.5 mobile:w-2.5" /> Add Row
                </button>
              </div>

              {/* Submit */}
              <button
                onClick={handleBulkAddStock}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 mobile:text-sm mobile:py-2"
                style={styles.button}
              >
                {loading ? (
                  <>Adding... <FaSpinner className="animate-spin h-3 w-3" /></>
                ) : (
                  'Add All Allocations'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}