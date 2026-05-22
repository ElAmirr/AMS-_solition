import React, { useState } from 'react';
import { login, saveUser } from '../api/authService';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const LoginPage = ({ onLoginSuccess }) => {
    const { t } = useLanguage();
    const [user_name, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login({ user_name, password });
            saveUser(data.user);
            onLoginSuccess(data.user);
        } catch (err) {
            setError(err.response?.data?.error || t('loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-dark)'
        }}>
            <div className="glass" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '15px',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 0 20px rgba(39, 46, 155, 0.4)'
                    }}>
                        <Lock color="white" size={30} />
                    </div>
                    <h2 style={{ marginBottom: '0.5rem' }}>{t('amsSolution')}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{t('imsDescription')}</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--danger)',
                        color: 'var(--danger)',
                        padding: '1rem',
                        borderRadius: '10px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.9rem'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label>{t('username')}</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={user_name}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t('enterUsername')}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label>{t('password')}</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('enterPassword')}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                    >
                        {loading ? t('signingIn') : t('signIn')}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    © 2026 {t('processTeamDashboard')}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
