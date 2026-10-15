
# Authentication API Testing

## J Prints Service Management System

### Overview

This document records the testing of the Laravel Sanctum authentication API using Thunder Client in Visual Studio Code.

The purpose of these tests is to verify customer registration, login, authentication tokens, logout, and role-based access control.

## Technologies Used

- Laravel 12
- Laravel Sanctum
- MySQL
- Thunder Client
- Visual Studio Code

## API Test Results

| Method | Endpoint | Expected Status | Result |
|---|---|---|---|
| POST | /api/register | 201 Created | Passed |
| POST | /api/login | 200 OK | Passed |
| GET | /api/me | 200 OK | Passed |
| GET | /api/admin-test (Customer) | 403 Forbidden | Passed |
| POST | /api/logout | 200 OK | Passed |
| GET | /api/me (Revoked Token) | 401 Unauthorized | Passed |
| GET | /api/admin-test (Admin) | 200 OK | Passed |

## Customer Registration

A new customer account was registered successfully.

The API automatically assigned the customer role and generated an authentication token.

## Customer Login

The registered customer successfully logged in using valid credentials.

Laravel Sanctum generated an authentication token that could be used to access protected endpoints.

## Authenticated User

The /api/me endpoint successfully returned the authenticated customer's information when a valid Bearer Token was provided.

## Role-Based Access Control

A customer attempted to access the admin-only endpoint and received a 403 Forbidden response.

An administrator accessed the same endpoint and received a 200 OK response.

This confirms that the tested route correctly distinguishes between customer and administrator permissions.

## Logout and Token Revocation

The customer successfully logged out.

After logout, the previously issued token was rejected by the protected endpoint with a 401 Unauthorized response.

## Conclusion

All seven authentication API tests passed.

The authentication system supports customer registration, login, authenticated user retrieval, logout, token revocation, and role-based access control for the tested endpoints.
