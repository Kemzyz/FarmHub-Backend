#  FarmHub Backend API Documentation (from Postman Collection)

##  Overview
FarmHub is a backend service for managing users, farmers, and agricultural products.  
It provides RESTful APIs for authentication,
Built with **Node.js**, **Express.js**, and **MongoDB**.

---

##  Base URL
**Deployed Backend:** https://farmhub-backend-26rg.onrender.com <br>
**Local Backend:** http://localhost:5000

---
**Authentication**

* Access tokens returned on successful login. Send as: Authorization: Bearer
* Protected endpoints require the Authorization header.


---

## Setup Instructions

```
# Clone repository
git clone https://github.com/Kemzyz/FarmHub-Backend.git

# Navigate to folder
cd FarmHub-Backend

# Install dependencies
npm install

# Create .env file and include:
MONGO_URI=<your-mongodb-url>
JWT_SECRET=<your-secret-key>
PORT=5000

# Start server
npm start

Backend Developer - EHIKWE NKEMKAMMA EMMANUEL
N/B: This project was built for learning and team collaboration.