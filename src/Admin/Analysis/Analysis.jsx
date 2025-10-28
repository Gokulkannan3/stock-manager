// src/Admin/StockAnalysis/StockAnalysis.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import * as XLSX from 'xlsx';
import { FaDownload, FaExclamationTriangle, FaEye } from 'react-icons/fa';
import Modal from 'react-modal';

Modal.setAppElement('#root');

export default function StockAnalysis() {
  const [data, setData] = useState({
    allRows: [],
    lowStock: [],
    godownSummary: [],
    productSummary: [],
    grandTotal: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lowStockModal, setLowStockModal] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/stock-analysis`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(setData)
      .catch(e => setError(e.message || e))
      .finally(() => setLoading(false));
  }, []);

  const capitalize = (s) => {
    if (!s || typeof s !== 'string') return '';
    return s
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: All Stock
    const allWS = XLSX.utils.json_to_sheet(
      data.allRows.map((r, i) => ({
        '#': i + 1,
        Godown: capitalize(r.godown_name),
        Type: capitalize(r.product_type),
        Product: r.productname,
        Brand: capitalize(r.brand),
        Cases: r.cases,
        'Per Case': r.per_case,
        'Total Qty': r.total_qty,
      }))
    );
    XLSX.utils.book_append_sheet(wb, allWS, 'All Stock');

    // Sheet 2: Low Stock
    const lowWS = XLSX.utils.json_to_sheet(
      data.lowStock.map((r, i) => ({
        '#': i + 1,
        Type: capitalize(r.product_type),
        Product: r.productname,
        Brand: capitalize(r.brand),
        'Total Cases': r.total_cases,
      }))
    );
    XLSX.utils.book_append_sheet(wb, lowWS, 'Low Stock');

    // Sheet 3: Godown Summary
    const godownWS = XLSX.utils.json_to_sheet(
      data.godownSummary.map((r, i) => ({
        '#': i + 1,
        Godown: capitalize(r.godown_name),
        'Total Cases': r.total_cases,
      }))
    );
    XLSX.utils.book_append_sheet(wb, godownWS, 'Godown Totals');

    // Sheet 4: Product Summary
    const productWS = XLSX.utils.json_to_sheet(
      data.productSummary.map((r, i) => ({
        '#': i + 1,
        Type: capitalize(r.product_type),
        Product: r.productname,
        Brand: capitalize(r.brand),
        'Total Cases': r.total_cases,
        'Total Qty': r.total_qty,
      }))
    );
    XLSX.utils.book_append_sheet(wb, productWS, 'Product Totals');

    XLSX.writeFile(wb, `Stock_Analysis_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading) return <div className="p-8 text-center">Loading analysis...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 pt-20">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Stock Analysis Dashboard
            </h1>
            <button
              onClick={downloadExcel}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-md font-medium shadow hover:from-indigo-600 hover:to-purple-700"
            >
              <FaDownload /> Download Full Report
            </button>
          </div>

          {/* Low Stock Alert - Only show if lowStock exists */}
          {data.lowStock.length > 0 && (
            <div className="mb-8 p-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FaExclamationTriangle className="text-red-600 text-xl" />
                  <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
                    Low Stock Alert
                  </h2>
                </div>
                <button
                  onClick={() => setLowStockModal(true)}
                  className="flex items-center gap-1 text-red-700 dark:text-red-300 hover:underline"
                >
                  <FaEye /> View Details
                </button>
              </div>
              <p className="text-sm text-black dark:text-white">
                {`${data.lowStock.length} product(s) with less than 3 cases total across all godowns.`}
              </p>
            </div>
          )}

          {/* Grand Totals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 rounded-lg text-white">
              <p className="text-sm opacity-80">Unique Products</p>
              <p className="text-3xl font-bold">{data.grandTotal.unique_products}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 rounded-lg text-white">
              <p className="text-sm opacity-80">Total Cases</p>
              <p className="text-3xl font-bold">{data.grandTotal.total_cases}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-lg text-white">
              <p className="text-sm opacity-80">Total Quantity</p>
              <p className="text-3xl font-bold">{data.grandTotal.total_quantity}</p>
            </div>
          </div>

          {/* Godown Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Total Cases per Godown
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Godown</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Cases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.godownSummary.map((g, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-sm text-black dark:text-white">{i + 1}</td>
                      <td className="px-4 py-3 text-sm text-black dark:text-white">{capitalize(g.godown_name)}</td>
                      <td className="px-4 py-3 text-sm text-left font-medium text-indigo-600 dark:text-indigo-400">
                        {g.total_cases}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Summary */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Total Cases per Product (All Godowns)
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Brand</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.productSummary.map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-sm text-black dark:text-white">{i + 1}</td>
                        <td className="px-4 py-3 text-sm text-black dark:text-white">{capitalize(p.product_type)}</td>
                        <td className="px-4 py-3 text-sm text-black dark:text-white">{p.productname}</td>
                        <td className="px-4 py-3 text-sm text-black dark:text-white">{capitalize(p.brand)}</td>
                        <td className="px-4 py-3 text-sm text-left font-medium text-green-600 dark:text-green-400">
                          {p.total_cases}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Low Stock Modal */}
          <Modal
            isOpen={lowStockModal}
            onRequestClose={() => setLowStockModal(false)}
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed inset-0 bg-black/50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-black dark:text-white">
                <FaExclamationTriangle className="text-red-600 " />
                Low Stock Products
              </h3>
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Brand</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Available Cases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.lowStock.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-sm text-black dark:text-white">{item.productname}</td>
                      <td className="px-4 py-2 text-sm text-black dark:text-white">{capitalize(item.brand)}</td>
                      <td className="px-4 py-2 text-sm text-left font-bold text-red-600">
                        {item.total_cases}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-right">
                <button
                  onClick={() => setLowStockModal(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-100 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}