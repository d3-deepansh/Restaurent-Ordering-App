QR Code Restaurant Ordering System
🚀 Project Overview
Welcome! This project is a digital ordering system for restaurants. Imagine sitting down at a table, scanning a QR code with your phone, and ordering your entire meal without ever needing to call a waiter. That's what this project does.
It consists of two main parts:
1.	A Customer App: A simple website that customers use to order food.
2.	An Admin Panel: A dashboard for restaurant staff to see and manage those orders.
✨ Features
👨‍🍳 For the Customer
•	Scan & Order: Scan a QR code to instantly open the menu.
•	Secure Login: Quickly verify your phone number with a one-time password (OTP).
•	Pick Your Table: Let the kitchen know exactly where you're sitting.
•	Live Menu: See only the food that's actually available right now.
•	Easy Cart: Add food, change your mind, and adjust quantities easily.
•	Track Your Food: Watch the status of your order change in real-time, from the kitchen to your table.
🖥️ For the Restaurant Staff
•	Live Order Screen: New orders pop up on the screen instantly. No refreshing needed!
•	Simple Workflow: Move orders from "New" to "Preparing" to "Ready" with one click.
•	Edit Orders on the Fly: Add a last-minute drink or another dish to a customer's active order.
•	Discounts & Bills: Easily apply discounts and print a professional, itemized bill for the customer.
•	Check Past Sales: Use a calendar to look at the orders and most popular dishes from any previous day.
•	Manage Your Menu: Add new dishes, edit prices, or mark an item as "sold out."
•	Manage Your Tables: Add or remove tables from the customer's view.
🛠️ Technology Stack (The Tools We Used)
Think of building this project like building a house. We used specific tools for different jobs:
•	React.js (The Walls and Windows): This is what we used to build what you see. It lets us create reusable UI components, like buttons and order cards, so the website is fast and interactive.
•	Google Firestore (The Live Brain): This is our database. It's like the restaurant's live memory. When a customer places an order, it's stored here. When a chef updates an order, that change is saved here. Its most important feature is being real-time.
•	Firebase Authentication (The Bouncer): This is our security guard. It handles the process of sending an OTP to the customer's phone to make sure they are who they say they are.
•	Tailwind CSS (The Paint and Furniture): This is our interior designer. It's a tool that let us style the application to make it look clean and modern without writing a lot of custom style code.
📁 Folder Structure
The project is organized into two main folders, one for each application.
Directory structure:
└── Restaurent/
     ├── admin-app/
     │    ├── package-lock.json
     │    ├── package.json
     │    ├── public/
     │    │    ├── favicon.ico
     │    │    ├── index.html
     │    │    ├── logo192.png
     │    │    ├── logo512.png
     │    │    ├── manifest.json
     │    │    └── robots.txt
     │    ├── README.md
     │    └── src/
     │         ├── App.css
     │         ├── App.js
     │         ├── App.test.js
     │         ├── components/
     │         │    ├── MenuManagement.js
     │         │    ├── OrderDashboard.js
     │         │    └── TableManagement.js
     │         ├── index.css
     │         ├── index.js
     │         ├── logo.svg
     │         ├── reportWebVitals.js
     │         └── setupTests.js
     └── customer-app/
          ├── package-lock.json
          ├── package.json
          ├── public/
          │    ├── favicon.ico
          │    ├── index.html
          │    ├── logo192.png
          │    ├── logo512.png
          │    ├── manifest.json
          │    └── robots.txt
          ├── README.md
          └── src/
               ├── App.css
               ├── App.js
               ├── App.test.js
               ├── index.css
               ├── index.js
               ├── logo.svg
               ├── reportWebVitals.js
               └── setupTests.js
⚙️ How It Works: The Magic of Real-Time
The most important concept to understand is how the customer's phone and the admin's screen are always in sync.
Imagine the database is a shared whiteboard in the kitchen.
1.	A Customer Orders: The customer uses their phone to write a new order on the whiteboard.
o	In the code: The customer-app creates a new document (a file) in the orders collection (a folder) in Firestore.
2.	The Admin Sees It Instantly: The admin's dashboard is always watching this whiteboard. The moment the new order appears, it shows up on their screen.
o	In the code: The admin-app uses a function called onSnapshot. This function gets an instant notification from Firestore whenever anything in the orders collection changes.
3.	The Chef Updates the Status: A chef in the kitchen sees the order and marks it as "Preparing" on the whiteboard.
o	In the code: The admin-app updates the status field in the order's document from "New" to "Preparing".
4.	The Customer Sees the Update: The customer, who is also watching their specific order on the whiteboard, sees the status change on their phone's tracking screen instantly.
o	In the code: The customer-app also uses onSnapshot to get an instant notification when its own order document is updated.
This creates a perfect, live communication loop between everyone involved.
🗂️ Database Structure (The Filing Cabinet)
Our database is organized like a digital filing cabinet with three drawers (collections).
1. The menuItems Drawer
This holds a file (document) for every single dish and drink.
•	Inside each file: name, description, price, category, and a switch for available (true or false).
2. The tables Drawer
This holds a simple file for each table in the restaurant.
•	Inside each file: Just the table name (e.g., "Table 5").
3. The orders Drawer
This is the busiest drawer, holding a file for every order placed.
•	Inside each file:
o	userName and phone of the customer.
o	tableName they are sitting at.
o	items: A list of all the food they ordered, including the quantity and price of each.
o	totalPrice: The final bill amount.
o	status: Where the order is in the process ("New", "Preparing", etc.).
o	createdAt: The exact time the order was placed.
💻 Code Breakdown (A Quick Tour)
customer-app/src/App.js
•	The Director of the Customer's Movie. This one file controls everything the customer sees. It uses a state variable called step to decide which "scene" to show: the login form, the menu, or the order tracking screen.
admin-app/src/App.js
•	The Main Switchboard for the Admin. This file doesn't do much on its own. Its only job is to look at which button the admin has clicked (Orders, Menu, or Tables) and connect them to the right component.
admin-app/src/components/OrderDashboard.js
•	The Live Command Center. This is the most important part of the admin panel. It's where onSnapshot listens for new orders and displays them. It also contains the code for the pop-up window (EditOrderModal) where admins can edit orders and print the bill.
admin-app/src/components/MenuManagement.js & TableManagement.js
•	The Inventory Managers. These are simple, straightforward components. They show a list of items from the database and have forms to add, update, or delete those items.

