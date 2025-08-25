import React, { useState, useEffect, useMemo } from 'react';
// Make sure to install firebase: npm install firebase
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    query,
    where,
    orderBy,
    addDoc,
    doc,
    serverTimestamp
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

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Components & Icons ---
const FormInput = ({ id, ...props }) => <input id={id} {...props} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow" />;
const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;
const LoadingSpinner = ({text = "Loading..."}) => (
    <div className="flex flex-col justify-center items-center p-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-600">{text}</p>
    </div>
);

// --- Main Application ---
export default function App() {
    // --- State Management ---
    const [step, setStep] = useState(1); // 1:Details, 2:OTP, 3:Table, 4:Menu, 5:Summary, 6:Tracking
    const [userName, setUserName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Table State
    const [tables, setTables] = useState([]);
    const [isTablesLoading, setIsTablesLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);

    // Menu & Order State
    const [menuItems, setMenuItems] = useState([]);
    const [isMenuLoading, setIsMenuLoading] = useState(true);
    const [order, setOrder] = useState([]);
    const [placedOrderId, setPlacedOrderId] = useState(null);

    // --- Firebase Auth Setup ---
    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => console.log("reCAPTCHA verified")
            });
        }
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        let unsubscribe = () => {};
        if (step === 3) {
            setIsTablesLoading(true);
            const q = query(collection(db, "tables"), orderBy("name"));
            unsubscribe = onSnapshot(q, (snapshot) => {
                setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setIsTablesLoading(false);
            });
        } else if (step === 4) {
            setIsMenuLoading(true);
            const q = query(collection(db, "menuItems"), where("available", "==", true));
            unsubscribe = onSnapshot(q, (snapshot) => {
                setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setIsMenuLoading(false);
            });
        }
        return () => unsubscribe();
    }, [step]);

    // --- Order Logic ---
    const addToOrder = (item) => {
        setOrder(currentOrder => {
            const existingItem = currentOrder.find(orderItem => orderItem.id === item.id);
            if (existingItem) {
                return currentOrder.map(orderItem => 
                    orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
                );
            }
            return [...currentOrder, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId, amount) => {
        setOrder(currentOrder => {
            const updatedOrder = currentOrder.map(item => 
                item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item
            );
            return updatedOrder.filter(item => item.quantity > 0);
        });
    };

    const orderTotal = useMemo(() => order.reduce((total, item) => total + item.price * item.quantity, 0), [order]);

    // --- Navigation & Submission ---
    const handleSendOtp = async (e) => { e.preventDefault(); setIsLoading(true); setError(''); try { const result = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier); setConfirmationResult(result); setStep(2); } catch (err) { setError("Failed to send OTP."); } finally { setIsLoading(false); }};
    const handleVerifyOtp = async (e) => { e.preventDefault(); setIsLoading(true); setError(''); try { await confirmationResult.confirm(otp); setStep(3); } catch (err) { setError("Invalid OTP."); } finally { setIsLoading(false); }};
    const handleTableSelect = (table) => { setSelectedTable(table); setStep(4); };
    
    const handlePlaceOrder = async () => {
        setIsLoading(true);
        setError('');
        try {
            const orderData = {
                userName, phone, tableId: selectedTable.id, tableName: selectedTable.name,
                items: order, totalPrice: orderTotal, status: "New", createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, "orders"), orderData);
            setPlacedOrderId(docRef.id);
            setStep(6);
        } catch (err) {
            console.error("Error placing order: ", err);
            setError("Could not place order.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const startNewOrder = () => {
        setOrder([]);
        setPlacedOrderId(null);
        setStep(4);
    };

    // --- Page Components ---
    const MenuPage = () => {
        const categories = useMemo(() => [...new Set(menuItems.map(item => item.category))], [menuItems]);
        return (
            <div className="w-full">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Our Menu</h1>
                    <p className="text-gray-500 mt-1">Ordering for <span className="font-bold text-indigo-600">{selectedTable.name}</span></p>
                </div>
                {isMenuLoading ? <LoadingSpinner text="Loading Menu..." /> : (
                    <div className="space-y-8">
                        {categories.map(category => (
                            <div key={category}>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 sticky top-0 bg-white py-2">{category}</h2>
                                <div className="space-y-4">
                                    {menuItems.filter(item => item.category === category).map(item => {
                                        const orderItem = order.find(oi => oi.id === item.id);
                                        return (
                                            <div key={item.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                                                <div className="flex-grow">
                                                    <h3 className="font-bold text-lg">{item.name}</h3>
                                                    <p className="text-sm text-gray-600">{item.description}</p>
                                                    <p className="font-semibold text-indigo-600 mt-1">₹{item.price.toFixed(2)}</p>
                                                </div>
                                                {orderItem ? (
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="bg-indigo-500 text-white rounded-full w-8 h-8 font-bold text-lg">-</button>
                                                        <span className="font-bold w-8 text-center">{orderItem.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="bg-indigo-500 text-white rounded-full w-8 h-8 font-bold text-lg">+</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => addToOrder(item)} className="bg-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors">Add</button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {order.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-t-lg border-t">
                        <button onClick={() => setStep(5)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg flex justify-between items-center px-6">
                            <span>{order.length} item{order.length > 1 ? 's' : ''} in cart</span>
                            <span>View Order (₹{orderTotal.toFixed(2)})</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };
    
    const OrderSummaryPage = () => (
        <div className="w-full">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Confirm Your Order</h1>
                <p className="text-gray-500 mt-1">For <span className="font-bold text-indigo-600">{selectedTable.name}</span></p>
            </div>
            <div className="space-y-3 bg-white p-4 rounded-lg shadow">
                {order.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                        <div>
                            <p className="font-bold">{item.name}</p>
                            <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                ))}
                <div className="border-t pt-3 mt-3 flex justify-between items-center">
                    <p className="text-xl font-bold">Total</p>
                    <p className="text-xl font-bold">₹{orderTotal.toFixed(2)}</p>
                </div>
            </div>
            <div className="mt-6 flex gap-4">
                <button onClick={() => setStep(4)} className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg">Back to Menu</button>
                <button onClick={handlePlaceOrder} disabled={isLoading} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg flex justify-center items-center">
                    {isLoading ? <Spinner /> : 'Place Order'}
                </button>
            </div>
        </div>
    );
    
    const OrderStatusPage = () => {
        const [liveOrder, setLiveOrder] = useState(null);
        const [isOrderLoading, setIsOrderLoading] = useState(true);

        useEffect(() => {
            if (!placedOrderId) return;
            const orderDocRef = doc(db, "orders", placedOrderId);
            const unsubscribe = onSnapshot(orderDocRef, (doc) => {
                if (doc.exists()) {
                    setLiveOrder({ id: doc.id, ...doc.data() });
                }
                setIsOrderLoading(false);
            });
            return () => unsubscribe();
        }, [placedOrderId]);

        if (isOrderLoading) return <LoadingSpinner text="Locating your order..." />;
        if (!liveOrder) return <p>Could not find order details.</p>;

        const statuses = ["New", "Preparing", "Ready", "Completed"];
        const currentStatusIndex = statuses.indexOf(liveOrder.status);

        return (
            <div className="w-full text-center">
                <h2 className="text-3xl font-bold text-gray-900">Track Your Order</h2>
                <p className="mt-2 text-gray-600">Thanks for your order, {liveOrder.userName}!</p>
                <div className="my-8">
                    <div className="relative w-full h-2 bg-gray-200 rounded-full">
                        <div className="absolute top-0 left-0 h-2 bg-green-500 rounded-full transition-all duration-500" style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs sm:text-sm">
                        {statuses.map((status, index) => (<span key={status} className={index <= currentStatusIndex ? 'font-bold text-green-600' : 'text-gray-400'}>{status}</span>))}
                    </div>
                </div>
                <div className="bg-indigo-50 p-6 rounded-lg">
                    <p className="text-lg">Current Status:</p>
                    <p className="text-4xl font-extrabold text-indigo-600 animate-pulse">{liveOrder.status}</p>
                </div>
                {liveOrder.status === 'Completed' && (
                    <div className="mt-8">
                        <p className="text-lg mb-4">Your order is complete. Enjoy!</p>
                        <button onClick={startNewOrder} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg">Place Another Order</button>
                    </div>
                )}
            </div>
        );
    };

    // --- Main Render Logic ---
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Welcome!</h1>
                            <p className="text-gray-500 mt-2">Verify your mobile to begin ordering.</p>
                        </div>
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <FormInput id="name" type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="e.g., Rohan Kumar" required />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">10-Digit Mobile Number</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">+91</span>
                                    <FormInput id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" required className="rounded-l-none" />
                                </div>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors">
                                {isLoading ? <Spinner /> : 'Send OTP'}
                            </button>
                        </form>
                    </div>
                );
            case 2:
                return (
                    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900">Verify Your Number</h1>
                            <p className="text-gray-500 mt-2">Enter the 6-digit code sent to +91 {phone}</p>
                        </div>
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">Enter 6-Digit OTP</label>
                                <FormInput id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="_ _ _ _ _ _" required />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors">
                                {isLoading ? <Spinner /> : 'Verify & Proceed'}
                            </button>
                        </form>
                    </div>
                );
            case 3:
                return (
                    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900">Welcome, {userName}!</h1>
                            <p className="text-gray-500 mt-2">Please select your table.</p>
                        </div>
                        {isTablesLoading ? <LoadingSpinner /> : (
                            <div className="grid grid-cols-3 gap-4">
                                {tables.map(table => (
                                    <button key={table.id} onClick={() => handleTableSelect(table)} className="py-4 px-2 bg-indigo-100 text-indigo-800 font-semibold rounded-lg hover:bg-indigo-600 hover:text-white transition-colors shadow-sm">
                                        {table.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 4: return <div className="w-full max-w-2xl mx-auto pb-24"><MenuPage /></div>;
            case 5: return <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg"><OrderSummaryPage /></div>;
            case 6: return <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg"><OrderStatusPage /></div>;
            default: return null;
        }
    };
    
    return (
        <div className="bg-gray-100 min-h-screen flex flex-col justify-center items-center font-sans p-4">
            <div id="recaptcha-container"></div>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm fixed top-4 z-50">{error}</p>}
            {renderStep()}
        </div>
    );
}