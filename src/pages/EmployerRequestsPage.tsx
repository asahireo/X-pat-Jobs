import React, { useState, useEffect } from 'react';
import { fetchRequestsByEmployer, normalizePhone } from '../services/firebase';
import type { ContactRequest } from '../types';
import { useTranslation } from '../context/LanguageContext';

const RequestCard: React.FC<{ request: ContactRequest }> = ({ request }) => {
    const { t } = useTranslation();
    const { status, jobSeekerName, timestamp, jobData } = request;

    const statusStyles = {
        pending: { bg: 'bg-warning/10', border: 'border-warning', text: 'text-warning', label: t('employer_requests_card_status_pending') },
        approved: { bg: 'bg-success/10', border: 'border-success', text: 'text-success', label: t('employer_requests_card_status_approved') },
        rejected: { bg: 'bg-error/10', border: 'border-error', text: 'text-error', label: t('employer_requests_card_status_rejected') },
    };
    const currentStatus = statusStyles[status];

    return (
        <div className={`p-5 rounded-2xl border ${currentStatus.border} ${currentStatus.bg}`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                    <h3 className="text-xl font-bold text-off-white">{jobSeekerName}</h3>
                    <p className="text-xs text-cream/70 mt-1">{t('employer_requests_card_requested_on')} {new Date(timestamp).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${currentStatus.bg.replace('10','20')} ${currentStatus.text}`}>
                    {currentStatus.label}
                </span>
            </div>
            
            {status === 'approved' && jobData?.phone && (
                <div className="mt-4 p-4 bg-success/10 rounded-lg text-center">
                    <p className="text-sm text-success mb-2">{t('employer_requests_card_approved_title')}</p>
                    <p className="text-2xl font-bold text-white">{jobData.phone}</p>
                    <a href={`https://wa.me/60${normalizePhone(jobData.phone)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block bg-[#25D366] text-white font-bold py-2 px-4 rounded-lg text-sm">
                        {t('employer_requests_card_whatsapp_btn')}
                    </a>
                </div>
            )}
            {status === 'pending' && <p className="text-sm text-warning p-3 bg-warning/10 rounded-lg">{t('employer_requests_card_pending_desc')}</p>}
            {status === 'rejected' && <p className="text-sm text-error p-3 bg-error/10 rounded-lg">{t('employer_requests_card_rejected_desc')}</p>}
        </div>
    );
};


export default function EmployerRequestsPage() {
    const { t } = useTranslation();
    const [phone, setPhone] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [requests, setRequests] = useState<ContactRequest[]>([]);
    const [loading, setLoading] = useState(false);

     useEffect(() => {
        const savedPhone = localStorage.getItem('employerPhone');
        if (savedPhone) {
            setPhone(savedPhone);
            setIsAuthenticated(true);
            fetchData(savedPhone);
        }
    }, []);
    
    const fetchData = async (phoneNumber: string) => {
        setLoading(true);
        try {
            const fetchedRequests = await fetchRequestsByEmployer(phoneNumber);
            setRequests(fetchedRequests.sort((a,b) => b.timestamp - a.timestamp));
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = () => {
        if (normalizePhone(phone)) {
            localStorage.setItem('employerPhone', phone);
            setIsAuthenticated(true);
            fetchData(phone);
        } else {
            alert("Please enter a valid phone number.");
        }
    };
    
    const stats = {
        total: requests.length,
        approved: requests.filter(r => r.status === 'approved').length,
        pending: requests.filter(r => r.status === 'pending').length,
    };
    
    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto text-center p-8 bg-dark-navy/50 backdrop-blur-sm rounded-2xl border border-cream/10">
                <h1 className="text-2xl font-bold mb-2">{t('employer_requests_login_title')}</h1>
                <p className="text-cream mb-6">{t('employer_requests_login_desc')}</p>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('seeker_requests_login_placeholder')}
                    className="w-full bg-dark-navy/50 border border-cream/20 rounded-lg p-3 mb-4 text-white placeholder-cream/50"
                />
                <button onClick={handleVerify} className="w-full bg-primary-blue text-white font-bold py-3 rounded-lg">{t('employer_requests_login_btn')}</button>
            </div>
        );
    }
    
    return (
        <div className="space-y-8 pb-24">
            <div className="text-center">
                 <h1 className="text-4xl font-extrabold mb-2">{t('employer_requests_title')}</h1>
                 <p className="text-lg text-cream">{t('employer_requests_subtitle')}</p>
                 <div className="flex justify-center gap-4 mt-6">
                    <div className="bg-secondary-blue/20 p-4 rounded-lg"><div className="text-3xl font-bold">{stats.total}</div><div className="text-xs">{t('employer_requests_stat_total')}</div></div>
                    <div className="bg-success/20 p-4 rounded-lg"><div className="text-3xl font-bold text-success">{stats.approved}</div><div className="text-xs">{t('employer_requests_stat_approved')}</div></div>
                    <div className="bg-warning/20 p-4 rounded-lg"><div className="text-3xl font-bold text-warning">{stats.pending}</div><div className="text-xs">{t('employer_requests_stat_pending')}</div></div>
                </div>
            </div>
            {loading ? (
                <div className="text-center">Loading...</div>
            ) : requests.length > 0 ? (
                <div className="space-y-4 max-w-2xl mx-auto">
                    {requests.map(req => <RequestCard key={req.id} request={req} />)}
                </div>
            ) : (
                <div className="text-center p-10 bg-dark-navy/50 rounded-2xl max-w-2xl mx-auto">
                    <p className="text-3xl mb-2">📄</p>
                    <h3 className="text-xl font-bold">{t('employer_requests_no_requests_title')}</h3>
                    <p className="text-cream mt-2">{t('employer_requests_no_requests_desc')}</p>
                </div>
            )}
        </div>
    );
}
