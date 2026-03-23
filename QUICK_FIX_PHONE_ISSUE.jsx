// QUICK FIX: Replace the handleSubmit function in PublicBooking.jsx with this version
// This adds comprehensive logging to debug the phone field issue

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // DEBUG: Log the entire patient data state
  console.log('=== FORM SUBMISSION DEBUG ===');
  console.log('Full patientData state:', patientData);
  console.log('Phone value:', patientData.phone);
  console.log('Phone type:', typeof patientData.phone);
  console.log('Phone is truthy?:', !!patientData.phone);
  
  // Validate phone before proceeding
  if (!patientData.phone || patientData.phone.trim() === '') {
    alert('Please enter your phone number');
    return;
  }
  
  setLoading(true);

  try {
    const bookingData = {
      doctor_id: selectedDoctor.id,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      patient_first_name: patientData.firstName,
      patient_last_name: patientData.lastName,
      patient_dob: patientData.dateOfBirth,
      patient_gender: patientData.gender,
      patient_contact: patientData.phone,
      patient_email: patientData.email,
      patient_address: patientData.address,
      reason: patientData.reason
    };

    console.log('📤 Booking data being sent:', bookingData);
    console.log('📞 patient_contact value:', bookingData.patient_contact);
    
    await db.createOnlineBooking(bookingData);
    setBookingSuccess(true);
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    alert('Failed to create booking. Please try again.');
  } finally {
    setLoading(false);
  }
};
