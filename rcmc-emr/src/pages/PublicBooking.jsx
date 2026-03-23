import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, FileText, CheckCircle } from 'lucide-react';
import { db } from '../lib/supabase';

export default function PublicBooking() {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    reason: ''
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const loadDoctors = async () => {
    try {
      const data = await db.getActiveDoctors();
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      const slots = await db.getAvailableTimeSlots(selectedDoctor.id, selectedDate, selectedDoctor.schedule);
      setTimeSlots(slots || []);
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bookingData = {
        doctor_id: selectedDoctor.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        first_name: patientData.firstName,
        last_name: patientData.lastName,
        date_of_birth: patientData.dateOfBirth,
        gender: patientData.gender,
        phone: patientData.phone,
        email: patientData.email,
        address: patientData.address,
        reason: patientData.reason
      };
      await db.createOnlineBooking(bookingData);
      setBookingSuccess(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Booking Submitted!</h2>
          <p className="text-gray-600 mb-6">Your appointment request has been received. We will confirm via email or phone shortly.</p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-sm text-gray-700 text-left">
            <p><strong>Doctor:</strong> Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
            <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {selectedTime}</p>
          </div>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Book Another Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Book an Appointment</h1>
          <p className="text-gray-600">Schedule your visit in 3 easy steps</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>{num}</div>
                {num < 3 && <div className={`w-16 h-1 ${step > num ? 'bg-blue-600' : 'bg-gray-300'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><User className="mr-2" /> Select Doctor and Time</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a Doctor</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} onClick={() => { setSelectedDoctor(doctor); setSelectedDate(''); setSelectedTime(''); setTimeSlots([]); }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${selectedDoctor?.id === doctor.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                      <h3 className="font-semibold text-gray-800">Dr. {doctor.first_name} {doctor.last_name}</h3>
                      <p className="text-sm text-gray-600">{doctor.specialization}</p>
                      {formatScheduleSummary(doctor.schedule) && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <Clock size={11} /> {formatScheduleSummary(doctor.schedule)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedDoctor && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar className="inline mr-1" size={16} /> Select Date</label>
                  <input type="date" min={getTodayDate()} value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); setTimeSlots([]); }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              {selectedDate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2"><Clock className="inline mr-1" size={16} /> Available Time Slots</label>
                  {loading ? (
                    <p className="text-gray-500">Loading available slots...</p>
                  ) : timeSlots.filter(s => s.is_available).length === 0 ? (
                    <p className="text-gray-500">No available slots for this date</p>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {timeSlots.filter(s => s.is_available).map((slot) => (
                        <button key={slot.slot} onClick={() => setSelectedTime(slot.slot)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition ${selectedTime === slot.slot ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}>
                          {slot.slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setStep(2)} disabled={!selectedDoctor || !selectedDate || !selectedTime}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                Continue to Patient Information
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><FileText className="mr-2" /> Patient Information</h2>
              <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input type="text" required value={patientData.firstName} onChange={(e) => setPatientData({...patientData, firstName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input type="text" required value={patientData.lastName} onChange={(e) => setPatientData({...patientData, lastName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input type="date" required value={patientData.dateOfBirth} onChange={(e) => setPatientData({...patientData, dateOfBirth: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select required value={patientData.gender} onChange={(e) => setPatientData({...patientData, gender: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1"><Phone className="inline mr-1" size={14} /> Phone Number *</label>
                    <input type="tel" required value={patientData.phone} onChange={(e) => setPatientData({...patientData, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1"><Mail className="inline mr-1" size={14} /> Email (Optional)</label>
                    <input type="email" value={patientData.email} onChange={(e) => setPatientData({...patientData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input type="text" required value={patientData.address} onChange={(e) => setPatientData({...patientData, address: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit *</label>
                  <textarea required rows="3" value={patientData.reason} onChange={(e) => setPatientData({...patientData, reason: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Please describe your symptoms or reason for visit" />
                </div>
                <div className="flex space-x-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">Back</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Review Booking</button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Your Booking</h2>
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Appointment Details</h3>
                  <p className="text-gray-600">
                    <strong>Doctor:</strong> Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}<br />
                    <strong>Specialization:</strong> {selectedDoctor.specialization}<br />
                    <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}<br />
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
                    {patientData.email && <><strong>Email:</strong> {patientData.email}<br /></>}
                    <strong>Address:</strong> {patientData.address}<br />
                    <strong>Reason:</strong> {patientData.reason}
                  </p>
                </div>
              </div>
              <div className="flex space-x-4">
                <button onClick={() => setStep(2)} disabled={loading} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50">
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
