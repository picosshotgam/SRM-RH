import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getEmployees, saveConge, updateConge, deleteConge, closeConge, getConges, getEmployeeByMatricule, formatDateFR } from '../utils/api';
import { generateCongePdf } from '../utils/pdfGenerator';
import { CalendarRange, Search, UserCheck, AlertCircle, Calendar, Users, Send, FileDown, Plus, Edit, Trash2, RotateCcw, X, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

import ConfirmModal from './ConfirmModal';
import CustomDatePicker from './CustomDatePicker';
import ToastNotification from './ToastNotification';

export default function CongeForm() {
  const [employees, setEmployees] = useState([]);
  const [congesList, setCongesList] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [loading, setLoading] = useState(true);
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
  const itemsPerPage = 5;

  // Form State (New Congé)
  const [matricule, setMatricule] = useState('');
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [nombreJours, setNombreJours] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [dateRetour, setDateRetour] = useState('');
  const [dateReprise, setDateReprise] = useState('');
  const [motif, setMotif] = useState('Congé annuel');
  const [interimMatricule, setInterimMatricule] = useState('');

  // Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Leave Modal State
  const [editingConge, setEditingConge] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre_jours: '',
    date_depart: '',
    date_retour: '',
    date_reprise: '',
    motif: 'Congé annuel',
    interim_matricule: ''
  });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Close Leave Modal State
  const [closingConge, setClosingConge] = useState(null);
  const [closeActualDate, setCloseActualDate] = useState('');
  const [closeError, setCloseError] = useState('');
  const [closeSuccess, setCloseSuccess] = useState('');
  const [closeSubmitting, setCloseSubmitting] = useState(false);

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTableQuery]);

  // Helper to map backend congé to frontend format
  const mapConge = (c) => ({
    ...c,
    employeeMatricule: c.employee ? c.employee.matricule : '',
    employeeName: c.employee ? `${c.employee.nom} ${c.employee.prenom}` : '',
    employeeFonction: c.employee ? c.employee.fonction : '',
    employeeDept: c.employee && c.employee.department ? c.employee.department.name : '',
    employeeDirection: c.employee ? c.employee.direction_province : 'TAZA',
    nombreJours: c.nombre_jours,
    dateDepart: c.date_depart,
    dateRetour: c.date_retour,
    dateReprise: c.date_reprise,
    dateRetourEffective: c.date_retour_effective,
    nombreJoursEffectif: c.nombre_jours_effectif,
    joursRestitues: c.jours_restitues,
    motif: c.motif,
    status: c.status || 'Approuvé',
    interimMatricule: c.interim_employee ? c.interim_employee.matricule : '',
    interimName: c.interim_employee ? `${c.interim_employee.nom} ${c.interim_employee.prenom}` : ''
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [emps, conges] = await Promise.all([getEmployees(), getConges()]);
      setEmployees(emps);
      setCongesList((conges || []).map(mapConge));

      // Auto-refresh active employee info if matricule is entered
      if (matricule && matricule.trim().length >= 3) {
        const empRes = await getEmployeeByMatricule(matricule.trim());
        if (empRes && empRes.success && empRes.employee) {
          setEmployeeInfo(empRes.employee);
        }
      }
    } catch (err) {
      console.error("Error loading congé initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounced matricule search for current employee
  useEffect(() => {
    if (!matricule || matricule.trim().length < 3) {
      setEmployeeInfo(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await getEmployeeByMatricule(matricule.trim());
        if (data.success && data.employee) {
          setEmployeeInfo(data.employee);
          setError('');
        } else {
          setEmployeeInfo(null);
        }
      } catch (err) {
        setEmployeeInfo(null);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [matricule]);

  // Handle auto-calculating date range length or suggesting date reprise for creation
  useEffect(() => {
    if (dateRetour) {
      const retourDate = new Date(dateRetour);
      const repriseDate = new Date(retourDate);
      repriseDate.setDate(retourDate.getDate() + 1);
      
      const year = repriseDate.getFullYear();
      const month = String(repriseDate.getMonth() + 1).padStart(2, '0');
      const day = String(repriseDate.getDate()).padStart(2, '0');
      setDateReprise(`${year}-${month}-${day}`);

      if (dateDepart) {
        const start = new Date(dateDepart);
        const end = new Date(dateRetour);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 0) {
          setNombreJours(diffDays);
        }
      }
    }
  }, [dateDepart, dateRetour]);

  // Handle auto-calculating duration and reprise date in Edit Modal
  useEffect(() => {
    if (editingConge && editForm.date_depart && editForm.date_retour) {
      const start = new Date(editForm.date_depart);
      const end = new Date(editForm.date_retour);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        const repriseDate = new Date(end);
        repriseDate.setDate(end.getDate() + 1);
        const year = repriseDate.getFullYear();
        const month = String(repriseDate.getMonth() + 1).padStart(2, '0');
        const day = String(repriseDate.getDate()).padStart(2, '0');

        setEditForm(prev => {
          const newReprise = `${year}-${month}-${day}`;
          if (prev.nombre_jours === diffDays && prev.date_reprise === newReprise) return prev;
          return {
            ...prev,
            nombre_jours: diffDays,
            date_reprise: newReprise
          };
        });
      }
    }
  }, [editingConge, editForm.date_depart, editForm.date_retour]);

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

    if (!employeeInfo) {
      const msg = "Veuillez saisir un matricule valide existant dans la base d'employés.";
      setError(msg);
      triggerAlert(msg, "Matricule Introuvable");
      return;
    }

    if (!nombreJours || !dateDepart || !dateRetour || !dateReprise || !interimMatricule) {
      const msg = "Veuillez remplir tous les champs obligatoires (Dates, Nombre de jours, Intérimaire).";
      setError(msg);
      triggerAlert(msg, "Champs Requis");
      return;
    }

    const requestedDays = parseInt(nombreJours);
    const availableBalance = employeeInfo.solde_conge !== undefined ? employeeInfo.solde_conge : 30;

    if (requestedDays > availableBalance) {
      const msg = `Le nombre de jours demandés (${requestedDays} jours) dépasse le solde de congé restant de l'employé (${availableBalance} jours disponible(s)).`;
      setError(msg);
      triggerAlert(msg, "Solde de Congé Insuffisant");
      return;
    }

    if (new Date(dateDepart) > new Date(dateRetour)) {
      const msg = "La date de départ (jj/mm/yyyy) doit être antérieure ou égale à la date de retour (jj/mm/yyyy).";
      setError(msg);
      triggerAlert(msg, "Plage de Dates Invalide");
      return;
    }

    const payload = {
      employee_matricule: employeeInfo.matricule,
      nombre_jours: requestedDays,
      date_depart: dateDepart,
      date_retour: dateRetour,
      date_reprise: dateReprise,
      motif: motif,
      interim_matricule: interimMatricule.trim().toUpperCase()
    };

    try {
      setSubmitting(true);
      const res = await saveConge(payload);
      if (res.success || res.conge) {
        const createdConge = mapConge(res.conge || res);
        setSuccess("Demande de congé enregistrée et solde mis à jour avec succès !");
        showToast("Demande de congé enregistrée et solde mis à jour avec succès !", "Demande Enregistrée", "success");
        
        // Auto-generate PDF
        generateCongePdf(createdConge);

        // Reset form & reload list
        setMatricule('');
        setEmployeeInfo(null);
        setNombreJours('');
        setDateDepart('');
        setDateRetour('');
        setDateReprise('');
        setMotif('Congé annuel');
        setInterimMatricule('');
        setShowCreateForm(false);

        await loadInitialData();
      } else {
        const msg = res.message || "Erreur lors de l'enregistrement de la demande de congé.";
        setError(msg);
        showToast(msg, "Erreur de Sauvegarde", "error");
        triggerAlert(msg, "Erreur de Sauvegarde");
      }
    } catch (err) {
      const msg = err.message || "Erreur de communication avec le serveur.";
      setError(msg);
      showToast(msg, "Erreur Serveur", "error");
      triggerAlert(msg, "Erreur Serveur");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (c) => {
    setEditingConge(c);
    setEditForm({
      nombre_jours: c.nombre_jours || c.nombreJours || '',
      date_depart: c.date_depart || c.dateDepart || '',
      date_retour: c.date_retour || c.dateRetour || '',
      date_reprise: c.date_reprise || c.dateReprise || '',
      motif: c.motif || 'Congé annuel',
      interim_matricule: c.interimMatricule || (c.interim_employee ? c.interim_employee.matricule : '')
    });
    setEditError('');
    setEditSuccess('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingConge) return;
    setEditError('');
    setEditSuccess('');

    if (new Date(editForm.date_depart) > new Date(editForm.date_retour)) {
      const msg = "La date de départ (jj/mm/yyyy) doit être antérieure ou égale à la date de retour (jj/mm/yyyy).";
      setEditError(msg);
      showToast(msg, "Plage de Dates Invalide", "error");
      triggerAlert(msg, "Plage de Dates Invalide");
      return;
    }

    const payload = {
      employee_matricule: editingConge.employeeMatricule || (editingConge.employee ? editingConge.employee.matricule : ''),
      nombre_jours: parseInt(editForm.nombre_jours),
      date_depart: editForm.date_depart,
      date_retour: editForm.date_retour,
      date_reprise: editForm.date_reprise,
      motif: editForm.motif,
      interim_matricule: editForm.interim_matricule.trim().toUpperCase()
    };

    try {
      setEditSubmitting(true);
      const res = await updateConge(editingConge.id, payload);
      if (res.success || res.conge) {
        setEditSuccess("Demande de congé mise à jour avec succès !");
        showToast("Demande de congé mise à jour avec succès !", "Modification Réussie", "success");
        await loadInitialData();

        setTimeout(() => {
          setEditingConge(null);
        }, 1200);
      } else {
        const msg = res.message || "Erreur lors de la mise à jour.";
        setEditError(msg);
        showToast(msg, "Erreur de Modification", "error");
        triggerAlert(msg, "Erreur de Modification");
      }
    } catch (err) {
      const msg = err.message || "Erreur de communication avec le serveur.";
      setEditError(msg);
      showToast(msg, "Erreur Serveur", "error");
      triggerAlert(msg, "Erreur Serveur");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Close Leave Modal
  const handleOpenClose = (c) => {
    setClosingConge(c);
    setCloseActualDate(c.date_retour_effective || c.date_retour || c.dateRetour);
    setCloseError('');
    setCloseSuccess('');
  };

  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    if (!closingConge || !closeActualDate) return;
    setCloseError('');
    setCloseSuccess('');

    try {
      setCloseSubmitting(true);
      const res = await closeConge(closingConge.id, {
        date_retour_effective: closeActualDate
      });

      if (res.success) {
        setCloseSuccess(res.message);
        showToast(res.message || "Congé clôturé et solde mis à jour !", "Clôture Réussie", "success");
        await loadInitialData();

        setTimeout(() => {
          setClosingConge(null);
        }, 1500);
      } else {
        const msg = res.message || "Erreur lors de la clôture du congé.";
        setCloseError(msg);
        showToast(msg, "Erreur de Clôture", "error");
        triggerAlert(msg, "Erreur de Clôture");
      }
    } catch (err) {
      const msg = err.message || "Erreur lors de la communication avec le serveur.";
      setCloseError(msg);
      showToast(msg, "Erreur Serveur", "error");
      triggerAlert(msg, "Erreur Serveur");
    } finally {
      setCloseSubmitting(false);
    }
  };

  const handleDelete = (id, title) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer la Demande de Congé",
      message: `Voulez-vous vraiment supprimer cette demande de congé pour "${title}" ? Les jours seront automatiquement restitués au solde de l'employé.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await deleteConge(id);
          if (res.success) {
            showToast("Demande de congé supprimée et jours restitués au solde de l'employé.", "Suppression Réussie", "success");
            await loadInitialData();
          } else {
            const msg = res.message || "Erreur lors de la suppression.";
            showToast(msg, "Erreur de Suppression", "error");
            triggerAlert(msg, "Erreur de Suppression");
          }
        } catch (err) {
          const msg = err.message || "Erreur lors de la suppression.";
          showToast(msg, "Erreur Serveur", "error");
          triggerAlert(msg, "Erreur Serveur");
        }
      }
    });
  };

  const filteredConges = congesList.filter((c) => {
    const q = searchTableQuery.toLowerCase();
    return (
      (c.employeeName && c.employeeName.toLowerCase().includes(q)) ||
      (c.employeeMatricule && c.employeeMatricule.toLowerCase().includes(q)) ||
      (c.motif && c.motif.toLowerCase().includes(q)) ||
      (c.status && c.status.toLowerCase().includes(q))
    );
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredConges.length / itemsPerPage);
  const paginatedConges = filteredConges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Header with Top "Ajouter" Button */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestion des Demandes de Congé</h1>
          <p style={styles.subtitle}>Gestion annuelle des congés, suivi des soldes et clôtures des retours anticipés</p>
        </div>

        <button
          id="toggle-create-conge-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={showCreateForm ? "btn btn-danger" : "btn btn-primary"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            ...(showCreateForm ? { backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff' } : {})
          }}
        >
          {showCreateForm ? <X size={18} /> : <Plus size={18} />}
          <span>{showCreateForm ? 'Fermer le formulaire' : 'Nouvelle Demande de Congé'}</span>
        </button>
      </div>

      {/* Creation Form Card (Toggled by button) */}
      {showCreateForm && (
        <div className="card animate-fade-in" style={styles.formCard}>
          <div style={styles.cardHeader}>
            <div style={styles.iconBadge}>
              <CalendarRange size={20} color="var(--primary)" />
            </div>
            <div>
              <h2 style={styles.cardTitle}>Nouvelle Demande de Congé</h2>
              <p style={styles.cardSubtitle}>Vérification automatique du solde de congé restant de l'employé</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div style={styles.msgBox} className="badge-warning">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={styles.msgBox} className="badge-success">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}

            {/* Matricule Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="conge-matricule-input">
                <Search size={16} /> Matricule de l'employé *
              </label>
              <input
                id="conge-matricule-input"
                type="text"
                className="form-input"
                placeholder="Entrez le matricule (ex: M1001)..."
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                required
              />

              {employeeInfo ? (
                <div style={styles.matchBox} className="badge-success">
                  <UserCheck size={16} />
                  <span>Collaborateur trouvé : <strong>{employeeInfo.nom} {employeeInfo.prenom}</strong> ({employeeInfo.fonction}) — <strong style={{ color: 'var(--primary-dark)' }}>Solde restant : {employeeInfo.solde_conge !== undefined ? employeeInfo.solde_conge : 30} jours</strong></span>
                </div>
              ) : matricule ? (
                <div style={styles.warningBox} className="badge-warning">
                  <AlertCircle size={16} />
                  <span>Aucun employé trouvé. Enregistrez-le d'abord dans l'onglet "Ajouter Emploi".</span>
                </div>
              ) : null}
            </div>

            {/* Auto filled fields */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom et Prénom</label>
                <input
                  type="text"
                  className="form-input"
                  style={styles.disabledInput}
                  value={employeeInfo ? `${employeeInfo.nom} ${employeeInfo.prenom}` : ''}
                  placeholder="Rempli automatiquement"
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label">Solde de congé restant (Annuel)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ ...styles.disabledInput, fontWeight: 'bold', color: 'var(--primary)' }}
                  value={employeeInfo ? `${employeeInfo.solde_conge !== undefined ? employeeInfo.solde_conge : 30} jours` : ''}
                  placeholder="Rempli automatiquement (ex: 30 jours)"
                  disabled
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fonction</label>
                <input
                  type="text"
                  className="form-input"
                  style={styles.disabledInput}
                  value={employeeInfo ? employeeInfo.fonction : ''}
                  placeholder="Rempli automatiquement"
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label">Département</label>
                <input
                  type="text"
                  className="form-input"
                  style={styles.disabledInput}
                  value={employeeInfo ? (employeeInfo.department ? employeeInfo.department.name : employeeInfo.departement) : ''}
                  placeholder="Rempli automatiquement"
                  disabled
                />
              </div>
            </div>

            <hr style={styles.divider} />

            {/* Congé Details */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="conge-date-depart">
                  <Calendar size={16} /> Date de départ (jj/mm/yyyy) *
                </label>
                <CustomDatePicker
                  id="conge-date-depart"
                  min={todayStr}
                  className="form-input"
                  value={dateDepart}
                  onChange={(e) => setDateDepart(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="conge-date-retour">
                  <Calendar size={16} /> Date de retour (jj/mm/yyyy) *
                </label>
                <CustomDatePicker
                  id="conge-date-retour"
                  min={dateDepart || todayStr}
                  className="form-input"
                  value={dateRetour}
                  onChange={(e) => setDateRetour(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="conge-days-count">Nombre de jours de congé *</label>
                <input
                  id="conge-days-count"
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Calculé ou saisi manuellement"
                  value={nombreJours}
                  onChange={(e) => setNombreJours(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="conge-date-reprise">Date de reprise du service (jj/mm/yyyy) *</label>
                <CustomDatePicker
                  id="conge-date-reprise"
                  min={dateRetour || todayStr}
                  className="form-input"
                  value={dateReprise}
                  onChange={(e) => setDateReprise(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="conge-motif-select">Motif de congé</label>
                <select
                  id="conge-motif-select"
                  className="form-select"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                >
                  <option value="Congé annuel">Congé annuel</option>
                  <option value="Congé exceptionnel">Congé exceptionnel</option>
                  <option value="Congé de maladie">Congé de maladie</option>
                  <option value="Maternité / Paternité">Maternité / Paternité</option>
                  <option value="Congé sans solde">Congé sans solde</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="conge-interim-select">
                  <Users size={16} /> Intérimaire (Même département) *
                </label>
                <select
                  id="conge-interim-select"
                  className="form-select"
                  value={interimMatricule}
                  onChange={(e) => setInterimMatricule(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionnez l'intérimaire (du même département) --</option>
                  {employees
                    .filter((emp) => {
                      if (!employeeInfo) return true;
                      if (emp.matricule === employeeInfo.matricule) return false;
                      const empDept = emp.department_id || (emp.department ? emp.department.id : null) || emp.departement;
                      const currentDept = employeeInfo.department_id || (employeeInfo.department ? employeeInfo.department.id : null) || employeeInfo.departement;
                      return empDept && currentDept && String(empDept).toLowerCase() === String(currentDept).toLowerCase();
                    })
                    .map((emp) => (
                      <option key={emp.id} value={emp.matricule}>
                        {emp.matricule} - {emp.nom} {emp.prenom} ({emp.fonction})
                      </option>
                    ))}
                </select>
                {employeeInfo && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                    Note : Seuls les collaborateurs du département <strong>{employeeInfo.department ? employeeInfo.department.name : employeeInfo.departement}</strong> sont affichés.
                  </span>
                )}
              </div>
            </div>

            <div style={styles.actions}>
              <button id="conge-submit-btn" type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={18} />
                <span>{submitting ? 'Enregistrement en cours...' : 'Enregistrer & Imprimer PDF'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Data Table Section */}
      <div className="card" style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.cardTitle}>Liste des Demandes de Congé</h2>
            <p style={styles.cardSubtitle}>{filteredConges.length} demande(s) enregistrée(s) au total</p>
          </div>

          <div style={styles.searchFilterGroup}>
            <Search size={18} style={styles.searchFilterIcon} />
            <input
              id="search-conges-table-input"
              type="text"
              placeholder="Rechercher par nom, matricule, motif, statut..."
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              style={styles.searchFilterInput}
            />
          </div>
        </div>

        {loading ? (
          <p style={styles.emptyText}>Chargement des demandes de congé...</p>
        ) : filteredConges.length === 0 ? (
          <p style={styles.emptyText}>Aucune demande de congé trouvée.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Collaborateur</th>
                    <th style={styles.th}>Période prévue (jj/mm/yyyy)</th>
                    <th style={styles.th}>Jours Accordés / Utilisés</th>
                    <th style={styles.th}>Date Reprise (jj/mm/yyyy)</th>
                    <th style={styles.th}>Motif & Intérimaire</th>
                    <th style={styles.th}>Statut</th>
                    <th style={styles.th}>Actions & Impression</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedConges.map((c) => {
                    const isCompleted = c.status === 'Terminé';
                    return (
                      <tr key={c.id} style={styles.tr}>
                        <td style={styles.td}>
                          <strong>{c.employeeName}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Matricule : {c.employeeMatricule} ({c.employeeDept})
                          </div>
                        </td>
                        <td style={styles.td}>
                          Du <strong>{formatDateFR(c.dateDepart)}</strong> au <strong>{formatDateFR(c.dateRetour)}</strong>
                          {isCompleted && c.date_retour_effective && (
                            <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.15rem' }}>
                              <em>Retour effectif : {formatDateFR(c.date_retour_effective)}</em>
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          {isCompleted ? (
                            <div>
                              <span className="badge" style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' }}>
                                {c.nombreJoursEffectif || c.nombreJours} j utilisés
                              </span>
                              {c.joursRestitues > 0 && (
                                <div style={{ fontSize: '0.725rem', color: 'var(--primary-dark)', fontWeight: 'bold', marginTop: '0.15rem' }}>
                                  +{c.joursRestitues} j restitué(s)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="badge badge-success">{c.nombreJours} jours</span>
                          )}
                        </td>
                        <td style={styles.td}>{formatDateFR(c.dateReprise)}</td>
                        <td style={styles.td}>
                          <div><strong>{c.motif}</strong></div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Intérimaire : {c.interimName || '—'}
                          </div>
                        </td>
                        <td style={styles.td}>
                          {isCompleted ? (
                            <span className="badge" style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', fontWeight: 'bold' }}>
                              Terminé
                            </span>
                          ) : (
                            <span className="badge badge-success">Approuvé</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <button
                              id={`print-conge-pdf-${c.id}`}
                              onClick={() => generateCongePdf(c)}
                              style={styles.actionPdfBtn}
                              title="Imprimer Document PDF"
                            >
                              <FileDown size={14} /> PDF
                            </button>
                            {!isCompleted && (
                              <button
                                id={`close-conge-btn-${c.id}`}
                                onClick={() => handleOpenClose(c)}
                                style={styles.actionCloseBtn}
                                title="Clôturer le congé / Retour anticipé"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                            <button
                              id={`edit-conge-btn-${c.id}`}
                              onClick={() => handleOpenEdit(c)}
                              style={styles.actionEditBtn}
                              title="Éditer la demande"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              id={`delete-conge-btn-${c.id}`}
                              onClick={() => handleDelete(c.id, `${c.employeeName} (${c.nombreJours} jours)`)}
                              style={styles.actionDeleteBtn}
                              title="Supprimer la demande"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={styles.paginationRow}>
                <span style={styles.paginationInfo}>
                  Affichage <strong>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredConges.length)}</strong> sur <strong>{filteredConges.length}</strong> demandes (Page {currentPage} sur {totalPages})
                </span>
                <div style={styles.paginationNav}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={styles.pageNavBtn}
                  >
                    <ChevronLeft size={16} /> Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      style={p === currentPage ? styles.pageNumberActive : styles.pageNumber}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={styles.pageNavBtn}
                  >
                    Suivant <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Congé Modal */}
      {editingConge && createPortal(
        <div style={styles.modalOverlay} className="animate-fade-in">
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Modifier la Demande de Congé</h3>
              <button onClick={() => setEditingConge(null)} style={styles.modalCloseBtn}>
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

              <div style={styles.modalEmpSummary}>
                <strong>Collaborateur :</strong> {editingConge.employeeName} ({editingConge.employeeMatricule})
              </div>

              <div className="form-row" style={{ marginTop: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Date de départ (jj/mm/yyyy) *</label>
                  <CustomDatePicker
                    min={todayStr}
                    className="form-input"
                    value={editForm.date_depart}
                    onChange={(e) => setEditForm({ ...editForm, date_depart: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date de retour (jj/mm/yyyy) *</label>
                  <CustomDatePicker
                    min={editForm.date_depart || todayStr}
                    className="form-input"
                    value={editForm.date_retour}
                    onChange={(e) => setEditForm({ ...editForm, date_retour: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre de jours *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={editForm.nombre_jours}
                    onChange={(e) => setEditForm({ ...editForm, nombre_jours: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date de reprise (jj/mm/yyyy) *</label>
                  <CustomDatePicker
                    min={editForm.date_retour || todayStr}
                    className="form-input"
                    value={editForm.date_reprise}
                    onChange={(e) => setEditForm({ ...editForm, date_reprise: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Motif de congé</label>
                  <select
                    className="form-select"
                    value={editForm.motif}
                    onChange={(e) => setEditForm({ ...editForm, motif: e.target.value })}
                  >
                    <option value="Congé annuel">Congé annuel</option>
                    <option value="Congé exceptionnel">Congé exceptionnel</option>
                    <option value="Congé de maladie">Congé de maladie</option>
                    <option value="Maternité / Paternité">Maternité / Paternité</option>
                    <option value="Congé sans solde">Congé sans solde</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Intérimaire (Matricule) *</label>
                  <select
                    className="form-select"
                    value={editForm.interim_matricule}
                    onChange={(e) => setEditForm({ ...editForm, interim_matricule: e.target.value })}
                    required
                  >
                    <option value="">-- Sélectionner l'intérimaire --</option>
                    {employees
                      .filter(emp => {
                        const currentEmpMatricule = editingConge.employeeMatricule || (editingConge.employee ? editingConge.employee.matricule : '');
                        const currentEmp = employees.find(e => e.matricule === currentEmpMatricule);
                        if (emp.matricule === currentEmpMatricule) return false;
                        if (currentEmp && currentEmp.department_id) {
                          return emp.department_id === currentEmp.department_id;
                        }
                        return true;
                      })
                      .map(emp => (
                        <option key={emp.id} value={emp.matricule}>
                          {emp.nom} {emp.prenom} ({emp.matricule}) - {emp.department ? emp.department.name : emp.departement}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={styles.modalFooterActions}>
                <button
                  type="button"
                  onClick={() => generateCongePdf({ ...editingConge, ...editForm, nombreJours: editForm.nombre_jours, dateDepart: editForm.date_depart, dateRetour: editForm.date_retour, dateReprise: editForm.date_reprise, interimMatricule: editForm.interim_matricule })}
                  className="btn btn-secondary"
                  title="Imprimer le PDF mis à jour"
                >
                  <FileDown size={16} /> Imprimer PDF
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

      {/* Close Leave Modal */}
      {closingConge && createPortal(
        <div style={styles.modalOverlay} className="animate-fade-in">
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={18} color="var(--primary)" /> Clôturer le congé (Retour de l'employé)
              </h3>
              <button onClick={() => setClosingConge(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCloseSubmit} style={{ marginTop: '1rem' }}>
              {closeError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }} className="badge-warning">
                  <AlertCircle size={18} />
                  <span>{closeError}</span>
                </div>
              )}
              {closeSuccess && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }} className="badge-success">
                  <CheckCircle size={18} />
                  <span>{closeSuccess}</span>
                </div>
              )}

              <div style={styles.modalEmpSummary}>
                <div><strong>Employé :</strong> {closingConge.employeeName}</div>
                <div><strong>Période initiale :</strong> Du {formatDateFR(closingConge.dateDepart)} au {formatDateFR(closingConge.dateRetour)} ({closingConge.nombreJours} jours)</div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">
                  <Clock size={16} /> Date de retour effective (jj/mm/yyyy) *
                </label>
                <CustomDatePicker
                  min={closingConge ? (closingConge.dateDepart || closingConge.date_depart) : todayStr}
                  className="form-input"
                  value={closeActualDate}
                  onChange={(e) => setCloseActualDate(e.target.value)}
                  required
                />
              </div>

              {closeActualDate && (
                <div style={styles.calculationPreviewBox}>
                  <div style={styles.previewRow}>
                    <span>Jours initialement accordés :</span>
                    <strong>{closingConge.nombreJours} jours</strong>
                  </div>
                  <div style={styles.previewRow}>
                    <span>Jours réellement consommés :</span>
                    <strong>{Math.max(1, Math.ceil((new Date(closeActualDate) - new Date(closingConge.dateDepart)) / (1000 * 60 * 60 * 24)) + 1)} jours</strong>
                  </div>
                  <div style={styles.previewRowHighlight}>
                    <span>Jours restitués au solde :</span>
                    <span style={{ color: 'var(--primary-dark)', fontSize: '1rem' }}>
                      +{Math.max(0, closingConge.nombreJours - (Math.max(1, Math.ceil((new Date(closeActualDate) - new Date(closingConge.dateDepart)) / (1000 * 60 * 60 * 24)) + 1)))} j
                    </span>
                  </div>
                </div>
              )}

              <div style={styles.modalFooterActions}>
                <button
                  type="button"
                  onClick={() => setClosingConge(null)}
                  className="btn btn-secondary"
                  disabled={closeSubmitting}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={closeSubmitting}>
                  {closeSubmitting ? 'Enregistrement...' : 'Confirmer la clôture'}
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
    gap: '1.25rem',
    textAlign: 'left',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.5rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  formCard: {
    padding: '1.5rem 2rem',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  iconBadge: {
    width: '42px',
    height: '42px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--primary-light)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: '1.15rem',
  },
  cardSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  disabledInput: {
    backgroundColor: 'var(--background)',
    color: 'var(--text-secondary)',
    cursor: 'not-allowed',
  },
  matchBox: {
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.825rem',
  },
  warningBox: {
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.825rem',
  },
  msgBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border)',
    margin: '0.5rem 0',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1rem',
  },
  tableCard: {
    padding: '1.5rem 2rem',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  searchFilterGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchFilterIcon: {
    position: 'absolute',
    left: '0.75rem',
    color: 'var(--text-muted)',
  },
  searchFilterInput: {
    paddingLeft: '2.5rem',
    paddingRight: '1rem',
    height: '40px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    color: 'var(--text-primary)',
    width: '280px',
    fontSize: '0.85rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
    textAlign: 'left',
  },
  th: {
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--background)',
    borderBottom: '2px solid var(--border)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '0.75rem 1rem',
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
  },
  actionPdfBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.35rem 0.65rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--primary-light)',
    backgroundColor: 'var(--primary-light)',
    color: 'var(--primary-dark)',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.75rem',
  },
  actionCloseBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.35rem 0.6rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    color: '#0284c7',
    cursor: 'pointer',
  },
  actionEditBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.35rem 0.6rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    color: '#3b82f6',
    cursor: 'pointer',
  },
  actionDeleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.35rem 0.6rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--accent-red)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: 'var(--accent-red)',
    cursor: 'pointer',
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
    marginTop: '1.25rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border)',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  paginationInfo: {
    fontSize: '0.825rem',
    color: 'var(--text-secondary)',
  },
  paginationNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  pageNavBtn: {
    padding: '0.35rem 0.65rem',
    fontSize: '0.8rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  pageNumber: {
    padding: '0.35rem 0.65rem',
    fontSize: '0.8rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  pageNumberActive: {
    padding: '0.35rem 0.65rem',
    fontSize: '0.8rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--primary)',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    fontWeight: 'bold',
    cursor: 'pointer',
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
    maxWidth: '560px',
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
  modalEmpSummary: {
    backgroundColor: 'var(--background)',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  calculationPreviewBox: {
    marginTop: '0.85rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(75, 149, 58, 0.08)',
    border: '1px solid var(--primary-light)',
    fontSize: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  previewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'var(--text-secondary)',
  },
  previewRowHighlight: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 'bold',
  },
  modalFooterActions: {
    marginTop: '1.5rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  }
};
