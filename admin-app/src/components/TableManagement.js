import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tablesCollection = collection(db, "tables");

// --- Helper Components ---
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 hover:text-red-700">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const FormInput = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
    </div>
);

const ConfirmationModal = ({ message, onConfirm, onCancel, show }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
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
export default function TableManagement() {
    const [tables, setTables] = useState([]);
    const [tableName, setTableName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState({ show: false, message: '', onConfirm: null });

    useEffect(() => {
        const q = query(tablesCollection, orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tablesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTables(tablesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching tables: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tableName.trim()) {
            alert('Table name cannot be empty.');
            return;
        }
        try {
            await addDoc(tablesCollection, { name: tableName.trim() });
            setTableName('');
        } catch (error) {
            console.error("Error adding table: ", error);
        }
    };

    const handleDelete = (id) => {
        setModal({
            show: true,
            message: 'Are you sure you want to delete this table?',
            onConfirm: () => confirmDelete(id)
        });
    };

    const confirmDelete = async (id) => {
        try {
            const tableDoc = doc(db, "tables", id);
            await deleteDoc(tableDoc);
        } catch (error) {
            console.error("Error deleting table: ", error);
        }
        closeModal();
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Table</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <FormInput
                                    label="Table Name or Number"
                                    id="tableName"
                                    name="tableName"
                                    value={tableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                    placeholder="e.g., Table 5 or Patio"
                                    required
                                />
                                <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                    Add Table
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Available Tables</h2>
                            <div className="space-y-3">
                                {isLoading ? (
                                    <p className="text-center text-gray-500 py-8">Loading tables...</p>
                                ) : tables.length > 0 ? tables.map(table => (
                                    <div key={table.id} className="p-4 rounded-lg bg-gray-100 flex items-center justify-between">
                                        <p className="font-semibold text-gray-800">{table.name}</p>
                                        <button onClick={() => handleDelete(table.id)} className="p-1 rounded-full hover:bg-red-100 transition-colors">
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-500 py-8">No tables have been added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}