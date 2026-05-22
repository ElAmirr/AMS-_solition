import React, { useState, useEffect } from 'react';
import { getMachines } from '../api/machineService';
import { getJigs } from '../api/jigService';
import { getReasons } from '../api/reasonService';
import { createAdjustment } from '../api/adjustmentService';
import { Send } from 'lucide-react';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        background: 'rgba(255, 255, 255, 0.05)',
        color: '#fff',
        boxShadow: state.isFocused ? '0 0 0 1px var(--primary)' : 'none',
        borderColor: 'var(--primary)',
    }),
    singleValue: (base) => ({
        ...base,
        color: '#000000ff'
    }),
    input: (base) => ({
        ...base,
        color: '#000000ff'
    }),
    placeholder: (base) => ({
        ...base,
        color: 'var(--text-muted)'
    }),
    menu: (base) => ({
        ...base,
        background: 'rgba(39, 47, 155, 0.18)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        zIndex: 10000
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    menuList: (base) => ({
        ...base,
        '::-webkit-scrollbar': {
            display: 'none'
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
    }),
    option: (base, state) => ({
        ...base,
        background: state.isFocused ? 'rgba(39, 47, 155, 0.18)' : 'transparent',
        color: '#000000ff',
        cursor: 'pointer',
        '&:active': {
            background: 'var(--primary-hover)'
        }
    })
};

const AdjustmentForm = ({ user, onCreated }) => {
    const { t } = useLanguage();
    const [machines, setMachines] = useState([]);
    const [jigs, setJigs] = useState([]);
    const [reasons, setReasons] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [formData, setFormData] = useState({
        machine_id: '',
        jig_id: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [m, j, r] = await Promise.all([getMachines(), getJigs(), getReasons()]);
                setMachines(m);
                setJigs(j);
                setReasons(r);
            } catch (err) {
                console.error('Error fetching data for form', err);
            }
        };
        fetchData();
    }, []);

    // Group reasons by category
    const groupedReasons = reasons.reduce((acc, r) => {
        const cat = r.category || 'Autres';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    const categories = Object.keys(groupedReasons).sort();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createAdjustment({
                ...formData,
                requested_by: user?.user_name || 'System'
            });
            setFormData({ ...formData, reason: '' });
            setSelectedCategory('');
            if (onCreated) onCreated();
            alert(t('interventionSubmitted'));
        } catch (err) {
            alert(t('submitError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3>{t('newInterventionRequest')}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                    <Select
                        options={machines.map(m => ({ value: m.machine_id, label: m.machine_name }))}
                        value={machines.map(m => ({ value: m.machine_id, label: m.machine_name })).find(o => o.value == formData.machine_id) || null}
                        onChange={(sel) => setFormData({ ...formData, machine_id: sel ? sel.value : '' })}
                        styles={customSelectStyles}
                        placeholder={t('searchMachine')}
                        isClearable
                        menuPortalTarget={document.body}
                    />
                </div>
                <div>
                    <Select
                        options={jigs.map(j => ({ value: j.jig_id, label: `${j.jig_identification} - ${j.program}` }))}
                        value={jigs.map(j => ({ value: j.jig_id, label: `${j.jig_identification} - ${j.program}` })).find(o => o.value == formData.jig_id) || null}
                        onChange={(sel) => setFormData({ ...formData, jig_id: sel ? sel.value : '' })}
                        styles={customSelectStyles}
                        placeholder={t('searchJigProgram')}
                        isClearable
                        menuPortalTarget={document.body}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <Select
                            options={categories.map(cat => ({ value: cat, label: cat }))}
                            value={categories.map(cat => ({ value: cat, label: cat })).find(o => o.value == selectedCategory) || null}
                            onChange={(sel) => {
                                const cat = sel ? sel.value : '';
                                setSelectedCategory(cat);
                                const items = groupedReasons[cat] || [];
                                if (items.length === 1) {
                                    setFormData({ ...formData, reason: `${cat} - ${items[0].reason_label}` });
                                } else {
                                    setFormData({ ...formData, reason: '' });
                                }
                            }}
                            styles={customSelectStyles}
                            placeholder={t('selectCategory')}
                            isClearable
                            menuPortalTarget={document.body}
                        />
                    </div>
                    {selectedCategory && groupedReasons[selectedCategory]?.length > 1 && (
                        <div className="fade-in">
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('detailDirection')}</label>
                            <Select
                                options={groupedReasons[selectedCategory].map(r => ({ value: `${selectedCategory} - ${r.reason_label}`, label: r.reason_label }))}
                                value={groupedReasons[selectedCategory].map(r => ({ value: `${selectedCategory} - ${r.reason_label}`, label: r.reason_label })).find(o => o.value == formData.reason) || null}
                                onChange={(sel) => setFormData({ ...formData, reason: sel ? sel.value : '' })}
                                styles={customSelectStyles}
                                placeholder={t('selectDetail')}
                                isClearable
                                menuPortalTarget={document.body}
                            />
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="btn-primary" disabled={loading || !formData.reason || !formData.machine_id || !formData.jig_id} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Send size={18} />
                        {loading ? t('submitting') : t('submitRequest')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdjustmentForm;