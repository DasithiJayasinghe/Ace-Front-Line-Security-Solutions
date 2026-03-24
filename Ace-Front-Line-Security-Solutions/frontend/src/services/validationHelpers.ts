// Validation helper functions for form fields

export const validateUsername = (username: string): string | null => {
  if (!username) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must not exceed 20 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores";
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  if (password.length > 50) return "Password must not exceed 50 characters";
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
};

export const validateFullName = (fullName: string): string | null => {
  if (!fullName) return "Full name is required";
  if (fullName.length < 2) return "Full name must be at least 2 characters";
  if (fullName.length > 100) return "Full name must not exceed 100 characters";
  return null;
};

export const validateNICNumber = (nicNumber: string): string | null => {
  if (!nicNumber) return "NIC number is required";
  // Sri Lankan NIC format validation
  if (!/^[0-9]{9}[vVxX]$/.test(nicNumber) && !/^[0-9]{12}$/.test(nicNumber)) {
    return "Please enter a valid NIC number";
  }
  return null;
};

export const validateMobileNumber = (mobileNumber: string): string | null => {
  if (!mobileNumber) return "Mobile number is required";
  // Sri Lankan mobile number format (07XX XXX XXXX or +94 7XX XXX XXXX)
  const mobileRegex = /^(\+94|0)7[0-9]{8}$/;
  if (!mobileRegex.test(mobileNumber.replace(/\s/g, ""))) {
    return "Please enter a valid mobile number";
  }
  return null;
};

export const validateDateOfBirth = (dateOfBirth: string): string | null => {
  if (!dateOfBirth) return "Date of birth is required";
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    return "Invalid date of birth";
  }
  if (age < 18) return "Employee must be at least 18 years old";
  if (age > 67) return "Employee cannot be older than 67 years";
  return null;
};

export const validateBasicSalary = (basicSalary: string | number): string | null => {
  if (!basicSalary) return "Basic salary is required";
  const salary = typeof basicSalary === "string" ? parseFloat(basicSalary) : basicSalary;
  if (isNaN(salary)) return "Please enter a valid salary amount";
  if (salary < 0) return "Salary cannot be negative";
  if (salary > 1000000) return "Please enter a reasonable salary amount";
  return null;
};

export const validateJoinDate = (joinDate: string): string | null => {
  if (!joinDate) return "Join date is required";
  const join = new Date(joinDate);
  const today = new Date();
  if (join > today) return "Join date cannot be in the future";
  // Check if more than 50 years in the past
  const fiftyYearsAgo = new Date();
  fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);
  if (join < fiftyYearsAgo) return "Join date seems invalid";
  return null;
};

export const validateAssignedArea = (assignedArea: string): string | null => {
  if (!assignedArea) return "Assigned area is required";
  if (assignedArea.trim().length < 2) return "Assigned area must be at least 2 characters";
  if (assignedArea.length > 100) return "Assigned area must not exceed 100 characters";
  return null;
};

export const validateResidentialAddress = (address: string): string | null => {
  if (!address) return "Residential address is required";
  if (address.trim().length < 5) return "Please enter a valid address";
  if (address.length > 500) return "Address is too long";
  return null;
};

export const validateEmergencyContact = (contact: string): string | null => {
  if (!contact) return "Emergency contact is required";
  const contactRegex = /^(\+94|0)7[0-9]{8}$/;
  if (!contactRegex.test(contact.replace(/\s/g, ""))) {
    return "Please enter a valid emergency contact number";
  }
  return null;
};

// Format phone numbers to display consistently
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, "");
  if (cleaned.length === 10) {
    // Sri Lankan format
    return cleaned.replace(/(\d{2})(\d{3})(\d{5})/, "$1 $2 $3");
  }
  return phoneNumber;
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Validate all fields and return an object with errors
export const validateRegistrationForm = (formData: {
  username?: string;
  password?: string;
  fullName?: string;
  email?: string;
  nicNumber?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  basicSalary?: string | number;
  joinDate?: string;
  assignedArea?: string;
  residentialAddress?: string;
  emergencyContact?: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (formData.username !== undefined) {
    const usernameError = validateUsername(formData.username);
    if (usernameError) errors.username = usernameError;
  }

  if (formData.password !== undefined) {
    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;
  }

  if (formData.fullName !== undefined) {
    const nameError = validateFullName(formData.fullName);
    if (nameError) errors.fullName = nameError;
  }

  if (formData.email !== undefined) {
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
  }

  if (formData.nicNumber !== undefined && formData.nicNumber) {
    const nicError = validateNICNumber(formData.nicNumber);
    if (nicError) errors.nicNumber = nicError;
  }

  if (formData.mobileNumber !== undefined && formData.mobileNumber) {
    const mobileError = validateMobileNumber(formData.mobileNumber);
    if (mobileError) errors.mobileNumber = mobileError;
  }

  if (formData.dateOfBirth !== undefined && formData.dateOfBirth) {
    const dobError = validateDateOfBirth(formData.dateOfBirth);
    if (dobError) errors.dateOfBirth = dobError;
  }

  if (formData.basicSalary !== undefined && formData.basicSalary) {
    const salaryError = validateBasicSalary(formData.basicSalary);
    if (salaryError) errors.basicSalary = salaryError;
  }

  if (formData.joinDate !== undefined && formData.joinDate) {
    const joinError = validateJoinDate(formData.joinDate);
    if (joinError) errors.joinDate = joinError;
  }

  if (formData.assignedArea !== undefined && formData.assignedArea) {
    const areaError = validateAssignedArea(formData.assignedArea);
    if (areaError) errors.assignedArea = areaError;
  }

  if (formData.residentialAddress !== undefined && formData.residentialAddress) {
    const addressError = validateResidentialAddress(formData.residentialAddress);
    if (addressError) errors.residentialAddress = addressError;
  }

  if (formData.emergencyContact !== undefined && formData.emergencyContact) {
    const contactError = validateEmergencyContact(formData.emergencyContact);
    if (contactError) errors.emergencyContact = contactError;
  }

  return errors;
};
