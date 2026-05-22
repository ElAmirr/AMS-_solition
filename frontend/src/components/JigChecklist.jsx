import React, { useState, useEffect } from 'react';
import { getJigs } from '../api/jigService';
import { saveChecklist } from '../api/checklistService';
import { FileDown, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const JigChecklist = ({ user, refreshTrigger }) => {
    const { t } = useLanguage();
    const [jigs, setJigs] = useState([]);
    const [selectedJig, setSelectedJig] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const initialItems = [
        { element: t('handleVerification'), status: '' },
        { element: t('pegPresenceVerification'), status: '' },
        { element: t('pegFixationVerification'), status: '' },
        { element: t('boltTightnessVerification'), status: '' }
    ];

    const [items, setItems] = useState(initialItems);

    useEffect(() => {
        const fetchJigs = async () => {
            setLoading(true);
            try {
                const data = await getJigs();
                setJigs(data);
            } catch (err) {
                console.error('Error fetching jigs', err);
            } finally {
                setLoading(false);
            }
        };
        fetchJigs();
    }, [refreshTrigger]);

    // Effect to update items when language changes (since t() is used in initialItems)
    useEffect(() => {
        setItems(prevItems => prevItems.map((item, idx) => ({
            ...item,
            element: initialItems[idx].element
        })));
    }, [t]);

    const handleStatusChange = (index, status) => {
        const newItems = [...items];
        newItems[index].status = status;
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Ensure all items have a status
        if (items.some(item => !item.status)) {
            alert(t('completeAllItems'));
            return;
        }

        setSubmitting(true);
        try {
            const data = {
                jig_id: selectedJig,
                audited_by: user?.user_name || 'Anonymous',
                items: items
            };

            const blob = await saveChecklist(data);

            // Trigger download
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            const jigName = jigs.find(j => j.jig_id === parseInt(selectedJig))?.jig_identification || 'jig';
            link.setAttribute('download', `checklist_${jigName}_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Reset form
            setSelectedJig('');
            setItems(initialItems);
            alert(t('checklistSubmitted'));
        } catch (err) {
            console.error('Error submitting checklist', err);
            alert(t('checklistError'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>{t('loading')}...</div>;

    return (
        <div className="fade-in">
            <div className="glass" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '12px' }}>
                        <FileDown size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0 }}>{t('jigPeriodicChecklist')}</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('completeVerification')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('selectJig')}</label>
                        <select
                            required
                            value={selectedJig}
                            onChange={(e) => setSelectedJig(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                        >
                            <option value="">{t('chooseJig')}</option>
                            {jigs.map(j => (
                                <option key={j.jig_id} value={j.jig_id}>
                                    {j.jig_identification} - {j.program}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {items.map((item, index) => (
                            <div key={index} className="glass" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ fontWeight: 500, flex: 1 }}>{item.element}</div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {['OK', 'NOK', 'NA'].map(status => (
                                        <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name={`status-${index}`}
                                                value={status}
                                                checked={item.status === status}
                                                onChange={() => handleStatusChange(index, status)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: item.status === status ?
                                                    (status === 'OK' ? 'var(--accent)' : status === 'NOK' ? 'var(--danger)' : 'var(--text-muted)') :
                                                    'inherit'
                                            }}>
                                                {status}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Info size={18} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {t('auditedBy')}: <strong>{user?.user_name || 'Anonymous'}</strong> {t('on')} {new Date().toLocaleDateString()}
                        </span>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={submitting}
                        style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                    >
                        {submitting ? t('generatingReport') : (
                            <>
                                <CheckCircle2 size={20} />
                                {t('submitGenerateExcel')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JigChecklist;
