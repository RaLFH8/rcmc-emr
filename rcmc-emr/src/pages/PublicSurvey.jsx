import { useState, useEffect } from 'react'
import { Star, Send, CheckCircle, AlertCircle, Activity } from 'lucide-react'
import { db } from '../lib/supabase'
import { checkRateLimit } from '../services/rateLimiter'

const PublicSurvey = () => {
  // Form state
  const [doctorId, setDoctorId] = useState(null)
  const [overallCareRating, setOverallCareRating] = useState(null)
  const [listeningRating, setListeningRating] = useState(null)
  const [explanationRating, setExplanationRating] = useState(null)
  const [respectRating, setRespectRating] = useState(null)
  const [recommendationRating, setRecommendationRating] = useState(null)
  const [comments, setComments] = useState('')
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  // Load doctors and parse URL parameters
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const doctorsList = await db.getDoctors()
        setDoctors(doctorsList)
        
        // Parse URL parameter for doctor ID
        const urlParams = new URLSearchParams(window.location.search)
        const docParam = urlParams.get('doc')
        
        if (docParam) {
          // Find doctor by ID
          const doctor = doctorsList.find(d => d.id === docParam)
          if (doctor) {
            setDoctorId(docParam)
          }
        }
      } catch (error) {
        console.error('Error loading doctors:', error)
        setErrorMessage('Failed to load doctors. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    loadDoctors()
  }, [])

  // Character counter for comments
  const remainingChars = 1000 - comments.length

  // Form validation
  const isFormValid = () => {
    return (
      doctorId &&
      (overallCareRating || listeningRating || explanationRating || respectRating || recommendationRating) &&
      !isSubmitting
    )
  }

  // Star rating component
  const StarRating = ({ value, onChange, label }) => {
    const [hoverValue, setHoverValue] = useState(null)

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              className="focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-full p-1 transition-transform hover:scale-110"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Star
                size={32}
                className={`transition-colors ${
                  star <= (hoverValue || value || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>
        {value && (
          <p className="text-xs text-slate-500">
            {value === 1 && 'Poor'}
            {value === 2 && 'Fair'}
            {value === 3 && 'Good'}
            {value === 4 && 'Very Good'}
            {value === 5 && 'Excellent'}
          </p>
        )}
      </div>
    )
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isFormValid()) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Check rate limit
      const rateLimitResult = await checkRateLimit()
      
      if (!rateLimitResult.allowed) {
        setErrorMessage('You have already submitted feedback today. Please try again tomorrow.')
        setIsSubmitting(false)
        return
      }

      // Sanitize and prepare data
      const surveyData = {
        doctorId,
        overallCareRating,
        listeningRating,
        explanationRating,
        respectRating,
        recommendationRating,
        comments: comments.trim(),
        fingerprint: rateLimitResult.fingerprint,
        ipAddress: rateLimitResult.ipAddress
      }

      // Submit survey
      await db.submitSurvey(surveyData)

      // Show success message
      setSubmitSuccess(true)

      // Clear form
      setDoctorId(null)
      setOverallCareRating(null)
      setListeningRating(null)
      setExplanationRating(null)
      setRespectRating(null)
      setRecommendationRating(null)
      setComments('')

    } catch (error) {
      console.error('Survey submission error:', error)
      setErrorMessage('Failed to submit survey. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', overflowY: 'auto' }} className="bg-gradient-to-br from-teal-50 to-blue-50 py-12 px-4">
        <div className="text-center mx-auto max-w-md">
          <Activity className="w-12 h-12 text-teal-600 animate-pulse mx-auto mb-4" />
          <p className="text-slate-600">Loading survey...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (submitSuccess) {
    return (
      <div style={{ minHeight: '100vh', overflowY: 'auto' }} className="bg-gradient-to-br from-teal-50 to-blue-50 py-12 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center mx-auto">
          <CheckCircle className="w-20 h-20 text-teal-600 mx-auto mb-6" />
          
          <div className="mb-6">
            <Activity className="w-16 h-16 text-teal-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              RIZALCARE MEDICAL CLINIC
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Thank You!
          </h2>
          
          <p className="text-slate-600 mb-6">
            Your feedback has been submitted successfully. We appreciate you taking the time to help us improve our services.
          </p>

          <button
            onClick={() => {
              setSubmitSuccess(false)
              // Parse URL parameter again if present
              const urlParams = new URLSearchParams(window.location.search)
              const docParam = urlParams.get('doc')
              if (docParam) {
                const doctor = doctors.find(d => d.id === docParam)
                if (doctor) {
                  setDoctorId(docParam)
                }
              }
            }}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Submit another review
          </button>
        </div>
      </div>
    )
  }

  // Survey form
  return (
    <div style={{ minHeight: '100vh', overflowY: 'auto' }} className="bg-gradient-to-br from-teal-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 text-center">
          <Activity className="w-12 h-12 text-teal-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            RIZALCARE MEDICAL CLINIC
          </h1>
          <p className="text-slate-600">
            Patient Satisfaction Survey
          </p>
        </div>

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Doctor Selection */}
          <div>
            <label htmlFor="doctor" className="block text-sm font-medium text-slate-700 mb-2">
              Select Doctor <span className="text-red-500">*</span>
            </label>
            <select
              id="doctor"
              value={doctorId || ''}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="">Choose a doctor...</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name}
                  {doctor.specialization && ` - ${doctor.specialization}`}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Sections */}
          <div className="space-y-6 pt-4">
            <StarRating
              value={overallCareRating}
              onChange={setOverallCareRating}
              label="1. How satisfied are you with the doctor's overall care during your visit?"
            />

            <StarRating
              value={listeningRating}
              onChange={setListeningRating}
              label="2. Did the doctor listen carefully to your concerns?"
            />

            <StarRating
              value={explanationRating}
              onChange={setExplanationRating}
              label="3. How clearly did the doctor explain your condition and treatment?"
            />

            <StarRating
              value={respectRating}
              onChange={setRespectRating}
              label="4. Did you feel respected and treated with courtesy by the doctor?"
            />

            <StarRating
              value={recommendationRating}
              onChange={setRecommendationRating}
              label="5. Would you recommend this doctor to family or friends?"
            />
          </div>

          {/* Comments */}
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-slate-700 mb-2">
              How can we improve?
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value.slice(0, 1000))}
              placeholder="Share your thoughts and suggestions..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <p className={`text-xs mt-1 ${remainingChars < 100 ? 'text-orange-600' : 'text-slate-500'}`}>
              {remainingChars} characters remaining
            </p>
          </div>

          {/* Validation Note */}
          {!isFormValid() && doctorId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Please provide at least one rating to submit your feedback.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid()}
            className={`w-full py-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${
              isFormValid()
                ? 'bg-teal-600 hover:bg-teal-700 active:scale-95'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Activity className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Feedback
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Your feedback is anonymous and helps us improve our services.
        </p>
      </div>
    </div>
  )
}

export default PublicSurvey
