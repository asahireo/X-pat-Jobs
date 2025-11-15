import React, { useState, useEffect } from 'react';
import { fetchRequestsForJobSeeker, updateRequestStatus, normalizePhone } from '../services/firebase';
import type { ContactRequest } from '../types';
import { useTranslation } from '../context/LanguageContext';

const RequestCard: React.FC<{ request: ContactRequest; onUpdate: () => void }> = ({ request, onUpdate }) => {
    const { t } = useTranslation();
    const { status, employerName, timestamp } = request;

    const handleApprove = async () => {
        if (window.confirm(t('seeker_requests_card_approve_confirm'))) {
            await updateRequestStatus(request.id, 'approved');
            onUpdate();
        }
    };

    const handleReject = async () => {
        if (window.confirm(t('seeker_requests_card_reject_confirm'))) {
            await updateRequestStatus(request.id, 'rejected');
            onUpdate();
        }
    };

    const statusStyles = {
        pending: { bg: 'bg-warning/10', border: 'border-warning', text: 'text-warning', label: t('seeker_requests_card_status_pending') },
        approved: { bg: 'bg-success/10', border: 'border-success', text: 'text-success', label: t('seeker_requests_card_status_approved') },
        rejected: { bg: 'bg-error/10', border: 'border-error', text: 'text-error', label: t('seeker_requests_card_status_rejected') },
    };
    const currentStatus = statusStyles[status];

    return (
        <div className={`p-5 rounded-2xl border ${currentStatus.border} ${currentStatus.bg}`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                    <h3 className="text-xl font-bold text-off-white">{employerName}</h3>
                    <p className="text-xs text-cream/70 mt-1">{new Date(timestamp).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${currentStatus.bg.replace('10','20')} ${currentStatus.text}`}>
                    {currentStatus.label}
                </span>
            </div>
            
            {status === 'pending' && (
                <>
                    <p className="text-sm text-warning mb-4 p-3 bg-warning/10 rounded-lg">{t('seeker_requests_card_pending_desc')}</p>
                    <div className="flex gap-3">
                        <button onClick={handleApprove} className="flex-1 bg-success text-white font-bold py-2.5 rounded-lg">{t('seeker_requests_card_approve_btn')}</button>
                        <button onClick={handleReject} className="flex-1 bg-error text-white font-bold py-2.5 rounded-lg">{t('seeker_requests_card_reject_btn')}</button>
                    </div>
                </>
            )}
            {status === 'approved' && <p className="text-sm text-success p-3 bg-success/10 rounded-lg">{t('seeker_requests_card_approved_desc')}</p>}
            {status === 'rejected' && <p className="text-sm text-error p-3 bg-error/10 rounded-lg">{t('seeker_requests_card_rejected_desc')}</p>}
        </div>
    );
};


export default function JobSeekerRequestsPage() {
    const { t } = useTranslation();
    const [phone, setPhone] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [requests, setRequests] = useState<ContactRequest[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedPhone = localStorage.getItem('jobSeekerPhone');
        if (savedPhone) {
            setPhone(savedPhone);
            setIsAuthenticated(true);
            fetchData(savedPhone);
        }
    }, []);

    const fetchData = async (phoneNumber: string) => {
        setLoading(true);
        try {
            const fetchedRequests = await fetchRequestsForJobSeeker(phoneNumber);
            setRequests(fetchedRequests.sort((a,b) => b.timestamp - a.timestamp));
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = () => {
        if (normalizePhone(phone)) {
            localStorage.setItem('jobSeekerPhone', phone);
            setIsAuthenticated(true);
            fetchData(phone);
        } else {
            alert("Please enter a valid phone number.");
        }
    };

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
    };

    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto text-center p-8 bg-dark-navy/50 backdrop-blur-sm rounded-2xl border border-cream/10">
                <h1 className="text-2xl font-bold mb-2">{t('seeker_requests_login_title')}</h1>
                <p className="text-cream mb-6">{t('seeker_requests_login_desc')}</p>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('seeker_requests_login_placeholder')}
                    className="w-full bg-dark-navy/50 border border-cream/20 rounded-lg p-3 mb-4 text-white placeholder-cream/50"
                />
                <button onClick={handleVerify} className="w-full bg-primary-blue text-white font-bold py-3 rounded-lg">{t('seeker_requests_login_btn')}</button>
            </div>
        );
    }
    
    return (
        <div className="space-y-8 pb-24">
            <div className="text-center">
                 <h1 className="text-4xl font-extrabold mb-2">{t('seeker_requests_title')}</h1>
                 <p className="text-lg text-cream">{t('seeker_requests_subtitle')}</p>
                 <div className="flex justify-center gap-4 mt-6">
                    <div className="bg-secondary-blue/20 p-4 rounded-lg"><div className="text-3xl font-bold">{stats.total}</div><div className="text-xs">{t('seeker_requests_stat_total')}</div></div>
                    <div className="bg-warning/20 p-4 rounded-lg"><div className="text-3xl font-bold text-warning">{stats.pending}</div><div className="text-xs">{t('seeker_requests_stat_pending')}</div></div>
                    <div className="bg-success/20 p-4 rounded-lg"><div className="text-3xl font-bold text-success">{stats.approved}</div><div className="text-xs">{t('seeker_requests_stat_approved')}</div></div>
                </div>
            </div>
            {loading ? (
                <div className="text-center">Loading...</div>
            ) : requests.length > 0 ? (
                <div className="space-y-4 max-w-2xl mx-auto">
                    {requests.map(req => <RequestCard key={req.id} request={req} onUpdate={() => fetchData(phone)} />)}
                </div>
            ) : (
                <div className="text-center p-10 bg-dark-navy/50 rounded-2xl max-w-2xl mx-auto">
                    <p className="text-3xl mb-2">📭</p>
                    <h3 className="text-xl font-bold">{t('seeker_requests_no_requests_title')}</h3>
                    <p className="text-cream mt-2">{t('seeker_requests_no_requests_desc')}</p>
                </div>
            )}
        </div>
    );
}
