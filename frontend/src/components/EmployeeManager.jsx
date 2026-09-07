import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getEmployees, getDepartments, saveEmployee, updateEmployee, deleteEmployee } from '../utils/api';
import { UserPlus, Users, Search, Trash2, Plus, AlertCircle, CheckCircle, Edit, X, ChevronLeft, ChevronRight } from 'lucide-react';

import ConfirmModal from './ConfirmModal';
import ToastNotification from './ToastNotification';

export default function EmployeeManager() {
  const [employeesList, setEmployeesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, title = "Notification", type = "success") => {
    setToast({ message, title, type });
  };

  // Confirm Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form State
  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [fonction, setFonction] = useState('');
  const [departement, setDepartement] = useState(''); // Stores selected department ID
  const [directionProvince, setDirectionProvince] = useState('TAZA');

  // Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingEmp, setEditingEmp] = useState(null);
  const [editForm, setEditForm] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    fonction: '',
    department_id: '',
    direction_province: 'TAZA'
  });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setEditForm({
      matricule: emp.matricule,
      nom: emp.nom,
      prenom: emp.prenom,
      fonction: emp.fonction,
      department_id: emp.department_id || (emp.department ? emp.department.id : ''),
      direction_province: emp.direction_province || 'TAZA'
    });
    setEditError('');
    setEditSuccess('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;
    setEditError('');
    setEditSuccess('');

    const updatedEmployee = {
      matricule: editForm.matricule.trim().toUpperCase(),
      nom: editForm.nom.trim().toUpperCase(),
      prenom: editForm.prenom.trim().charAt(0).toUpperCase() + editForm.prenom.trim().slice(1),
      fonction: editForm.fonction.trim(),
      department_id: parseInt(editForm.department_id),
      direction_province: editForm.direction_province.trim() || 'TAZA'
    };

    try {
      setEditSubmitting(true);
      const data = await updateEmployee(editingEmp.id, updatedEmployee);
      if (data.success) {
        setEditSuccess('Collaborateur mis à jour avec succès !');
        showToast("Informations du collaborateur mises à jour avec succès !", "Modification Réussie", "success");
        const updatedEmps = await getEmployees();
        setEmployeesList(updatedEmps);
        setTimeout(() => setEditingEmp(null), 1200);
      } else {
        const msg = data.message || 'Erreur lors de la mise à jour.';
        setEditError(msg);
        showToast(msg, "Erreur de Modification", "error");
        triggerAlert(msg, "Erreur de Modification");
      }
    } catch (err) {
      const msg = err.message || 'Erreur lors de la mise à jour.';
      setEditError(msg);
      showToast(msg, "Erreur Serveur", "error");
      triggerAlert(msg, "Erreur Serveur");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [emps, depts] = await Promise.all([getEmployees(), getDepartments()]);
      setEmployeesList(emps);
      setDepartmentsList(depts);
    } catch (err) {
      console.error("Error loading employees/departments:", err);
      setError("Erreur de communication avec le serveur API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerAlert = (message, title = "Attention") => {
    setConfirmDialog({
      isOpen: true,
      title: title,
      message: message,
      isAlert: true,
      isDanger: true,
      confirmText: "Compris",
      onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!matricule || !nom || !prenom || !fonction || !departement) {
      const msg = 'Veuillez remplir tous les champs obligatoires.';
      setError(msg);
      showToast(msg, "Champs Requis", "error");
      triggerAlert(msg, "Champs Requis");
      return;
    }

    const formattedMatricule = matricule.trim().toUpperCase();

    // Check if matricule already exists (if it's a new employee)
    const exists = employeesList.some(
      (emp) => emp.matricule.toUpperCase() === formattedMatricule
    );
    
    if (exists) {
      const msg = `Le matricule ${formattedMatricule} est déjà attribué à un autre collaborateur.`;
      setError(msg);
      showToast(msg, "Matricule Déjà Utilisé", "error");
      triggerAlert(msg, "Matricule Déjà Utilisé");
      return;
    }

    const newEmployee = {
      matricule: formattedMatricule,
      nom: nom.trim().toUpperCase(),
      prenom: prenom.trim().charAt(0).toUpperCase() + prenom.trim().slice(1),
      fonction: fonction.trim(),
      department_id: parseInt(departement),
      direction_province: directionProvince.trim() || 'TAZA'
    };

    try {
      const data = await saveEmployee(newEmployee);
      if (data.success) {
        setSuccess('Collaborateur enregistré avec succès !');
        showToast("Nouveau collaborateur enregistré avec succès !", "Enregistrement Réussi", "success");
        // Refresh list
        const updatedEmps = await getEmployees();
        setEmployeesList(updatedEmps);
        
        // Reset Form
        setMatricule('');
        setNom('');
        setPrenom('');
        setFonction('');
        setDepartement('');
        setDirectionProvince('TAZA');
      } else {
        const msg = data.message || 'Erreur lors de l\'enregistrement.';
        setError(msg);
        showToast(msg, "Erreur d'Enregistrement", "error");
        triggerAlert(msg, "Erreur d'Enregistrement");
      }
    } catch (err) {
      const msg = err.message || 'Erreur lors de l\'enregistrement de l\'employé.';
      setError(msg);
      showToast(msg, "Erreur Serveur", "error");
      triggerAlert(msg, "Erreur Serveur");
    }

    setTimeout(() => setSuccess(''), 4000);
  };

  const handleDelete = (id, fullName) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer le Collaborateur",
      message: `Voulez-vous vraiment supprimer l'employé ${fullName} ? Toutes les données et historiques associés seront supprimés.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const data = await deleteEmployee(id);
          if (data.success) {
            setSuccess('Collaborateur supprimé avec succès.');
            showToast(`Collaborateur ${fullName} supprimé avec succès.`, "Suppression Réussie", "success");
            const updatedEmps = await getEmployees();
            setEmployeesList(updatedEmps);
          } else {
            const msg = data.message || 'Impossible de supprimer.';
            setError(msg);
            showToast(msg, "Erreur de Suppression", "error");
            triggerAlert(msg, "Erreur de Suppression");
          }
        } catch (err) {
          const msg = err.message || 'Erreur lors de la suppression.';
          setError(msg);
          showToast(msg, "Erreur Serveur", "error");
          triggerAlert(msg, "Erreur Serveur");
        }
        setTimeout(() => setSuccess(''), 3000);
      }
    });
  };

  // Filter list by search query
  const filteredEmployees = employeesList.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const deptName = emp.department ? emp.department.name.toLowerCase() : '';
    return (
      emp.matricule.toLowerCase().includes(q) ||
      emp.nom.toLowerCase().includes(q) ||
      emp.prenom.toLowerCase().includes(q) ||
      emp.fonction.toLowerCase().includes(q) ||
      deptName.includes(q)
    );
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <UserPlus size={28} color="var(--primary)" />
        <div>
          <h1 style={styles.title}>Ajouter Employé</h1>
          <p style={styles.subtitle}>Enregistrement et gestion de l'effectif du personnel de la province de Taza</p>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Registration Form Card */}
        <div className="card" style={styles.formCard}>
          <h3 style={styles.cardTitle}>Nouveau Collaborateur</h3>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div style={styles.alertBox} className="badge-warning">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div style={styles.successBox} className="badge-success">
                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="emp-matricule">Matricule *</label>
              <input
                id="emp-matricule"
                type="text"
                className="form-input"
                placeholder="Ex: M1006"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                style={{ textTransform: 'uppercase' }}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="emp-nom">Nom de famille *</label>
                <input
                  id="emp-nom"
                  type="text"
                  className="form-input"
                  placeholder="Ex: EL ALAMI"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="emp-prenom">Prénom *</label>
                <input
                  id="emp-prenom"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Youssef"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emp-fonction">Fonction / Poste *</label>
              <input
                id="emp-fonction"
                type="text"
                className="form-input"
                placeholder="Ex: Technicien Electricien"
                value={fonction}
                onChange={(e) => setFonction(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emp-dept-select">Département *</label>
              <select
                id="emp-dept-select"
                className="form-select"
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                required
              >
                <option value="">Sélectionner un département...</option>
                {departmentsList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emp-direction">Direction / Province</label>
              <input
                id="emp-direction"
                type="text"
                className="form-input"
                value={directionProvince}
                onChange={(e) => setDirectionProvince(e.target.value)}
                placeholder="Ex: TAZA"
              />
            </div>

            <button
              id="emp-submit-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', height: '46px' }}
            >
              <Plus size={18} /> Enregistrer l'employé
            </button>
          </form>
        </div>

        {/* Directory List Card */}
        <div style={styles.listSection}>
          <div className="card" style={styles.listCard}>
            <div style={styles.listHeader}>
              <h3 style={styles.listTitle}>
                <Users size={18} color="var(--primary)" /> Annuaire du personnel ({filteredEmployees.length})
              </h3>
              
              {/* Search Bar */}
              <div style={styles.searchContainer}>
                <Search size={16} style={styles.searchIcon} />
                <input
                  id="emp-search-input"
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            {/* List */}
            <div style={styles.scrollList}>
              {filteredEmployees.length === 0 ? (
                <p style={styles.emptyText}>Aucun collaborateur trouvé.</p>
              ) : (
                paginatedEmployees.map((emp) => (
                  <div key={emp.matricule} style={styles.empItem}>
                    <div style={styles.empAvatar}>
                      {emp.nom.charAt(0)}{emp.prenom.charAt(0)}
                    </div>
                    <div style={styles.empMeta}>
                      <strong style={styles.empName}>
                        {emp.nom} {emp.prenom}
                      </strong>
                      <span style={styles.empMatricule}>Matricule: <strong>{emp.matricule}</strong></span>
                      <span style={styles.empPoste}>{emp.fonction} • {emp.department ? emp.department.name : emp.departement}</span>
                      <span style={styles.empLoc}>{emp.direction_province}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        id={`edit-emp-btn-${emp.matricule}`}
                        onClick={() => handleOpenEdit(emp)}
                        className="btn btn-secondary"
                        style={{ ...styles.deleteBtn, borderColor: '#3b82f6', color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                        title="Éditer le collaborateur"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        id={`delete-emp-btn-${emp.matricule}`}
                        onClick={() => handleDelete(emp.id, `${emp.nom} ${emp.prenom}`)}
                        className="btn btn-secondary"
                        style={styles.deleteBtn}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={styles.paginationRow}>
                <span style={styles.paginationInfo}>
                  <strong>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</strong> sur <strong>{filteredEmployees.length}</strong>
                </span>
                <div style={styles.paginationNav}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={styles.pageNavBtn}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.8rem', padding: '0 0.25rem' }}>
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={styles.pageNavBtn}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {editingEmp && createPortal(
        <div style={styles.modalOverlay} className="animate-fade-in">
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Modifier le Collaborateur</h3>
              <button onClick={() => setEditingEmp(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ marginTop: '1rem' }}>
              {editError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }} className="badge-warning">
                  <AlertCircle size={18} />
                  <span>{editError}</span>
                </div>
              )}
              {editSuccess && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }} className="badge-success">
                  <CheckCircle size={18} />
                  <span>{editSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Matricule *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.matricule}
                  onChange={(e) => setEditForm({ ...editForm, matricule: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.nom}
                    onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.prenom}
                    onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fonction *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.fonction}
                  onChange={(e) => setEditForm({ ...editForm, fonction: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Département *</label>
                <select
                  className="form-select"
                  value={editForm.department_id}
                  onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                  required
                >
                  <option value="">-- Sélectionner département --</option>
                  {departmentsList.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Direction/Province</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.direction_province}
                  onChange={(e) => setEditForm({ ...editForm, direction_province: e.target.value })}
                />
              </div>

              <div style={styles.modalFooterActions}>
                <button type="button" onClick={() => setEditingEmp(null)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Enregistrement...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Confirmation Popup */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isAlert={confirmDialog.isAlert}
        isDanger={confirmDialog.isDanger}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* Toast Alert Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    textAlign: 'left',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '5fr 7fr',
    gap: '1.5rem',
    alignItems: 'start',
  },
  formCard: {
    padding: '2rem',
  },
  cardTitle: {
    fontSize: '1.15rem',
    marginBottom: '1.25rem',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  listSection: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  listCard: {
    padding: '1.5rem',
    maxHeight: '750px',
    display: 'flex',
    flexDirection: 'column',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '1rem',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0.75rem',
  },
  listTitle: {
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    padding: '0.45rem 1rem 0.45rem 2rem',
    fontSize: '0.85rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '180px',
    transition: 'var(--transition)',
    '&:focus': {
      width: '240px',
      borderColor: 'var(--primary)',
    }
  },
  scrollList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
    maxHeight: '520px',
    paddingRight: '0.25rem',
  },
  empItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.85rem 1rem',
    backgroundColor: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    transition: 'var(--transition)',
  },
  empAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-light)',
    color: 'var(--primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '700',
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  empMeta: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    textAlign: 'left',
    gap: '0.05rem',
  },
  empName: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  empMatricule: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  empPoste: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  empLoc: {
    fontSize: '0.7rem',
    backgroundColor: 'var(--surface-hover)',
    color: 'var(--text-secondary)',
    alignSelf: 'start',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    marginTop: '0.15rem',
  },
  deleteBtn: {
    padding: '0.5rem',
    borderRadius: '50%',
    color: 'var(--secondary)',
    border: 'none',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(225, 29, 72, 0.08)',
    }
  },
  alertBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
    color: '#9a3412',
    backgroundColor: '#ffedd5',
    border: '1px solid #fed7aa',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
    color: '#065f46',
    backgroundColor: '#d1fae5',
    border: '1px solid #a7f3d0',
  },
  emptyText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '1.5rem 0',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border)',
  },
  paginationInfo: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  paginationNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  pageNavBtn: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    display: 'inline-flex',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '1rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '1.75rem 2rem',
    boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0.75rem',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  modalFooterActions: {
    marginTop: '1.5rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  }
};
export { styles };
