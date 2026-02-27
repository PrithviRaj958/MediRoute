# MediRoute

## Overview

**MediRoute** is a city-level emergency response prototype designed to simulate intelligent ambulance routing and hospital availability coordination.

The system helps detect the **nearest available ambulance**, track it in **real time**, and route it to an appropriate hospital based on **availability constraints**.

This project is built as a **local MVP prototype** to demonstrate how real-time technologies and geospatial queries can improve emergency response coordination.

---

## Tech Stack

### Frontend

* React
* Mapbox GL JS
* Socket.io Client

### Backend

* Node.js
* Express.js
* MongoDB
* Socket.io

### Geospatial

* MongoDB `2dsphere` indexes
* Mapbox routing & visualization

---

## Architecture

The backend follows a **Layered Architecture**:

```
routes → controllers → services → models
```

**Routes**

* Define API endpoints
* Map requests to controllers

**Controllers**

* Handle request validation
* Coordinate application logic

**Services**

* Core business logic
* Geospatial queries
* Simulation handling

**Models**

* MongoDB schemas
* Data access layer

---

## Project Structure

```
mediroute/
│
├── client/                 # React frontend
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── context/
│
├── server/                 # Node + Express backend
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── socket/
│
├── docs/                   # Architecture and design documents
│
└── README.md
```

---

## Core Features

### 1. Emergency Creation

Users can create an emergency request which triggers the dispatch process.

### 2. Nearest Ambulance Detection

The backend uses **MongoDB geospatial queries (`2dsphere`)** to find the closest available ambulance.

### 3. Real-Time Tracking

Ambulance movement is broadcast through **Socket.io**, allowing clients to track location updates live.

### 4. Hospital Availability Filtering

Hospitals can be filtered based on available resources (beds, emergency capacity).

### 5. Simulation-Based Ambulance Movement

Ambulance movement is simulated along routes to demonstrate real-time tracking behavior.

---

## Setup Instructions

### 1. Clone the Repository

```
git clone https://github.com/PrithviRaj958/MediRoute.git
cd MediRoute
```

---

### 2. Backend Setup

```
cd server
npm install
```

Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
MAPBOX_TOKEN=your_mapbox_token
```

Start the server:

```
npm run dev
```

---

### 3. Frontend Setup

```
cd client
npm install
npm start
```

---



## MVP Scope

This project is designed as a **city-level simulation prototype**.
It does not integrate with real emergency systems but demonstrates the **core routing and coordination logic**.

---

## Future Improvements

* AI-based ambulance allocation
* Traffic-aware routing
* Multi-city scaling
* Real hospital data integration
* Load balancing for dispatch centers

---

