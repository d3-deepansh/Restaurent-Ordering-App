import React, { useState, useEffect, useMemo } from 'react';
// Make sure to install firebase: npm install firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    query,
    orderBy,
    doc,
    updateDoc,
    where,
    Timestamp
} from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBNKkYUPljHCG--cDOrIjDLvIu7AIxC7DY",
  authDomain: "qr-menu-project-6825a.firebaseapp.com",
  projectId: "qr-menu-project-6825a",
  storageBucket: "qr-menu-project-6825a.appspot.com",
  messagingSenderId: "185451704846",
  appId: "1:185451704846:web:1f6580b829234ed4b6825f",
  measurementId: "G-8K9VP5F654"
};

// --- Initialize Firebase Services (Robust Method) ---
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Helper Components & Functions ---
const LoadingSpinner = () => ( <div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div></div> );
const ChartBarIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a1 1 0 001 1h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 12.414l3.293 3.293a1 1 0 001.414-1.414L13.414 12H16a1 1 0 001-1V5a1 1 0 10-2 0v6h-1a1 1 0 00-1 1v1H8v-1a1 1 0 00-1-1H6V5a1 1 0 00-1-1H3z" clipRule="evenodd" /></svg> );
const formatTime = (timestamp) => { if (!timestamp) return 'Just now'; return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
const formatDateForInput = (date) => date.toISOString().split('T')[0];

// --- Order Column & Card Components (No Changes) ---
const OrderColumn = ({ title, orders, onUpdateStatus, onShowDetails, bgColor }) => ( <div className={`flex-1 p-4 rounded-lg ${bgColor} min-w-[300px]`}><h2 className="text-xl font-bold text-gray-800 mb-4">{title} ({orders.length})</h2><div className="space-y-4 h-[calc(100vh-250px)] overflow-y-auto pr-2">{orders.length > 0 ? orders.map(order => (<OrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} onShowDetails={onShowDetails}/>)) : <p className="text-center text-gray-500 mt-10">No orders in this category.</p>}</div></div> );
const OrderCard = ({ order, onUpdateStatus, onShowDetails }) => { const nextStatus = { "New": "Preparing", "Preparing": "Ready", "Ready": "Completed" }; return ( <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onShowDetails(order)}><div className="flex justify-between items-start"><div><p className="font-bold text-lg text-gray-900">{order.tableName}</p><p className="text-sm text-gray-600">by {order.userName}</p></div><p className="text-sm text-gray-500">{formatTime(order.createdAt)}</p></div><div className="mt-3 border-t pt-3"><p className="font-semibold">{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</p><p className="font-bold text-indigo-600 text-lg">₹{order.totalPrice.toFixed(2)}</p></div>{order.status !== "Completed" && (<button onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, nextStatus[order.status]); }} className="w-full mt-4 bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors">Mark as {nextStatus[order.status]}</button>)}</div> );};
const AnalyticsModal = ({ show, onClose, completedOrders, date }) => { const dishAnalytics = useMemo(() => { const counts = {}; if (completedOrders) { completedOrders.forEach(order => { order.items.forEach(item => { counts[item.name] = (counts[item.name] || 0) + item.quantity; }); }); } return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count); }, [completedOrders]); if (!show) { return null; } return ( <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"><div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full"><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Top Selling Dishes for {date.toLocaleDateString()}</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button></div><div className="space-y-3 max-h-96 overflow-y-auto">{dishAnalytics.length > 0 ? dishAnalytics.map((dish, index) => ( <div key={dish.name} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"><p className="font-semibold text-lg">{index + 1}. {dish.name}</p><p className="font-bold text-indigo-600 text-lg">{dish.count} <span className="text-sm font-normal text-gray-600">orders</span></p></div> )) : ( <p className="text-center text-gray-500 py-8">No completed orders to analyze for this day.</p> )}</div></div></div> );};

// --- Edit Order Modal (UPDATED with Discount and Print Fix) ---
const EditOrderModal = ({ order, allMenuItems, onClose, onSave }) => {
    const [editedItems, setEditedItems] = useState([]);
    const [newItemId, setNewItemId] = useState('');
    const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'currency'
    const [discountValue, setDiscountValue] = useState(0);

    useEffect(() => {
        if (order) {
            setEditedItems(JSON.parse(JSON.stringify(order.items)));
            setDiscountType('percentage'); // Reset discount on new order
            setDiscountValue(0);
        } else {
            setEditedItems([]);
        }
    }, [order]);
    
    const subtotal = useMemo(() => 
        editedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0), 
    [editedItems]);

    const discountAmount = useMemo(() => {
        if (discountType === 'percentage') {
            return (subtotal * discountValue) / 100;
        }
        return discountValue;
    }, [subtotal, discountType, discountValue]);

    const grandTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

    const availableToAdd = useMemo(() => 
        allMenuItems.filter(menuItem => 
            !editedItems.some(orderItem => orderItem.id === menuItem.id)
        ),
    [allMenuItems, editedItems]);

    if (!order) {
        return null;
    }

    const handleQuantityChange = (itemId, amount) => {
        const newItems = editedItems.map(item => 
            item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item
        ).filter(item => item.quantity > 0);
        setEditedItems(newItems);
    };

    const handleAddItem = () => {
        if (!newItemId) return;
        const itemToAdd = allMenuItems.find(item => item.id === newItemId);
        if (itemToAdd) {
            setEditedItems([...editedItems, { ...itemToAdd, quantity: 1 }]);
        }
        setNewItemId('');
    };
    
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Please allow pop-ups for this site to print the bill.");
            return;
        }
        const billContent = `
            <html>
                <head>
                    <title>Bill for Table ${order.tableName}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
                        .container { width: 300px; margin: auto; }
                        h1, h2, h3 { text-align: center; color: #333; margin: 5px 0; }
                        p { margin: 2px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th, td { padding: 8px 4px; text-align: left; }
                        th { border-bottom: 2px solid #333; }
                        .summary-row td { border-top: 1px solid #ccc; padding-top: 8px; }
                        .total { font-weight: bold; font-size: 1.1em; }
                        .footer { text-align: center; margin-top: 20px; font-style: italic; color: #777; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Your Restaurant</h1>
                        <h3>Invoice / Bill</h3>
                        <p><strong>Table:</strong> ${order.tableName}</p>
                        <p><strong>Customer:</strong> ${order.userName}</p>
                        <p><strong>Date:</strong> ${new Date(order.createdAt.seconds * 1000).toLocaleString()}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${editedItems.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td>₹${item.price.toFixed(2)}</td>
                                        <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <table>
                           <tr class="summary-row">
                                <td colspan="3">Subtotal</td>
                                <td>₹${subtotal.toFixed(2)}</td>
                           </tr>
                           <tr>
                                <td colspan="3">Discount (${discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`})</td>
                                <td>-₹${discountAmount.toFixed(2)}</td>
                           </tr>
                           <tr class="total summary-row">
                                <td colspan="3">Grand Total</td>
                                <td>₹${grandTotal.toFixed(2)}</td>
                           </tr>
                        </table>
                        <p class="footer">Thank you for dining with us!</p>
                    </div>
                </body>
            </html>
        `;
        printWindow.document.write(billContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Order Details for {order.tableName}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto border-b pb-4 mb-4">
                    {editedItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                            <p className="font-semibold">{item.name}</p>
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-gray-500">₹{item.price.toFixed(2)}</p>
                                <button onClick={() => handleQuantityChange(item.id, -1)} className="bg-gray-200 rounded-full w-7 h-7 font-bold">-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => handleQuantityChange(item.id, 1)} className="bg-gray-200 rounded-full w-7 h-7 font-bold">+</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4 items-end mb-4 border-b pb-4">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Add another dish</label>
                        <select value={newItemId} onChange={(e) => setNewItemId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="">Select an item...</option>
                            {availableToAdd.length > 0 ? ( availableToAdd.map(item => (<option key={item.id} value={item.id}>{item.name}</option>))) : (<option disabled>No other items to add</option>)}
                        </select>
                    </div>
                    <button onClick={handleAddItem} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600">Add</button>
                </div>
                
                {/* Discount Section */}
                <div className="flex gap-4 items-end mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                        <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="p-2 border border-gray-300 rounded-md">
                            <option value="percentage">%</option>
                            <option value="currency">₹</option>
                        </select>
                    </div>
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                        <input type="number" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                </div>

                <div className="border-t pt-4 flex justify-between items-center">
                    <button onClick={handlePrint} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600">
                        Generate Bill
                    </button>
                    <div className="flex items-center gap-4">
                        <p className="text-xl font-bold">Grand Total: ₹{grandTotal.toFixed(2)}</p>
                        <button onClick={() => onSave(order.id, editedItems, grandTotal)} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Dashboard Component ---
export default function OrderDashboard() {
    const [orders, setOrders] = useState([]);
    const [allMenuItems, setAllMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const menuQuery = query(collection(db, "menuItems"), orderBy("name"));
        const unsubscribeMenu = onSnapshot(menuQuery, (snapshot) => {
            setAllMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribeMenu();
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);
        const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
        const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

        const q = query(collection(db, "orders"), where("createdAt", ">=", startOfDayTimestamp), where("createdAt", "<=", endOfDayTimestamp), orderBy("createdAt", "desc"));
        const unsubscribeOrders = onSnapshot(q, (snapshot) => { setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setIsLoading(false); }, (error) => { console.error("Error fetching orders: ", error); setIsLoading(false); });
        
        return () => unsubscribeOrders();
    }, [selectedDate]);

    const handleUpdateStatus = async (orderId, newStatus) => { const orderDoc = doc(db, "orders", orderId); try { await updateDoc(orderDoc, { status: newStatus }); } catch (error) { console.error("Error updating status: ", error); } };
    
    const handleSaveOrder = async (orderId, updatedItems, newGrandTotal) => {
        const orderDoc = doc(db, "orders", orderId);
        try {
            await updateDoc(orderDoc, {
                items: updatedItems,
                totalPrice: newGrandTotal
            });
            setSelectedOrder(null);
        } catch (error) {
            console.error("Error saving order: ", error);
        }
    };

    const filteredOrders = useMemo(() => ({ new: orders.filter(o => o.status === 'New'), preparing: orders.filter(o => o.status === 'Preparing'), ready: orders.filter(o => o.status === 'Ready'), completed: orders.filter(o => o.status === 'Completed') }), [orders]);

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-md p-4 flex flex-wrap justify-between items-center gap-4">
                <div><h1 className="text-3xl font-bold text-gray-800">Order Dashboard</h1><p className="text-gray-600">Showing orders for {selectedDate.toLocaleDateString()}</p></div>
                <div className="flex items-center gap-4">
                     <input type="date" value={formatDateForInput(selectedDate)} onChange={(e) => setSelectedDate(new Date(e.target.value))} className="p-2 border border-gray-300 rounded-lg"/>
                    <button onClick={() => setShowAnalytics(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center"><ChartBarIcon />View Analytics</button>
                </div>
            </header>

            {isLoading ? <LoadingSpinner /> : (
                <main className="p-4 flex gap-4 overflow-x-auto">
                    <OrderColumn title="New Orders" orders={filteredOrders.new} onUpdateStatus={handleUpdateStatus} onShowDetails={setSelectedOrder} bgColor="bg-red-100" />
                    <OrderColumn title="Preparing" orders={filteredOrders.preparing} onUpdateStatus={handleUpdateStatus} onShowDetails={setSelectedOrder} bgColor="bg-yellow-100" />
                    <OrderColumn title="Ready for Pickup" orders={filteredOrders.ready} onUpdateStatus={handleUpdateStatus} onShowDetails={setSelectedOrder} bgColor="bg-green-100" />
                    <OrderColumn title="Completed" orders={filteredOrders.completed} onUpdateStatus={handleUpdateStatus} onShowDetails={setSelectedOrder} bgColor="bg-gray-200" />
                </main>
            )}

            <EditOrderModal order={selectedOrder} allMenuItems={allMenuItems} onClose={() => setSelectedOrder(null)} onSave={handleSaveOrder} />
            <AnalyticsModal show={showAnalytics} onClose={() => setShowAnalytics(false)} completedOrders={filteredOrders.completed} date={selectedDate} />
        </div>
    );
}


