import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const [productTypes, setProductTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const capitalize = str => 
    str ? str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

  const fetchProductTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-types`);
      if (!response.ok) throw new Error('Failed to fetch product types');
      const data = await response.json();
      setProductTypes(data.map(t => t.product_type));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = async () => {
    // Allow search if either product type is selected OR name is entered
    if (selectedType === 'all' && !searchName.trim()) {
      setError('Please select a product type or enter a product name');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      if (searchName.trim()) {
        params.append('name', searchName.trim());
      }

      const url = `${API_BASE_URL}/api/search?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to search products');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when product type changes (and name is optional)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedType !== 'all') {
        handleSearch();
      }
    }, 300); // Debounce to avoid too many requests

    return () => clearTimeout(timeoutId);
  }, [selectedType]);

  // Auto-search when search name changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchName.trim()) {
        handleSearch();
      } else if (selectedType !== 'all') {
        // If name is cleared but type is selected, still show results for type
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchName]);

  const handleViewGodown = (godownId) => {
    navigate(`/view-stocks/${godownId}`);
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 pt-16">
        <div className="max-w-6xl mobile:w-96 mx-auto mt-10">
          <h2 className="text-2xl mobile:text-xl text-center font-bold text-gray-900 dark:text-gray-100 mb-6 mobile:mb-4">
            Search Products Across Godowns
          </h2>
          {error && <div className="mb-4 text-red-600 dark:text-red-400 text-center">{error}</div>}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="flex-1 rounded-md px-3 py-2 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
            >
              <option value="all">All Product Types</option>
              {productTypes.map(t => (
                <option key={t} value={t}>{capitalize(t)}</option>
              ))}
            </select>
            <input
              type="text"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              placeholder="Enter product name (optional)..."
              className="flex-1 rounded-md px-3 py-2 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
            />
            <button
              onClick={handleSearch}
              disabled={loading || (selectedType === 'all' && !searchName.trim())}
              className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Product Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Brand</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Godown</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Cases Available</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((r, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{r.productname}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{capitalize(r.brand)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{capitalize(r.godown_name)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{r.current_cases}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleViewGodown(r.godown_id)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
              {selectedType === 'all' && !searchName.trim()
                ? 'Select a product type or enter a name to search.'
                : 'No results found.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}