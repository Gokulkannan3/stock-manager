// src/Components/Sidebar/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBox, FaList, FaChartBar, FaUsers, FaMapMarkerAlt, FaBars, FaTimes, FaLocationArrow, FaShoppingCart, FaTruck, FaImage, FaTag, FaPlus, FaWarehouse, FaAngleDown, FaAngleUp } from 'react-icons/fa';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isGodownOpen, setIsGodownOpen] = useState(false);

  const navItems = [
    {
      name: 'Inventory',
      subItems: [
        { name: 'Add Product', path: '/inventory', icon: <FaPlus className="mr-2" /> },
        { name: 'Listing', path: '/listing', icon: <FaList className="mr-2" /> },
      ],
    },
    {
      name: 'Godown',
      subItems: [
        { name: 'Add Godown', path: '/godown', icon: <FaPlus className="mr-2" /> },
        { name: 'View Stocks', path: '/viewstock', icon: <FaList className="mr-2" /> },
      ],
    },
    {
      name: 'Overall Stocks', path: '/analysis', icon: <FaChartBar className='mr-2'/>
    }
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleInventory = () => {
    setIsInventoryOpen(!isInventoryOpen);
  };

  const toggleGodown = () => {
    setIsGodownOpen(!isGodownOpen);
  };

  return (
    <>
      {!isOpen && (
        <button
          className="hundred:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded-md"
          onClick={toggleSidebar}
        >
          <FaBars size={24} />
        </button>
      )}

      <div
        className={`fixed top-0 left-0 h-screen bg-black/80 text-white flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } hundred:translate-x-0 mobile:w-64 w-64 z-40`}
      >
        <div className="p-4 text-xl font-bold border-b border-gray-700 flex items-center justify-between">
          Admin
          <button className="hundred:hidden text-white" onClick={toggleSidebar}>
            <FaTimes size={20} />
          </button>
        </div>
        <nav className="flex-1 mt-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                {item.subItems ? (
                  <div>
                    <div
                      className="py-3 px-6 text-sm font-bold text-gray-300 dark:text-gray-300 flex items-center justify-between cursor-pointer hover:bg-black/50 transition-colors"
                      onClick={item.name === 'Inventory' ? toggleInventory : toggleGodown}
                    >
                      <span className="flex items-center">
                        {item.name === 'Inventory' ? <FaBox className="mr-2" /> : <FaWarehouse className="mr-2" />}
                        {item.name}
                      </span>
                      {(item.name === 'Inventory' ? isInventoryOpen : isGodownOpen) ? <FaAngleUp /> : <FaAngleDown />}
                    </div>
                    <ul
                      className={`pl-4 overflow-hidden transition-all duration-300 ease-in-out ${
                        (item.name === 'Inventory' ? isInventoryOpen : isGodownOpen) ? 'max-h-40' : 'max-h-0'
                      }`}
                    >
                      {item.subItems.map((subItem) => (
                        <li key={subItem.name}>
                          <NavLink
                            to={subItem.path}
                            className={({ isActive }) =>
                              `flex items-center py-2 px-6 text-sm font-medium hover:bg-black/50 transition-colors ${
                                isActive ? 'bg-gray-900 text-white' : ''
                              }`
                            }
                            onClick={() => {
                              setIsOpen(false);
                            }}
                          >
                            {subItem.icon}
                            {subItem.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center py-3 px-6 text-sm font-medium hover:bg-black/50 transition-colors ${
                        isActive ? 'bg-gray-900 text-white' : ''
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {isOpen && (
        <div
          className="hundred:hidden fixed inset-0 bg-black/50 bg-opacity-30 z-30"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}