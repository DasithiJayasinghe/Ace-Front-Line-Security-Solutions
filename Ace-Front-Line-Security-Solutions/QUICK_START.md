# Quick Start: Form Validation Testing

## 30-Second Test

### Admin Registration
1. Navigate to: Operational Manager Dashboard → Registration Management → Admin Registration
2. Leave all fields empty and click "Register"
3. Observe: ✅ Form shows errors below each required field
4. Fill fields with invalid data (e.g., "ab" for username, "password" for password)
5. Observe: ✅ Real-time error messages appear as you type
6. Fix each field (watch for green checkmarks to appear)
7. When all valid: ✅ Form allows submission
8. Click Register
9. Observe: ✅ Success message or clear error if backend rejects

### Security Officer Registration  
1. Navigate to: Operational Manager Dashboard → Registration Management → Security Officer
2. Same test as Admin form above
3. Additionally: Test dropdown fields (Sex, Designation) - they're required
4. Without selecting dropdowns: ✅ Shows error on submit

---

## Validation Quick Reference

### Fields with Real-Time Validation (Show errors as you type)

| Field | Valid Example | Invalid Example | Feedback |
|-------|---------------|-----------------|----------|
| Username | `myusername` | `ab` | Error if <3 chars |
| Password | `Pass@1234` | `password` | Errors if missing uppercase/digit/special char |
| Email | `user@test.com` | `invalid@` | Error if format wrong |
| NIC | `123456789X` | `12345` | Error if wrong format |
| Phone | `0701234567` | `123` | Error if wrong format |
| DateOfBirth | `2000-01-15` | `2020-01-15` | Error if age <18 or >65 |
| Residential Address | `123 Main St City` | `Main` | Error if <5 chars |
| Bank Account | `123456789` | `12345` | Error if not 8-18 digits |

---

## Expected User Experience

### As User Fills Form

```
Username field: Start typing "u"
↓
No error (might be valid)
↓
Type "ab"
↓
ERROR: "Username must be at least 3 characters" (red text below field)
↓
Type "c" to make "abc"
↓
✓ Green checkmark appears (validation passed!)
```

### Password Field Special Case

```
Type "password"
ERROR: "must contain at least one uppercase letter"
↓
Type "Password"
ERROR: "must contain at least one number"
↓
Type "Password1"
ERROR: "must contain at least one special character (@$!%*?&)"
↓
Type "Password1@"
✓ Green checkmark! (now meets all requirements)
```

---

## Step-by-Step Validation Test

### Test 1: Required Field Detection

**Admin Form**
1. Leave all fields blank
2. Scroll to bottom, click "Register"
3. ✅ Observe errors on:
   - Username: "Username is required"
   - Password: "Password is required"
   - Full Name: "Full name is required"
   - Email: "Email is required"
   - (Others depending on selected role)

### Test 2: Format Validation (Real-Time)

**Phone Number**
1. Click Mobile Number field
2. Type "123" and press Tab
3. ✅ Error appears: "Invalid phone number format..."
4. Clear and type "0701234567"
5. ✅ Error disappears, green checkmark appears

**NIC Number**
1. Click NIC Number field
2. Type "12345" and press Tab
3. ✅ Error appears: "Invalid NIC format..."
4. Clear and type "123456789X"
5. ✅ Error disappears, green checkmark appears

**Password Strength**
1. Click Password field
2. Type "weak" and press Tab
3. ✅ Error appears: "Password must be at least 8 characters"
4. Type "WeakPass" and press Tab
5. ✅ Still error: "must contain at least one number"
6. Type "WeakPass1" and press Tab
7. ✅ Still error: "must contain at least one special character"
8. Type "WeakPass1@" and press Tab
9. ✅ Error disappears, green checkmark appears

### Test 3: Age Validation

1. Click Date of Birth field
2. Select a date that makes user 10 years old
3. Press Tab
4. ✅ Error appears: "Age must be at least 18 years"
5. Select a date that makes user 30 years old
6. Press Tab
7. ✅ Error disappears, green checkmark appears

### Test 4: Dropdown Validation (Security Officer Form)

1. Leave Sex and Designation dropdowns unselected
2. Fill other fields with valid data
3. Click "Register Officer"
4. ✅ Error appears: "Please select sex"
5. ✅ Error appears: "Please select a designation"
6. Select MALE in Sex dropdown
7. ✅ Sex error disappears
8. Select LSO in Designation dropdown
9. ✅ Designation error disappears
10. Click Register again
11. ✅ Form submits (or shows backend errors if applicable)

### Test 5: Role-Specific Fields

**Admin Form - CHAIRMAN vs Others**

1. Select role "CHAIRMAN"
2. ✅ Observe: Sex, NIC, Mobile, DoB, Residential Address fields disappear
3. ✅ Only basic fields remain: Username, Password, Full Name, Email
4. Select role "EXECUTIVE_OFFICER"
5. ✅ Observe: All fields reappear
6. No validation errors should appear for fields that just appeared

**Admin Form - AREA_MANAGER Specific**

1. Select role "AREA_MANAGER"
2. ✅ Observe: New field appears: "Assigned Area"
3. Leave Assigned Area empty
4. Click Register
5. ✅ Error appears: "Please enter an assigned area for the Area Manager"
6. Type "Colombo North"
7. ✅ Error disappears (can submit)
8. Change role to "EXECUTIVE_OFFICER"
9. ✅ Assigned Area field disappears

---

## Backend Error Scenarios

### Test 6: Duplicate Username

1. Register user with username: `testuser123`
2. Try to register another user with same username
3. ✅ Backend error appears at form: "Username already exists"

### Test 7: Duplicate Email

1. Register user with email: `test@company.com`
2. Try to register another user with same email  
3. ✅ Backend error appears: "Email already registered"

### Test 8: Duplicate NIC (Non-Chairman/Director)

1. Register SECURITY_OFFICER with NIC: `987654321X`
2. Try to register EXECUTIVE_OFFICER with same NIC
3. ✅ Backend error appears: "NIC number already registered"

---

## Success Indicators ✅

You'll know validation is working when:

- [ ] **Real-Time Feedback**: Error messages appear instantly as user types (not waiting for submit)
- [ ] **Visual Indicators**: 
  - Green checkmark ✓ for valid fields
  - Red border 🔴 for invalid fields
- [ ] **Multiple Errors**: When form is submitted empty, ALL errors show at once (not one by one)
- [ ] **Field-Level Display**: Error message appears directly below the problematic field
- [ ] **Clear Messages**: Error text tells user exactly what's wrong
- [ ] **Submit Prevention**: Form cannot be submitted while ANY field has error
- [ ] **Error Clearing**: Once user fixes field, error immediately disappears
- [ ] **Success Confirmation**: After valid submit, success toast appears
- [ ] **Form Reset**: After success, form clears for next registration
- [ ] **Backend Enforcement**: Backend prevents submission even if frontend validation is somehow bypassed

---

## Common Validation Errors & How to Fix

| Error | Why It Happens | How to Fix |
|-------|----------------|-----------|
| "Username must be at least 3 characters" | Username too short | Type at least 3 characters |
| "Password must contain at least one uppercase letter" | No capital letters | Include A-Z |
| "Invalid phone number format" | Not matching +94/0 format | Use format: 0701234567 or +94701234567 |
| "Invalid NIC format" | Doesn't match pattern | Use: 123456789X or 123456789012 |
| "Age must be at least 18 years" | Selected date makes user <18 | Pick earlier date of birth |
| "Please select sex" | Dropdown not selected | Click dropdown and pick MALE or FEMALE |
| "Username already exists" | Same username registered | Choose different username |
| "Email already registered" | Same email used | Use different email |

---

## Accessing the Forms

### From Browser
1. Go to: `http://localhost:5173` (or your deployment URL)
2. Login as Operation Manager
3. Navigate to: **Dashboard → Registration Management**
4. Choose:
   - **Admin Personnel** → Admin Registration form
   - **Security Force** → Security Officer Registration form

### Keyboard Shortcuts
- **Tab**: Move to next field (triggers validation on blur)
- **Shift+Tab**: Move to previous field
- **Enter** in last field or on button: Submit form

---

## Mobile Testing

Form works on mobile! When testing on phone:
- Fields stack vertically
- Errors still display below each field
- Green checkmarks still visible
- Touch validation works same as desktop

---

## Troubleshooting

**Problem**: Validation messages not appearing
- **Solution**: Check browser console (F12) for JavaScript errors
- **Try**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Problem**: Form submits with invalid data
- **Check**: Backend might need restart
- **Verify**: Server errors aren't being silently caught

**Problem**: Can't see green checkmarks
- **Check**: Dark mode might make green hard to see (it's theme color)
- **Try**: File issue if inaccessible

**Problem**: Error messages are confusing
- **Note**: They match backend validation requirements
- **Reference**: See error message table in VALIDATION_TESTING_GUIDE.md

---

## Next Steps to Try

1. **Test all fields**: Go through each field with valid and invalid data
2. **Test dropdowns**: Make sure Sex and Designation validation works
3. **Test role changes**: Switch between different admin roles and watch fields change
4. **Test role-specific validations**: Only test required fields for that role
5. **Test backend**: Try duplicate username/email/NIC to trigger backend validation
6. **Test on mobile**: Ensure responsive design works
7. **Read docs**: Check VALIDATION_TESTING_GUIDE.md for 30+ comprehensive test cases

---

## Documentation Files

- **IMPLEMENTATION_SUMMARY.md** - What was built and why
- **VALIDATION_TESTING_GUIDE.md** - Comprehensive 30+ test cases
- **frontend/src/lib/validationHelpers.ts** - Validation logic code
- **QUICK_START.md** - This file!

Happy testing! 🎉
