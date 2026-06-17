# BarHop Creator WebApp - Master Context

## Overview
The **BarHop Creator WebApp** is a B2B SaaS platform designed for venue owners (bars, clubs, restaurants, etc.) to create and manage their presence on the BarHop mobile app. The core mechanic relies on a "Tinder-style" venue card that users can swipe on. The platform allows venue owners to create these cards, track marketing analytics (impressions, swipe rates, match rates), and will eventually support VIP reservations, staff payouts, and detailed revenue analytics.

The stack utilizes:
*   **Frontend**: React.js (Bootstrapped with Create React App), React Router, Context API.
*   **Backend / DB**: Firebase (Authentication, Firestore, Cloud Functions).
*   **Media Storage**: Cloudinary (for high-quality image uploads).
*   **External APIs**: Foursquare Places API (Proxied via Firebase Cloud Functions).

---

## File & Directory Structure

### Configuration & Root
*   `package.json` / `package-lock.json`: Dependencies including React, Firebase, Cloudinary SDKs, and React Router.
*   `firebase.json` / `.firebaserc`: Firebase hosting, functions, and project configuration.
*   `src/index.js` & `src/App.js`: Application entry points. `App.js` manages the core routing (Public vs. Private Routes) and wraps the application in Auth and Error Context providers.
*   `src/types.ts`: Core domain models (TypeScript types/interfaces) that define the Firestore schema for `User`, `Venue`, `Reservation`, `StaffMember`, and `RevenueAnalytics`.

### Pages (`src/pages/`)
*   `Landing.js`: The public-facing marketing page.
*   `Register.js` / `Login.js`: Authentication screens for venue owners to sign up or log in.
*   `Dashboard.js`: The central hub for authenticated users. It displays the active venue's status, analytics summaries (impressions, swipe rates), and provides links to edit or preview their venue card.
*   `CreateVenue.js`: A multi-step form where owners input their venue's details (name, category, hours, social links) and upload images.
*   `Preview.js`: Displays a live preview of the venue card exactly as it will appear in the consumer app.

### Components (`src/components/`)
*   `DashboardLayout.js`: Wrapper component for authenticated routes, rendering the `Sidebar` and dynamic content.
*   `Sidebar.js`: Primary navigation menu for the dashboard.
*   `Navbar.js`: Top navigation component.
*   `VenueCard.js` / `VenueCardPreview.js`: UI components responsible for rendering the Tinder-style venue card with images, descriptions, and interactive elements.
*   `ErrorBoundary.js`: React boundary to catch runtime errors and display a fallback UI.

### Contexts (`src/context/`)
*   `AuthContext.js`: Manages global user authentication state and session data.
*   `ErrorContext.js`: Manages global error notifications and toast alerts.

### Firebase Services (`src/firebase/`)
*   `config.js`: Firebase app initialization and provider setup.
*   `authService.js`: Wrappers for Firebase Auth (Email/Password, Google OAuth).
*   `userService.js`: Handles user profile management within Firestore.
*   `venueService.js`: Core CRUD operations for `venues`. Also contains placeholder logic for B2B operations like VIP reservations and staff management. Includes Cloudinary integration (`uploadVenueImages`) for venue photos.
*   `analyticsService.js`: Fetches and aggregates daily marketing logs (swipes, impressions) from Firestore for dashboard visualizations.

### Cloud Functions (`functions/`)
*   `index.js`: Contains backend serverless functions. Currently houses the `foursquareSearch` function, which acts as a secure proxy to the Foursquare Places API, preventing CORS issues and securing the API key while fetching venue lookup data.

---

## Current Completed Features

1.  **Authentication & Security**:
    *   Email/Password and Google sign-in methods.
    *   Route protection via `PrivateRoute` and `PublicRoute` wrappers.
2.  **Venue Creation Pipeline**:
    *   Comprehensive multi-step form capturing core details, social links, and weekly hours.
    *   Image uploading via Cloudinary rather than Firebase Storage for optimized media delivery.
    *   Integration with Foursquare Places API (via a secure Firebase Cloud Function) to streamline onboarding/lookup.
3.  **Dashboard & Analytics**:
    *   Static Sidebar layout wrapped over dynamic routing.
    *   Integration with Firestore to retrieve and aggregate daily swipe analytics (Impressions, Right/Left Swipes, Match Rates).
    *   Empty states prompting users to create a venue if none exists.
4.  **Tinder-Style Venue Card Previews**:
    *   UI components accurately mirroring the mobile app experience so owners can preview how their business is represented.
5.  **State & Error Management**:
    *   Robust React Context providers for handling session state and globally bubbling up UI errors/toasts.

*(Note: Advanced B2B features defined in `types.ts` such as VIP Reservations, Staff/Payout management, and Revenue Analytics have their core schemas and service shells built but await full UI/UX implementation).*
