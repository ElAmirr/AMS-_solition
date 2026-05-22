import React, { useState, useEffect } from 'react';
import { getAdjustments } from '../api/adjustmentService';
import { getMachines } from '../api/machineService';
import { getJigs } from '../api/jigService';
import { Activity, Clock, Wrench, AlertTriangle, User, FileText, CheckCircle, XCircle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';

const COLORS = ['#272e9b', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6'];

const formatDuration = (ms) => {
    if (!ms || isNaN(ms)) return '0h 0m';
    const MathAbs = Math.abs(ms);
    const mins = Math.floor(MathAbs / 60000);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
};

const ManagerDashboard = ({ refreshTrigger }) => {
    const { t } = useLanguage();
    const [adjustments, setAdjustments] = useState([]);
    const [machines, setMachines] = useState([]);
    const [jigs, setJigs] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentDate = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [adjData, machData, jigData] = await Promise.all([
                    getAdjustments(),
                    getMachines(),
                    getJigs()
                ]);
                setAdjustments(adjData);
                setMachines(machData);
                setJigs(jigData);
            } catch (err) {
                console.error('Error fetching data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshTrigger]);

    const filteredAdjs = adjustments.filter(adj => {
        const d = new Date(adj.created_at);
        const s = new Date(startDate);
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        return d >= s && d <= e;
    });

    let rhInterventions = 0;
    let fhInterventions = 0;
    let rhDowntimeMs = 0;
    let fhDowntimeMs = 0;
    let rhRepairTimeMs = 0;
    let fhRepairTimeMs = 0;
    let closedCountForMTTR = 0;
    let rhClosedCount = 0;
    let fhClosedCount = 0;

    const reporterCounts = {};
    const machineStats = {};
    const jigStats = {};
    const reasonStatsObj = {};

    filteredAdjs.forEach(adj => {
        const rep = adj.requested_by || 'Unknown';
        reporterCounts[rep] = (reporterCounts[rep] || 0) + 1;

        let downtime = 0;
        if (adj.adjustement_status === 'CLOSED' && adj.ended_at && adj.created_at) {
            downtime = new Date(adj.ended_at) - new Date(adj.created_at);

            if (adj.started_at) {
                const repairTime = new Date(adj.ended_at) - new Date(adj.started_at);
                closedCountForMTTR++;

                const mInner = machines.find(mac => String(mac.machine_id) === String(adj.machine_id));
                if (mInner) {
                    if (mInner.machine_name.includes('RH')) { rhRepairTimeMs += repairTime; rhClosedCount++; }
                    if (mInner.machine_name.includes('FH')) { fhRepairTimeMs += repairTime; fhClosedCount++; }
                }
            }
        }

        const mid = adj.machine_id;
        if (!machineStats[mid]) machineStats[mid] = { count: 0, downtime: 0 };
        machineStats[mid].count++;
        machineStats[mid].downtime += downtime;

        const jid = adj.jig_id;
        if (!jigStats[jid]) jigStats[jid] = { count: 0, downtime: 0 };
        jigStats[jid].count++;
        jigStats[jid].downtime += downtime;

        // Custom chart calculations
        const m = machines.find(mac => String(mac.machine_id) === String(adj.machine_id));
        const isRH = m && m.machine_name.includes('RH');
        const isFH = m && m.machine_name.includes('FH');

        if (isRH) {
            rhInterventions++;
            rhDowntimeMs += downtime;
        } else if (isFH) {
            fhInterventions++;
            fhDowntimeMs += downtime;
        }

        // Reasons breakdown (Valid only for CLOSED - not cancelled)
        if (adj.adjustement_status === 'CLOSED') {
            const r = adj.reason || 'Unknown';
            if (!reasonStatsObj[r]) reasonStatsObj[r] = { name: r, count: 0, downtime: 0 };
            reasonStatsObj[r].count++;
            reasonStatsObj[r].downtime += downtime;
        }
    });

    const totalRepairTimeMs = rhRepairTimeMs + fhRepairTimeMs;
    const totalDowntimeMs = rhDowntimeMs + fhDowntimeMs;
    const totalReports = filteredAdjs.length;
    const acceptedReports = filteredAdjs.filter(a => a.adjustement_status === 'CLOSED').length;
    const cancelledReports = filteredAdjs.filter(a => a.adjustement_status === 'CANCELLED').length;
    const mttrMs = closedCountForMTTR > 0 ? totalRepairTimeMs / closedCountForMTTR : 0;
    const mttrRH = rhClosedCount > 0 ? rhRepairTimeMs / rhClosedCount : 0;
    const mttrFH = fhClosedCount > 0 ? fhRepairTimeMs / fhClosedCount : 0;

    const periodHours = Math.max(1, (new Date(endDate) - new Date(startDate)) / 3600000);
    const totalMachines = machines.length || 1;
    const totalRHMachines = machines.filter(m => m.machine_name.includes('RH')).length || 1;
    const totalFHMachines = machines.filter(m => m.machine_name.includes('FH')).length || 1;

    const totalPotentialUptimeMs = (periodHours * totalMachines * 3600000);
    const estimatedUptimeMs = totalPotentialUptimeMs > totalDowntimeMs ? totalPotentialUptimeMs - totalDowntimeMs : 0;
    const mtbfMs = filteredAdjs.length > 0 ? estimatedUptimeMs / filteredAdjs.length : estimatedUptimeMs;

    const potUpRH = (periodHours * totalRHMachines * 3600000);
    const estUpRH = potUpRH > rhDowntimeMs ? potUpRH - rhDowntimeMs : 0;
    const mtbfRH = rhInterventions > 0 ? estUpRH / rhInterventions : estUpRH;

    const potUpFH = (periodHours * totalFHMachines * 3600000);
    const estUpFH = potUpFH > fhDowntimeMs ? potUpFH - fhDowntimeMs : 0;
    const mtbfFH = fhInterventions > 0 ? estUpFH / fhInterventions : estUpFH;

    const topProcess = Object.entries(reporterCounts).sort((a, b) => b[1] - a[1]);
    const topReporter = topProcess.length > 0 ? topProcess[0] : ['-', 0];

    const sortedMachines = Object.entries(machineStats)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([id, stats]) => {
            const m = machines.find(mac => String(mac.machine_id) === String(id));
            return { name: m ? m.machine_name : `Machine ${id}`, ...stats };
        }).slice(0, 5);

    const sortedJigs = Object.entries(jigStats)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([id, stats]) => {
            const j = jigs.find(jig => String(jig.jig_id) === String(id));
            return { name: j ? `${j.jig_identification} (${j.program})` : `Jig ${id}`, ...stats };
        }).slice(0, 5);

    const machineTypeData = [
        { name: t('rhMachines'), interventions: rhInterventions, downtimeHrs: Number((rhDowntimeMs / 3600000).toFixed(2)) },
        { name: t('fhMachines'), interventions: fhInterventions, downtimeHrs: Number((fhDowntimeMs / 3600000).toFixed(2)) }
    ];

    const reasonBarData = Object.values(reasonStatsObj)
        .map(r => ({ ...r, downtimeHrs: Number((r.downtime / 3600000).toFixed(2)) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const mttrData = [
        { name: t('rhMachines'), MTTR: Number((mttrRH / 3600000).toFixed(2)) },
        { name: t('fhMachines'), MTTR: Number((mttrFH / 3600000).toFixed(2)) }
    ];

    const mtbfData = [
        { name: t('rhMachines'), MTBF: Number((mtbfRH / 3600000).toFixed(2)) },
        { name: t('fhMachines'), MTBF: Number((mtbfFH / 3600000).toFixed(2)) }
    ];

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>{t('loading')}</div>;

    return (
        <div className="fade-in">
            <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={24} /> {t('managerAnalytics')}
                </h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('startDate')}</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '0.4rem', marginTop: '0.2rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('endDate')}</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '0.4rem', marginTop: '0.2rem' }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('mttr')}</span>
                        <Wrench size={20} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-main)' }}>
                        {formatDuration(mttrMs)}
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('mtbf')}</span>
                        <Clock size={20} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-main)' }}>
                        {formatDuration(mtbfMs)}
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('totalReports')}</span>
                        <FileText size={20} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-main)' }}>
                        {totalReports}
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('acceptedSolved')}</span>
                        <CheckCircle size={20} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--accent)' }}>
                        {acceptedReports}
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('cancelledFake')}</span>
                        <XCircle size={20} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--danger)' }}>
                        {cancelledReports}
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('periodDowntime')}</span>
                        <AlertTriangle size={20} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-main)' }}>
                        {formatDuration(totalDowntimeMs)}
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('topReporter')}</span>
                        <User size={20} />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-main)' }}>
                        {topReporter[0]} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({topReporter[1]} {t('logs')})</span>
                    </div>
                </div>
            </div>

            {/* Custom Bar Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div className="glass" style={{ padding: '1.5rem', minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem' }}>{t('interventionsByMachineType')}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={machineTypeData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} allowDecimals={false} />
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)' }} />
                            <Bar dataKey="interventions" name={t('interventions')} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass" style={{ padding: '1.5rem', minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem' }}>{t('downtimeByMachineType')}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={machineTypeData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)' }} />
                            <Bar dataKey="downtimeHrs" name={t('downtimeH')} fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div className="glass" style={{ padding: '1.5rem', minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem' }}>{t('reasonFrequency')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reasonBarData} layout="vertical" margin={{ left: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={120} />
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)' }} />
                            <Bar dataKey="count" name={t('frequency')} fill={COLORS[4]} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass" style={{ padding: '1.5rem', minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem' }}>{t('reasonDowntime')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reasonBarData} layout="vertical" margin={{ left: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={120} />
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)' }} />
                            <Bar dataKey="downtimeHrs" name={t('totalTime')} fill={COLORS[3]} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div className="glass" style={{ padding: '1.5rem', minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem' }}>{t('mttrComparison')}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={mttrData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)' }} />
                            <Bar dataKey="MTTR" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass" style={{ padding: '1.5rem', minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem' }}>{t('mtbfComparison')}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={mtbfData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)' }} />
                            <Bar dataKey="MTBF" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                        {t('mostProblematicMachines')}
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <th style={{ paddingBottom: '0.5rem' }}>{t('machine')}</th>
                                <th style={{ paddingBottom: '0.5rem' }}>{t('faults')}</th>
                                <th style={{ paddingBottom: '0.5rem' }}>{t('downtime')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMachines.map((m, i) => (
                                <tr key={i} style={{ borderBottom: i !== sortedMachines.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <td style={{ padding: '0.8rem 0', fontWeight: 500 }}>{m.name}</td>
                                    <td style={{ padding: '0.8rem 0' }}><span className="badge badge-cancelled">{m.count}</span></td>
                                    <td style={{ padding: '0.8rem 0', color: 'var(--danger)', fontWeight: 600 }}>{formatDuration(m.downtime)}</td>
                                </tr>
                            ))}
                            {sortedMachines.length === 0 && <tr><td colSpan="3" style={{ padding: '1rem 0' }}>{t('noFaults')}</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="glass" style={{ padding: '1.5rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                        {t('mostProblematicJigs')}
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <th style={{ paddingBottom: '0.5rem' }}>{t('jigProgram')}</th>
                                <th style={{ paddingBottom: '0.5rem' }}>{t('faults')}</th>
                                <th style={{ paddingBottom: '0.5rem' }}>{t('downtime')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedJigs.map((j, i) => (
                                <tr key={i} style={{ borderBottom: i !== sortedJigs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <td style={{ padding: '0.8rem 0', fontWeight: 500 }}>{j.name}</td>
                                    <td style={{ padding: '0.8rem 0' }}><span className="badge badge-cancelled">{j.count}</span></td>
                                    <td style={{ padding: '0.8rem 0', color: 'var(--danger)', fontWeight: 600 }}>{formatDuration(j.downtime)}</td>
                                </tr>
                            ))}
                            {sortedJigs.length === 0 && <tr><td colSpan="3" style={{ padding: '1rem 0' }}>{t('noFaults')}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
