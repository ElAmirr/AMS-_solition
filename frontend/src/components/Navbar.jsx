import React from 'react';
import { Activity, ClipboardCheck, ListFilter, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const Navbar = ({ user, onLogout, currentView, onViewChange }) => {
    const showChecklist = user?.role === 'PROCESS' || user?.role === 'ADMIN';
    const { lang, t, toggleLang } = useLanguage();

    return (
        <nav className="glass" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo.svg" alt="forvia Logo" style={{ width: '100px', height: '60px', objectFit: 'contain' }} />
                </div>

                {showChecklist && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button
                            className={currentView === 'interventions' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => onViewChange('interventions')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                            <ListFilter size={16} />
                            {t('interventions')}
                        </button>
                        <button
                            className={currentView === 'checklist' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => onViewChange('checklist')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                            <ClipboardCheck size={16} />
                            {t('jigChecklist')}
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button
                    onClick={toggleLang}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                    title="Toggle Language"
                >
                    <Globe size={16} />
                    {lang === 'en' ? 'FR' : 'EN'}
                </button>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.user_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</span>
                </div>
                <button onClick={onLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>{t('logout')}</button>
            </div>
        </nav>
    );
};

export default Navbar;
