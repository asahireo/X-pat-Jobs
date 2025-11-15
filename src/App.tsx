
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';

// Import Language Context
import { LanguageProvider, useTranslation } from './context/LanguageContext';

// Import Pages
import HomePage from './pages/HomePage';
import JobBoardPage from './pages/JobBoardPage';
import CreateProfilePage from './pages/CreateProfilePage';
import JobSeekerRequestsPage from './pages/JobSeekerRequestsPage';
import EmployerRequestsPage from './pages/EmployerRequestsPage';
import RequestsPortalPage from './pages/RequestsPortalPage';
import SplashScreen from './pages/SplashScreen';
import { fetchActiveJobs } from './services/firebase';


// Helper to apply classes conditionally
const classNames = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// --- LAYOUT & NAVIGATION COMPONENTS ---

const Icon = ({ path, className = 'w-6 h-6' }: { path: string; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d={path} />
    </svg>
);

const iconPaths = {
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z",
    jobs: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    create: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM17 13h-4v4h-2v-4H7v-2h4V7h2v4h4v2z",
    requests: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
};


const BottomNavBar = () => {
    const { t } = useTranslation();

    const navLinks = [
      { to: '/', labelKey: 'nav_home', iconPath: iconPaths.home },
      { to: '/jobs', labelKey: 'nav_jobs', iconPath: iconPaths.jobs },
      { to: '/create-profile', labelKey: 'nav_create', iconPath: iconPaths.create },
      { to: '/requests', labelKey: 'nav_requests', iconPath: iconPaths.requests },
    ];
    
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-dark-navy/90 backdrop-blur-lg border-t border-cream/20 z-50">
            <div className="grid grid-cols-4 h-full max-w-lg mx-auto">
                {navLinks.map(({ to, labelKey, iconPath }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => classNames(
                            "flex flex-col items-center justify-center text-xs transition-colors duration-200",
                            isActive ? "text-secondary-blue" : "text-cream/70 hover:text-white"
                        )}
                    >
                        <Icon path={iconPath} />
                        <span className="mt-1">{t(labelKey)}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};


const AppLayout: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="min-h-screen text-off-white font-inter">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
            {children}
        </main>
        <BottomNavBar />
    </div>
);


const AppWithSplash = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Create two promises: one for the minimum display time, one for data fetching.
      const minDisplayPromise = new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
      const dataFetchPromise = fetchActiveJobs(); // Pre-load job data
      
      // Wait for both to complete
      await Promise.all([minDisplayPromise, dataFetchPromise]);
      
      // Start the fade-out animation, then remove the component
      setIsFading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // This duration should match the CSS fade-out animation
    };
    
    initializeApp();
  }, []);

  if (isLoading) {
      return <SplashScreen isFading={isFading} />;
  }
  
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobBoardPage />} />
          <Route path="/create-profile" element={<CreateProfilePage />} />
          <Route path="/requests" element={<RequestsPortalPage />} />
          <Route path="/my-requests" element={<JobSeekerRequestsPage />} />
          <Route path="/employer-requests" element={<EmployerRequestsPage />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppWithSplash />
    </LanguageProvider>
  );
}
