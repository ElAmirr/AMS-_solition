import React, { useState, useEffect } from 'react';
import { getMachines, createMachine, updateMachine, deleteMachine } from '../api/machineService';
import { getJigs, createJig, updateJig, deleteJig } from '../api/jigService';
import { getReasons, createReason, updateReason, deleteReason } from '../api/reasonService';
import { getUsers, createUser, updateUser, deleteUser } from '../api/userService';
import { getAdjustments, deleteAdjustment } from '../api/adjustmentService';
import {
    getJigSolutions, createJigSolution, updateJigSolution, deleteJigSolution,
    getProgramSolutions, createProgramSolution, updateProgramSolution, deleteProgramSolution
} from '../api/solutionService';
import Modal from './Modal';
import { Trash2, Edit2, Plus, Users, Cpu, Layers, List, Settings, PenTool, Terminal } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const AdminDashboard = ({ refreshTrigger }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('machines');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    const tabs = [
        { id: 'machines', label: t('machines'), icon: <Cpu size={18} /> },
        { id: 'jigs', label: t('jigs'), icon: <Layers size={18} /> },
        { id: 'reasons', label: t('reasons'), icon: <List size={18} /> },
        { id: 'jig_solutions', label: t('jigSolutions'), icon: <PenTool size={18} /> },
        { id: 'program_solutions', label: t('programSolutions'), icon: <Terminal size={18} /> },
        { id: 'users', label: t('users'), icon: <Users size={18} /> },
        { id: 'adjustments', label: t('adjustments'), icon: <Settings size={18} /> }
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            let res;
            switch (activeTab) {
                case 'machines': res = await getMachines(); break;
                case 'jigs': res = await getJigs(); break;
                case 'reasons': res = await getReasons(); break;
                case 'jig_solutions': res = await getJigSolutions(); break;
                case 'program_solutions': res = await getProgramSolutions(); break;
                case 'users': res = await getUsers(); break;
                case 'adjustments': res = await getAdjustments(); break;
                default: res = [];
            }
            setData(res);
        } catch (err) {
            console.error('Error fetching admin data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, refreshTrigger]);

    const handleAdd = () => {
        setEditingItem(null);
        setFormData({});
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ ...item }); // Clone to avoid direct mutation
        setShowModal(true);
    };

    const handleDelete = async (item) => {
        if (!window.confirm(t('confirmDelete'))) return;
        const id = item.machine_id || item.jig_id || item.reason_id || item.user_id || item.adjustment_id || item.solution_for_jigs_id || item.solution_for_program_id;
        try {
            switch (activeTab) {
                case 'machines': await deleteMachine(id); break;
                case 'jigs': await deleteJig(id); break;
                case 'reasons': await deleteReason(id); break;
                case 'jig_solutions': await deleteJigSolution(id); break;
                case 'program_solutions': await deleteProgramSolution(id); break;
                case 'users': await deleteUser(id); break;
                case 'adjustments': await deleteAdjustment(id); break;
            }
            fetchData();
        } catch (err) {
            alert(t('errorDeleting'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const id = editingItem.machine_id || editingItem.jig_id || editingItem.reason_id || editingItem.user_id || editingItem.solution_for_jigs_id || editingItem.solution_for_program_id;
                switch (activeTab) {
                    case 'machines': await updateMachine(id, formData); break;
                    case 'jigs': await updateJig(id, formData); break;
                    case 'reasons': await updateReason(id, formData); break;
                    case 'jig_solutions': await updateJigSolution(id, formData); break;
                    case 'program_solutions': await updateProgramSolution(id, formData); break;
                    case 'users': await updateUser(id, formData); break;
                }
            } else {
                switch (activeTab) {
                    case 'machines': await createMachine(formData); break;
                    case 'jigs': await createJig(formData); break;
                    case 'reasons': await createReason(formData); break;
                    case 'jig_solutions': await createJigSolution(formData); break;
                    case 'program_solutions': await createProgramSolution(formData); break;
                    case 'users': await createUser(formData); break;
                }
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || t('errorSaving'));
        }
    };

    const renderTable = () => {
        if (loading) return <p>{t('loading')}...</p>;
        if (!data.length) return <p>{t('noDataFound')}</p>;

        const columns = {
            machines: [t('machine')],
            jigs: [t('identification'), t('program')],
            reasons: [t('category'), t('label')],
            jig_solutions: [t('jigSolution')],
            program_solutions: [t('programSolution')],
            users: [t('username'), t('role')],
            adjustments: [t('machine'), t('reason'), t('status'), t('date'), t('duration')]
        }[activeTab];

        const getDuration = (start, end) => {
            if (!start) return '-';
            const s = new Date(start);
            const e = end ? new Date(end) : new Date();
            const diffMs = e - s;
            if (diffMs < 0) return '-';
            const mins = Math.floor(diffMs / 60000);
            const hrs = Math.floor(mins / 60);
            const remMins = mins % 60;
            return hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;
        };

        const getTranslatedStatus = (status) => {
            const map = {
                'OPEN': t('open'),
                'IN_PROGRESS': t('ongoing'),
                'CLOSED': t('close'),
                'CANCELLED': t('canceled')
            };
            return map[status] || status;
        };

        return (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {columns.map(c => <th key={c} style={{ padding: '1rem', textAlign: 'left' }}>{c}</th>)}
                            <th style={{ padding: '1rem', textAlign: 'right' }}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                {activeTab === 'machines' && (
                                    <td style={{ padding: '1rem' }}>{item.machine_name}</td>
                                )}
                                {activeTab === 'jigs' && (
                                    <>
                                        <td style={{ padding: '1rem' }}>{item.jig_identification}</td>
                                        <td style={{ padding: '1rem' }}>{item.program}</td>
                                    </>
                                )}
                                {activeTab === 'reasons' && (
                                    <>
                                        <td style={{ padding: '1rem' }}>{item.category}</td>
                                        <td style={{ padding: '1rem' }}>{item.reason_label}</td>
                                    </>
                                )}
                                {activeTab === 'jig_solutions' && (
                                    <td style={{ padding: '1rem' }}>{item.solution_for_jigs_label}</td>
                                )}
                                {activeTab === 'program_solutions' && (
                                    <td style={{ padding: '1rem' }}>{item.solution_for_program_label}</td>
                                )}
                                {activeTab === 'users' && (
                                    <>
                                        <td style={{ padding: '1rem' }}>{item.user_name}</td>
                                        <td style={{ padding: '1rem' }}>{item.role}</td>
                                    </>
                                )}
                                {activeTab === 'adjustments' && (
                                    <>
                                        <td style={{ padding: '1rem' }}>{item.machine_name}</td>
                                        <td style={{ padding: '1rem' }}>{item.reason}</td>
                                        <td style={{ padding: '1rem' }}>{getTranslatedStatus(item.adjustement_status)}</td>
                                        <td style={{ padding: '1rem' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{getDuration(item.started_at, item.ended_at)}</td>
                                    </>
                                )}
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        {activeTab !== 'adjustments' && (
                                            <button onClick={() => handleEdit(item)} className="btn-secondary" style={{ padding: '0.4rem' }}>
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(item)} className="btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderModalForm = () => {
        return (
            <form onSubmit={handleSubmit}>
                {activeTab === 'machines' && (
                    <div>
                        <label>{t('machine')} {t('label')}</label>
                        <input
                            required
                            value={formData.machine_name || ''}
                            onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
                        />
                    </div>
                )}
                {activeTab === 'reasons' && (
                    <>
                        <div>
                            <label>{t('category')}</label>
                            <input
                                required
                                placeholder={t('pattern')}
                                value={formData.category || ''}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>{t('label')}</label>
                            <input
                                required
                                value={formData.reason_label || ''}
                                onChange={(e) => setFormData({ ...formData, reason_label: e.target.value })}
                            />
                        </div>
                    </>
                )}
                {activeTab === 'jig_solutions' && (
                    <div>
                        <label>{t('jigSolution')} {t('label')}</label>
                        <input
                            required
                            value={formData.solution_for_jigs_label || ''}
                            onChange={(e) => setFormData({ ...formData, solution_for_jigs_label: e.target.value })}
                        />
                    </div>
                )}
                {activeTab === 'program_solutions' && (
                    <div>
                        <label>{t('programSolution')} {t('label')}</label>
                        <input
                            required
                            value={formData.solution_for_program_label || ''}
                            onChange={(e) => setFormData({ ...formData, solution_for_program_label: e.target.value })}
                        />
                    </div>
                )}
                {activeTab === 'users' && (
                    <>
                        <div>
                            <label>{t('username')}</label>
                            <input
                                required
                                value={formData.user_name || ''}
                                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>{t('password')} {editingItem && t('leaveBlank')}</label>
                            <input
                                type="password"
                                required={!editingItem}
                                value={formData.password || ''}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>{t('role')}</label>
                            <select
                                value={formData.role || 'PROCESS'}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="PROCESS">PROCESS</option>
                                <option value="SUPERVISOR">SUPERVISOR</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="MANAGER">MANAGER</option>
                            </select>
                        </div>
                    </>
                )}
                {activeTab === 'jigs' && (
                    <>
                        <div>
                            <label>{t('identification')}</label>
                            <input
                                required
                                value={formData.jig_identification || ''}
                                onChange={(e) => setFormData({ ...formData, jig_identification: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>{t('program')}</label>
                            <input
                                required
                                value={formData.program || ''}
                                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                            />
                        </div>
                    </>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>{t('cancel')}</button>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingItem ? t('edit') : t('addNew')}</button>
                </div>
            </form>
        );
    };

    return (
        <div className="fade-in">
            <div className="glass" style={{ padding: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="glass" style={{
                padding: '1.5rem 2rem',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderBottom: '1px solid var(--border)'
            }}>
                <h2 style={{ margin: 0 }}>{t('manage')} {tabs.find(t => t.id === activeTab).label}</h2>
                {activeTab !== 'adjustments' && (
                    <button className="btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> {t('addNew')}
                    </button>
                )}
            </div>
            <div className="glass" style={{
                padding: '0 2rem 2rem 2rem',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderTop: 'none'
            }}>
                {renderTable()}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingItem ? `${t('edit')} ${activeTab.slice(0, -1)}` : `${t('addNew')} ${activeTab.slice(0, -1)}`}
            >
                {renderModalForm()}
            </Modal>
        </div >
    );
};

export default AdminDashboard;
