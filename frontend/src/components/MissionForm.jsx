import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getMissions, saveMission, updateMission, deleteMission, getEmployeeByMatricule, formatDateFR } from '../utils/api';
import { generateMissionPdf } from '../utils/pdfGenerator';
import { FileText, Search, UserCheck, AlertCircle, Calendar, Car, Send, FileDown, Plus, Edit, Trash2, X, CheckCircle, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

import ConfirmModal from './ConfirmModal';
import CustomDatePicker from './CustomDatePicker';
import ToastNotification from './ToastNotification';

export default function MissionForm() {
  const [missionsList, setMissionsList] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, title = "Notification", type = "success") => {
    setToast({ message, title, type });
  };

  const todayStr = new Date().toISOString().split('T')[0];

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

  // Form State (New Mission)
  const [matricule, setMatricule] = useState('');
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [raison, setRaison] = useState('');
  const [destination, setDestination] = useState('');
  const [observation, setObservation] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [dateRetour, setDateRetour] = useState('');
  const [moyenTransport, setMoyenTransport] = useState('vehicule_service');
  const [marqueVehicule, setMarqueVehicule] = useState('');
  const [matriculeVehicule, setMatriculeVehicule] = useState('');

  // Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [editingMission, setEditingMission] = useState(null);
  const [editForm, setEditForm] = useState({
    raison: '',
    destination: '',
    date_depart: '',
    date_retour: '',
    moyen_transport: 'vehicule_service',
    marque_vehicule: '',
    matricule_vehicule: '',
    observation: ''
  });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTableQuery]);

  // Helper to map backend mission to frontend format
  const mapMission = (m) => ({
    ...m,
    employeeMatricule: m.employee ? m.employee.matricule : '',
    employeeName: m.employee ? `${m.employee.nom} ${m.employee.prenom}` : '',
    employeeDept: m.employee && m.employee.department ? m.employee.department.name : '',
    employeeDirection: m.employee ? m.employee.direction_province : 'TAZA',
    dateDepart: m.date_depart,
    dateRetour: m.date_retour,
    moyenTransport: m.moyen_transport,
    marqueVehicule: m.marque_vehicule,
    matriculeVehicule: m.matricule_vehicule,
  });

  const loadMissionsList = async () => {
    try {
      setLoading(true);
      const data = await getMissions();
      setMissionsList((data || []).map(mapMission));
    } catch (err) {
      console.error("Error loading missions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissionsList();
  }, []);

  // Debounced matricule search for creation
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

    if (!raison || !destination || !dateDepart || !dateRetour) {
      const msg = "Veuillez remplir tous les champs obligatoires (Raison, Destination, Dates).";
      setError(msg);
      triggerAlert(msg, "Champs Requis");
      return;
    }

    if (new Date(dateDepart) > new Date(dateRetour)) {
      const msg = "La date de départ (jj/mm/yyyy) doit être antérieure ou égale à la date de retour (jj/mm/yyyy).";
      setError(msg);
      triggerAlert(msg, "Plage de Dates Invalide");
      return;
    }

    if (moyenTransport === 'vehicule_service' && (!marqueVehicule || !matriculeVehicule)) {
      const msg = "Veuillez renseigner la marque et le matricule du véhicule de service.";
      setError(msg);
      triggerAlert(msg, "Informations Véhicule Manquantes");
      return;
    }

    const payload = {
      employee_matricule: employeeInfo.matricule,
      destination: destination.trim().toUpperCase(),
      raison: raison.trim(),
      observation: observation.trim(),
      date_depart: dateDepart,
      date_retour: dateRetour,
      moyen_transport: moyenTransport,
      marque_vehicule: moyenTransport === 'vehicule_service' ? marqueVehicule.trim() : null,
      matricule_vehicule: moyenTransport === 'vehicule_service' ? matriculeVehicule.trim() : null
    };

    try {
      setSubmitting(true);
      const res = await saveMission(payload);
      if (res.success || res.mission) {
        const createdMission = mapMission(res.mission || res);
        setSuccess("Ordre de mission créé et enregistré avec succès !");
        showToast("Ordre de mission créé et enregistré avec succès !", "Mission Enregistrée", "success");
        
        // Auto-generate PDF
        generateMissionPdf(createdMission);

        // Reset form & reload table
        setMatricule('');
        setEmployeeInfo(null);
        setRaison('');
        setDestination('');
        setObservation('');
        setDateDepart('');
        setDateRetour('');
        setMarqueVehicule('');
        setMatriculeVehicule('');
        setShowCreateForm(false);

        await loadMissionsList();
      } else {
        const msg = res.message || "Erreur lors de la création de la mission.";
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
  const handleOpenEdit = (m) => {
    setEditingMission(m);
    setEditForm({
      raison: m.raison || '',
      destination: m.destination || '',
      date_depart: m.date_depart || m.dateDepart || '',
      date_retour: m.date_retour || m.dateRetour || '',
      moyen_transport: m.moyen_transport || m.moyenTransport || 'vehicule_service',
      marque_vehicule: m.marque_vehicule || m.marqueVehicule || '',
      matricule_vehicule: m.matricule_vehicule || m.matriculeVehicule || '',
      observation: m.observation || ''
    });
    setEditError('');
    setEditSuccess('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMission) return;
    setEditError('');
    setEditSuccess('');

    if (new Date(editForm.date_depart) > new Date(editForm.date_retour)) {
      const msg = "La date de départ (jj/mm/yyyy) doit être antérieure ou égale à la date de retour (jj/mm/yyyy).";
      setEditError(msg);
      showToast(msg, "Plage de Dates Invalide", "error");
      triggerAlert(msg, "Plage de Dates Invalide");
      return;
    }

    if (editForm.moyen_transport === 'vehicule_service' && (!editForm.marque_vehicule || !editForm.matricule_vehicule)) {
      const msg = "Veuillez renseigner la marque et la plaque du véhicule.";
      setEditError(msg);
      showToast(msg, "Informations Véhicule Manquantes", "error");
      triggerAlert(msg, "Informations Véhicule Manquantes");
      return;
    }

    const payload = {
      employee_matricule: editingMission.employeeMatricule || (editingMission.employee ? editingMission.employee.matricule : ''),
      destination: editForm.destination.trim().toUpperCase(),
      raison: editForm.raison.trim(),
      observation: editForm.observation ? editForm.observation.trim() : '',
      date_depart: editForm.date_depart,
      date_retour: editForm.date_retour,
      moyen_transport: editForm.moyen_transport,
      marque_vehicule: editForm.moyen_transport === 'vehicule_service' ? editForm.marque_vehicule.trim() : null,
      matricule_vehicule: editForm.moyen_transport === 'vehicule_service' ? editForm.matricule_vehicule.trim() : null
    };

    try {
      setEditSubmitting(true);
      const res = await updateMission(editingMission.id, payload);
      if (res.success || res.mission) {
        setEditSuccess("Ordre de mission mis à jour avec succès !");
        showToast("Ordre de mission mis à jour avec succès !", "Modification Réussie", "success");
        
        // Reload table
        await loadMissionsList();

        setTimeout(() => {
          setEditingMission(null);
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

  const handleDelete = (id, title) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer l'Ordre de Mission",
      message: `Voulez-vous vraiment supprimer l'ordre de mission pour "${title}" ? Cette action est définitive.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await deleteMission(id);
          if (res.success) {
            showToast("Ordre de mission supprimé avec succès.", "Suppression Réussie", "success");
            await loadMissionsList();
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

  const filteredMissions = missionsList.filter((m) => {
    const q = searchTableQuery.toLowerCase();
    return (
      (m.employeeName && m.employeeName.toLowerCase().includes(q)) ||
      (m.employeeMatricule && m.employeeMatricule.toLowerCase().includes(q)) ||
      (m.destination && m.destination.toLowerCase().includes(q)) ||
      (m.raison && m.raison.toLowerCase().includes(q))
    );
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);
  const paginatedMissions = filteredMissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Header with Top "Ajouter" Button */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestion des Ordres de Mission</h1>
          <p style={styles.subtitle}>Consultez, modifiez, créez et imprimez les ordres de mission enregistrés</p>
        </div>
        
        <button
          id="toggle-create-mission-btn"
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
          <span>{showCreateForm ? 'Fermer le formulaire' : 'Nouveau Ordre de Mission'}</span>
        </button>
      </div>

      {/* Creation Form Card (Toggled by button) */}
      {showCreateForm && (
        <div className="card animate-fade-in" style={styles.formCard}>
          <div style={styles.cardHeader}>
            <div style={styles.iconBadge}>
              <FileText size={20} color="var(--primary)" />
            </div>
            <div>
              <h2 style={styles.cardTitle}>Créer un Ordre de Mission</h2>
              <p style={styles.cardSubtitle}>Recherche automatique du collaborateur par son matricule</p>
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
              <label className="form-label" htmlFor="mission-matricule-input">
                <Search size={16} /> Matricule de l'employé *
              </label>
              <input
                id="mission-matricule-input"
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
                  <span>Collaborateur trouvé : <strong>{employeeInfo.nom} {employeeInfo.prenom}</strong> ({employeeInfo.fonction} | {employeeInfo.department ? employeeInfo.department.name : employeeInfo.departement})</span>
                </div>
              ) : matricule ? (
                <div style={styles.warningBox} className="badge-warning">
                  <AlertCircle size={16} />
                  <span>Aucun employé trouvé avec ce matricule.</span>
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
            </div>

            <div className="form-row">
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
              <div className="form-group">
                <label className="form-label">Direction/Province</label>
                <input
                  type="text"
                  className="form-input"
                  style={styles.disabledInput}
                  value={employeeInfo ? employeeInfo.direction_province : 'TAZA'}
                  placeholder="Rempli automatiquement"
                  disabled
                />
              </div>
            </div>

            <hr style={styles.divider} />

            {/* Mission Details */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="mission-reason">Raison / Objet de la mission *</label>
                <input
                  id="mission-reason"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Réunion de chantier, Audit"
                  value={raison}
                  onChange={(e) => setRaison(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="mission-destination">Destination *</label>
                <input
                  id="mission-destination"
                  type="text"
                  className="form-input"
                  placeholder="Ex: FÈS, MEKNÈS, TAZA"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="mission-date-depart">
                  <Calendar size={16} /> Date de départ (jj/mm/yyyy) *
                </label>
                <CustomDatePicker
                  id="mission-date-depart"
                  min={todayStr}
                  className="form-input"
                  value={dateDepart}
                  onChange={(e) => setDateDepart(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="mission-date-retour">
                  <Calendar size={16} /> Date de retour (jj/mm/yyyy) *
                </label>
                <CustomDatePicker
                  id="mission-date-retour"
                  min={dateDepart || todayStr}
                  className="form-input"
                  value={dateRetour}
                  onChange={(e) => setDateRetour(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mission-observation">Observation</label>
              <textarea
                id="mission-observation"
                className="form-textarea"
                rows="2"
                placeholder="Indiquez des détails supplémentaires si nécessaire..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>

            {/* Transport dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="mission-transport-select">
                <Car size={16} /> Moyen de Transport
              </label>
              <select
                id="mission-transport-select"
                className="form-select"
                value={moyenTransport}
                onChange={(e) => setMoyenTransport(e.target.value)}
              >
                <option value="vehicule_service">Véhicule de Service (Marque & Plaque requises)</option>
                <option value="train">Train</option>
                <option value="taxi">Taxi</option>
                <option value="propre_vehicule">Propre Véhicule</option>
                <option value="bus">Autobus</option>
              </select>
            </div>

            {moyenTransport === 'vehicule_service' && (
              <div style={styles.vehicleBox} className="animate-fade-in">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="mission-vehicule-marque">Marque du véhicule *</label>
                    <input
                      id="mission-vehicule-marque"
                      type="text"
                      className="form-input"
                      placeholder="Ex: Dacia Duster"
                      value={marqueVehicule}
                      onChange={(e) => setMarqueVehicule(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="mission-vehicule-immat">Matricule du véhicule *</label>
                    <input
                      id="mission-vehicule-immat"
                      type="text"
                      className="form-input"
                      placeholder="Ex: 12345-A-15"
                      value={matriculeVehicule}
                      onChange={(e) => setMatriculeVehicule(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={styles.actions}>
              <button id="mission-submit-btn" type="submit" className="btn btn-primary" disabled={submitting}>
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
            <h2 style={styles.cardTitle}>Liste des Ordres de Mission</h2>
            <p style={styles.cardSubtitle}>{filteredMissions.length} ordre(s) enregistrés au total</p>
          </div>

          <div style={styles.searchFilterGroup}>
            <Search size={18} style={styles.searchFilterIcon} />
            <input
              id="search-missions-table-input"
              type="text"
              placeholder="Rechercher par nom, matricule, destination..."
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              style={styles.searchFilterInput}
            />
          </div>
        </div>

        {loading ? (
          <p style={styles.emptyText}>Chargement des ordres de mission...</p>
        ) : filteredMissions.length === 0 ? (
          <p style={styles.emptyText}>Aucun ordre de mission trouvé.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Collaborateur</th>
                    <th style={styles.th}>Objet / Raison</th>
                    <th style={styles.th}>Destination</th>
                    <th style={styles.th}>Période (jj/mm/yyyy)</th>
                    <th style={styles.th}>Moyen de Transport</th>
                    <th style={styles.th}>Statut</th>
                    <th style={styles.th}>Actions & Impression</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMissions.map((m) => (
                    <tr key={m.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{m.employeeName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Matricule : {m.employeeMatricule} ({m.employeeDept})
                        </div>
                      </td>
                      <td style={styles.td}>{m.raison}</td>
                      <td style={styles.td}>
                        <strong style={{ color: 'var(--primary)' }}><MapPin size={14} style={{ display: 'inline', marginRight: '3px' }} />{m.destination}</strong>
                      </td>
                      <td style={styles.td}>
                        Du <strong>{formatDateFR(m.dateDepart)}</strong> au <strong>{formatDateFR(m.dateRetour)}</strong>
                      </td>
                      <td style={styles.td}>
                        {m.moyenTransport === 'vehicule_service' ? (
                          <div>
                            <span>Véhicule Service</span>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              {m.marqueVehicule} ({m.matriculeVehicule})
                            </div>
                          </div>
                        ) : (
                          <span style={{ textTransform: 'capitalize' }}>{m.moyenTransport}</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span className="badge badge-success">{m.status || 'Effectué'}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            id={`print-mission-pdf-${m.id}`}
                            onClick={() => generateMissionPdf(m)}
                            style={styles.actionPdfBtn}
                            title="Imprimer Document PDF"
                          >
                            <FileDown size={14} /> PDF
                          </button>
                          <button
                            id={`edit-mission-btn-${m.id}`}
                            onClick={() => handleOpenEdit(m)}
                            style={styles.actionEditBtn}
                            title="Éditer l'ordre de mission"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            id={`delete-mission-btn-${m.id}`}
                            onClick={() => handleDelete(m.id, `${m.employeeName} - ${m.destination}`)}
                            style={styles.actionDeleteBtn}
                            title="Supprimer la mission"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={styles.paginationRow}>
                <span style={styles.paginationInfo}>
                  Affichage <strong>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredMissions.length)}</strong> sur <strong>{filteredMissions.length}</strong> missions (Page {currentPage} sur {totalPages})
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

      {/* Edit Mission Modal */}
      {editingMission && createPortal(
        <div style={styles.modalOverlay} className="animate-fade-in">
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Modifier l'Ordre de Mission</h3>
              <button onClick={() => setEditingMission(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ marginTop: '3rem' }}>
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
                <strong>Collaborateur :</strong> {editingMission.employeeName} ({editingMission.employeeMatricule})
              </div>

              <div className="form-row" style={{ marginTop: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Raison / Objet *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.raison}
                    onChange={(e) => setEditForm({ ...editForm, raison: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.destination}
                    onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
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

              <div className="form-group">
                <label className="form-label">Moyen de Transport</label>
                <select
                  className="form-select"
                  value={editForm.moyen_transport}
                  onChange={(e) => setEditForm({ ...editForm, moyen_transport: e.target.value })}
                >
                  <option value="vehicule_service">Véhicule de Service</option>
                  <option value="train">Train</option>
                  <option value="taxi">Taxi</option>
                  <option value="propre_vehicule">Propre Véhicule</option>
                  <option value="bus">Autobus</option>
                </select>
              </div>

              {editForm.moyen_transport === 'vehicule_service' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Marque *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.marque_vehicule}
                      onChange={(e) => setEditForm({ ...editForm, marque_vehicule: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Matricule Véhicule *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.matricule_vehicule}
                      onChange={(e) => setEditForm({ ...editForm, matricule_vehicule: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div style={styles.modalFooterActions}>
                <button
                  type="button"
                  onClick={() => generateMissionPdf({ ...editingMission, ...editForm, dateDepart: editForm.date_depart, dateRetour: editForm.date_retour, marqueVehicule: editForm.marque_vehicule, matriculeVehicule: editForm.matricule_vehicule })}
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
  vehicleBox: {
    backgroundColor: 'var(--background)',
    padding: '1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px dashed var(--primary-light)',
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
  },
  modalFooterActions: {
    marginTop: '1.5rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  }
};
