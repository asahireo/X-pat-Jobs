
import React from 'react';
import { useTranslation } from '../context/LanguageContext';

const SplashScreen: React.FC<{ isFading: boolean }> = ({ isFading }) => {
    const { t } = useTranslation();
    return (
        <div className={`fixed inset-0 bg-dark-navy flex flex-col items-center justify-center z-50 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center animate-fade-in-scale-up">
                <p className="text-2xl text-cream mb-4">{t('splash_welcome')}</p>
                <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-off-white to-secondary-blue text-transparent bg-clip-text">
                    X'PAT JOBS
                </h1>
            </div>
            <style>{`
                @keyframes fade-in-scale-up {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale-up {
                    animation: fade-in-scale-up 0.8s ease-out;
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;