/**
 * Booking Helper Utilities
 * Clean, reusable functions for online booking system
 */

/**
 * Converts 12-hour time format to 24-hour format
 * @param {string} time12h - Time in 12-hour format (e.g., "2:00 PM")
 * @returns {string} Time in 24-hour format (e.g., "14:00:00")
 */
export function convertTo24Hour(time12h) {
  const [time, period] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);
  
  if (period === 'AM') {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

/**
 * Checks if a time slot has passed for today
 * @param {string} timeSlot - Time slot string (e.g., "2:00 PM" or "14:00")
 * @param {number} bufferMinutes - Buffer time in minutes (default: 20)
 * @returns {boolean} True if the time slot has passed
 */
export function isTimeSlotPast(timeSlot, bufferMinutes = 20) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  let slotHour, slotMinute;
  
  // Handle both 12-hour and 24-hour formats
  if (timeSlot.includes('AM') || timeSlot.includes('PM')) {
    const [time, period] = timeSlot.split(' ');
    const [hourStr, minuteStr] = time.split(':');
    slotHour = parseInt(hourStr);
    slotMinute = parseInt(minuteStr);
    
    if (period === 'PM' && slotHour !== 12) slotHour += 12;
    if (period === 'AM' && slotHour === 12) slotHour = 0;
  } else {
    const [hourStr, minuteStr] = timeSlot.split(':');
    slotHour = parseInt(hourStr);
    slotMinute = parseInt(minuteStr);
  }
  
  const slotTimeInMinutes = slotHour * 60 + slotMinute;
  
  // Slot is past if current time + buffer >= slot time
  return slotTimeInMinutes + bufferMinutes <= currentTimeInMinutes;
}

/**
 * Filters available time slots based on date, booked slots, and current time
 * @param {Array} availableSlots - Array of all possible time slots
 * @param {Array} bookedSlots - Array of already booked time slots from database
 * @param {string} selectedDate - Selected date in YYYY-MM-DD format
 * @returns {Array} Filtered array of available slots
 */
export function filterAvailableSlots(availableSlots, bookedSlots, selectedDate) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;
  
  return availableSlots.filter(slot => {
    // Check if slot is already booked
    const isBooked = bookedSlots.some(bookedSlot => {
      // Handle both string and object formats
      const bookedTime = typeof bookedSlot === 'string' 
        ? bookedSlot 
        : bookedSlot.appointment_time || bookedSlot.time || bookedSlot.slot;
      
      return bookedTime === slot || bookedTime === convertTo24Hour(slot);
    });
    
    if (isBooked) return false;
    
    // If today, check if time has passed
    if (isToday && isTimeSlotPast(slot)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Generates time slots for a given range
 * @param {string} startTime - Start time in 24-hour format (e.g., "10:00")
 * @param {string} endTime - End time in 24-hour format (e.g., "17:00")
 * @param {number} intervalMinutes - Interval between slots in minutes (default: 20)
 * @param {string} format - Output format: '12h' or '24h' (default: '12h')
 * @returns {Array} Array of time slot strings
 */
export function generateTimeSlots(startTime, endTime, intervalMinutes = 20, format = '12h') {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    
    if (format === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      slots.push(`${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`);
    } else {
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
    
    currentMinutes += intervalMinutes;
  }
  
  return slots;
}

/**
 * Creates initial form state for booking
 * @returns {Object} Initial patient data state
 */
export function createInitialFormState() {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    reason: ''
  };
}

/**
 * Validates booking form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export function validateBookingForm(formData) {
  const errors = [];
  
  if (!formData.firstName?.trim()) errors.push('First name is required');
  if (!formData.lastName?.trim()) errors.push('Last name is required');
  if (!formData.dateOfBirth) errors.push('Date of birth is required');
  if (!formData.gender) errors.push('Gender is required');
  if (!formData.phone?.trim()) errors.push('Phone number is required');
  if (!formData.email?.trim()) errors.push('Email is required');
  if (!formData.address?.trim()) errors.push('Address is required');
  if (!formData.reason?.trim()) errors.push('Reason for visit is required');
  
  // Email validation
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.push('Invalid email format');
  }
  
  // Phone validation (basic)
  if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
    errors.push('Phone number must be at least 10 digits');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Formats a date for display
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export function formatDisplayDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
