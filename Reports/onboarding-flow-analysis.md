# Onboarding & Document Upload Flow Analysis

This report provides a deep-dive analysis of the user onboarding and document verification system in the `vo-onelink-google` project. It maps the end-to-end flow from the frontend components to the backend API routes.

---

### **1. Onboarding Flow Implementation**

**✅ Is the 4-step enhanced onboarding properly implemented?**

**Yes, for the most part.** The frontend (`/auth/onboarding/page.tsx`) correctly implements a multi-step process for both `influencer` and `brand` roles. The flow is as follows:

1.  **Step 1: Profile Basics** (`ProfileBasicsStep.tsx`)
    -   Collects name, display name, country, phone, and language.
    -   Makes API calls to `/api/onboarding/check-handle` for display name validation and to `/api/onboarding/send-otp` / `/api/onboarding/verify-otp` for phone verification.

2.  **Step 2: Profile Details** (Role-Specific)
    -   **Influencer:** `InfluencerProfileStep.tsx` collects social links, audience size, niches, and bio.
    -   **Brand:** `BrandProfileStep.tsx` collects legal/trade names, website, contact info, and business address.

3.  **Step 3: Verification (KYC/KYB)** (Role-Specific)
    -   **Influencer:** `InfluencerKYCStep.tsx` handles the upload of ID, selfie, proof of address, and bank statement.
    -   **Brand:** `BrandKYBStep.tsx` handles the upload of business registration, bank passbook, representative ID, and an optional retail permit.

4.  **Step 4: Commission** (`CommissionStep.tsx`)
    -   Collects preferred commission rates, with different UIs for influencers and brands.

5.  **Step 5: Review & Submit** (`ReviewStep.tsx`)
    -   Summarizes all entered data.
    -   Requires agreement to legal terms and a simulated CAPTCHA.
    -   Calls the final `/api/onboarding/submit` endpoint.

**Observation:** While the frontend shows a 5-step process (including Review), the core logic is a 4-step data collection flow, which is correctly implemented.

---

### **2. Document Upload System**

**✅ Are document upload components connected to the API?**

**Yes.** The `DocumentUploader` component (`components/ui/document-uploader.tsx`) and the individual file upload cards in the KYC/KYB steps are correctly wired to the `/api/onboarding/docs` API route.

-   **Frontend Logic:**
    -   When a user selects a file, the component validates its size and type on the client side.
    -   It then immediately sends a `POST` request to `/api/onboarding/docs` with the file and `documentType` in a `FormData` object.
    -   The UI shows a progress bar and updates to a "Submitted" or "Verified" state upon a successful API response.

-   **Backend Logic (`/api/onboarding/docs/route.ts`):**
    -   The API route is correctly configured with the `nodejs` runtime to handle `FormData`.
    -   It authenticates the user using `getCurrentUser`.
    -   It creates or finds an existing `verification_requests` record for the user.
    -   **Crucially, it sanitizes the filename to prevent path traversal vulnerabilities before uploading.**
    -   It uploads the file to the `documents` bucket in Supabase Storage.
    -   It saves a corresponding record in the `verification_documents` table, linking the file to the user's verification request.
    -   It returns the public URL of the uploaded file.

**Conclusion:** The document upload system is robust, secure, and correctly implemented end-to-end.

---

### **3. Phone Verification (OTP)**

**✅ Does phone verification work end-to-end?**

**Yes, as a mock implementation.** The flow is correctly implemented but relies on simulated backend logic.

-   **Step 1: Send OTP (`/api/onboarding/send-otp`)**
    -   The frontend calls this API when the user clicks "Send OTP".
    -   The backend simulates sending an OTP and, in development mode, returns the mock OTP in the response for testing. In a real-world scenario, this would integrate with an SMS provider like Twilio.

-   **Step 2: Verify OTP (`/api/onboarding/verify-otp`)**
    -   The frontend calls this API with the phone number and the user-entered code.
    -   The backend mock logic accepts any 6-digit code ending in "0" or "1", or the code "123456".
    -   Upon success, it returns a `verified: true` status, and the frontend UI updates to show the phone number as verified.

**Conclusion:** The flow is logically sound and ready for integration with a real SMS service.

---

### **4. Role-Specific Flows**

**✅ Are role-specific flows (influencer vs brand) properly separated?**

**Yes.** The application does an excellent job of handling role-specific logic.

-   **Sign-Up:** The `/sign-up` page correctly redirects users with `role=influencer` or `role=brand` to the `/auth/onboarding` page.
-   **Onboarding Page:** The main onboarding page (`/auth/onboarding/page.tsx`) uses the `role` from the user's profile to conditionally render the correct components for Step 2 (Profile Details) and Step 3 (KYC/KYB).
-   **Component Implementation:** The `InfluencerProfileStep.tsx` and `BrandProfileStep.tsx` (and their corresponding KYC/KYB components) are entirely separate, ensuring a clean separation of concerns.

**Conclusion:** The role-specific paths are well-architected and correctly implemented.

---

### **5. Session & Progress Tracking**

**✅ Is session tracking working for progress resumption?**

**Yes.** The onboarding page (`/auth/onboarding/page.tsx`) uses `localStorage` to persist the user's progress.

-   **Saving:** An effect with a 1-second debounce automatically saves the entire `OnboardingData` state to `localStorage` under the key `onelink-onboarding`.
-   **Loading:** When the page mounts, it checks for this key in `localStorage` and hydrates the state, allowing the user to resume from where they left off.
-   **API Calls:** While progress is saved locally for UX, each step completion also triggers a `POST` request to the corresponding `/api/onboarding/step-*` endpoint. **However, these API endpoints are currently mock implementations and do not persist data to the database.**

**Conclusion:** Client-side progress resumption is fully functional. The backend needs to be updated to persist this step-by-step data in the database if server-side resumption is required.

---

### **6. Korean Business Validation**

**✅ Are Korean business validation features active?**

**No, not explicitly.** There is no specific logic for validating a Korean Business Registration Number (BRN).

-   **UI:** The `BrandKYBStep.tsx` component includes a generic "Business ID (TIN/VAT/BRN)" input field.
-   **Country Selection:** The `ProfileBasicsStep.tsx` and `BrandProfileStep.tsx` components both include "South Korea" as a selectable country.
-   **Backend:** There are no API routes or logic that perform a lookup or validation against a Korean business registry API (like the National Tax Service).

**Recommendation:** To implement this, you would need to:
1.  Add a condition in `BrandKYBStep.tsx` that triggers a validation check when the selected `taxCountry` is "KR".
2.  Create a new API route (e.g., `/api/validation/kr-brn`) that takes a business number as input.
3.  This new API route would then make a secure, server-to-server request to the appropriate third-party Korean validation service.

**Conclusion:** The foundation is there (country selection), but the specific validation logic is not implemented.
