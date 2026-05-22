import React, { createContext, useContext, useState } from 'react';
import en from './en.json';
import fr from './fr.json';

const translations = { en, fr };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState('en');
    const t = (key) => translations[lang]?.[key] || key;
    const toggleLang = () => setLang(prev => prev === 'en' ? 'fr' : 'en');
    return (
        <LanguageContext.Provider value={{ lang, t, toggleLang }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
