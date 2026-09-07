const API_BASE_URL = 'http://127.0.0.1:8000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
  }
  return response.json();
};

export const loginRH = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return handleResponse(response);
};

export const getDashboardStats = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
  return handleResponse(response);
};

export const getDepartments = async () => {
  const response = await fetch(`${API_BASE_URL}/departments`);
  return handleResponse(response);
};

export const getEmployees = async () => {
  const response = await fetch(`${API_BASE_URL}/employees`);
  return handleResponse(response);
};

export const getEmployeeByMatricule = async (matricule) => {
  const response = await fetch(`${API_BASE_URL}/employees/matricule/${matricule}`);
  return handleResponse(response);
};

export const saveEmployee = async (employeeData) => {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData)
  });
  return handleResponse(response);
};

export const updateEmployee = async (id, employeeData) => {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData)
  });
  return handleResponse(response);
};

export const deleteEmployee = async (id) => {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'DELETE'
  });
  return handleResponse(response);
};

export const getMissions = async () => {
  const response = await fetch(`${API_BASE_URL}/missions`);
  return handleResponse(response);
};

export const saveMission = async (missionData) => {
  const response = await fetch(`${API_BASE_URL}/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(missionData)
  });
  return handleResponse(response);
};

export const updateMission = async (id, missionData) => {
  const response = await fetch(`${API_BASE_URL}/missions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(missionData)
  });
  return handleResponse(response);
};

export const deleteMission = async (id) => {
  const response = await fetch(`${API_BASE_URL}/missions/${id}`, {
    method: 'DELETE'
  });
  return handleResponse(response);
};

export const getConges = async () => {
  const response = await fetch(`${API_BASE_URL}/conges`);
  return handleResponse(response);
};

export const saveConge = async (congeData) => {
  const response = await fetch(`${API_BASE_URL}/conges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(congeData)
  });
  return handleResponse(response);
};

export const updateConge = async (id, congeData) => {
  const response = await fetch(`${API_BASE_URL}/conges/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(congeData)
  });
  return handleResponse(response);
};

export const deleteConge = async (id) => {
  const response = await fetch(`${API_BASE_URL}/conges/${id}`, {
    method: 'DELETE'
  });
  return handleResponse(response);
};

export const closeConge = async (id, closeData) => {
  const response = await fetch(`${API_BASE_URL}/conges/${id}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(closeData)
  });
  return handleResponse(response);
};

export const getEmployeeHistoryByMatricule = async (matricule) => {
  const response = await fetch(`${API_BASE_URL}/employees/matricule/${matricule}/history`);
  return handleResponse(response);
};

export const formatDateFR = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateStr;
};
