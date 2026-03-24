# Form Validation Testing Guide

## Overview
This guide provides step-by-step instructions to test all validations in the registration forms for Admin Personnel and Security Officers in the Operational Manager Dashboard.

## Features Tested

### ✅ Frontend Real-Time Validation
- **Green checkmark** appears when field is valid
- **Error messages** appear below fields when invalid
- **Red border** on invalid fields
- Real-time feedback as users type

### ✅ Backend Validation (Spring Boot)
- **JSR-303** validation annotations on `RegisterUserRequest` DTO
- **Custom validators** for: NIC, Phone, Password Strength, Age, Bank Account
- **Structured error responses** with field-level messages

### ✅ Frontend Error Display
- All backend validation errors display at field level
- Admin toast notifications show errors
- Form prevents submission until errors are resolved

---

## Test Cases

### 1. Admin Registration Form Testing

#### Test 1.1: Username Validation
**Field:** Username (required)
**Rules:**
- Required (min 3 chars, max 50 chars)

**Test Steps:**
- [ ] Leave blank → Error: "Username is required"
- [ ] Type "ab" → Error: "Username must be at least 3 characters"
- [ ] Type "validusername" → Green checkmark ✓
- [ ] Submit with duplicate username → Backend error: "Username already exists"

**Expected Result:**
- Real-time validation shows format errors
- Backend validates uniqueness
- Form cannot submit with errors

---

#### Test 1.2: Password Validation
**Field:** Password (required, strong)
**Rules:**
- Min 8 characters
- Must contain: uppercase, lowercase, number, special char (@$!%*?&)

**Test Steps:**
- [ ] Leave blank → Error: "Password is required"
- [ ] Type "pass" → Error: "Password must be at least 8 characters"
- [ ] Type "password123" → Error: "must contain at least one special character"
- [ ] Type "Pass@123" → Green checkmark ✓
- [ ] Type "Test@1234" → Green checkmark ✓

**Expected Result:**
- Real-time validation enforces all requirements
- Special character requirement is clear
- Green checkmark only when ALL conditions met

---

#### Test 1.3: Email Validation
**Field:** Email (required, valid format)
**Rules:**
- Required
- Valid email format

**Test Steps:**
- [ ] Leave blank → Error: "Email is required"
- [ ] Type "invalid@" → Error: "Please enter a valid email address"
- [ ] Type "user@example.com" → Green checkmark ✓
- [ ] Submit with duplicate email → Backend error: "Email already registered"

**Expected Result:**
- Frontend validates format
- Backend validates uniqueness
- Cannot submit with format or duplicate errors

---

#### Test 1.4: NIC Number Validation
**Field:** NIC Number (required for non-CHAIRMAN/DIRECTOR)
**Rules:**
- 9 digits + X/V (old format: 123456789X)
- OR 12 digits (new format: 123456789012)

**Test Steps:**
- [ ] Leave blank → Error: "NIC number is required"
- [ ] Type "123456789" → Error: "Invalid NIC format. Must be 9 digits + X/V or 12 digits"
- [ ] Type "123456789X" → Green checkmark ✓
- [ ] Type "123456789012" → Green checkmark ✓
- [ ] Type "12345678x" → Green checkmark ✓ (case insensitive)
- [ ] Submit with duplicate NIC → Backend error: "NIC number already registered"

**Expected Result:**
- Validates both old and new NIC formats
- Case insensitive for X/V
- Backend prevents duplicate NICs

---

#### Test 1.5: Phone Number Validation
**Field:** Mobile Number & Emergency Contact (required for non-CHAIRMAN/DIRECTOR)
**Rules:**
- Sri Lankan format: +94, 0, or full number
- Examples: "+94701234567", "0701234567", "701234567"

**Test Steps:**
- [ ] Leave blank → Error: "Mobile number is required"
- [ ] Type "123" → Error: "Invalid phone number..."
- [ ] Type "0701234567" → Green checkmark ✓
- [ ] Type "+94701234567" → Green checkmark ✓
- [ ] Type "701234567" → Green checkmark ✓
- [ ] Type "0701234567" (for Emergency Contact) → Green checkmark ✓
- [ ] Submit with invalid format → Backend error: "Invalid phone number format"

**Expected Result:**
- Accepts all valid Sri Lankan phone formats
- Rejects invalid formats
- Both mobile and emergency contact validated

---

#### Test 1.6: Date of Birth & Age Validation
**Field:** Date of Birth (required for non-CHAIRMAN/DIRECTOR)
**Rules:**
- Required
- Age must be 18-65 years

**Test Steps:**
- [ ] Leave blank → Error: "Date of birth is required"
- [ ] Select date making user 14 years old → Error: "Age must be at least 18 years"
- [ ] Select date making user 70 years old → Error: "Age must not exceed 65 years"
- [ ] Select date making user 30 years old → Green checkmark ✓

**Expected Result:**
- Age calculation is accurate
- Rejects users too young or too old
- Real-time validation updates as date changes

---

#### Test 1.7: Assigned Area (AREA_MANAGER only)
**Field:** Assigned Area (appears only when role = AREA_MANAGER)
**Rules:**
- Required for AREA_MANAGER
- Min 2 characters

**Test Steps:**
- [ ] Select role "AREA_MANAGER" → Field appears
- [ ] Leave blank → Error: "Assigned area is required"
- [ ] Type "K" → Error: "Assigned area must be at least 2 characters"
- [ ] Type "Colombo North" → Green checkmark ✓
- [ ] Select different role → Field disappears

**Expected Result:**
- Field only shows for AREA_MANAGER role
- Validation enforces required and minimum length
- Field hides when role changes

---

#### Test 1.8: Role-Specific Field Visibility
**Field:** Various fields depending on role
**Rules:**
- CHAIRMAN & DIRECTOR: Simplified form (fullName, email, password, username only)
- Other roles: Full extended form

**Test Steps:**
- [ ] Select "CHAIRMAN" → Only basic fields shown
- [ ] Select "EXECUTIVE_OFFICER" → All fields shown
- [ ] Required fields marked with red asterisk on both

**Expected Result:**
- CHAIRMAN/DIRECTOR see minimal form
- Other roles see full form
- No validation errors for hidden fields

---

#### Test 1.9: Bank Account Number Validation
**Field:** Bank Account Number (optional for non-CHAIRMAN/DIRECTOR)
**Rules:**
- If provided: 8-18 digits only

**Test Steps:**
- [ ] Leave blank → No error (optional)
- [ ] Type "12345" → Error: "must be between 8 and 18 digits"
- [ ] Type "123456789" → Green checkmark ✓
- [ ] Type "12345678901234567890" → Error: "must not exceed 18 digits"

**Expected Result:**
- Optional field
- When filled, validates digit count
- Accepts 8-18 digit accounts

---

#### Test 1.10: Form Submission with Multiple Errors
**Test Steps:**
- [ ] Leave all fields blank except role
- [ ] Click Submit
- [ ] Verify:
  - [ ] Username error shown
  - [ ] Password error shown
  - [ ] Full Name error shown
  - [ ] Email error shown
  - [ ] NIC error shown (if visible for role)
  - [ ] Mobile error shown (if visible for role)
  - [ ] All errors display at once

**Expected Result:**
- All validation errors appear simultaneously
- Form does not submit
- Toast shows all error messages
- Can correct multiple fields before resubmitting

---

### 2. Security Officer Registration Form Testing

#### Test 2.1: Required Fields (Same as Admin)
- [ ] Username validation (same as Admin)
- [ ] Password validation (same as Admin)
- [ ] Full Name validation (same as Admin)
- [ ] Email validation (same as Admin)
- [ ] NIC Number validation (same as Admin)
- [ ] Mobile Number validation (same as Admin)
- [ ] Date of Birth & Age validation (same as Admin)

**Expected Results:**
- Same validation rules apply as Admin form
- Real-time feedback for all fields

---

#### Test 2.2: Sex Selection (Required)
**Field:** Sex (required dropdown)

**Test Steps:**
- [ ] Leave unselected → Error on submit: "Please select sex"
- [ ] Select "MALE" → No error, can proceed
- [ ] Select "FEMALE" → No error, can proceed

**Expected Result:**
- Red error message if submit attempted without selection
- Error clears when selection made

---

#### Test 2.3: Designation Selection (Required)
**Field:** Designation (required dropdown)
**Options:** LSO, JSO, SSO, CSO, ISO

**Test Steps:**
- [ ] Leave unselected → Error on submit: "Please select a designation"
- [ ] Select "LSO" → No error, displays "Leading Security Officer"
- [ ] Select "SSO" → No error, displays "Senior Security Officer"

**Expected Result:**
- Required field validation on submit
- Shows user-friendly designation names
- Error clears when selection made

---

#### Test 2.4: Residential Address Validation
**Field:** Residential Address Textarea
**Rules:**
- Required
- Min 5 chars, Max 500 chars

**Test Steps:**
- [ ] Leave blank → Error: "Residential address is required"
- [ ] Type "Main" → Error: "must be at least 5 characters"
- [ ] Type "123 Main Street, City" → Green checkmark ✓
- [ ] Enter 501+ characters → Error: "must not exceed 500 characters"

**Expected Result:**
- Real-time validation for length requirements
- Textarea errors display below field

---

#### Test 2.5: Equipment Handover (Optional)
**Field:** Equipment Checkboxes (optional)

**Test Steps:**
- [ ] Don't select any equipment → Form submits successfully
- [ ] Select 1 equipment → Form submits successfully
- [ ] Select multiple equipment → Form submits successfully
- [ ] Verify selected items are sent to backend

**Expected Result:**
- Equipment is optional (no required validation)
- Multiple selections allowed
- Equipment data properly sent on submit

---

#### Test 2.6: Bank Details (Optional)
**Field:** Bank Account Number (optional)

**Test Steps:**
- [ ] Leave blank → No error (optional)
- [ ] Type "123456789" → Green checkmark ✓
- [ ] Email "12345" → Error: "must be between 8 and 18 digits"

**Expected Result:**
- Real-time validation when filled
- Optional (no validation when empty)

---

#### Test 2.7: Full Form Submission
**Test Steps:**
- [ ] Fill entire form with valid data
- [ ] Select all required dropdowns (Sex, Designation)
- [ ] Submit form
- [ ] Verify:
  - [ ] Success toast: "Security Officer registered successfully"
  - [ ] Form resets
  - [ ] All fields cleared
  - [ ] Green checkmarks disappear

**Expected Result:**
- Form submits successfully
- Success confirmation shown
- Form resets for next registration

---

### 3. Backend Validation Testing

#### Test 3.1: Duplicate Username
**Test Steps:**
- [ ] Register user with username "testuser"
- [ ] Attempt to register another user with "testuser"
- [ ] Verify backend error: "Username already exists"

**Expected Result:**
- Frontend cannot catch this (backend checks database)
- Error displays at field level in form
- Form does not proceed with registration

---

#### Test 3.2: Duplicate Email
**Test Steps:**
- [ ] Register user with email "user@test.com"
- [ ] Attempt to register another user with "user@test.com"
- [ ] Verify backend error: "Email already registered"

**Expected Result:**
- Frontend validates format (not uniqueness)
- Backend validates uniqueness
- Error displays to user

---

#### Test 3.3: Duplicate NIC (non-CHAIRMAN/DIRECTOR)
**Test Steps:**
- [ ] Register SECURITY_OFFICER with NIC "123456789X"
- [ ] Try to register another role with same NIC
- [ ] Verify backend error: "NIC number already registered"

**Expected Result:**
- Only checked for non-simplified roles
- Backend prevents duplicates
- Clear error message

---

#### Test 3.4: Invalid Designation for Security Officer
**Test Steps:**
- [ ] Submit with role SECURITY_OFFICER but invalid designation
- [ ] Verify backend validation

**Expected Result:**
- Backend validates against enum values
- Appropriate error returned

---

## Error Message Reference

### Frontend Real-Time Validation Messages

| Field | Validation | Message |
|-------|-----------|---------|
| Username | Required | "Username is required" |
| Username | Min Length | "Username must be at least 3 characters" |
| Username | Max Length | "Username must not exceed 50 characters" |
| Password | Required | "Password is required" |
| Password | Min Length | "Password must be at least 8 characters" |
| Password | Uppercase | "Password must contain at least one uppercase letter" |
| Password | Lowercase | "Password must contain at least one lowercase letter" |
| Password | Number | "Password must contain at least one number" |
| Password | Special Char | "Password must contain at least one special character (@$!%*?&)" |
| Email | Required | "Email is required" |
| Email | Format | "Please enter a valid email address" |
| NIC | Required | "NIC number is required" |
| NIC | Format | "Invalid NIC format. Must be 9 digits + X/V or 12 digits" |
| Phone | Required | "Phone number is required" |
| Phone | Format | "Invalid phone number format..." |
| DoB | Required | "Date of birth is required" |
| DoB | Age Min | "Age must be at least 18 years" |
| DoB | Age Max | "Age must not exceed 65 years" |
| Address | Required | "Residential address is required" |
| Address | Min Length | "Address must be at least 5 characters" |
| Bank Account | Format | "Bank account number must be between 8 and 18 digits" |

### Backend Validation Messages

| Validation | Message |
|-----------|---------|
| Duplicate Username | "Username already exists" |
| Duplicate Email | "Email already registered" |
| Duplicate NIC | "NIC number already registered" |
| Invalid Password Strength | "Password must be at least 8 characters and contain uppercase letter, lowercase letter, number, and special character" |
| Invalid Phone | "Invalid phone number format..." |
| Invalid NIC | "Invalid NIC number format..." |
| Invalid Age | "Age must be between 18 and 65 years" |
| Invalid Bank Account | "Bank account number must be between 8 and 18 digits" |

---

## Success Criteria

### All Tests Pass When:
- ✅ Real-time validation provides immediate feedback while typing
- ✅ Green checkmarks appear for valid fields
- ✅ Error messages are clear and specific
- ✅ All validation rules from backend are enforced on frontend
- ✅ Backend validators catch any issues frontend might miss
- ✅ Form cannot submit with any errors
- ✅ Success message displays after valid submission
- ✅ Multiple errors display simultaneously
- ✅ Forms reset properly after submission
- ✅ Error messages are user-friendly and actionable

---

## Known Limitations

1. **DateOfBirth Age Calculation**: Based on current system date
2. **Phone Number Format**: Specifically for Sri Lankan numbers
3. **NIC Format**: Only validates format, not checksum
4. **Uniqueness Checks**: Username, Email, NIC checked only by backend

---

## Troubleshooting

### Issue: Validation messages not appearing
- **Solution:** Check browser console for JavaScript errors
- **Check:** Ensure `validationHelpers.ts` file is imported
- **Clear cache:** Try hard refresh (Ctrl+Shift+R)

### Issue: Backend errors not displaying
- **Solution:** Check AuthService error parsing logic
- **Verify:** GlobalExceptionHandler is catching MethodArgumentNotValidException
- **Check:** Backend returns proper error structure: `{ data: { fieldName: "error message" } }`

### Issue: Real-time validation too strict
- **Solution:** Validation functions are intentionally strict for security
- **Adjust:** Modify ValidationRules in validationHelpers.ts if needed

---

## Testing Checklist

- [ ] All Frontend Real-Time Validation Tests Passed
- [ ] All Backend Validation Tests Passed
- [ ] Error Messages Display Correctly
- [ ] Form Submission Works for Valid Data
- [ ] Form Prevents Submission for Invalid Data
- [ ] Multiple Errors Display Simultaneously
- [ ] Form Resets After Successful Submission
- [ ] Role-Specific Fields Show/Hide Correctly
- [ ] Required Field Indicators Are Clear
- [ ] Duplicate Validation Works (Backend)

---

## Next Steps

1. Execute all test cases
2. Document any issues found
3. Update validation rules if needed
4. Test in various browsers (Chrome, Firefox, Edge, Safari)
5. Test on mobile devices
6. Verify accessibility (keyboard navigation, screen readers)
