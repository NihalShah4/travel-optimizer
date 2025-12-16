# Travel Optimizer

## Overview

Travel Optimizer is a full‑stack application that helps users plan efficient multi‑country travel routes. The system takes a sequence of countries or cities and automatically determines the optimal travel mode between each leg (flight or ground travel), estimates travel time using realistic assumptions, and visualizes the complete route on a world map.

The goal of this project is to show how real‑world travel logic can be modeled using clean backend APIs, a modern frontend, and clear separation of concerns.

---

## What Problem This Solves

When planning trips across multiple countries, users usually need to:

* Decide when flying makes sense vs ground travel
* Account for fixed overheads like airport time
* Handle long chains of countries realistically
* Visualize the route instead of reading raw numbers

Travel Optimizer automates these decisions and presents the results in a simple, structured way.

---

## Key Features

* Automatic detection of travel mode per leg

  * Ground travel for shorter distances
  * Flights for long distances (around 1500 km and above)

* Realistic travel time calculation

  * Ground travel based on average driving speed
  * Flights include fixed overhead (airport time, waiting, transfers)

* Support for multi‑country chains

  * Example: India → UAE → Italy → France

* World map visualization

  * Pins for each country or city
  * Connected routes showing the travel path

* Clean API design

  * Frontend and backend are fully decoupled

---

## Tech Stack

### Backend

* Python
* FastAPI
* Pydantic (request and response validation)
* Geopy (distance calculations)

### Frontend

* Next.js
* React
* Basic CSS for layout

### Other

* REST APIs
* JSON‑based communication

---

## High‑Level Architecture

1. User enters a list of countries or cities in the frontend
2. Frontend sends the travel plan request to the FastAPI backend
3. Backend:

   * Resolves coordinates
   * Calculates distance between each leg
   * Decides travel mode (flight or ground)
   * Computes total time per leg and overall journey
4. Backend returns a structured response
5. Frontend:

   * Displays travel summary
   * Renders route on the world map

---

## Distance and Travel Logic

### Distance Calculation

* Distances are calculated using latitude and longitude
* Haversine formula is used via Geopy

### Mode Selection Logic

* If distance <= ~1500 km

  * Mode: Ground travel
* If distance > ~1500 km

  * Mode: Flight

This threshold was chosen to reflect realistic travel decisions.

### Speed and Overhead Assumptions

* Ground travel

  * Average speed is assumed
  * No fixed overhead

* Flights

  * Average flight speed is used
  * Fixed overhead added for:

    * Airport arrival
    * Security
    * Boarding
    * Transfers

This avoids unrealistically short flight times.

---

## API Design

### Example Request

```json
{
  "locations": ["India", "UAE", "Italy", "France"]
}
```

### Example Response

```json
{
  "legs": [
    {
      "from": "India",
      "to": "UAE",
      "distance_km": 2290,
      "mode": "flight",
      "time_hours": 7.5
    },
    {
      "from": "UAE",
      "to": "Italy",
      "distance_km": 4300,
      "mode": "flight",
      "time_hours": 9.2
    }
  ],
  "total_time_hours": 16.7
}
```

---

## Frontend Features

* Input form for entering travel locations

* Clear display of:

  * Each travel leg
  * Distance
  * Mode of transport
  * Estimated time

* World map visualization

  * Pins for each location
  * Lines connecting travel legs

The map image is stored locally and rendered in the UI.

---

## Project Structure

```
travel-optimizer/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes.py
│   │   ├── schemas.py
│   │   ├── services/
│   │   │   ├── distance.py
│   │   │   ├── planner.py
│   │   └── utils/
│   └── requirements.txt
│
├── frontend/
│   ├── pages/
│   ├── components/
│   ├── public/
│   │   └── world-map.png
│   └── package.json
│
└── README.md
```

---

## How to Run the Project

### Backend

1. Create and activate a virtual environment
2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Start the server

```bash
uvicorn app.main:app --reload
```

Backend will run on:

```
http://localhost:8000
```

---

### Frontend

1. Install dependencies

```bash
npm install
```

2. Start the development server

```bash
npm run dev
```

Frontend will run on:

```
http://localhost:3000
```

---

## Assumptions and Limitations

* City and country names rely on geocoding accuracy
* No real‑time flight data is used
* Travel times are estimates, not guarantees
* Visa rules, costs, and layovers are not considered

---

## Possible Future Improvements

* Add cost estimation per leg
* Support multiple transport types like trains
* Allow users to adjust speed and overhead assumptions
* Save and load travel plans
* Replace static map with an interactive map

---

## Purpose of This Project

This project demonstrates:

* API design using FastAPI
* Practical distance and travel modeling
* Frontend and backend integration
* Turning real‑world logic into clean, testable code

It is intended as a portfolio‑level project and a foundation for more advanced travel planning tools.
