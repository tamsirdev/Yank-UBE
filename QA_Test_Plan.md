# UBEP QA Test Plan
**Version 1.0**

## 1. Introduction
This document outlines the testing strategy for the Used Book Exchange Portal to ensure it meets SRS requirements and provides a bug-free experience.

## 2. Test Environment
- **OS**: Windows/macOS/Linux
- **Browsers**: Chrome (Primary), Firefox, Safari
- **Tools**: Chrome DevTools, Postman (API Testing)

## 3. Test Cases

### 3.1 Authentication & Profile
| Test ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| TC-01 | User Registration | User successfully created; 'phone' field is saved; redirected to dashboard. |
| TC-02 | Login Validation | Rejects incorrect email/password with "Invalid credentials" toast. |
| TC-03 | Duplicate Email | Registration fails if email already exists in Database. |

### 3.2 Book Management
| Test ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| TC-04 | Add Book | Book appears in "Browse" for others and "My Books" for the owner. |
| TC-05 | Delete Book | Owner can delete their book; listing disappears from all grids. |
| TC-06 | Image URL | Book card renders the image correctly from a valid URL. |

### 3.3 Messaging & Real-time
| Test ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| TC-07 | Socket Connection | User joins room on login (Check console logs for "User X joined room"). |
| TC-08 | Instant Messaging | Message sent by User A appears instantly for User B without page refresh. |
| TC-09 | Chat History | Refreshing the page persists previous chat messages. |

### 3.4 Exchanges
| Test ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| TC-10 | Propose Exchange | Request appears in the receiver's "Exchanges" section. |
| TC-11 | Mismatched Data | API correctly handles `fromUserId` and `toUserId` mapping. |

### 3.5 Admin Panel
| Test ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| TC-12 | Admin Access | "Admin" link only visible if `roles === 'admin'`. |
| TC-13 | Stats Accuracy | Total counts (Users, Books) match the current database state. |

## 4. Regression Testing
After any bug fix (like the "roles" column fix), verify:
1. New user registration.
2. Database initialization via `initDb()` logic.
3. Admin dashboard access.

## 5. Security Testing
- Verify passwords are NOT stored in plain text (Check `users` table in Postgres).
- Verify sensitive fields (like `password`) are excluded from API responses (RETURNING clause in `server.js`).
