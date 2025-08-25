import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
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

// --- Initialize Firebase and Firestore ---
// Note: It's okay to initialize multiple times in separate components for this project structure.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const menuItemsCollection = collection(db, "menuItems");


// --- Helper Components ---
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 hover:text-blue-700">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 hover:text-red-700">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const FormInput = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
    </div>
);

const FormSelect = ({ label, id, children, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            {children}
        </select>
    </div>
);

const ConfirmationModal = ({ message, onConfirm, onCancel, show }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
                <p className="text-lg mb-4">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Confirm</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
export default function MenuManagement() {
    const [menuItems, setMenuItems] = useState([]);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', category: 'Starters' });
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState({ show: false, message: '', onConfirm: null });

    useEffect(() => {
        const unsubscribe = onSnapshot(menuItemsCollection, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMenuItems(items);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price || !formData.description) {
            alert('Please fill out all fields.');
            return;
        }

        const data = { ...formData, price: parseFloat(formData.price) };

        try {
            if (editingId) {
                const itemDoc = doc(db, "menuItems", editingId);
                await updateDoc(itemDoc, data);
                setEditingId(null);
            } else {
                await addDoc(menuItemsCollection, { ...data, available: true });
            }
            setFormData({ name: '', description: '', price: '', category: 'Starters' });
        } catch (error) {
            console.error("Error saving document: ", error);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({ name: item.name, description: item.description, price: item.price.toString(), category: item.category });
    };

    const handleDelete = (id) => {
        setModal({
            show: true,
            message: 'Are you sure you want to delete this item?',
            onConfirm: () => confirmDelete(id)
        });
    };

    const confirmDelete = async (id) => {
        try {
            const itemDoc = doc(db, "menuItems", id);
            await deleteDoc(itemDoc);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
        closeModal();
    };

    const toggleAvailability = async (item) => {
        try {
            const itemDoc = doc(db, "menuItems", item.id);
            await updateDoc(itemDoc, { available: !item.available });
        } catch (error) {
            console.error("Error updating availability: ", error);
        }
    };

    const closeModal = () => {
        setModal({ show: false, message: '', onConfirm: null });
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <ConfirmationModal
                show={modal.show}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
            />
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">{editingId ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <FormInput label="Item Name" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Veg Biryani" required />
                                <FormInput label="Description" id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="A short description" required />
                                <FormInput label="Price (₹)" id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="e.g., 200" required />
                                <FormSelect label="Category" id="category" name="category" value={formData.category} onChange={handleInputChange}>
                                    <option>Starters</option>
                                    <option>Main Course</option>
                                    <option>Desserts</option>
                                    <option>Beverages</option>
                                </FormSelect>
                                <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                    {editingId ? 'Update Item' : 'Add Item'}
                                </button>
                                {editingId && (
                                    <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', description: '', price: '', category: 'Starters' }); }} className="w-full mt-2 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                                        Cancel Edit
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Current Menu</h2>
                            <div className="space-y-4">
                                {isLoading ? (
                                    <p className="text-center text-gray-500 py-8">Loading menu...</p>
                                ) : menuItems.length > 0 ? menuItems.map(item => (
                                    <div key={item.id} className={`p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${item.available ? 'bg-green-50' : 'bg-red-50 opacity-70'}`}>
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-lg text-gray-900">{item.name} <span className="text-sm font-normal text-gray-500">({item.category})</span></h3>
                                            <p className="text-gray-600 text-sm">{item.description}</p>
                                            <p className="text-indigo-600 font-semibold mt-1">₹{item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center space-x-3 flex-shrink-0">
                                            <label htmlFor={`available-${item.id}`} className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" id={`available-${item.id}`} className="sr-only" checked={item.available} onChange={() => toggleAvailability(item)} />
                                                    <div className={`block w-14 h-8 rounded-full ${item.available ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${item.available ? 'transform translate-x-6' : ''}`}></div>
                                                </div>
                                                <div className="ml-3 text-gray-700 text-sm font-medium">
                                                    {item.available ? 'Available' : 'Unavailable'}
                                                </div>
                                            </label>
                                            <button onClick={() => handleEdit(item)} className="p-1 rounded-full hover:bg-blue-100 transition-colors"><EditIcon /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1 rounded-full hover:bg-red-100 transition-colors"><DeleteIcon /></button>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-500 py-8">No menu items yet. Add one using the form!</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}