import { useState } from 'react'
import { User, Mail, Shield, Calendar, Key, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const UserProfile = () => {
  const { user, userProfile } = useAuth()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text: string }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.newPass !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (passwordData.newPass.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.current,
      })
      if (signInError) throw new Error('Current password is incorrect.')

      const { error } = await supabase.auth.updateUser({ password: passwordData.newPass })
      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully.' })
      setPasswordData({ current: '', newPass: '', confirm: '' })
      setShowPasswordForm(false)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const toggleShow = (field) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))

  const roleBadgeStyle = {
    admin: 'bg-purple-100 text-purple-700',
    doctor: 'bg-blue-100 text-blue-700',
    receptionist: 'bg-teal-100 text-teal-700',
  }

  const joinedDate = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">View your account details and manage your password</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-teal-400 to-teal-600" />

        {/* Avatar + Info */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-md">
              {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-slate-900">{userProfile?.full_name || '—'}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeStyle[userProfile?.role] || 'bg-gray-100 text-gray-700'}`}>
                {userProfile?.role || 'staff'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <Mail className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Email</p>
                <p className="text-sm text-slate-900 font-medium break-all">{user?.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <Shield className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Role</p>
                <p className="text-sm text-slate-900 font-medium capitalize">{userProfile?.role || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <User className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Full Name</p>
                <p className="text-sm text-slate-900 font-medium">{userProfile?.full_name || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <Calendar className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Member Since</p>
                <p className="text-sm text-slate-900 font-medium">{joinedDate}</p>
              </div>
            </div>
          </div>

          {/* Account ID */}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Account ID</p>
            <p className="text-xs text-slate-600 font-mono break-all">{userProfile?.id || '—'}</p>
          </div>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg text-sm font-medium ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success'
            ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <Key className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Password</p>
              <p className="text-xs text-slate-500">Update your login password</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowPasswordForm(!showPasswordForm)
              setMessage(null)
              setPasswordData({ current: '', newPass: '', confirm: '' })
            }}
            className="px-4 py-2 text-sm font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            {[
              { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
              { key: 'newPass', label: 'New Password', placeholder: 'Minimum 6 characters' },
              { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={showPasswords[key] ? 'text' : 'password'}
                    value={passwordData[key]}
                    onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                    placeholder={placeholder}
                    required
                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default UserProfile
