import React, { useState, useEffect } from 'react';
import { getAdjustments, updateAdjustmentStatus } from '../api/adjustmentService';
import { getJigSolutions, getProgramSolutions } from '../api/solutionService';
import Modal from './Modal';
import { Play, CheckCircle, XCircle, User, AlertCircle, ToggleLeft, ToggleRight, Clock, Check, Settings2, Terminal } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const AdjustmentList = ({ refreshTrigger, user, role = 'SUPERVISOR' }) => {
    const { t } = useLanguage();
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Solutions data
    const [jigSolutions, setJigSolutions] = useState([]);
    const [programSolutions, setProgramSolutions] = useState([]);

    // Modal states
    const [activeAdj, setActiveAdj] = useState(null);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Form states
    const [solution, setSolution] = useState('');
    const [solutionComment, setSolutionComment] = useState('');
    const [solutionType, setSolutionType] = useState('JIG'); // 'JIG' or 'PROGRAM'
    const [cancelReason, setCancelReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [tick, setTick] = useState(0);
    const lastKnownIds = React.useRef(new Set());

    const playAlert = () => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, context.currentTime); // A4
            oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.1); // Slide up to A5

            gain.gain.setValueAtTime(0.1, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

            oscillator.connect(gain);
            gain.connect(context.destination);

            oscillator.start();
            oscillator.stop(context.currentTime + 0.5);
        } catch (e) {
            console.warn('Audio alert failed', e);
        }
    };

    const fetchData = async (isPoll = false) => {
        try {
            const [adjData, jigData, progData] = await Promise.all([
                getAdjustments(),
                getJigSolutions(),
                getProgramSolutions()
            ]);
            // Filter to show only today's interventions
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const filteredAdj = adjData.filter(adj => {
                const adjDate = new Date(adj.created_at);
                adjDate.setHours(0, 0, 0, 0);
                return adjDate.getTime() === today.getTime();
            });

            // Alerts logic for PROCESS role
            if (role === 'PROCESS') {
                const openAdjs = filteredAdj.filter(a => a.adjustement_status === 'OPEN');
                let foundNew = false;
                openAdjs.forEach(a => {
                    if (!lastKnownIds.current.has(a.adjustment_id)) {
                        foundNew = true;
                        lastKnownIds.current.add(a.adjustment_id);
                    }
                });

                if (foundNew && isPoll) {
                    playAlert();
                }
            }

            // Sync lastKnownIds with all current adjustments to avoid alerting on old ones
            filteredAdj.forEach(a => lastKnownIds.current.add(a.adjustment_id));

            setAdjustments(filteredAdj);
            setJigSolutions(jigData);
            setProgramSolutions(progData);
        } catch (err) {
            console.error('Error fetching data', err);
        } finally {
            if (!isPoll) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // High frequency polling for alerts (every 10s)
        const pollInterval = setInterval(() => fetchData(true), 10000);

        // Duration tick (every 60s)
        const tickInterval = setInterval(() => setTick(t => t + 1), 60000);

        return () => {
            clearInterval(pollInterval);
            clearInterval(tickInterval);
        };
    }, [refreshTrigger]);

    const handleUpdate = async (id, status, extraData = {}) => {
        setSubmitting(true);
        try {
            await updateAdjustmentStatus(id, { status, ...extraData });
            setShowCloseModal(false);
            setShowCancelModal(false);
            setSolution('');
            setSolutionComment('');
            setCancelReason('');
            fetchData();
        } catch (err) {
            alert(t('errorUpdatingStatus'));
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (adj) => {
        const status = adj.adjustement_status;
        const labelMap = {
            'OPEN': t('open'),
            'IN_PROGRESS': t('ongoing'),
            'CLOSED': t('close'),
            'CANCELLED': t('canceled')
        };

        const iconMap = {
            'OPEN': <AlertCircle size={14} />,
            'IN_PROGRESS': <Clock size={14} className="spin-slow" />,
            'CLOSED': <Check size={14} />,
            'CANCELLED': <XCircle size={14} />
        };

        const classMap = {
            'OPEN': 'badge-open',
            'IN_PROGRESS': 'badge-pending',
            'CLOSED': 'badge-solved',
            'CANCELLED': 'badge-cancelled'
        };

        const tooltip = status === 'CLOSED' ? (adj.solution || 'No solution logged') :
            status === 'CANCELLED' ? (adj.canceled_reason || 'No reason provided') : '';

        return (
            <span
                className={`badge ${classMap[status]}`}
                title={tooltip}
                style={{ cursor: tooltip ? 'help' : 'default' }}
            >
                {iconMap[status]}
                {labelMap[status] || status}
            </span>
        );
    };

    const getDuration = (adj) => {
        if (!adj.started_at) return '-';
        const start = new Date(adj.started_at);
        const end = adj.ended_at ? new Date(adj.ended_at) : new Date();
        const diffMs = end - start;
        if (diffMs < 0) return '-';

        const mins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(mins / 60);
        const remainingMins = mins % 60;

        if (hrs > 0) return `${hrs}h ${remainingMins}m`;
        return `${remainingMins}m`;
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>{t('loadingAdjustments')}</div>;

    return (
        <>
            <div className="glass fade-in" style={{ padding: '0.5rem' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '1rem' }}>{t('time')}</th>
                                <th style={{ padding: '1rem' }}>{t('machine')}</th>
                                <th style={{ padding: '1rem' }}>{t('jigProgram')}</th>
                                <th style={{ padding: '1rem' }}>{t('reason')}</th>
                                <th style={{ padding: '1rem' }}>{t('reporter')}</th>
                                <th style={{ padding: '1rem' }}>{t('duration')}</th>
                                <th style={{ padding: '1rem' }}>{t('status')}</th>
                                {role === 'PROCESS' && <th style={{ padding: '1rem' }}>{t('actions')}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {adjustments.map(adj => (
                                <tr key={adj.adjustment_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary)' }}>
                                        {new Date(adj.created_at).toLocaleTimeString([], {
                                            hour12: false,
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{adj.machine_name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>{adj.jig_identification}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{adj.program}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{adj.reason}</td>
                                    <td style={{ padding: '1rem' }}>{adj.requested_by}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{getDuration(adj)}</td>
                                    <td style={{ padding: '1rem' }}>{getStatusBadge(adj)}</td>
                                    {role === 'PROCESS' && (
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                {adj.adjustement_status === 'OPEN' && (
                                                    <button
                                                        className="btn-action btn-start"
                                                        onClick={() => handleUpdate(adj.adjustment_id, 'IN_PROGRESS', { solved_by: user?.user_name })}
                                                    >
                                                        <Play size={16} fill="white" />
                                                        {t('startIntervention')}
                                                    </button>
                                                )}
                                                {adj.adjustement_status === 'IN_PROGRESS' && (
                                                    <>
                                                        <button
                                                            className="btn-action btn-resolve"
                                                            onClick={() => { setActiveAdj(adj); setShowCloseModal(true); }}
                                                        >
                                                            <CheckCircle size={16} />
                                                            {t('close')}
                                                        </button>
                                                        <button
                                                            className="btn-action btn-cancel-action"
                                                            onClick={() => { setActiveAdj(adj); setShowCancelModal(true); }}
                                                        >
                                                            <XCircle size={16} />
                                                            {t('cancel')}
                                                        </button>
                                                    </>
                                                )}
                                                {adj.adjustement_status === 'CLOSED' && (
                                                    <div style={{ width: '120px', fontSize: '0.85rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                        <Check size={16} />
                                                        <span>{adj.solution}</span>
                                                    </div>
                                                )}
                                                {adj.adjustement_status === 'CANCELLED' && (
                                                    <div style={{ width: '120px', fontSize: '0.85rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                        <XCircle size={16} />
                                                        <span>{t('canceled')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div >

            {/* Close Intervention Modal */}
            <Modal
                isOpen={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                title={t('logSolution')}
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const fullSolution = solutionComment.trim() ? `${solution} (comment: ${solutionComment})` : solution;
                    handleUpdate(activeAdj.adjustment_id, 'CLOSED', { solution: fullSolution });
                }}>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>{t('selectPredefinedSolution')} {activeAdj?.machine_name}.</p>

                    <div className="segmented-control" style={{ marginBottom: '2rem' }}>
                        <div className={`segment-indicator ${solutionType === 'PROGRAM' ? 'right' : ''}`} />
                        <button
                            type="button"
                            className={`segment-btn ${solutionType === 'JIG' ? 'active' : ''}`}
                            onClick={() => { setSolutionType('JIG'); setSolution(''); }}
                        >
                            <Settings2 size={16} />
                            {t('jigSolution')}
                        </button>
                        <button
                            type="button"
                            className={`segment-btn ${solutionType === 'PROGRAM' ? 'active' : ''}`}
                            onClick={() => { setSolutionType('PROGRAM'); setSolution(''); }}
                        >
                            <Terminal size={16} />
                            {t('programSolution')}
                        </button>
                    </div>

                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{solutionType === 'JIG' ? t('selectJigIssue') : t('selectProgramIssue')}</label>
                    <select
                        required
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        style={{ marginBottom: '1.5rem' }}
                    >
                        <option value="">{t('chooseSolution')}</option>
                        {solutionType === 'JIG' ? (
                            jigSolutions.map(s => (
                                <option key={s.solution_for_jigs_id} value={s.solution_for_jigs_label}>
                                    {s.solution_for_jigs_label}
                                </option>
                            ))
                        ) : (
                            programSolutions.map(s => (
                                <option key={s.solution_for_program_id} value={s.solution_for_program_label}>
                                    {s.solution_for_program_label}
                                </option>
                            ))
                        )}
                    </select>

                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('additionalComment')}</label>
                    <input
                        type="text"
                        value={solutionComment}
                        onChange={(e) => setSolutionComment(e.target.value)}
                        placeholder={t('addMoreDetails')}
                    />

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCloseModal(false)}>{t('cancel')}</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting || !solution}>
                            {submitting ? t('saving') : t('completeIntervention')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Cancel Intervention Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title={t('cancelIntervention')}
            >
                <form onSubmit={(e) => { e.preventDefault(); handleUpdate(activeAdj.adjustment_id, 'CANCELLED', { canceled_reason: cancelReason }); }}>
                    <div style={{ display: 'flex', gap: '15px', color: 'var(--danger)', marginBottom: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={20} />
                        <span style={{ fontSize: '0.9rem' }}>{t('actionUndone')}</span>
                    </div>
                    <label>{t('cancellationReason')}</label>
                    <textarea
                        required
                        rows="4"
                        autoFocus
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder={t('whyCancelled')}
                    />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCancelModal(false)}>{t('back')}</button>
                        <button type="submit" className="btn-danger" style={{ flex: 1 }} disabled={submitting}>
                            {submitting ? t('processing') : t('cancelRequest')}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default AdjustmentList;
