import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getDashboardStats, getEmployeeHistoryByMatricule, closeConge, formatDateFR } from '../utils/api';
import { Users, FileSpreadsheet, CalendarCheck, MapPin, Plus, FileDown, ArrowRight, Search, AlertCircle, CheckCircle, X, RotateCcw, Clock } from 'lucide-react';
import { generateMissionPdf, generateCongePdf } from '../utils/pdfGenerator';
import ToastNotification from './ToastNotification';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    employeesCount: 0,
    missionsCount: 0,
    congesCount: 0,
    destinationsCount: 0
  });
  const [recentMissions, setRecentMissions] = useState([]);
  const [recentConges, setRecentConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, title = "Notification", type = "success") => {
    setToast({ message, title, type });
  };

  // Employee History Search State
  const [searchMatricule, setSearchMatricule] = useState('');
  const [employeeHistory, setEmployeeHistory] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const handleEmployeeSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchMatricule.trim()) {
      const msg = 'Veuillez saisir un matricule d\'employé.';
      setSearchError(msg);
      showToast(msg, "Matricule Requis", "error");
      return;
    }
    setSearchError('');
    setSearchLoading(true);
    try {
      const data = await getEmployeeHistoryByMatricule(searchMatricule.trim());
      if (data.success) {
        setEmployeeHistory(data);
        showToast(`Bilan et historique de ${data.employee.nom} ${data.employee.prenom} chargés !`, "Collaborateur Trouvé", "success");
      } else {
        setEmployeeHistory(null);
        const msg = data.message || 'Aucun collaborateur trouvé pour ce matricule.';
        setSearchError(msg);
        showToast(msg, "Recherche Introuvable", "error");
      }
    } catch (err) {
      setEmployeeHistory(null);
      const msg = err.message || 'Erreur lors de la recherche du collaborateur.';
      setSearchError(msg);
      showToast(msg, "Erreur Serveur", "error");
    } finally {
      setSearchLoading(false);
    }
  };

  // Close Leave Modal State
  const [selectedCongeToClose, setSelectedCongeToClose] = useState(null);
  const [closeActualReturnDate, setCloseActualReturnDate] = useState('');
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [closeModalError, setCloseModalError] = useState('');
  const [closeSuccessMsg, setCloseSuccessMsg] = useState('');

  const handleOpenCloseModal = (conge) => {
    setSelectedCongeToClose(conge);
    setCloseActualReturnDate(conge.date_retour_effective || conge.date_retour || conge.dateRetour);
    setCloseModalError('');
  };

  const handleCloseModalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCongeToClose || !closeActualReturnDate) return;
    setCloseSubmitting(true);
    setCloseModalError('');

    try {
      const data = await closeConge(selectedCongeToClose.id, {
        date_retour_effective: closeActualReturnDate
      });

      if (data.success) {
        setCloseSuccessMsg(data.message);
        showToast(data.message || "Congé clôturé et solde mis à jour avec succès !", "Clôture Validée", "success");
        setTimeout(() => setCloseSuccessMsg(''), 5000);

        // Refresh employee history if active
        if (searchMatricule.trim()) {
          handleEmployeeSearch();
        }

        // Refresh recent dashboard conges & stats
        const statsData = await getDashboardStats();
        setRecentConges((statsData.recentConges || []).map(mapConge));

        setSelectedCongeToClose(null);
      } else {
        const msg = data.message || 'Erreur lors de la clôture du congé.';
        setCloseModalError(msg);
        showToast(msg, "Erreur de Clôture", "error");
      }
    } catch (err) {
      const msg = err.message || 'Erreur lors de la communication avec le serveur.';
      setCloseModalError(msg);
      showToast(msg, "Erreur Serveur", "error");
    } finally {
      setCloseSubmitting(false);
    }
  };

  // Helper to map backend mission to frontend format
  const mapMission = (m) => ({
    ...m,
    employeeMatricule: m.employee ? m.employee.matricule : '',
    employeeName: m.employee ? `${m.employee.nom} ${m.employee.prenom}` : '',
    employeeDept: m.employee && m.employee.department ? m.employee.department.name : '',
    employeeDirection: m.employee ? m.employee.direction_province : '',
    dateDepart: m.date_depart,
    dateRetour: m.date_retour,
    moyenTransport: m.moyen_transport,
    marqueVehicule: m.marque_vehicule,
    matriculeVehicule: m.matricule_vehicule,
  });

  // Helper to map backend congé to frontend format
  const mapConge = (c) => ({
    ...c,
    employeeMatricule: c.employee ? c.employee.matricule : '',
    employeeName: c.employee ? `${c.employee.nom} ${c.employee.prenom}` : '',
    employeeFonction: c.employee ? c.employee.fonction : '',
    employeeDept: c.employee && c.employee.department ? c.employee.department.name : '',
    employeeDirection: c.employee ? c.employee.direction_province : '',
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats({
          employeesCount: data.employeesCount,
          missionsCount: data.missionsCount,
          congesCount: data.congesCount,
          destinationsCount: data.destinationsCount
        });
        
        setRecentMissions((data.recentMissions || []).map(mapMission));
        setRecentConges((data.recentConges || []).map(mapConge));
      } catch (err) {
        console.error("Error fetching dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleDownloadMission = (m) => {
    generateMissionPdf(m);
  };

  const handleDownloadConge = (c) => {
    generateCongePdf(c);
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Dashboard Title Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Tableau de Bord</h1>
          <p style={styles.subtitle}>Indicateurs de performance et raccourcis d'administration RH</p>
        </div>
        <span className="badge badge-success">Portail Actif</span>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid-cols-4" style={{ margin: '1.5rem 0' }}>
        <div className="card" style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: 'var(--primary-light)' }}>
            <Users color="var(--primary)" size={24} />
          </div>
          <div>
            <span style={styles.kpiLabel}>Total Employés</span>
            <h3 style={styles.kpiVal}>{stats.employeesCount}</h3>
          </div>
        </div>

        <div className="card" style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
            <FileSpreadsheet color="#3b82f6" size={24} />
          </div>
          <div>
            <span style={styles.kpiLabel}>Ordres de Mission</span>
            <h3 style={styles.kpiVal}>{stats.missionsCount}</h3>
          </div>
        </div>

        <div className="card" style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
            <CalendarCheck color="#10b981" size={24} />
          </div>
          <div>
            <span style={styles.kpiLabel}>Demandes Congé</span>
            <h3 style={styles.kpiVal}>{stats.congesCount}</h3>
          </div>
        </div>

        <div className="card" style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
            <MapPin color="#f59e0b" size={24} />
          </div>
          <div>
            <span style={styles.kpiLabel}>Destinations Actives</span>
            <h3 style={styles.kpiVal}>{stats.destinationsCount}</h3>
          </div>
        </div>
      </div>

      {/* Employee Search & History Section */}
      <div className="card" style={styles.historyCard}>
        <div style={styles.historyHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Recherche & Historique Collaborateur</h2>
            <p style={styles.sectionSubtitle}>Consulter le solde de congé restant, l'historique des congés et des missions par matricule</p>
          </div>
          
          <form onSubmit={handleEmployeeSearch} style={styles.searchForm}>
            <div style={styles.searchInputGroup}>
              <Search size={18} style={styles.searchIcon} />
              <input
                id="dashboard-employee-search-input"
                type="text"
                placeholder="Entrez le matricule (ex: M1001)..."
                value={searchMatricule}
                onChange={(e) => setSearchMatricule(e.target.value)}
                style={styles.historySearchInput}
              />
            </div>
            <button id="dashboard-employee-search-btn" type="submit" className="btn btn-primary" disabled={searchLoading}>
              {searchLoading ? 'Recherche...' : 'Consulter'}
            </button>
          </form>
        </div>

        {searchError && (
          <div style={styles.searchErrorBox} className="badge-warning">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{searchError}</span>
          </div>
        )}

        {employeeHistory && (
          <div style={styles.historyResultContainer} className="animate-fade-in">
            {/* Employee Banner */}
            <div style={styles.employeeBanner}>
              <div style={styles.employeeMetaGroup}>
                <div style={styles.empAvatarBig}>
                  {employeeHistory.employee.nom.charAt(0)}{employeeHistory.employee.prenom.charAt(0)}
                </div>
                <div>
                  <h3 style={styles.empNameBig}>
                    {employeeHistory.employee.nom} {employeeHistory.employee.prenom}
                  </h3>
                  <div style={styles.empTagsRow}>
                    <span className="badge badge-success">Matricule: {employeeHistory.employee.matricule}</span>
                    <span style={styles.empTagText}>{employeeHistory.employee.fonction}</span>
                    <span style={styles.empTagText}>•</span>
                    <span style={styles.empTagText}>{employeeHistory.employee.department ? employeeHistory.employee.department.name : employeeHistory.employee.departement}</span>
                    <span style={styles.empTagText}>({employeeHistory.employee.direction_province})</span>
                  </div>
                </div>
              </div>

              {/* Leave Balance Counters */}
              <div style={styles.leaveBalanceCounters}>
                <div style={styles.counterBox}>
                  <span style={styles.counterLabel}>Solde Initial</span>
                  <span style={styles.counterValue}>{employeeHistory.initial_balance} j</span>
                </div>
                <div style={styles.counterBox}>
                  <span style={styles.counterLabel}>Total Pris</span>
                  <span style={{ ...styles.counterValue, color: 'var(--accent-red)' }}>{employeeHistory.total_days_taken} j</span>
                </div>
                <div style={{ ...styles.counterBox, backgroundColor: 'rgba(75, 149, 58, 0.12)', border: '1px solid var(--primary-light)' }}>
                  <span style={styles.counterLabel}>Solde Restant</span>
                  <span style={{ ...styles.counterValue, color: 'var(--primary-dark)', fontWeight: '800' }}>{employeeHistory.remaining_balance} j</span>
                </div>
              </div>
            </div>

            {/* Leave History Table */}
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={styles.tableTitle}>
                <CalendarCheck size={18} color="var(--primary)" /> Historique des Congés ({employeeHistory.conges.length})
              </h3>
              {employeeHistory.conges.length === 0 ? (
                <p style={styles.emptyText}>Aucun congé enregistré pour cet employé.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Période prévue (jj/mm/yyyy)</th>
                        <th style={styles.th}>Jours Accordés / Utilisés</th>
                        <th style={styles.th}>Motif & Intérimaire</th>
                        <th style={styles.th}>Statut & Traçabilité</th>
                        <th style={styles.th}>Actions RH</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeHistory.conges.map((c) => {
                        const isCompleted = c.status === 'Terminé';
                        return (
                          <tr key={c.id} style={styles.tr}>
                            <td style={styles.td}>
                              <div>
                                <strong>{formatDateFR(c.date_depart)}</strong> au <strong>{formatDateFR(c.date_retour)}</strong>
                              </div>
                              {isCompleted && c.date_retour_effective && (
                                <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.2rem' }}>
                                  <em>Retour effectif : {formatDateFR(c.date_retour_effective)}</em>
                                </div>
                              )}
                            </td>
                            <td style={styles.td}>
                              {isCompleted ? (
                                <div>
                                  <span className="badge" style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' }}>
                                    {c.nombre_jours_effectif || c.nombre_jours} j utilisés
                                  </span>
                                  {c.jours_restitues > 0 && (
                                    <div style={{ fontSize: '0.725rem', color: 'var(--primary-dark)', fontWeight: 'bold', marginTop: '0.15rem' }}>
                                      +{c.jours_restitues} j restitué(s)
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="badge badge-success">{c.nombre_jours} jours accordés</span>
                              )}
                            </td>
                            <td style={styles.td}>
                              <div><strong>{c.motif || 'Congé annuel'}</strong></div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Intérimaire : {c.interim_employee ? `${c.interim_employee.nom} ${c.interim_employee.prenom}` : (c.interimName || '—')}
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
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {!isCompleted && (
                                  <button
                                    id={`close-conge-btn-${c.id}`}
                                    onClick={() => handleOpenCloseModal(c)}
                                    className="btn btn-secondary"
                                    style={styles.closeActionBtn}
                                    title="Clôturer le congé / Retour de l'employé"
                                  >
                                    <RotateCcw size={14} /> Clôturer
                                  </button>
                                )}
                                <button
                                  id={`history-download-conge-${c.id}`}
                                  onClick={() => handleDownloadConge(mapConge(c))}
                                  style={styles.tableBtn}
                                  title="Télécharger PDF Congé"
                                >
                                  <FileDown size={14} /> PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Mission History Table */}
            <div style={{ marginTop: '1.75rem' }}>
              <h3 style={styles.tableTitle}>
                <FileSpreadsheet size={18} color="#3b82f6" /> Historique des Missions ({employeeHistory.missions.length})
              </h3>
              {employeeHistory.missions.length === 0 ? (
                <p style={styles.emptyText}>Aucune mission enregistrée pour cet employé.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Destination</th>
                        <th style={styles.th}>Raison / Objet</th>
                        <th style={styles.th}>Dates (jj/mm/yyyy)</th>
                        <th style={styles.th}>Moyen de Transport</th>
                        <th style={styles.th}>Statut</th>
                        <th style={styles.th}>PDF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeHistory.missions.map((m) => (
                        <tr key={m.id} style={styles.tr}>
                          <td style={styles.td}>
                            <strong style={{ color: 'var(--primary)' }}>{m.destination}</strong>
                          </td>
                          <td style={styles.td}>{m.raison}</td>
                          <td style={styles.td}>
                            Du {formatDateFR(m.date_depart)} au {formatDateFR(m.date_retour)}
                          </td>
                          <td style={styles.td}>
                            {m.moyen_transport === 'vehicule_service' ? `Véhicule Service (${m.marque_vehicule || ''})` : 'Transport Public / Personnel'}
                          </td>
                          <td style={styles.td}>
                            <span className="badge badge-success">{m.status || 'Effectué'}</span>
                          </td>
                          <td style={styles.td}>
                            <button
                              id={`history-download-mission-${m.id}`}
                              onClick={() => handleDownloadMission(mapMission(m))}
                              style={styles.tableBtn}
                              title="Télécharger PDF Mission"
                            >
                              <FileDown size={16} /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity Split Columns */}
      <div style={styles.splitGrid}>
        {/* Recent Missions */}
        <div className="card" style={styles.activityColumn}>
          <div style={styles.columnHeader}>
            <h3 style={styles.columnTitle}>Dernières Missions</h3>
            <button id="view-all-missions-btn" onClick={() => setActiveTab('mission')} style={styles.linkBtn}>Tout voir</button>
          </div>
          <div style={styles.list}>
            {recentMissions.length === 0 ? (
              <p style={styles.emptyText}>Aucune mission enregistrée.</p>
            ) : (
              recentMissions.map((m) => (
                <div key={m.id} style={styles.listItem}>
                  <div style={styles.listItemText}>
                    <strong style={styles.listItemName}>{m.employeeName}</strong>
                    <span style={styles.listItemDetail}>{m.destination} ({formatDateFR(m.dateDepart)} au {formatDateFR(m.dateRetour)})</span>
                  </div>
                  <button
                    id={`download-mission-btn-${m.id}`}
                    onClick={() => handleDownloadMission(m)}
                    style={styles.downloadIconBtn}
                    title="Générer PDF"
                  >
                    <FileDown size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Congés */}
        <div className="card" style={styles.activityColumn}>
          <div style={styles.columnHeader}>
            <h3 style={styles.columnTitle}>Derniers Congés</h3>
            <button id="view-all-conges-btn" onClick={() => setActiveTab('conge')} style={styles.linkBtn}>Tout voir</button>
          </div>
          <div style={styles.list}>
            {recentConges.length === 0 ? (
              <p style={styles.emptyText}>Aucun congé enregistré.</p>
            ) : (
              recentConges.map((c) => {
                const isCompleted = c.status === 'Terminé';
                return (
                  <div key={c.id} style={styles.listItem}>
                    <div style={styles.listItemText}>
                      <strong style={styles.listItemName}>{c.employeeName}</strong>
                      <span style={styles.listItemDetail}>
                        {c.nombreJours} jours • Reprise le {formatDateFR(c.dateReprise)} {isCompleted ? '(Terminé)' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {!isCompleted && (
                        <button
                          id={`quick-close-conge-${c.id}`}
                          onClick={() => handleOpenCloseModal(c)}
                          style={{ ...styles.downloadIconBtn, backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' }}
                          title="Clôturer le congé / Retour anticipé"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                      <button
                        id={`download-conge-btn-${c.id}`}
                        onClick={() => handleDownloadConge(c)}
                        style={styles.downloadIconBtn}
                        title="Générer PDF"
                      >
                        <FileDown size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Notification Success Toast */}
      {closeSuccessMsg && (
        <div style={styles.toastNotification} className="badge-success animate-fade-in">
          <CheckCircle size={18} />
          <span>{closeSuccessMsg}</span>
        </div>
      )}

      {/* Close Leave Modal */}
      {selectedCongeToClose && createPortal(
        <div style={styles.modalOverlay} className="animate-fade-in">
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={20} color="var(--primary)" /> Clôturer le congé (Retour de l'employé)
              </h3>
              <button
                id="close-modal-x-btn"
                onClick={() => setSelectedCongeToClose(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCloseModalSubmit} style={{ marginTop: '1rem' }}>
              {closeModalError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }} className="badge-warning">
                  <AlertCircle size={18} />
                  <span>{closeModalError}</span>
                </div>
              )}

              <div style={styles.modalInfoBox}>
                <div><strong>Employé :</strong> {selectedCongeToClose.employeeName || (selectedCongeToClose.employee ? `${selectedCongeToClose.employee.nom} ${selectedCongeToClose.employee.prenom}` : '')}</div>
                <div><strong>Période initiale accordée :</strong> Du {formatDateFR(selectedCongeToClose.date_depart || selectedCongeToClose.dateDepart)} au {formatDateFR(selectedCongeToClose.date_retour || selectedCongeToClose.dateRetour)} ({selectedCongeToClose.nombre_jours || selectedCongeToClose.nombreJours} jours)</div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label" htmlFor="close-date-effective">
                  <Clock size={16} /> Date de retour effective (jj/mm/yyyy) *
                </label>
                <input
                  id="close-date-effective"
                  type="date"
                  className="form-input"
                  value={closeActualReturnDate}
                  onChange={(e) => setCloseActualReturnDate(e.target.value)}
                  required
                />
              </div>

              {/* Dynamic Calculation Preview */}
              {closeActualReturnDate && (
                <div style={styles.calculationPreviewBox}>
                  <div style={styles.previewRow}>
                    <span>Jours initialement accordés :</span>
                    <strong>{selectedCongeToClose.nombre_jours || selectedCongeToClose.nombreJours} jours</strong>
                  </div>
                  <div style={styles.previewRow}>
                    <span>Jours réellement consommés :</span>
                    <strong>{Math.max(1, Math.ceil((new Date(closeActualReturnDate) - new Date(selectedCongeToClose.date_depart || selectedCongeToClose.dateDepart)) / (1000 * 60 * 60 * 24)) + 1)} jours</strong>
                  </div>
                  <hr style={{ margin: '0.5rem 0', borderColor: 'var(--border)' }} />
                  <div style={styles.previewRowHighlight}>
                    <span>Jours restitués au solde :</span>
                    <strong style={{ color: 'var(--primary-dark)', fontSize: '1.05rem' }}>
                      +{Math.max(0, (selectedCongeToClose.nombre_jours || selectedCongeToClose.nombreJours) - (Math.ceil((new Date(closeActualReturnDate) - new Date(selectedCongeToClose.date_depart || selectedCongeToClose.dateDepart)) / (1000 * 60 * 60 * 24)) + 1))} jours
                    </strong>
                  </div>
                </div>
              )}

              <div style={styles.modalFooterActions}>
                <button
                  id="close-modal-cancel-btn"
                  type="button"
                  onClick={() => setSelectedCongeToClose(null)}
                  className="btn btn-secondary"
                  disabled={closeSubmitting}
                >
                  Annuler
                </button>
                <button
                  id="close-modal-confirm-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={closeSubmitting}
                >
                  {closeSubmitting ? 'Enregistrement...' : 'Confirmer la clôture'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

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
    gap: '1rem',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '1.5rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  kpiCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '1.25rem 1.5rem',
  },
  kpiIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  kpiVal: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginTop: '0.2rem',
  },
  quickActionsCard: {
    padding: '1.5rem 2rem',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    marginBottom: '1rem',
    color: 'var(--text-primary)',
  },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%',
  },
  actionBtnIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-light)',
    color: 'var(--primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '0.1rem',
    '& strong': {
      fontSize: '0.9rem',
      color: 'var(--text-primary)',
    },
    '& span': {
      fontSize: '0.75rem',
      color: 'var(--text-muted)',
    }
  },
  arrow: {
    color: 'var(--text-muted)',
    transition: 'transform 0.2s ease',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem',
  },
  activityColumn: {
    padding: '1.5rem',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0.5rem',
  },
  columnTitle: {
    fontSize: '1.05rem',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--background)',
    border: '1px solid var(--border)',
    transition: 'var(--transition)',
  },
  listItemText: {
    display: 'flex',
    flexDirection: 'column',
  },
  listItemName: {
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
  },
  listItemDetail: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  downloadIconBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--surface)',
    color: 'var(--primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s ease',
  },
  emptyText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '1rem 0',
  },
  historyCard: {
    padding: '1.5rem 2rem',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  sectionSubtitle: {
    fontSize: '0.825rem',
    color: 'var(--text-muted)',
    marginTop: '-0.5rem',
    marginBottom: '0.5rem',
  },
  searchForm: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  searchInputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '0.75rem',
    color: 'var(--text-muted)',
  },
  historySearchInput: {
    paddingLeft: '2.5rem',
    paddingRight: '1rem',
    height: '42px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    color: 'var(--text-primary)',
    width: '260px',
    fontSize: '0.875rem',
  },
  searchErrorBox: {
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
  },
  historyResultContainer: {
    marginTop: '1.25rem',
    borderTop: '1px solid var(--border)',
    paddingTop: '1.25rem',
  },
  employeeBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
    padding: '1.25rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--background)',
    border: '1px solid var(--border)',
  },
  employeeMetaGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  empAvatarBig: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '1.25rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empNameBig: {
    fontSize: '1.15rem',
    color: 'var(--text-primary)',
    margin: 0,
  },
  empTagsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.25rem',
    flexWrap: 'wrap',
  },
  empTagText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  leaveBalanceCounters: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  counterBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.6rem 1.25rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    minWidth: '95px',
  },
  counterLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  counterValue: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginTop: '0.1rem',
  },
  tableTitle: {
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
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
  tableBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.65rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--primary-light)',
    backgroundColor: 'var(--primary-light)',
    color: 'var(--primary-dark)',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.75rem',
  },
  closeActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.65rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    color: '#0284c7',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.75rem',
  },
  toastNotification: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1.25rem',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-md)',
    zIndex: 999,
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
  modalInfoBox: {
    backgroundColor: 'var(--background)',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  calculationPreviewBox: {
    marginTop: '1rem',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(75, 149, 58, 0.08)',
    border: '1px solid var(--primary-light)',
    fontSize: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
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
export { styles };
