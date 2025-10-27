// src/Components/Godown/ViewStock.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaEye } from 'react-icons/fa';

export default function ViewStock() {
  const [godowns, setGodowns] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const styles = {
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

  const fetchGodowns = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns`);
      const data = await response.json();
      setGodowns(data);
    } catch (err) {
      setError('Failed to fetch godowns');
    }
  };

  useEffect(() => {
    fetchGodowns();
  }, []);

  const capitalize = str => str ? str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

  const handleViewGodown = (godownId) => {
    navigate(`/view-stocks/${godownId}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 pt-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl mobile:text-xl text-center font-bold text-gray-900 dark:text-gray-100 mb-6 mobile:mb-4">View Stocks</h2>
          {error && <div className="mb-4 mobile:mb-2 text-red-600 dark:text-red-400 text-sm mobile:text-xs text-center">{error}</div>}
          <div className="grid grid-cols-1 mobile:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile:gap-4">
            {godowns.map(g => (
              <div key={g.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mobile:p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg mobile:text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 mobile:mb-2">{capitalize(g.name)}</h3>
                <button
                  onClick={() => handleViewGodown(g.id)}
                  className="flex items-center px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-xs text-white dark:text-gray-100 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md"
                  style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                >
                  <FaEye className="mr-2 h-4 w-4 mobile:h-3 mobile:w-3" /> View Stocks
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        [style*="backgroundDark"] { background: var(--bg, ${styles.button.background}); }
        [style*="backgroundDark"][data-dark] { --bg: ${styles.button.backgroundDark}; }
        [style*="borderDark"] { border: var(--border, ${styles.button.border}); }
        [style*="borderDark"][data-dark] { --border: ${styles.button.borderDark}; }
        [style*="boxShadowDark"] { box-shadow: var(--shadow, ${styles.button.boxShadow}); }
        [style*="boxShadowDark"][data-dark] { --shadow: ${styles.button.boxShadowDark}; }
      `}</style>
    </div>
  );
}