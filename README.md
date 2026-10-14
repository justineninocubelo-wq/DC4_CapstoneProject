# J Prints Service Management System

## Project Information

**Project Title:** J Prints Service Management System

**Client:** J Prints

**Developer:** Justine Nino B. Cubelo

**Course:** Domain Course 4

## Project Description

The J Prints Service Management System is a web-based application
designed to help manage printer repair and service requests.

The system will allow customers to submit service requests and
monitor their status. J Prints staff will be able to manage
customers, services, repair requests, and service records through
an administrative interface.

## Problem Statement

J Prints needs a more organized way to manage customer information
and printer service requests. Information about repairs, services,
prices, and request statuses can become difficult to manage when
handled manually.

The proposed system will provide a centralized web application
where service requests can be recorded, monitored, and updated.

## User Roles

### Admin/Staff

- Manage customers
- Manage services
- Manage service requests
- Manage service records
- Update service request status
- Search and filter records
- View dashboard statistics
- Delete records

### Customer

- Register an account
- Log in
- Submit a service request
- View their service requests
- Monitor service request status
- View service information

## Main Entities

- Users
- Customers
- Services
- Service Requests
- Service Records

1. users
Stores account and login information.
- user_id (Primary Key)
- name
- email (Unique)
- password
- role (admin, staff, or customer)
- created_at, updated_at


2. customers
Stores additional information about customers.
- customer_id (Primary Key)
- user_id (Foreign Key referencing users.id, unique)
- phone
- address
- created_at, updated_at


3. services
Stores the services offered by J Prints.
- service_id (Primary Key)
- service_name
- description
- base_price
- is_active
- created_at, updated_at


4. service_requests
Stores customer repair requests and their current status.
- service_request_id (Primary Key)
- customer_id (Foreign Key referencing customers.id)
- service_id (Foreign Key referencing services.id)
- printer_brand
- printer_model
- issue_description
- status
- received_at
- created_at, updated_at


5. service_records
Stores diagnosis and repair updates for each request.
- service_records_id (Primary Key)
- service_request_id (Foreign Key referencing service_requests.id)
- user_id (Foreign Key referencing users.id)
- diagnosis
- work_performed
- parts_used
- labor_cost
- notes
- recorded_at
- created_at, updated_at

## Service Request Status

Pending
→ Diagnosing
→ In Repair
→ Completed
→ Claimed

## Planned Features

- User registration
- User login
- User logout
- Current user authentication
- Role-based access
- Customer management
- Service management
- Service request management
- Service record management
- Search and filtering
- Pagination
- Dashboard
- Status workflow
- Client-side validation
- Server-side validation
- Loading indicators
- Success and error messages
- Delete confirmation
- Protected routes
- REST API

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Axios
- CSS

### Backend

- Laravel
- Laravel Sanctum
- PHP

### Database

- MySQL

### Development Tools

- Git
- GitHub
- Postman
- Composer
- npm

## Basic Relationships

The J Prints Service Management System uses five main tables: Users, Customers, Services, Service Requests, and Service Records. These tables are connected to organize customer information, available services, repair requests, and the progress of each repair.

- **Users and Customers:** One user account can have one customer profile. The Users table stores login information and the user's role, while the Customers table stores additional customer information. Staff and administrator accounts do not need customer profiles.
- **Customers and Service Requests:** One customer can submit multiple service requests, but each service request belongs to one customer.
- **Services and Service Requests:** One service can be selected for multiple service requests, but each service request is associated with one service.
- **Service Requests and Service Records:** One service request can have multiple service records to document diagnosis, repair progress, parts used, and other service updates. Each service record belongs to one service request.
- **Users and Service Records:** One staff or administrator account can create multiple service records. Each record identifies the staff member who documented the service update.

### Service Request Statuses

The system will use the following statuses to track each printer repair request:

1. **Received:** The printer has been accepted by J Prints, and the request has been recorded.
2. **Diagnosing:** The printer is being inspected to identify the problem.
3. **Repairing:** The repair work is in progress.
4. **Ready:** The repair is finished, and the printer is ready for collection.
5. **Released:** The printer has been returned to the customer, completing the request.

The normal workflow is Received → Diagnosing → Repairing → Ready → Released. Authorized staff or administrators will update the request status as the repair progresses, while customers can view the status of their own requests.

## Database Relationships

The system has five main tables: `users`, `customers`, `services`, `service_requests`, and `service_records`.

- A user account can have one customer profile.
- A customer can submit multiple service requests.
- A service can be associated with multiple service requests.
- A service request can contain multiple service records.
- A staff or administrator user can create multiple service records.

## Database Design

View the [Formal Entity Relationship Diagram](docs/screenshots/J%20Prints%20Service%20Management%20System.png).

The database consists of five main tables: `users`, `customers`,
`services`, `service_requests`, and `service_records`.

Service requests follow the workflow:
Received → Diagnosing → Repairing → Ready → Released.

## Service Request Workflow

Each request follows the normal workflow:

`Received → Diagnosing → Repairing → Ready → Released`

The current status is stored in the `service_requests` table. Authorized staff or administrators update the status, and customers can view the progress of their own requests.

## User Roles

- **Admin:** Manages users, services, customers, service requests, and service records.
- **Staff:** Handles service requests, records diagnosis and repair updates, and updates request statuses.
- **Customer:** Views personal service requests and their current status.