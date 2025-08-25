import React, { useState } from 'react';

// Import the components you just created
import OrderDashboard from './components/OrderDashboard';
import MenuManagement from './components/MenuManagement';
import TableManagement from './components/TableManagement';

export default function App() {
    // State to manage which view is currently active
    const [activeView, setActiveView] = useState('dashboard');

    // Function to render the correct component based on the active view
    const renderView = () => {
        switch (activeView) {
            case 'menu':
                return <MenuManagement />;
            case 'tables':
                return <TableManagement />;
            case 'dashboard':
            default:
                return <OrderDashboard />;
        }
    };

    const NavButton = ({ view, children }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeView === view
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="font-sans">
            {/* Main Navigation Bar */}
            <nav className="bg-white shadow-lg p-4 flex justify-center items-center space-x-4 sticky top-0 z-50">
                <h1 className="text-2xl font-bold text-gray-800 mr-auto">Admin Panel</h1>
                <NavButton view="dashboard">Order Dashboard</NavButton>
                <NavButton view="menu">Menu Management</NavButton>
                <NavButton view="tables">Table Management</NavButton>
            </nav>

            {/* Render the active component */}
            <main>
                {renderView()}
            </main>
        </div>
    );
}