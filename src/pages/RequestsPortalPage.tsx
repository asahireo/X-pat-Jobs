import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

const Icon = ({ path, className = 'w-16 h-16' }: { path: string; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d={path} />
    </svg>
);

const roleLinkData = [
    {
        to: '/my-requests',
        titleKey: 'requests_portal_seeker_title',
        descriptionKey: 'requests_portal_seeker_desc',
        iconPath: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
        bg: 'bg-primary-blue/20'
    },
    {
        to: '/employer-requests',
        titleKey: 'requests_portal_employer_title',
        descriptionKey: 'requests_portal_employer_desc',
        iconPath: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
        bg: 'bg-secondary-blue/20'
    }
];

const RoleCard: React.FC<{ to: string, title: string, description: string, iconPath: string, bg: string }> = ({ to, title, description, iconPath, bg }) => (
    <Link
        to={to}
        className={`p-8 rounded-2xl text-center shadow-lg transform hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center ${bg}`}
    >
        <div className="text-secondary-blue mb-4">
            <Icon path={iconPath} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-cream">{description}</p>
    </Link>
);

export default function RequestsPortalPage() {
    const { t } = useTranslation();
    return (
        <div className="space-y-8 pb-24">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold mb-2">{t('requests_portal_title')}</h1>
                <p className="text-lg text-cream">{t('requests_portal_subtitle')}</p>
            </div>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {roleLinkData.map(link => (
                    <RoleCard 
                        key={link.to} 
                        to={link.to} 
                        title={t(link.titleKey)}
                        description={t(link.descriptionKey)}
                        iconPath={link.iconPath}
                        bg={link.bg}
                    />
                ))}
            </div>
        </div>
    );
}
