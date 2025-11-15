import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { fetchActiveJobs, incrementJobViews, submitContactRequest, normalizePhone } from '../services/firebase';
import type { JobPost } from '../types';

const filterCategoryKeys = [
    'jobboard_filters_all', 'jobboard_filters_factory', 'jobboard_filters_restaurant', 
    'jobboard_filters_cleaner', 'jobboard_filters_construction', 'jobboard_filters_security', 
    'jobboard_filters_driver', 'jobboard_filters_technician', 'jobboard_filters_packing', 'jobboard_filters_general'
];

const getInitials = (name?: string) => {
    if (!name || name === 'Anonymous') return '👤';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatTimeAgo = (timestamp: number, t: (key: string) => string) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('Just now');
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
};

const getDaysUntilExpiry = (timestamp: number) => {
    const expiryDate = timestamp + 7 * 24 * 60 * 60 * 1000;
    const diff = expiryDate - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
};


const JobCard: React.FC<{ job: JobPost; onSelect: (job: JobPost) => void; }> = ({ job, onSelect }) => {
    const { t } = useTranslation();
    const daysLeft = getDaysUntilExpiry(job.timestamp);
    const isExpiring = daysLeft <= 2;

    return (
        <div 
            onClick={() => onSelect(job)}
            className="bg-dark-navy/70 backdrop-blur-md border border-[rgba(233,223,195,0.2)] rounded-2xl p-6 cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-primary-blue/30"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-blue to-secondary-blue rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
                        {getInitials(job.name)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-off-white">{job.name}</h3>
                        <p className="text-sm text-cream">{job.job}</p>
                    </div>
                </div>
                {isExpiring && (
                     <div className="bg-warning text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                        {t('jobboard_card_expires_in')} {daysLeft} {daysLeft !== 1 ? t('jobboard_card_days') : t('jobboard_card_day')}
                    </div>
                )}
            </div>
            
            <p className="text-cream text-sm mb-4 line-clamp-2"><strong>{t('jobboard_card_skills')}:</strong> {job.skills}</p>
            
            <div className="flex flex-wrap gap-2 text-xs mb-4">
                <span className="bg-secondary-blue/20 text-cream px-3 py-1 rounded-full">{job.age}</span>
                <span className="bg-secondary-blue/20 text-cream px-3 py-1 rounded-full">{job.nationality}</span>
                <span className="bg-secondary-blue/20 text-cream px-3 py-1 rounded-full">{job.location}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-cream/70 border-t border-cream/10 pt-3 mt-4">
                <span>👁️ {job.views || 0} {t('jobboard_card_views')}</span>
                <span>{formatTimeAgo(job.timestamp, t)}</span>
            </div>
        </div>
    );
};

const JobDetailModal: React.FC<{ job: JobPost | null; onClose: () => void; onRequestContact: (job: JobPost) => void; }> = ({ job, onClose, onRequestContact }) => {
    const { t } = useTranslation();
    if (!job) return null;
    const daysLeft = getDaysUntilExpiry(job.timestamp);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-mid-navy border border-cream/20 rounded-2xl w-full max-w-md p-6 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-cream hover:text-white text-2xl">&times;</button>
                
                <div className="text-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-blue to-secondary-blue rounded-full flex items-center justify-center text-4xl font-bold shadow-lg mx-auto mb-4">
                        {getInitials(job.name)}
                    </div>
                    <h2 className="text-3xl font-bold">{job.name}</h2>
                    <p className="text-lg text-secondary-blue">{job.job}</p>
                </div>

                <div className="space-y-3 text-sm text-cream">
                    <p><strong>{t('jobboard_detail_experience')}:</strong> {job.experience}</p>
                    <p><strong>{t('jobboard_card_skills')}:</strong> {job.skills}</p>
                    <p><strong>{t('jobboard_detail_location')}:</strong> {job.location}</p>
                    <p><strong>{t('jobboard_detail_nationality')}:</strong> {job.nationality}</p>
                    <p><strong>{t('jobboard_detail_visa')}:</strong> {job.visa}</p>
                </div>

                <div className="flex gap-4 my-6">
                    <div className="flex-1 text-center bg-dark-navy/50 p-3 rounded-lg"><div className="text-2xl font-bold">{job.views || 0}</div><div className="text-xs">{t('jobboard_detail_views')}</div></div>
                    <div className="flex-1 text-center bg-dark-navy/50 p-3 rounded-lg"><div className="text-2xl font-bold text-success">{daysLeft}</div><div className="text-xs">{t('jobboard_detail_days_left')}</div></div>
                </div>

                <button onClick={() => onRequestContact(job)} className="w-full bg-gradient-to-r from-primary-blue to-secondary-blue text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
                    {t('jobboard_detail_request_btn')}
                </button>
            </div>
             <style>{`
                @keyframes slide-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
            `}</style>
        </div>
    );
};

const ContactRequestModal: React.FC<{ job: JobPost | null; onClose: () => void; onSent: () => void; }> = ({ job, onClose, onSent }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSending, setIsSending] = useState(false);

    if (!job) return null;

    const handleSubmit = async () => {
        if (!name || !phone) {
            alert('Please fill in both fields.');
            return;
        }
        setIsSending(true);
        try {
            await submitContactRequest({
                jobId: job.id,
                jobSeekerName: job.name,
                employerName: name,
                employerPhone: phone,
                employerPhoneNormalized: normalizePhone(phone),
                timestamp: Date.now(),
                status: 'pending'
            });
            onSent();
        } catch (error) {
            console.error(error);
            alert('Failed to send request. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-mid-navy border border-cream/20 rounded-2xl w-full max-w-sm p-6 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                 <h2 className="text-2xl font-bold text-center mb-2">{t('jobboard_request_modal_title')}</h2>
                 <p className="text-center text-sm text-cream mb-6">{t('jobboard_request_modal_desc', {name: job.name})}</p>
                 <div className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('jobboard_request_modal_name_placeholder')} className="w-full bg-dark-navy/50 border border-cream/20 rounded-lg p-3 text-white placeholder-cream/50 focus:ring-2 focus:ring-secondary-blue focus:outline-none"/>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('jobboard_request_modal_phone_placeholder')} className="w-full bg-dark-navy/50 border border-cream/20 rounded-lg p-3 text-white placeholder-cream/50 focus:ring-2 focus:ring-secondary-blue focus:outline-none"/>
                 </div>
                 <div className="flex gap-4 mt-6">
                    <button onClick={onClose} className="flex-1 bg-cream/20 text-white font-bold py-3 rounded-lg hover:bg-cream/30 transition-colors">{t('jobboard_request_modal_cancel')}</button>
                    <button onClick={handleSubmit} disabled={isSending} className="flex-1 bg-success text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSending ? t('jobboard_request_modal_sending') : t('jobboard_request_modal_send')}
                    </button>
                 </div>
            </div>
        </div>
    );
};


export default function JobBoardPage() {
    const { t } = useTranslation();
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Jobs');
    
    const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    
    const filterCategories = useMemo(() => filterCategoryKeys.map(key => ({ key, label: t(key) })), [t]);

    useEffect(() => {
        const loadJobs = async () => {
            setLoading(true);
            try {
                const fetchedJobs = await fetchActiveJobs();
                setJobs(fetchedJobs);
            } catch (error) {
                console.error("Failed to fetch jobs:", error);
            } finally {
                setLoading(false);
            }
        };
        loadJobs();
    }, []);

    const filteredJobs = useMemo(() => {
        const translatedAllJobs = t('jobboard_filters_all');
        const translatedActiveFilter = filterCategories.find(c => c.key === activeFilter)?.label || activeFilter;
        
        return jobs.filter(job => {
            const matchesFilter = translatedActiveFilter === translatedAllJobs || job.job === translatedActiveFilter;
            const matchesSearch = searchTerm === '' || 
                job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.skills.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.nationality.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [jobs, activeFilter, searchTerm, t, filterCategories]);


    const handleSelectJob = (job: JobPost) => {
        setSelectedJob(job);
        incrementJobViews(job.id);
        setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? {...j, views: (j.views || 0) + 1} : j));
    };
    
    const handleRequestContact = (job: JobPost) => {
        setSelectedJob(job);
        setIsRequestModalOpen(true);
    };

    const handleRequestSent = () => {
        setIsRequestModalOpen(false);
        setSelectedJob(null);
        setToastMessage(t('jobboard_toast_success'));
        setTimeout(() => setToastMessage(''), 3000);
    };
    
    const stats = useMemo(() => ({
        total: jobs.length,
        newToday: jobs.filter(j => new Date(j.timestamp).toDateString() === new Date().toDateString()).length,
    }), [jobs]);

    return (
        <div className="space-y-8 pb-24">
            {toastMessage && (
                <div className="fixed bottom-24 right-5 bg-success text-white py-3 px-5 rounded-lg shadow-lg animate-slide-up">
                    {toastMessage}
                </div>
            )}
            
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} onRequestContact={handleRequestContact} />
            <ContactRequestModal job={selectedJob && isRequestModalOpen ? selectedJob : null} onClose={() => setIsRequestModalOpen(false)} onSent={handleRequestSent}/>

            <div className="text-center p-8 bg-dark-navy/50 backdrop-blur-sm rounded-2xl border border-cream/10">
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-off-white to-secondary-blue text-transparent bg-clip-text mb-2">{t('jobboard_title')}</h1>
                <p className="text-lg text-cream">{t('jobboard_subtitle')}</p>
                <div className="flex justify-center gap-4 mt-6">
                    <div className="bg-secondary-blue/20 p-4 rounded-lg"><div className="text-3xl font-bold">{stats.total}</div><div className="text-xs">{t('jobboard_stat_profiles')}</div></div>
                    <div className="bg-secondary-blue/20 p-4 rounded-lg"><div className="text-3xl font-bold">{stats.newToday}</div><div className="text-xs">{t('jobboard_stat_new')}</div></div>
                </div>
            </div>

            <div className="bg-dark-navy/50 backdrop-blur-sm rounded-2xl p-4 border border-cream/10 space-y-4">
                <input
                    type="text"
                    placeholder={t('jobboard_search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-navy/50 border border-cream/20 rounded-lg p-3 text-white placeholder-cream/50 focus:ring-2 focus:ring-secondary-blue focus:outline-none"
                />
                <div className="flex overflow-x-auto space-x-2 pb-2 -mx-2 px-2">
                    {filterCategories.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveFilter(cat.key)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors duration-200 ${activeFilter === cat.key ? 'bg-primary-blue text-white' : 'bg-secondary-blue/20 text-cream hover:bg-secondary-blue/40'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-blue mx-auto"></div>
                    <p className="mt-4 text-cream">{t('jobboard_loading')}</p>
                </div>
            ) : filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map(job => (
                        <JobCard key={job.id} job={job} onSelect={handleSelectJob} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-dark-navy/50 rounded-2xl">
                    <p className="text-2xl mb-2">😕</p>
                    <h3 className="text-xl font-bold">{t('jobboard_no_profiles_title')}</h3>
                    <p className="text-cream mt-2">{t('jobboard_no_profiles_desc')}</p>
                </div>
            )}
        </div>
    );
}
