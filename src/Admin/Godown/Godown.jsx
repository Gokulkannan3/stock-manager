// src/Components/Godown/Godown.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaPlus } from 'react-icons/fa';

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

  const fetchGodowns = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns`);
      if (!response.ok) throw new Error('Failed to fetch godowns');
      const data = await response.json();
      setGodowns(data);
    } catch (err) {
      setError('Failed to fetch godowns');
      console.error('Error fetching godowns:', err.message);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-types`);
      if (!response.ok) throw new Error('Failed to fetch product types');
      const data = await response.json();
      setProductTypes(data.map(item => item.product_type));
    } catch (err) {
      setError('Failed to fetch product types');
      console.error('Error fetching product types:', err.message);
    }
  };

  const fetchProductsByType = async (type) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${type}`);
      if (!response.ok) throw new Error('Failed to fetch products for type');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch products for type');
      console.error('Error fetching products:', err.message);
    }
  };

  useEffect(() => {
    fetchGodowns();
    fetchProductTypes();
  }, []);

  const handleCreateGodown = async () => {
    if (!newGodownName) {
      setError('Godown name is required');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGodownName }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create godown');
      }
      setSuccess('Godown created successfully');
      setNewGodownName('');
      setError('');
      fetchGodowns();
    } catch (err) {
      setError(err.message);
      console.error('Error creating godown:', err.message);
    }
  };

  const handleAddStock = async () => {
    if (!selectedGodown || !selectedProductType || !selectedProduct || !casesAdded) {
      setError('All fields are required');
      return;
    }
    const casesAddedNum = parseInt(casesAdded, 10);
    if (isNaN(casesAddedNum) || casesAddedNum <= 0) {
      setError('Cases must be a positive number');
      return;
    }
    try {
      const { productname, brand } = JSON.parse(selectedProduct);
      const response = await fetch(`${API_BASE_URL}/api/godowns/${selectedGodown}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          godown_id: selectedGodown,
          product_type: selectedProductType,
          productname,
          brand,
          cases_added: casesAddedNum,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add stock');
      }
      setSuccess('Stock added successfully');
      setSelectedGodown('');
      setSelectedProductType('');
      setSelectedProduct('');
      setCasesAdded('');
      setError('');
      fetchGodowns();
    } catch (err) {
      setError(err.message);
      console.error('Error adding stock:', err.message);
    }
  };

  const capitalize = str => (str ? str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '');

  const calculateTotalItems = () => {
    if (!selectedProduct || !casesAdded) return 'Select product and cases';
    const casesAddedNum = parseInt(casesAdded, 10);
    if (isNaN(casesAddedNum) || casesAddedNum <= 0) return 'Enter valid cases';
    const { productname, brand } = JSON.parse(selectedProduct);
    const product = products.find(p => p.productname === productname && p.brand === brand);
    if (!product) return 'Select product';
    return product.per_case * casesAddedNum;
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 pt-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl text-center font-bold text-gray-900 dark:text-gray-100 mb-6">Add Godown and Stock</h2>
          {error && <div className="mb-4 text-red-600 dark:text-red-400 text-sm text-center">{error}</div>}
          {success && <div className="mb-4 text-green-600 dark:text-green-400 text-sm text-center">{success}</div>}
          <div className="space-y-8">
            <div className="border-b border-gray-900/10 dark:border-gray-700 pb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create Godown</h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="new-godown-name" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Godown Name
                  </label>
                  <div className="mt-2 flex gap-x-4">
                    <input
                      type="text"
                      id="new-godown-name"
                      value={newGodownName}
                      onChange={(e) => setNewGodownName(e.target.value)}
                      className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                      style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                      placeholder="Enter godown name"
                    />
                    <button
                      type="button"
                      onClick={handleCreateGodown}
                      className="rounded-full w-8 h-7 flex justify-center items-center text-white dark:text-gray-100 font-semibold shadow-xs hover:bg-gray-900 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-blue-500"
                      style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                    >
                      <FaPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-b border-gray-900/10 dark:border-gray-700 pb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Add Product to Godown</h3>
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="select-godown" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Select Godown
                  </label>
                  <select
                    id="select-godown"
                    value={selectedGodown}
                    onChange={(e) => setSelectedGodown(e.target.value)}
                    className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                    style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                  >
                    <option value="">Select</option>
                    {godowns.map(g => (
                      <option key={g.id} value={g.id}>{capitalize(g.name)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="select-product-type" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Select Product Type
                  </label>
                  <select
                    id="select-product-type"
                    value={selectedProductType}
                    onChange={(e) => {
                      setSelectedProductType(e.target.value);
                      setSelectedProduct('');
                      if (e.target.value) {
                        fetchProductsByType(e.target.value);
                      } else {
                        setProducts([]);
                      }
                    }}
                    className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                    style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                  >
                    <option value="">Select</option>
                    {productTypes.map(type => (
                      <option key={type} value={type}>{capitalize(type)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="select-product" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Select Product (Brand)
                  </label>
                  <select
                    id="select-product"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                    style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                  >
                    <option value="">Select</option>
                    {products.map(p => (
                      <option key={`${p.productname}-${p.brand}`} value={JSON.stringify({ productname: p.productname, brand: p.brand })}>
                        {`${p.productname} (${capitalize(p.brand)})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="cases-added" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Cases Added
                  </label>
                  <input
                    type="number"
                    id="cases-added"
                    value={casesAdded}
                    onChange={(e) => setCasesAdded(e.target.value)}
                    className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                    style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                    placeholder="Enter cases"
                    min="1"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Total Items
                  </label>
                  <p className="mt-2 text-base text-gray-900 dark:text-gray-100">
                    {calculateTotalItems()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddStock}
                className="mt-4 rounded-md px-3 py-2 text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
                style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        [style*="backgroundDark"] { background: var(--bg, ${styles.input.background}); }
        [style*="backgroundDark"][data-dark] { --bg: ${styles.input.backgroundDark}; }
        [style*="borderDark"] { border: var(--border, ${styles.input.border}); }
        [style*="borderDark"][data-dark] { --border: ${styles.input.borderDark}; }
        [style*="boxShadowDark"] { box-shadow: var(--shadow, ${styles.button.boxShadow}); }
        [style*="boxShadowDark"][data-dark] { --shadow: ${styles.button.boxShadowDark}; }
      `}</style>
    </div>
  );
}