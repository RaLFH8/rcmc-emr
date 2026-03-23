import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { db } from '../lib/supabase'

const Employees = () => {
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    salary: '',
    sss_salary: '',
    status: 'Active',
    join_date: '',
    sss_number: '',
    sss: '',
    philhealth: '',
    pagibig: ''
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await db.getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error('Error loading employees:', error)
      alert('Failed to load employees. Please check your Supabase connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Auto-calculate SSS: 15% of SSS salary, employee pays 7.5%
      const sssContribution = parseFloat(formData.sss_salary) * 0.075
      
      const employeeData = {
        ...formData,
        salary: parseFloat(formData.salary),
        sss_salary: parseFloat(formData.sss_salary),
        sss: sssContribution,
        philhealth: parseFloat(formData.philhealth) || 0,
        pagibig: parseFloat(formData.pagibig) || 0
      }

      if (editingEmployee) {
        await db.updateEmployee(editingEmployee.id, employeeData)
      } else {
        await db.addEmployee(employeeData)
      }

      await loadEmployees()
      closeModal()
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('Failed to save employee: ' + error.message)
    }
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      position: employee.position,
      department: employee.department,
      salary: employee.salary,
      sss_salary: employee.sss_salary || '',
      status: employee.status,
      join_date: employee.join_date,
      sss_number: employee.sss_number || '',
      sss: employee.sss || '',
      philhealth: employee.philhealth || '',
      pagibig: employee.pagibig || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await db.deleteEmployee(id)
        await loadEmployees()
      } catch (error) {
        console.error('Error deleting employee:', error)
        alert('Failed to delete employee: ' + error.message)
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingEmployee(null)
    setFormData({
      name: '',
      email: '',
      position: '',
      department: '',
      salary: '',
      sss_salary: '',
      status: 'Active',
      join_date: '',
      sss_number: '',
      sss: '',
      philhealth: '',
      pagibig: ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
            theme === 'dark' ? 'border-spectro-purple' : 'border-purple-400'
          }`}></div>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}>Loading employees...</p>
        </div>
      </div>
    )
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-full space-y-4 md:space-y-6 mt-16 lg:mt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Employees</h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>Manage your workforce</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg transition-shadow whitespace-nowrap"
        >
          <Plus size={20} />
          Add Employee
        </button>
      </div>

      <div className="glass-card rounded-2xl">
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-spectro-border' : 'border-slate-200'}`}>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`} size={20} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                theme === 'dark'
                  ? 'bg-white/5 border-spectro-border text-white placeholder-gray-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-spectro-border' : 'border-slate-200'}`}>
                <th className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-slate-600'}`}>Employee</th>
                <th className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-slate-600'}`}>Position</th>
                <th className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-slate-600'}`}>Department</th>
                <th className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-slate-600'}`}>Salary</th>
                <th className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-slate-600'}`}>Status</th>
                <th className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-slate-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className={`border-b transition-colors ${
                  theme === 'dark'
                    ? 'border-spectro-border hover:bg-white/5'
                    : 'border-slate-100 hover:bg-slate-50'
                }`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{emp.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{emp.name}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`py-4 px-6 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>{emp.position}</td>
                  <td className={`py-4 px-6 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>{emp.department}</td>
                  <td className={`py-4 px-6 font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>₱{emp.salary.toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      emp.status === 'Active' 
                        ? theme === 'dark'
                          ? 'bg-spectro-teal/10 text-spectro-teal'
                          : 'bg-emerald-50 text-emerald-700'
                        : theme === 'dark'
                          ? 'bg-gray-500/10 text-gray-400'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
                        title="Edit Employee"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                        title="Delete Employee"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-spectro-card' : 'bg-white'
          }`}>
            <div className={`p-6 border-b flex items-center justify-between sticky top-0 ${
              theme === 'dark'
                ? 'border-spectro-border bg-spectro-card'
                : 'border-slate-200 bg-white'
            }`}>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={closeModal} className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-slate-100 text-slate-600'
              }`}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                      theme === 'dark'
                        ? 'bg-white/5 border-spectro-border text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                      theme === 'dark'
                        ? 'bg-white/5 border-spectro-border text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Position *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                      theme === 'dark'
                        ? 'bg-white/5 border-spectro-border text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                      theme === 'dark'
                        ? 'bg-white/5 border-spectro-border text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="">Select Department</option>
                    <option value="Medical">Medical</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance">Finance</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Basic Salary *</label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                      theme === 'dark'
                        ? 'bg-white/5 border-spectro-border text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>SSS Salary *</label>
                  <input
                    type="number"
                    required
                    value={formData.sss_salary}
                    onChange={(e) => setFormData({...formData, sss_salary: e.target.value})}
                    placeholder="For SSS contribution calculation"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                      theme === 'dark'
                        ? 'bg-white/5 border-spectro-border text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Join Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.join_date}
                    onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                      theme === 'dark'
                        ? 'bg-white/5 border-spectro-border text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div></div>
              </div>

              <div className={`rounded-xl p-4 mb-4 ${
                theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'
              }`}>
                <h3 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Government Deductions</h3>
                <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>SSS is auto-calculated at 7.5% of SSS Salary. PhilHealth and Pag-IBIG can be entered manually.</p>
                
                <div className="mb-4">
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>SSS Number</label>
                  <input
                    type="text"
                    placeholder="XX-XXXXXXX-X"
                    value={formData.sss_number}
                    onChange={(e) => setFormData({...formData, sss_number: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                      theme === 'dark'
                        ? 'bg-white/5 border-spectro-border text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>SSS (Auto)</label>
                    <input
                      type="text"
                      disabled
                      value={formData.sss_salary ? `₱${(parseFloat(formData.sss_salary) * 0.075).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱0.00'}
                      className={`w-full px-4 py-3 border rounded-xl ${
                        theme === 'dark'
                          ? 'bg-white/10 border-spectro-border text-gray-400'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>PhilHealth</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.philhealth}
                      onChange={(e) => setFormData({...formData, philhealth: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                        theme === 'dark'
                          ? 'bg-white/5 border-spectro-border text-white placeholder-gray-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Pag-IBIG</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.pagibig}
                      onChange={(e) => setFormData({...formData, pagibig: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                        theme === 'dark'
                          ? 'bg-white/5 border-spectro-border text-white placeholder-gray-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-spectro-purple ${
                    theme === 'dark'
                      ? 'bg-white/5 border-spectro-border text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
                >
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-8 py-3 border-2 rounded-xl font-semibold transition-colors ${
                    theme === 'dark'
                      ? 'border-spectro-border bg-white/5 text-gray-300 hover:bg-white/10'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees
