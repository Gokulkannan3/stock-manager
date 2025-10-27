import React, { useState, useEffect } from 'react';
import { FiLogOut } from 'react-icons/fi';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import { FaPlus } from 'react-icons/fa';
import Logout from '../Logout';

export default function Inventory() {
  const [focused, setFocused] = useState({});
  const [values, setValues] = useState({ productName: '', price: '', caseCount: '', perCase: '', brand: '' });
  const [productType, setProductType] = useState('');
  const [newProductType, setNewProductType] = useState('');
  const [productTypes, setProductTypes] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const styles = {
    input: { 
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", 
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)", 
      border: "1px solid rgba(2,132,199,0.3)", 
      borderDark: "1px solid rgba(59,130,246,0.4)"
    },
    button: { 
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", 
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)", 
      border: "1px solid rgba(125,211,252,0.4)", 
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-types`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch product types');
      const validTypes = data
        .filter(item => item && item.product_type && typeof item.product_type === 'string')
        .map(item => item.product_type);
      setProductTypes(validTypes);
    } catch (err) {
      console.error('Error fetching product types:', err);
      setError(err.message);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/brands`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch brands');
      const validBrands = data
        .filter(item => item && item.name && typeof item.name === 'string')
        .map(item => item.name);
      setBrands(validBrands);
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchProductTypes();
    fetchBrands();
    const intervalId = setInterval(() => {
      fetchProductTypes();
      fetchBrands();
    }, 180000);
    return () => clearInterval(intervalId);
  }, []);

  const handleFocus = (inputId) => {
    setFocused((prev) => ({ ...prev, [inputId]: true }));
  };

  const handleBlur = (inputId) => {
    setFocused((prev) => ({ ...prev, [inputId]: values[inputId] !== '' }));
  };

  const handleChange = (inputId, event) => {
    setValues((prev) => ({ ...prev, [inputId]: event.target.value }));
  };

  const handleProductTypeChange = (event) => {
    setProductType(event.target.value);
    setValues({ productName: '', price: '', caseCount: '', perCase: '', brand: '' });
    setFocused({});
    setError('');
    setSuccess('');
  };

  const handleNewProductTypeChange = (event) => {
    setNewProductType(event.target.value);
  };

  const handleNewBrandChange = (event) => {
    setNewBrand(event.target.value);
  };

  const handleCreateBrand = async () => {
    if (!newBrand) {
      setError('Brand name is required');
      return;
    }
    const formattedBrand = newBrand.toLowerCase().replace(/\s+/g, '_');
    if (brands.includes(formattedBrand)) {
      setError('Brand already exists');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: formattedBrand }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create brand');
      setBrands([...brands, formattedBrand]);
      setNewBrand('');
      setSuccess('Brand created successfully!');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateProductType = async () => {
    if (!newProductType) {
      setError('Product type name is required');
      return;
    }
    const formattedProductType = newProductType.toLowerCase().replace(/\s+/g, '_');
    if (productTypes.includes(formattedProductType)) {
      setError('Product type already exists');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_type: formattedProductType }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create product type');
      setProductTypes([...productTypes, formattedProductType]);
      setNewProductType('');
      setSuccess('Product type created successfully!');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!values.productName || !values.price || !values.caseCount || !values.perCase || !values.brand || !productType) {
      setError('Please fill in all required fields');
      return;
    }
  
    const payload = {
      productname: values.productName,
      price: values.price,
      case_count: values.caseCount,
      per_case: values.perCase,
      brand: values.brand,
      product_type: productType,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to save product');

      setSuccess('Product saved successfully!');
      setValues({ productName: '', price: '', caseCount: '', perCase: '', brand: '' });
      event.target.reset();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatProductTypeDisplay = (type) => {
    if (!type || typeof type !== 'string') return 'Unknown Type';
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatBrandDisplay = (brand) => {
    if (!brand || typeof brand !== 'string') return 'Unknown Brand';
    return brand
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderFormFields = () => {
    if (!productType) return null;
    return (
      <>
        <div className="sm:col-span-3">
          <label htmlFor="product-name" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Product Name*
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="product-name"
              required
              value={values.productName || ''}
              onChange={(e) => handleChange('productName', e)}
              onFocus={() => handleFocus('productName')}
              onBlur={() => handleBlur('productName')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="price" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Price (INR)*
          </label>
          <div className="mt-2">
            <input
              type="number"
              id="price"
              required
              min="0"
              step="0.01"
              value={values.price || ''}
              onChange={(e) => handleChange('price', e)}
              onFocus={() => handleFocus('price')}
              onBlur={() => handleBlur('price')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="case-count" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Case Count*
          </label>
          <div className="mt-2">
            <input
              type="number"
              id="case-count"
              required
              min="0"
              step="1"
              value={values.caseCount || ''}
              onChange={(e) => handleChange('caseCount', e)}
              onFocus={() => handleFocus('caseCount')}
              onBlur={() => handleBlur('caseCount')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="per-case" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Per Case*
          </label>
          <div className="mt-2">
            <input
              type="number"
              id="per-case"
              required
              min="0"
              step="1"
              value={values.perCase || ''}
              onChange={(e) => handleChange('perCase', e)}
              onFocus={() => handleFocus('perCase')}
              onBlur={() => handleBlur('perCase')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="brand" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Brand*
          </label>
          <div className="mt-2">
            <select
              id="brand"
              required
              value={values.brand || ''}
              onChange={(e) => handleChange('brand', e)}
              onFocus={() => handleFocus('brand')}
              onBlur={() => handleBlur('brand')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            >
              <option value="">Select</option>
              {brands.map(brand => (
                <option key={brand} value={brand} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                  {formatBrandDisplay(brand)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 pt-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl text-center font-bold text-gray-900 dark:text-gray-100 mb-6">Add Items</h2>
          {error && <div className="mb-4 text-red-600 dark:text-red-400 text-sm text-center">{error}</div>}
          {success && <div className="mb-4 text-green-600 dark:text-green-400 text-sm text-center">{success}</div>}
          <div className="space-y-8">
            <div className="border-b border-gray-900/10 dark:border-gray-700 pb-8">
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="new-brand" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Create New Brand
                  </label>
                  <div className="mt-2 flex gap-x-4">
                    <input
                      type="text"
                      id="new-brand"
                      value={newBrand}
                      onChange={handleNewBrandChange}
                      className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                      style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                      placeholder="Enter brand name"
                    />
                    <button
                      type="button"
                      onClick={handleCreateBrand}
                      className="rounded-full w-8 h-7 flex justify-center items-center text-white dark:text-gray-100 font-semibold shadow-xs hover:bg-gray-900 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-blue-500"
                      style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                    >
                      <FaPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="new-product-type" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Create New Product Type
                  </label>
                  <div className="mt-2 flex gap-x-4">
                    <input
                      type="text"
                      id="new-product-type"
                      value={newProductType}
                      onChange={handleNewProductTypeChange}
                      className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                      style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                      placeholder="Enter product type name"
                    />
                    <button
                      type="button"
                      onClick={handleCreateProductType}
                      className="rounded-full w-8 h-7 flex justify-center items-center text-white dark:text-gray-100 font-semibold shadow-xs hover:bg-gray-900 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-blue-500"
                      style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                    >
                      <FaPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="product-type" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Select Product Type
                  </label>
                  <div className="mt-2">
                    <select
                      id="product-type"
                      value={productType}
                      onChange={handleProductTypeChange}
                      className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                      style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                    >
                      <option value="">Select</option>
                      {productTypes.map(type => (
                        <option key={type} value={type} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                          {formatProductTypeDisplay(type)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            {productType ? (
              <>
                <div className="border-b border-gray-900/10 dark:border-gray-700 pb-8">
                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    {renderFormFields()}
                  </div>
                </div>
                <div className="flex justify-end gap-x-6">
                  <button
                    type="button"
                    className="text-sm cursor-pointer font-semibold text-gray-900 dark:text-gray-100"
                    onClick={() => {
                      setValues({ productName: '', price: '', caseCount: '', perCase: '', brand: '' });
                      setProductType('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="rounded-md cursor-pointer text-white dark:text-gray-100 px-3 py-2 text-sm font-semibold shadow-xs hover:bg-gray-900 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-blue-500"
                    style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center">
                <p className="text-lg text-center font-medium text-gray-900 dark:text-gray-100">
                  Please select or create a product type to add items
                </p>
              </div>
            )}
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