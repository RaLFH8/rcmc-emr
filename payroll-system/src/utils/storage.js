// LocalStorage utility functions for data persistence

export const storage = {
  // Employees
  getEmployees: () => {
    const data = localStorage.getItem('employees')
    return data ? JSON.parse(data) : []
  },
  
  saveEmployees: (employees) => {
    localStorage.setItem('employees', JSON.stringify(employees))
  },
  
  addEmployee: (employee) => {
    const employees = storage.getEmployees()
    const newEmployee = {
      ...employee,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    employees.push(newEmployee)
    storage.saveEmployees(employees)
    return newEmployee
  },
  
  updateEmployee: (id, updates) => {
    const employees = storage.getEmployees()
    const index = employees.findIndex(emp => emp.id === id)
    if (index !== -1) {
      employees[index] = { ...employees[index], ...updates }
      storage.saveEmployees(employees)
      return employees[index]
    }
    return null
  },
  
  deleteEmployee: (id) => {
    const employees = storage.getEmployees()
    const filtered = employees.filter(emp => emp.id !== id)
    storage.saveEmployees(filtered)
  },
  
  // Payroll
  getPayrollRecords: () => {
    const data = localStorage.getItem('payroll')
    return data ? JSON.parse(data) : []
  },
  
  savePayrollRecords: (records) => {
    localStorage.setItem('payroll', JSON.stringify(records))
  },
  
  addPayrollRecord: (record) => {
    const records = storage.getPayrollRecords()
    const newRecord = {
      ...record,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    records.push(newRecord)
    storage.savePayrollRecords(records)
    return newRecord
  },
  
  // Initialize with sample data
  initializeSampleData: () => {
    if (storage.getEmployees().length === 0) {
      const sampleEmployees = [
        {
          id: '1',
          name: 'Darlene Steffy',
          email: 'darlene@spectro.com',
          position: 'Software Engineer',
          department: 'Engineering',
          salary: 85000,
          status: 'Active',
          joinDate: '2023-01-15',
          sss: 2500,
          philhealth: 1500,
          pagibig: 200
        },
        {
          id: '2',
          name: 'Darrell Steward',
          email: 'darrell@spectro.com',
          position: 'Business Analyst',
          department: 'Operations',
          salary: 65000,
          status: 'Active',
          joinDate: '2023-03-20',
          sss: 2000,
          philhealth: 1200,
          pagibig: 200
        },
        {
          id: '3',
          name: 'Nessa Cooper',
          email: 'nessa@spectro.com',
          position: 'Product Designer',
          department: 'Design',
          salary: 75000,
          status: 'Active',
          joinDate: '2023-02-10',
          sss: 2200,
          philhealth: 1300,
          pagibig: 200
        },
        {
          id: '4',
          name: 'Marvin McKinney',
          email: 'marvin@spectro.com',
          position: 'Marketing Manager',
          department: 'Marketing',
          salary: 70000,
          status: 'Active',
          joinDate: '2023-04-05',
          sss: 2100,
          philhealth: 1250,
          pagibig: 200
        }
      ]
      storage.saveEmployees(sampleEmployees)
    }
  }
}
