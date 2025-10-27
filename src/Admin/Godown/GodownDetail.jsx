// src/Components/Godown/GodownDetail.jsx
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaMinus, FaHistory, FaTimes, FaPlus, FaDownload } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { debounce } from 'lodash';

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
  const [isTakingStock, setIsTakingStock] = useState(false); // New loading state
  const cardsPerPage = 20;

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

  // Debounced state update functions
  const debouncedSetCasesTaken = debounce((value) => setCasesTaken(value), 300);
  const debouncedSetCasesToAdd = debounce((value) => setCasesToAdd(value), 300);

  const fetchGodown = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/${godownId}/stock`);
      if (!response.ok) throw new Error('Failed to fetch godown details');
      const data = await response.json();
      console.log('Fetched stock data:', data);
      if (data.length === 0) {
        setGodown({ name: 'Unknown', stocks: [] });
      } else {
        setGodown({ name: data[0].godown_name, stocks: data });
        const uniqueTypes = [...new Set(data.map(stock => stock.product_type))];
        setProductTypes(uniqueTypes);
      }
    } catch (err) {
      console.error('Error fetching godown:', err.message);
      setError(err.message);
    }
  };

  const handleTakeStock = async () => {
    if (!selectedStock || !selectedStock.id) {
      setError('No stock selected or stock ID is missing');
      return;
    }
    if (!casesTaken || parseInt(casesTaken) <= 0) {
      setError('Please enter a valid number of cases to take');
      return;
    }
    setIsTakingStock(true); // Set loading state
    try {
      console.log(`Taking stock with stock_id: ${selectedStock.id}`);
      const response = await fetch(`${API_BASE_URL}/api/godowns/stock/take`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: selectedStock.id, cases_taken: parseInt(casesTaken) }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to take stock');
      }
      // Batch state updates for efficiency
      setCasesTaken('');
      setSelectedStock(null);
      setTakeModalIsOpen(false);
      setIsTakingStock(false); // Clear loading state
      fetchGodown();
    } catch (err) {
      console.error('Error in handleTakeStock:', err.message);
      setError(`Error: ${err.message}`);
      setIsTakingStock(false); // Clear loading state on error
    }
  };

  const handleAddStock = async () => {
    if (!selectedStock || !selectedStock.id) {
      setError('No stock selected or stock ID is missing');
      return;
    }
    if (!casesToAdd || parseInt(casesToAdd) <= 0) {
      setError('Please enter a valid number of cases to add');
      return;
    }
    try {
      console.log(`Adding stock with stock_id: ${selectedStock.id}`);
      const response = await fetch(`${API_BASE_URL}/api/godowns/stock/add`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: selectedStock.id, cases_added: parseInt(casesToAdd) }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add stock');
      }
      setAddModalIsOpen(false);
      setCasesToAdd('');
      setSelectedStock(null);
      fetchGodown();
    } catch (err) {
      console.error('Error in handleAddStock:', err.message);
      setError(`Error: ${err.message}`);
    }
  };

  const fetchStockHistory = async (stockId) => {
    try {
      console.log(`Fetching history for stock_id: ${stockId}`);
      const response = await fetch(`${API_BASE_URL}/api/stock/${stockId}/history`);
      if (!response.ok) throw new Error('Failed to fetch stock history');
      const data = await response.json();
      setStockHistory(data);
      setHistoryModalIsOpen(true);
    } catch (err) {
      console.error('Error fetching stock history:', err.message);
      setError(err.message);
    }
  };

  const downloadExcel = () => {
    if (!godown || !godown.stocks || godown.stocks.length === 0) {
      setError('No stock data available to download');
      return;
    }

    const grouped = godown.stocks.reduce((acc, stock) => {
      const pt = capitalize(stock.product_type);
      if (!acc[pt]) {
        acc[pt] = [];
      }
      acc[pt].push({
        'Product Name': stock.productname,
        'Brand': capitalize(stock.brand),
        'Current Cases': stock.current_cases,
        'Per Case': stock.per_case,
      });
      return acc;
    }, {});

    const workbook = XLSX.utils.book_new();

    for (const pt in grouped) {
      const worksheet = XLSX.utils.json_to_sheet(grouped[pt]);
      XLSX.utils.book_append_sheet(workbook, worksheet, pt);
    }

    XLSX.writeFile(workbook, `${godown.name}_stocks_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  useEffect(() => {
    fetchGodown();
  }, [godownId]);

  useEffect(() => {
    console.log('Selected stock updated:', selectedStock);
  }, [selectedStock]);

  const capitalize = (str) => (str ? str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '');

  const openTakeModal = (stock) => {
    console.log('Opening take modal with stock:', stock);
    setSelectedStock(stock);
    setCasesTaken('');
    setTakeModalIsOpen(true);
  };

  const openAddModal = (stock) => {
    console.log('Opening add modal with stock:', stock);
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

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 pt-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex mobile:flex-col mobile:gap-4 justify-between items-center mb-6 mobile:mb-4">
            <h2 className="text-2xl mobile:text-xl text-center font-bold text-gray-900 dark:text-gray-900">
              View Stocks for {godown ? capitalize(godown.name) : 'Godown'}
            </h2>
            <button
              onClick={downloadExcel}
              className="flex items-center rounded-md px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-xs font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600"
              style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
            >
              <FaDownload className="mr-2 h-4 w-4 mobile:h-3 mobile:w-3" />
              Download Stocks
            </button>
          </div>
          {error && <div className="mb-4 mobile:mb-2 text-red-600 dark:text-red-400 text-sm mobile:text-xs text-center">{error}</div>}
          <div className="mb-6 mobile:mb-4 flex mobile:flex-col mobile:gap-4 justify-between items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 mobile:w-full rounded-md px-3 py-1.5 mobile:px-2 mobile:py-1 text-base mobile:text-sm text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500"
              style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
              placeholder="Search by product name"
            />
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="w-64 mobile:w-full rounded-md px-3 py-1.5 mobile:px-2 mobile:py-1 text-base mobile:text-sm text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500"
              style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
            >
              <option value="all">All Product Types</option>
              {productTypes.map(type => (
                <option key={type} value={type}>{capitalize(type)}</option>
              ))}
            </select>
          </div>
          <div className="mb-6 mobile:mb-4">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-xs font-medium ${activeTab === 'current' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-100'}`}
                onClick={() => setActiveTab('current')}
              >
                Current Stock
              </button>
              <button
                className={`px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-xs font-medium ${activeTab === 'previous' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-100'}`}
                onClick={() => setActiveTab('previous')}
              >
                Previous Stock
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 mobile:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile:gap-4">
            {currentCards.map(s => (
              <div key={s.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mobile:p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col">
                  <div className="mb-3 mobile:mb-2">
                    <h3 className="text-md mobile:text-md font-semibold text-gray-900 dark:text-gray-100 truncate">{s.productname}</h3>
                    <p className="text-sm mobile:text-sm text-gray-600 dark:text-gray-100">{capitalize(s.product_type)}</p>
                    <p className="text-sm mobile:text-sm text-sky-300">B - {capitalize(s.brand)}</p>
                  </div>
                  <div className="mb-4 mobile:mb-2 grid grid-cols-2 mobile:grid-cols-2 gap-2 mobile:gap-1 text-xs mobile:text-[10px]">
                    <div>
                      <span className="font-medium text-sm text-gray-700 dark:text-gray-100">Current Cases: {s.current_cases}</span>
                    </div>
                    <div>
                      <span className="font-medium text-sm text-gray-700 dark:text-gray-100">Per Case: {s.per_case}</span>
                    </div>
                  </div>
                  <div className="flex mobile:gap-1 justify-center gap-2">
                    {activeTab === 'current' && (
                      <button
                        onClick={() => openTakeModal(s)}
                        className="flex w-20 justify-center items-center rounded-md px-2 py-1 mobile:px-1 mobile:py-0.5 text-xs mobile:text-lg font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
                        style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                      >
                        Take
                      </button>
                    )}
                    <button
                      onClick={() => openAddModal(s)}
                      className="flex w-20 justify-center items-center rounded-md px-2 py-1 mobile:px-1 mobile:py-0.5 text-xs mobile:text-lg font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
                      style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => fetchStockHistory(s.id)}
                      className="flex w-20 justify-center items-center rounded-md px-2 py-1 mobile:px-1 mobile:py-0.5 text-xs mobile:text-lg font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
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
            <p className="text-center text-gray-500 dark:text-gray-900 mt-6 mobile:mt-4 text-sm mobile:text-xs">
              No {activeTab === 'current' ? 'current' : 'previous'} stocks available.
            </p>
          )}
          {totalPages > 1 && (
            <div className="mt-6 mobile:mt-4 flex justify-center items-center space-x-4 mobile:space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 mobile:p-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-900 cursor-not-allowed' : 'text-white dark:text-gray-900 hover:bg-indigo-700 dark:hover:bg-blue-600'}`}
                style={currentPage !== 1 ? { background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow } : {}}
              >
                Previous
              </button>
              <span className="text-sm mobile:text-xs text-gray-700 dark:text-gray-900">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 mobile:p-1 rounded-md ${currentPage === totalPages ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-900 cursor-not-allowed' : 'text-white dark:text-gray-900 hover:bg-indigo-700 dark:hover:bg-blue-600'}`}
                style={currentPage !== totalPages ? { background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow } : {}}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Take Stock Modal */}
      <Modal
        isOpen={takeModalIsOpen}
        onRequestClose={() => {
          setTakeModalIsOpen(false);
          setCasesTaken('');
          setSelectedStock(null);
        }}
        className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
        overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mobile:p-4 max-w-md mobile:max-w-[90vw] w-96">
          <div className="flex justify-between items-center mb-4 mobile:mb-2">
            <h2 className="text-lg mobile:text-base font-bold text-gray-900 dark:text-gray-100">Take Cases</h2>
            <button
              onClick={() => {
                setTakeModalIsOpen(false);
                setCasesTaken('');
                setSelectedStock(null);
              }}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <FaTimes className="h-5 w-5 mobile:h-4 mobile:w-4" />
            </button>
          </div>
          <input
            type="number"
            value={casesTaken}
            onChange={(e) => debouncedSetCasesTaken(e.target.value)}
            className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 mobile:px-2 mobile:py-1 text-base mobile:text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500"
            style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
            placeholder="Cases to take"
            min="1"
            disabled={isTakingStock} // Disable input during submission
          />
          <button
            onClick={handleTakeStock}
            className={`mt-4 mobile:mt-2 rounded-md px-3 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-xs font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600 ${isTakingStock ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
            disabled={isTakingStock} // Disable button during submission
          >
            {isTakingStock ? 'Submitting...' : 'Take'}
          </button>
        </div>
      </Modal>

      {/* Add Stock Modal */}
      <Modal
        isOpen={addModalIsOpen}
        onRequestClose={() => {
          setAddModalIsOpen(false);
          setCasesToAdd('');
          setSelectedStock(null);
        }}
        className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
        overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mobile:p-4 max-w-md mobile:max-w-[90vw] w-96">
          <div className="flex justify-between items-center mb-4 mobile:mb-2">
            <h2 className="text-lg mobile:text-base font-bold text-gray-900 dark:text-gray-100">Add Stock</h2>
            <button
              onClick={() => {
                setAddModalIsOpen(false);
                setCasesToAdd('');
                setSelectedStock(null);
              }}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-900"
            >
              <FaTimes className="h-5 w-5 mobile:h-4 mobile:w-4" />
            </button>
          </div>
          <input
            type="number"
            value={casesToAdd}
            onChange={(e) => debouncedSetCasesToAdd(e.target.value)}
            className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 mobile:px-2 mobile:py-1 text-base mobile:text-sm text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500"
            style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
            placeholder="Cases to add"
            min="1"
          />
          <button
            onClick={handleAddStock}
            className="mt-4 mobile:mt-2 rounded-md px-3 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-xs font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
            style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
          >
            Add
          </button>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={historyModalIsOpen}
        onRequestClose={() => {
          setHistoryModalIsOpen(false);
          setStockHistory([]);
          setSelectedStock(null);
        }}
        className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
        overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mobile:p-4 max-w-4xl mobile:max-w-[90vw] w-1/2">
          <div className="flex justify-between items-center mb-4 mobile:mb-2">
            <h2 className="text-lg mobile:text-base font-bold text-gray-900 dark:text-gray-900">Stock History</h2>
            <button
              onClick={() => {
                setHistoryModalIsOpen(false);
                setStockHistory([]);
                setSelectedStock(null);
              }}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-900"
            >
              <FaTimes className="h-5 w-5 mobile:h-4 mobile:w-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 mobile:px-4 mobile:py-2 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-100 uppercase tracking-wider">Sl. No</th>
                  <th className="px-6 py-3 mobile:px-4 mobile:py-2 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-100 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 mobile:px-4 mobile:py-2 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-100 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-3 mobile:px-4 mobile:py-2 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-100 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 mobile:px-4 mobile:py-2 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-100 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 mobile:px-4 mobile:py-2 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-100 uppercase tracking-wider">Case Count</th>
                  <th className="px-6 py-3 mobile:px-4 mobile:py-2 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-100 uppercase tracking-wider">Total Quantity</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {stockHistory.map((h, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 mobile:px-4 mobile:py-2 whitespace-nowrap text-sm mobile:text-xs text-gray-900 dark:text-gray-100">{index + 1}</td>
                    <td className="px-6 py-4 mobile:px-4 mobile:py-2 whitespace-nowrap text-sm mobile:text-xs text-gray-900 dark:text-gray-100">{new Date(h.date).toLocaleString()}</td>
                    <td className="px-6 py-4 mobile:px-4 mobile:py-2 whitespace-nowrap text-sm mobile:text-xs text-gray-900 dark:text-gray-100">{h.productname}</td>
                    <td className="px-6 py-4 mobile:px-4 mobile:py-2 whitespace-nowrap text-sm mobile:text-xs text-gray-900 dark:text-gray-100">{capitalize(h.brand)}</td>
                    <td className={`px-6 py-4 mobile:px-4 mobile:py-2 whitespace-nowrap font-bold text-md mobile:text-sm ${h.action === 'taken' ? 'text-red-500' : 'text-green-500'}`}>
                      {capitalize(h.action)}
                    </td>
                    <td className="px-6 py-4 mobile:px-4 mobile:py-2 whitespace-nowrap text-sm mobile:text-xs text-gray-900 dark:text-gray-100">{h.cases}</td>
                    <td className="px-6 py-4 mobile:px-4 mobile:py-2 whitespace-nowrap text-sm mobile:text-xs text-gray-900 dark:text-gray-100">{h.per_case_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stockHistory.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-900 mt-6 mobile:mt-4 text-sm mobile:text-xs">
                No stock history available.
              </p>
            )}
          </div>
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