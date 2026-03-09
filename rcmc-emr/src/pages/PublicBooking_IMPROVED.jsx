import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, Phone, Mail, FileText, CheckCircle } from 'lucide-react';
import { db } from '../lib/supabase';
import {
  convertTo24Hour,
  filterAvailableSlots,
  createInitialFormState,
  validateBookingForm,
  getTodayDate,
  formatDisplayDate
} from '../utils/bookingHelpers';

export default function PublicBooking() {
  // Step management
  const [step, setStep] = useState(1);
  
  // Doctor and appointment selection
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  
  // Form state
  const [patientData, setPatientData] = useState(createInitialFormState());
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load doctors on mount
  useEffect(() => {
    loadDoctors();
  }, []);

  // Load time slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDoctor, selectedDate]);

  /**
   * Load active doctors from database
   */
  const loadDoctors = async () => {
    try {
      const data = await db.getActiveDoctors();
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setError('Failed to load doctors. Please refresh the page.');
    }
  };

  /**
   * Load and filter available time slots
   */
  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch available slots from database
      const slots = await db.getAvailableTimeSlots(selectedDoctor.id, selectedDate);
      
      // Filter out booked and past slots
      const bookedSlots = (slots || [])
        .filter(slot => !slot.is_available)
        .map(slot => slot.slot);
      
      const allSlots = (slots || []).map(slot => slot.slot);
      
      // Apply filtering logic
      const availableSlots = filterAvailableSlots(allSlots, bookedSlots, selectedDate);
      
      // Convert back to slot objects
      const filteredSlots = availableSlots.map(slot => ({
        slot,
        is_available: true
      }));
      
      setTimeSlots(filteredSlots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setError('Failed to load time slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset entire form to initial state
   */
  const resetForm = useCallback(() => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate('');
    setTimeSlots([]);
    setSelectedTime('');
    setBookingSuccess(false);
    setPatientData(createInitialFormState());
    setError(null);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form data
      const validation = validateBookingForm(patientData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Convert time to 24-hour format
      const convertedTime = convertTo24Hour(selectedTime);
      
      console.log('🕐 Submitting booking:', {
        doctor: `${selectedDoctor.first_name} ${selectedDoctor.last_name}`,
        date: selectedDate,
        time: `${selectedTime} → ${convertedTime}`,
        patient: `${patientData.firstName} ${patientData.lastName}`
      });

      // Prepare booking data
      const bookingData = {
        doctor_id: selectedDoctor.id,
        appointment_date: selectedDate,
        appointment_time: convertedTime,
        first_name: patientData.firstName,
        last_name: patientData.lastName,
        date_of_birth: patientData.dateOfBirth,
        gender: patientData.gender,
        phone: patientData.phone,
        email: patientData.email,
        address: patientData.address,
        reason: patientData.reason
      };

      // Submit booking
      await db.createOnlineBooking(bookingData);
      
      console.log('✅ Booking successful!');
      setBookingSuccess(true);
    } catch (error) {
      console.error('❌ Booking error:', error);
      setError(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle patient data changes
   */
  const updatePatientData = (field, value) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Success screen
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Booking Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your appointment request has been received. We will review it and send you a confirmation via email or phone shortly.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 text-left">
              <strong>Doctor:</strong> Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}<br />
              <strong>Date:</strong> {formatDisplayDate(selectedDate)}<br />
              <strong>Time:</strong> {selectedTime}<br />
              <strong>Patient:</strong> {patientData.firstName} {patientData.lastName}
            </p>
          </div>
          <button
            onClick={resetForm}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition w-full"
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    );
  }

  // Main booking form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Book an Appointment</h1>
          <p className="text-gray-600">Schedule your visit in 3 easy steps</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {num}
                </div>
                {num < 3 && <div className={`w-16 h-1 ${step > num ? 'bg-blue-600' : 'bg-gray-300'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form container */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Select Doctor and Time */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <User className="mr-2" /> Select Doctor and Time
              </h2>
              
              {/* Doctor selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a Doctor</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setSelectedDate('');
                        setSelectedTime('');
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${selectedDoctor?.id === doctor.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                      <h3 className="font-semibold text-gray-800">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{doctor.specialization}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date selection */}
              {selectedDoctor && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-1" size={16} /> Select Date
                  </label>
                  <input
                    type="date"
                    min={getTodayDate()}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Time slot selection */}
              {selectedDate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline mr-1" size={16} /> Available Time Slots
                  </label>
                  {loading ? (
                    <p className="text-gray-500">Loading available slots...</p>
                  ) : timeSlots.length === 0 ? (
                    <p className="text-gray-500">No available slots for this date. Please select another date.</p>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.slot}
                          onClick={() => setSelectedTime(slot.slot)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition ${selectedTime === slot.slot ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
                        >
                          {slot.slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!selectedDoctor || !selectedDate || !selectedTime}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue to Patient Information
              </button>
            </div>
          )}

          {/* Step 2: Patient Information */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FileText className="mr-2" /> Patient Information
              </h2>
              
              <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={patientData.firstName}
                      onChange={(e) => updatePatientData('firstName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={patientData.lastName}
                      onChange={(e) => updatePatientData('lastName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={patientData.dateOfBirth}
                      onChange={(e) => updatePatientData('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      required
                      value={patientData.gender}
                      onChange={(e) => updatePatientData('gender', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="inline mr-1" size={14} /> Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={patientData.phone}
                      onChange={(e) => updatePatientData('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="inline mr-1" size={14} /> Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={patientData.email}
                      onChange={(e) => updatePatientData('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={patientData.address}
                    onChange={(e) => updatePatientData('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit *</label>
                  <textarea
                    required
                    rows="3"
                    value={patientData.reason}
                    onChange={(e) => updatePatientData('reason', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please describe your symptoms or reason for visit"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Review Booking
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Review and Confirm */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Your Booking</h2>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Appointment Details</h3>
                  <p className="text-gray-600">
                    <strong>Doctor:</strong> Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}<br />
                    <strong>Specialization:</strong> {selectedDoctor.specialization}<br />
                    <strong>Date:</strong> {formatDisplayDate(selectedDate)}<br />
                    <strong>Time:</strong> {selectedTime}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Patient Information</h3>
                  <p className="text-gray-600">
                    <strong>Name:</strong> {patientData.firstName} {patientData.lastName}<br />
                    <strong>Date of Birth:</strong> {new Date(patientData.dateOfBirth).toLocaleDateString()}<br />
                    <strong>Gender:</strong> {patientData.gender}<br />
                    <strong>Phone:</strong> {patientData.phone}<br />
                    <strong>Email:</strong> {patientData.email}<br />
                    <strong>Address:</strong> {patientData.address}<br />
                    <strong>Reason:</strong> {patientData.reason}
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
