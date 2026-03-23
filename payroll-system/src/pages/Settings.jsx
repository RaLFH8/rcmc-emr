import { useState } from 'react'
import { Building2, Mail, Phone, MapPin, Save, Info } from 'lucide-react'

const Settings = () => {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'RIZALCARE MEDICAL CLINIC',
    address: 'GF IPDL8 Bldg., 25 G. Dikit St., Brgy. Bagumbayan, Pililla, Rizal',
    phone1: '0938-775-1504',
    phone2: '0976-273-9445',
    email: 'rizalcaremedicalclinic@gmail.com'
  })

  const [deductionRates, setDeductionRates] = useState({
    sssRate: 7.5,
    sssEmployerRate: 7.5,
    philhealthNote: 'Manually set per employee',
    pagibigNote: 'Manually set per employee'
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo))
    localStorage.setItem('deductionRates', JSON.stringify(deductionRates))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-workly-text-primary">
            Settings
          </h1>
          <p className="text-sm mt-1 text-workly-text-secondary">
            Manage system configuration and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-workly font-semibold transition-all shadow-workly ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-workly-coral text-white hover:opacity-90'
          }`}
        >
          <Save size={18} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Company Information */}
      <div className="workly-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-workly-coral/20 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-workly-coral" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-workly-text-primary">
            Company Information
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-workly-text-secondary">
              Company Name
            </label>
            <input
              type="text"
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
              className="workly-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-workly-text-secondary">
              Address
            </label>
            <input
              type="text"
              value={companyInfo.address}
              onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
              className="workly-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-workly-text-secondary">
                Phone 1
              </label>
              <input
                type="text"
                value={companyInfo.phone1}
                onChange={(e) => setCompanyInfo({...companyInfo, phone1: e.target.value})}
                className="workly-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-workly-text-secondary">
                Phone 2
              </label>
              <input
                type="text"
                value={companyInfo.phone2}
                onChange={(e) => setCompanyInfo({...companyInfo, phone2: e.target.value})}
                className="workly-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-workly-text-secondary">
              Email
            </label>
            <input
              type="email"
              value={companyInfo.email}
              onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
              className="workly-input w-full"
            />
          </div>
        </div>
      </div>

      {/* Deduction Settings */}
      <div className="workly-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-workly-blue-light/20 rounded-lg flex items-center justify-center">
            <Info size={20} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-workly-text-primary tracking-tight">Deduction Configuration</h2>
        </div>

        <div className="space-y-6">
          {/* SSS */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-workly-text-primary font-semibold mb-3">SSS (Social Security System)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-workly-text-secondary mb-2">Employee Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={deductionRates.sssRate}
                  onChange={(e) => setDeductionRates({...deductionRates, sssRate: parseFloat(e.target.value)})}
                  className="workly-input w-full"
                />
                <p className="text-xs text-workly-text-muted mt-1">Auto-calculated from salary</p>
              </div>
              <div>
                <label className="block text-sm text-workly-text-secondary mb-2">Employer Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={deductionRates.sssEmployerRate}
                  onChange={(e) => setDeductionRates({...deductionRates, sssEmployerRate: parseFloat(e.target.value)})}
                  className="workly-input w-full"
                />
                <p className="text-xs text-workly-text-muted mt-1">For reference only</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-workly-purple-light border border-purple-200 rounded-lg">
              <p className="text-xs text-workly-text-primary">
                <strong>Total SSS:</strong> 15% of salary (Employee: {deductionRates.sssRate}%, Employer: {deductionRates.sssEmployerRate}%)
              </p>
            </div>
          </div>

          {/* PhilHealth */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-workly-text-primary font-semibold mb-3">PhilHealth</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-workly-text-primary">
                <strong>Configuration:</strong> {deductionRates.philhealthNote}
              </p>
              <p className="text-xs text-workly-text-secondary mt-2">
                PhilHealth contributions are set manually per employee in the employee management page.
              </p>
            </div>
          </div>

          {/* Pag-IBIG */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-workly-text-primary font-semibold mb-3">Pag-IBIG</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-workly-text-primary">
                <strong>Configuration:</strong> {deductionRates.pagibigNote}
              </p>
              <p className="text-xs text-workly-text-secondary mt-2">
                Pag-IBIG contributions are set manually per employee in the employee management page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="workly-card p-6">
        <h2 className="text-xl font-bold text-workly-text-primary tracking-tight mb-6">System Information</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-workly-text-secondary">System Version</span>
            <span className="text-workly-text-primary font-semibold">1.0.0</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-workly-text-secondary">Database</span>
            <span className="text-workly-text-primary font-semibold">Supabase PostgreSQL</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-workly-text-secondary">Deployment</span>
            <span className="text-workly-text-primary font-semibold">Vercel</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-workly-text-secondary">Last Updated</span>
            <span className="text-workly-text-primary font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="workly-card p-6">
        <h2 className="text-xl font-bold text-workly-text-primary tracking-tight mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <Mail size={20} className="text-workly-coral" />
              <span className="text-workly-text-primary font-semibold">Email Settings</span>
            </div>
            <p className="text-xs text-workly-text-secondary">Configure email notifications</p>
          </button>

          <button className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <Phone size={20} className="text-workly-blue-light" />
              <span className="text-workly-text-primary font-semibold">SMS Alerts</span>
            </div>
            <p className="text-xs text-workly-text-secondary">Setup SMS notifications</p>
          </button>

          <button className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <MapPin size={20} className="text-workly-green" />
              <span className="text-workly-text-primary font-semibold">Backup Data</span>
            </div>
            <p className="text-xs text-workly-text-secondary">Export and backup records</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
