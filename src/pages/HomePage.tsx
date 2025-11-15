import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Language } from '../context/LanguageContext';

const Icon = ({ path, className = 'w-10 h-10' }: { path: string; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d={path} />
    </svg>
);

const portalLinkData = [
    { 
        to: '/jobs', 
        titleKey: 'home_card_find_title', 
        descriptionKey: 'home_card_find_desc',
        iconPath: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
        gradient: 'from-blue-500 to-primary-blue'
    },
    { 
        to: '/create-profile', 
        titleKey: 'home_card_create_title', 
        descriptionKey: 'home_card_create_desc',
        iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM17 13h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',
        gradient: 'from-green-500 to-success'
    },
    { 
        to: '/requests', 
        titleKey: 'home_card_requests_title', 
        descriptionKey: 'home_card_requests_desc',
        iconPath: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
        gradient: 'from-amber-500 to-warning'
    },
];

const PortalCard: React.FC<{ to: string, title: string, description: string, iconPath: string, gradient: string }> = ({ to, title, description, iconPath, gradient }) => (
    <Link 
        to={to} 
        className={`bg-gradient-to-br ${gradient} p-6 rounded-2xl text-white shadow-lg transform hover:-translate-y-2 transition-transform duration-300 flex flex-col`}
    >
        <div className="mb-4"><Icon path={iconPath} /></div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm opacity-90 flex-grow">{description}</p>
    </Link>
);


export default function HomePage() {
    const { t, lang, setLang } = useTranslation();

    const changeLanguage = (newLang: Language) => {
        setLang(newLang);
    };

    return (
        <div className="space-y-8">
            <div className="text-center p-8 bg-dark-navy/50 backdrop-blur-sm rounded-2xl border border-cream/10">
                <span className="text-4xl">💼</span>
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-off-white to-secondary-blue text-transparent bg-clip-text mt-2 mb-2">{t('home_welcome_title')}</h1>
                <p className="text-lg text-cream">{t('home_welcome_subtitle')}</p>
                 <div className="mt-6 flex justify-center">
                     <div className="flex items-center bg-mid-navy/50 rounded-full p-1">
                        {(['en', 'bn', 'ms'] as Language[]).map(l => (
                          <button 
                            key={l}
                            onClick={() => changeLanguage(l)}
                            className={`px-4 py-2 text-sm font-bold rounded-full transition-colors ${
                              lang === l ? 'bg-secondary-blue text-white' : 'text-cream hover:bg-secondary-blue/30'
                            }`}
                          >
                            {l === 'en' ? 'English' : l === 'bn' ? 'বাংলা' : 'Melayu'}
                          </button>
                        ))}
                      </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portalLinkData.map(link => (
                    <PortalCard 
                        key={link.to} 
                        to={link.to}
                        title={t(link.titleKey)}
                        description={t(link.descriptionKey)}
                        iconPath={link.iconPath}
                        gradient={link.gradient}
                    />
                ))}
            </div>
        </div>
    );
}
