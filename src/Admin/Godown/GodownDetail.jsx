import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaMinus, FaHistory, FaTimes, FaPlus, FaDownload } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { debounce } from 'lodash';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
Modal.setAppElement('#root');
export default function GodownDetail() {
  const { godownId } = useParams();
  const [godown, setGodown] = useState(null);
  const [error, setError] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [casesTaken, setCasesTaken] = useState('');
  const [casesToAdd, setCasesToAdd] = useState('');
  const [stockHistory, setStockHistory] = useState([]);
  const [takeModalIsOpen, setTakeModalIsOpen] = useState(false);
  const [addModalIsOpen, setAddModalIsOpen] = useState(false);
  const [historyModalIsOpen, setHistoryModalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('all');
  const [productTypes, setProductTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTakingStock, setIsTakingStock] = useState(false);
  const cardsPerPage = 20;
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadMode, setDownloadMode] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [historyCache, setHistoryCache] = useState({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showUniqueProductsModal, setShowUniqueProductsModal] = useState(false);
  const [showTotalCasesModal, setShowTotalCasesModal] = useState(false);
  const styles = {
    input: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))',
      backgroundDark: 'linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(2,132,199,0.3)',
      borderDark: '1px solid rgba(59,130,246,0.4)',
    },
    button: {
      background: 'linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))',
      backgroundDark: 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))',
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(125,211,252,0.4)',
      borderDark: '1px solid rgba(147,197,253,0.4)',
      boxShadow: '0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
      boxShadowDark: '0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    },
  };
  const debouncedSetCasesTaken = debounce(v => setCasesTaken(v), 300);
  const debouncedSetCasesToAdd = debounce(v => setCasesToAdd(v), 300);
  const capitalize = str =>
    str ? str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
  const fetchGodown = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/${godownId}/stock`);
      if (!response.ok) throw new Error('Failed to fetch godown details');
      const data = await response.json();
      if (data.length === 0) {
        setGodown({ name: 'Unknown', stocks: [] });
      } else {
        setGodown({ name: data[0].godown_name, stocks: data });
        const uniqueTypes = [...new Set(data.map(s => s.product_type))];
        setProductTypes(uniqueTypes);
      }
      setIsLoadingHistory(true);
      for (const stock of data) {
        if (!historyCache[stock.id]) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/stock/${stock.id}/history`);
            if (res.ok) {
              const hist = await res.json();
              setHistoryCache(prev => ({ ...prev, [stock.id]: hist }));
            }
          } catch (e) {}
        }
      }
      setIsLoadingHistory(false);
    } catch (err) {
      setError(err.message);
      setIsLoadingHistory(false);
    }
  };
  const handleTakeStock = async () => {
    if (!selectedStock?.id || !casesTaken || parseInt(casesTaken) <= 0) return;
    setIsTakingStock(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/stock/take`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: selectedStock.id, cases_taken: parseInt(casesTaken) }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed');
      setTakeModalIsOpen(false);
      setCasesTaken('');
      setSelectedStock(null);
      fetchGodown();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTakingStock(false);
    }
  };
  const handleAddStock = async () => {
    if (!selectedStock?.id || !casesToAdd || parseInt(casesToAdd) <= 0) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/stock/add`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: selectedStock.id, cases_added: parseInt(casesToAdd) }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed');
      setAddModalIsOpen(false);
      setCasesToAdd('');
      setSelectedStock(null);
      fetchGodown();
    } catch (err) {
      setError(err.message);
    }
  };
  const fetchStockHistory = async stockId => {
    if (historyCache[stockId]) {
      setStockHistory(historyCache[stockId]);
      setHistoryModalIsOpen(true);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/${stockId}/history`);
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setHistoryCache(prev => ({ ...prev, [stockId]: data }));
      setStockHistory(data);
      setHistoryModalIsOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };
  const openDownloadModal = () => setShowDownloadModal(true);
  const confirmDownload = () => {
    if (!godown?.stocks?.length) {
      alert('No stock data to export');
      return;
    }
    const allHistory = Object.values(historyCache).flat();
    let filtered = [];
    if (downloadMode === 'all') {
      filtered = allHistory;
    } else if (downloadMode === 'date' && selectedDate) {
      const d = selectedDate.toISOString().split('T')[0];
      filtered = allHistory.filter(h => h.date.startsWith(d));
    } else if (downloadMode === 'month' && selectedMonth) {
      const year = selectedMonth.getFullYear();
      const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      filtered = allHistory.filter(h => h.date.startsWith(prefix));
    }
    if (filtered.length === 0 && downloadMode !== 'all') {
      alert('No history found for the selected filter.');
      return;
    }
    const wb = XLSX.utils.book_new();
    // === 1. CURRENT STOCK SHEET ===
    const currentStockData = godown.stocks
      .filter(s => s.current_cases > 0)
      .map(s => ({
        'Product Type': capitalize(s.product_type),
        'Product Name': s.productname,
        'Brand': capitalize(s.brand || ''),
        'Agent': s.agent_name || '-',
        'Current Cases': s.current_cases,
        'Per Case': s.per_case,
        'Total Items': s.current_cases * s.per_case,
      }));
    if (currentStockData.length > 0) {
      const wsCurrent = XLSX.utils.json_to_sheet(currentStockData);
      XLSX.utils.book_append_sheet(wb, wsCurrent, 'Current Stock');
    }
    // === 2. HISTORY SHEETS BY PRODUCT TYPE ===
    const historyByType = {};
    filtered.forEach(h => {
      const type = capitalize(h.product_type);
      if (!historyByType[type]) historyByType[type] = [];
      historyByType[type].push({
        'Date': new Date(h.date).toLocaleString(),
        'Product': h.productname,
        'Brand': capitalize(h.brand || ''),
        'Action': capitalize(h.action),
        'Cases': h.action === 'added' ? h.cases : -h.cases,
        'Items': h.per_case_total,
        'Agent': h.action === 'added' ? (h.agent_name || '-') : '-',
      });
    });
    for (const type in historyByType) {
      if (historyByType[type].length > 0) {
        const ws = XLSX.utils.json_to_sheet(historyByType[type]);
        const safeName = type.length > 30 ? type.substring(0, 30) : type;
        XLSX.utils.book_append_sheet(wb, ws, safeName);
      }
    }
    if (Object.keys(wb.Sheets).length === 0) {
      alert('No data to export.');
      return;
    }
    const suffix =
      downloadMode === 'all' ? 'all' :
      downloadMode === 'date' ? selectedDate.toISOString().split('T')[0] :
      `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
    XLSX.writeFile(wb, `${godown.name}_stock_${suffix}.xlsx`);
    setShowDownloadModal(false);
    setDownloadMode('all');
    setSelectedDate(null);
    setSelectedMonth(null);
  };
  useEffect(() => {
    fetchGodown();
  }, [godownId]);
  const openTakeModal = stock => {
    setSelectedStock(stock);
    setCasesTaken('');
    setTakeModalIsOpen(true);
  };
  const openAddModal = stock => {
    setSelectedStock(stock);
    setCasesToAdd('');
    setAddModalIsOpen(true);
  };
  const currentStocks = godown ? godown.stocks.filter(s => s.current_cases > 0) : [];
  const previousStocks = godown ? godown.stocks.filter(s => s.current_cases === 0) : [];
  const stocksToDisplay = activeTab === 'current' ? currentStocks : previousStocks;
  const filteredStocks = stocksToDisplay.filter(stock => {
    const matchesSearch = stock.productname.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedProductType === 'all' || stock.product_type === selectedProductType;
    return matchesSearch && matchesType;
  });
  const totalPages = Math.ceil(filteredStocks.length / cardsPerPage);
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredStocks.slice(indexOfFirstCard, indexOfLastCard);
  const uniqueProducts = godown
    ? [...new Set(godown.stocks.map(s => s.productname))].sort()
    : [];
  // FIXED: sum is now defined
    const totalCases = godown
      ? godown.stocks.reduce((sum, s) => sum + s.current_cases, 0)
      : 0;
    // FIXED: Safe fallback if product not found
    const uniqueProductsData = uniqueProducts.map((name, i) => {
      const stock = godown.stocks.find(s => s.productname === name) || {};
      return {
        no: i + 1,
        product_type: capitalize(stock.product_type || 'unknown'),
        name
      };
    });
  const totalCasesData = godown
    ? godown.stocks
        .filter(s => s.current_cases > 0)
        .map(s => ({ productname: s.productname, casecount: s.current_cases }))
        .sort((a, b) => b.casecount - a.casecount)
    : [];
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 pt-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex mobile:flex-col mobile:gap-4 justify-between items-center mb-6 mobile:mb-4">
            <h2 className="text-2xl mobile:text-xl text-center font-bold text-gray-900 dark:text-gray-100">
              View Stocks for {godown ? capitalize(godown.name) : 'Godown'}
            </h2>
            <button
              onClick={openDownloadModal}
              disabled={isLoadingHistory}
              className="flex items-center rounded-md px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
            >
              <FaDownload className="mr-2 h-4 w-4 mobile:h-3 mobile:w-3" />
              {isLoadingHistory ? 'Loading...' : 'Download History'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unique Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{uniqueProducts.length}</p>
              </div>
              <button
                onClick={() => setShowUniqueProductsModal(true)}
                className="text-indigo-600 hover:underline text-sm"
              >
                View
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cases</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCases}</p>
              </div>
              <button
                onClick={() => setShowTotalCasesModal(true)}
                className="text-indigo-600 hover:underline text-sm"
              >
                View
              </button>
            </div>
          </div>
          {error && <div className="mb-4 text-red-600 dark:text-red-400 text-center">{error}</div>}
          <div className="mb-6 mobile:mb-4 flex mobile:flex-col mobile:gap-4 justify-between items-center">
            <select
              value={selectedProductType}
              onChange={e => setSelectedProductType(e.target.value)}
              className="w-64 mobile:w-full rounded-md px-3 py-1.5 mobile:px-2 mobile:py-1 text-base mobile:text-sm text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
              style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
            >
              <option value="all">All Product Types</option>
              {productTypes.map(t => (
                <option key={t} value={t}>{capitalize(t)}</option>
              ))}
            </select>
          </div>
          <div className="mb-6 mobile:mb-4">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-sm font-medium ${activeTab === 'current' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('current')}
              >
                Current Stock
              </button>
              <button
                className={`px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-sm font-medium ${activeTab === 'previous' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('previous')}
              >
                Previous Stock
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile:gap-4">
            {currentCards.map(s => (
              <div key={s.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mobile:p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col">
                  <div className="mb-3 mobile:mb-2">
                    <h3 className="text-md mobile:text-md font-semibold text-gray-900 dark:text-gray-100 truncate">{s.productname}</h3>
                    <p className="text-sm mobile:text-sm text-gray-600 dark:text-gray-400">{capitalize(s.product_type)}</p>
                    <div className="flex gap-5">
                      <p className="text-sm mobile:text-sm text-sky-300">B - {capitalize(s.brand)}</p>
                      <p className="text-sm mobile:text-sm text-sky-300">A - {s.agent_name || '-'}</p>
                    </div>
                  </div>
                  <div className="mb-4 mobile:mb-2 grid grid-cols-2 gap-2 text-xs mobile:text-[10px]">
                    <div><span className="font-medium text-sm text-gray-700 dark:text-gray-300">Current Cases: {s.current_cases}</span></div>
                    <div><span className="font-medium text-sm text-gray-700 dark:text-gray-300">Per Case: {s.per_case}</span></div>
                  </div>
                  <div className="flex justify-center gap-2 mobile:gap-1">
                    {activeTab === 'current' && (
                      <button
                        onClick={() => openTakeModal(s)}
                        className="flex w-20 justify-center items-center rounded-md px-2 py-1 mobile:px-1 mobile:py-0.5 text-xs mobile:text-lg font-semibold text-white shadow-sm hover:bg-indigo-700"
                        style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                      >
                        Take
                      </button>
                    )}
                    <button
                      onClick={() => openAddModal(s)}
                      className="flex w-20 justify-center items-center rounded-md px-2 py-1 mobile:px-1 mobile:py-0.5 text-xs mobile:text-lg font-semibold text-white shadow-sm hover:bg-indigo-700"
                      style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => fetchStockHistory(s.id)}
                      className="flex w-20 justify-center items-center rounded-md px-2 py-1 mobile:px-1 mobile:py-0.5 text-xs mobile:text-lg font-semibold text-white shadow-sm hover:bg-indigo-700"
                      style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                    >
                      History
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredStocks.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-6 mobile:mt-4">
              No {activeTab === 'current' ? 'current' : 'previous'} stocks available.
            </p>
          )}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-white hover:bg-indigo-700'}`}
                style={currentPage !== 1 ? { background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow } : {}}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-white hover:bg-indigo-700'}`}
                style={currentPage !== totalPages ? { background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow } : {}}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Take Modal */}
      <Modal
        isOpen={takeModalIsOpen}
        onRequestClose={() => { setTakeModalIsOpen(false); setCasesTaken(''); setSelectedStock(null); }}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black dark:text-white">Take Cases</h2>
            <button onClick={() => setTakeModalIsOpen(false)}><FaTimes /></button>
          </div>
          <input
            type="number"
            value={casesTaken}
            onChange={e => debouncedSetCasesTaken(e.target.value)}
            className="w-full p-2 border rounded mb-4 text-black dark:text-white"
            placeholder="Cases to take"
            min="1"
            disabled={isTakingStock}
          />
          <button
            onClick={handleTakeStock}
            disabled={isTakingStock}
            className="w-full py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {isTakingStock ? 'Submitting...' : 'Take'}
          </button>
        </div>
      </Modal>
      {/* Add Modal */}
      <Modal
        isOpen={addModalIsOpen}
        onRequestClose={() => { setAddModalIsOpen(false); setCasesToAdd(''); setSelectedStock(null); }}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black dark:text-white">Add Cases</h2>
            <button onClick={() => setAddModalIsOpen(false)}><FaTimes /></button>
          </div>
          <input
            type="number"
            value={casesToAdd}
            onChange={e => debouncedSetCasesToAdd(e.target.value)}
            className="w-full p-2 border rounded mb-4 text-black dark:text-white"
            placeholder="Cases to add"
            min="1"
          />
          <button onClick={handleAddStock} className="w-full py-2 bg-indigo-600 text-white rounded">
            Add
          </button>
        </div>
      </Modal>
      {/* History Modal - WITH AGENT COLUMN */}
      <Modal
        isOpen={historyModalIsOpen}
        onRequestClose={() => { setHistoryModalIsOpen(false); setStockHistory([]); }}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black dark:text-white">Stock History</h2>
            <button onClick={() => setHistoryModalIsOpen(false)}><FaTimes /></button>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase">No</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase">Brand</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase">Action</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase">Cases</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase">Total Qty</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase">Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stockHistory.map((h, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{i + 1}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{new Date(h.date).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{h.productname}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{capitalize(h.brand)}</td>
                  <td className={`px-4 py-2 text-sm font-bold ${h.action === 'taken' ? 'text-red-600' : 'text-green-600'}`}>
                    {capitalize(h.action)}
                  </td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{h.cases}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{h.per_case_total}</td>
                  <td className="px-4 py-2 text-sm text-sky-300">
                    {h.action === 'added' ? (h.agent_name || '-') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stockHistory.length === 0 && <p className="text-center mt-4 text-gray-500">No history</p>}
        </div>
      </Modal>
      {/* Download Modal */}
      <Modal
        isOpen={showDownloadModal}
        onRequestClose={() => setShowDownloadModal(false)}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-bold mb-4 text-black dark:text-white">Download Stock History</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" value="all" checked={downloadMode === 'all'} onChange={e => setDownloadMode(e.target.value)} className='text-black dark:text-white'/>
              <span className='text-black dark:text-white'>All History</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" value="date" checked={downloadMode === 'date'} onChange={e => setDownloadMode(e.target.value)} />
              <span className='text-black dark:text-white'>Specific Date</span>
            </label>
            {downloadMode === 'date' && (
              <DatePicker
                selected={selectedDate}
                onChange={d => setSelectedDate(d)}
                className="w-full p-2 border rounded dark:bg-gray-700 text-black dark:text-white"
                placeholderText="Select date"
                dateFormat="yyyy-MM-dd"
              />
            )}
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" value="month" checked={downloadMode === 'month'} onChange={e => setDownloadMode(e.target.value)} />
              <span className='text-black dark:text-white'>Specific Month</span>
            </label>
            {downloadMode === 'month' && (
              <DatePicker
                selected={selectedMonth}
                onChange={d => setSelectedMonth(d)}
                showMonthYearPicker
                dateFormat="MM/yyyy"
                className="w-full p-2 border rounded dark:bg-gray-700 text-black dark:text-white"
                placeholderText="Select month"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setShowDownloadModal(false)} className="px-4 py-2 text-black dark:text-white">
              Cancel
            </button>
            <button
              onClick={confirmDownload}
              disabled={isLoadingHistory || (downloadMode === 'date' && !selectedDate) || (downloadMode === 'month' && !selectedMonth)}
              className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50 text-white"
            >
              {isLoadingHistory ? 'Loading...' : 'Download'}
            </button>
          </div>
        </div>
      </Modal>
      {/* Unique Products Modal */}
      <Modal
        isOpen={showUniqueProductsModal}
        onRequestClose={() => setShowUniqueProductsModal(false)}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-black dark:text-white">Unique Products</h3>
            <button onClick={() => setShowUniqueProductsModal(false)}><FaTimes /></button>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">No</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {uniqueProductsData.map(p => (
                <tr key={p.no}>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{p.no}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{p.product_type}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{p.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
      {/* Total Cases Modal */}
      <Modal
        isOpen={showTotalCasesModal}
        onRequestClose={() => setShowTotalCasesModal(false)}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-black dark:text-white">Total Cases</h3>
            <button onClick={() => setShowTotalCasesModal(false)}><FaTimes /></button>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Case Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {totalCasesData.map((c, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{c.productname}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{c.casecount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
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