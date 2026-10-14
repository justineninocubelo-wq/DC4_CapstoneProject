# J Prints Service Management System

## Formal Entity Relationship Diagram

![J Prints Service Management System ERD](../screenshots/J%20Prints%20Service%20Management%20System.png)

## Database Tables

The database consists of five main tables:

1. **users:** Stores user accounts, login credentials, and roles.
2. **customers:** Stores customer contact information and links each customer profile to a user account.
3. **services:** Stores the available services, descriptions, prices, and active status.
4. **service_requests:** Stores customer repair requests, printer details, selected services, and current request status.
5. **service_records:** Stores diagnosis details, repair activities, parts used, costs, and service updates recorded by staff.

## Relationships

- One user account can have zero or one customer profile.
- One customer can submit multiple service requests.
- One service can be associated with multiple service requests.
- One service request can have multiple service records.
- One staff or administrator user can create multiple service records.

## Service Request Workflow

The normal service request workflow is:

**Received → Diagnosing → Repairing → Ready → Released**

Authorized staff or administrators update the status as the repair progresses. Customers can view the status of their own requests.