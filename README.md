# J-Prints Service Management System

## Project Information

**Project Title:** J-Prints Service Management System  
**Client:** J-Prints  
**Developer:** Justine Nino B. Cubelo  
**Course:** Domain Course 4

## Project Overview

The J-Prints Service Management System is a web-based application designed to simplify the management of printing services, printer repairs, customer information, and service requests.

The system provides customers with an online platform to submit service requests, monitor their progress, and view their service history. It also allows administrators to manage customers, available services, service requests, and service records through a centralized dashboard.

## System Objectives

The system aims to:

1. Provide an organized platform for managing J-Prints services and customer requests.
2. Allow customers to submit and monitor service requests online.
3. Help administrators manage service requests and update their statuses.
4. Maintain accurate records of completed work, diagnoses, and labor costs.
5. Improve the efficiency and accessibility of service management.

## User Roles

### Administrator

The administrator can:

- Access the administrative dashboard.
- Manage customer information.
- Update service information, pricing, and availability.
- View and manage customer service requests.
- Update service request statuses.
- Create, view, edit, and delete service records.
- Search and filter system records.

### Customer

The customer can:

- Register and log in to an account.
- View available services.
- Submit printing and printer repair requests.
- Monitor the status of submitted requests.
- View personal service history.
- Cancel eligible service requests.

## Available Services

The system supports two main services:

**1. Document Printing and Photocopying**

Customers can submit printing requests by providing the document description, number of copies, paper size, color mode, and additional instructions.

**2. Printer Repair**

Customers can request printer repair services by providing the printer brand, model, and a description of the problem.

Administrators can update the information, prices, and availability of these services.

## Main System Features

- User registration and authentication
- Role-based access control
- Admin and Customer dashboards
- Customer management
- Services management
- Service request submission and tracking
- Service request status management
- Service records management
- Search, filtering, and pagination
- Form validation and error handling
- Responsive interface with collapsible sidebar
- REST API integration

## Service Request Workflow

Service requests follow these statuses:

**Received → Diagnosing → Repairing → Ready → Released**

The administrator updates the request status as the service progresses. Customers can monitor their requests through their dashboard.

Eligible requests may also be cancelled.

## Database Structure

The system uses five main tables:

| Table | Description |
|---|---|
| `users` | Stores user accounts, credentials, and roles. |
| `customers` | Stores customer profile information. |
| `services` | Stores the two supported services, pricing, and availability. |
| `service_requests` | Stores printing and repair requests, including their statuses and service-specific details. |
| `service_records` | Stores diagnoses, work performed, parts used, labor costs, and service documentation. |

### Database Relationships

- One user account can have one customer profile.
- One customer can submit multiple service requests.
- One service can be associated with multiple service requests.
- One service request can have multiple service records.
- One administrator can create multiple service records.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Routing | React Router |
| HTTP Client | Axios |
| Backend | Laravel, PHP |
| Authentication | Laravel Sanctum |
| Database | SQLite |
| Version Control | Git and GitHub |
| Development Environment | Visual Studio Code |

## Project Structure

```text
J-Prints-Service-Management-System/
├── backend/       # Laravel REST API
├── frontend/      # React application
├── docs/          # Project documentation
├── .gitignore
└── README.md
```

## Running the Application

### Backend

Open a terminal in the `backend` directory:

```bash
composer install
php artisan migrate
php artisan serve
```

Ensure that the Laravel `.env` file is configured for SQLite and that the required application key and database file have been initialized.

### Frontend

Open another terminal in the `frontend` directory:

```bash
npm install
npm run dev
```

The application normally runs at:

- **Frontend:** `http://localhost:5173`
- **Backend:** `http://127.0.0.1:8000`

Both servers must be running for the application to function correctly.

## Conclusion

The J-Prints Service Management System provides a centralized platform for managing printing and printer repair services. Through its customer and administrator interfaces, the system helps organize service requests, monitor their progress, and maintain service records, supporting a more efficient and systematic workflow for J-Prints.