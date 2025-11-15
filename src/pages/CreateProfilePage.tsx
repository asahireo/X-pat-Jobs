import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJobPost } from '../services/firebase';
import type { JobPost } from '../types';
import { useTranslation } from '../context/LanguageContext';

interface Message {
    id: number;
    type: 'bot' | 'user' | 'options' | 'input' | 'typing' | 'loading' | 'success';
    content?: any;
    question?: any;
}


const ProgressBar = ({ current, total, label }: { current: number, total: number, label: string }) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
        <div className="mb-6">
            <div className="flex justify-between text-sm text-cream mb-1">
                <span>{label}</span>
                <span>{percentage}%</span>
            </div>
            <div className="w-full bg-secondary-blue/20 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-primary-blue to-secondary-blue h-2.5 rounded-full" style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>
        </div>
    );
};

export default function CreateProfilePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const questions = useMemo(() => [
        { key: 'name', type: 'input', text: t('create_profile_q_name'), skip: true },
        { key: 'age', type: 'options', text: t('create_profile_q_age'), options: ['18-25', '26-35', '36-45', '46-55', '55+'] },
        { key: 'visa', type: 'options', text: t('create_profile_q_visa'), options: ['Work Permit', 'Student Visa', 'Dependent Pass', 'Other'] },
        { key: 'nationality', type: 'options', text: t('create_profile_q_nationality'), options: ['Bangladesh', 'Nepal', 'India', 'Pakistan', 'Myanmar', 'Indonesia', 'Philippines', 'Other'] },
        { key: 'experience', type: 'options', text: t('create_profile_q_experience'), options: ['No experience', '1-2 years', '3-5 years', '5-10 years', '10+ years'] },
        { key: 'job', type: 'options', text: t('create_profile_q_job'), options: ['Factory Worker', 'Restaurant/Kitchen Helper', 'Cleaner/Housekeeper', 'Construction Worker', 'Security Guard', 'Driver', 'Technician/Mechanic', 'General Worker', 'Other'] },
        { key: 'skills', type: 'textarea', text: t('create_profile_q_skills'), validation: (v: string) => v.length >= 10 || t('create_profile_validation_skills') },
        { key: 'phone', type: 'input', text: t('create_profile_q_phone'), placeholder: t('create_profile_phone_placeholder'), validation: (v: string) => /^(\+?60|0)1[0-9]{8,9}$/.test(v) || t('create_profile_validation_phone') },
        { key: 'location', type: 'input', text: t('create_profile_q_location'), placeholder: t('create_profile_location_placeholder') }
    ], [t]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [userData, setUserData] = useState<Partial<Omit<JobPost, 'id'>>>({});
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messages.length === 0) {
            addNewMessage({ id: Date.now(), type: 'bot', content: questions[0].text });
            addNewMessage({ id: Date.now() + 1, type: 'input', question: questions[0] });
        }
    }, [messages.length, questions]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addNewMessage = (msg: Message) => {
        setMessages(prev => [...prev, msg]);
    };

    const handleAnswer = (key: string, value: any) => {
        setUserData(prev => ({ ...prev, [key]: value }));
        
        setMessages(prev => prev.filter(m => m.type !== 'input' && m.type !== 'options'));
        addNewMessage({ id: Date.now(), type: 'user', content: value });
        
        const nextStep = currentStep + 1;

        if (nextStep < questions.length) {
            setCurrentStep(nextStep);
            addNewMessage({ id: Date.now() + 1, type: 'typing' });
            setTimeout(() => {
                setMessages(prev => prev.filter(m => m.type !== 'typing'));
                addNewMessage({ id: Date.now() + 2, type: 'bot', content: questions[nextStep].text });
                
                const currentQuestion = questions[nextStep];
                const messageType = currentQuestion.type === 'options' ? 'options' : 'input';
                addNewMessage({ 
                    id: Date.now() + 3, 
                    type: messageType, 
                    question: currentQuestion,
                    content: messageType === 'options' ? currentQuestion.options : undefined
                });
            }, 1000);
        } else {
            finalizeProfile({ ...userData, [key]: value });
        }
    };
    
    const handleSkip = () => {
        handleAnswer('name', t('create_profile_anonymous'));
    }

    const finalizeProfile = async (finalData: any) => {
        addNewMessage({ id: Date.now(), type: 'loading' });
        
        const postData = {
            ...finalData,
            timestamp: Date.now(),
            views: 0,
            status: 'active',
        } as Omit<JobPost, 'id'>;
        
        try {
            const newJobId = await createJobPost(postData);
            setMessages(prev => prev.filter(m => m.type !== 'loading'));
            addNewMessage({ id: Date.now() + 1, type: 'success', content: { id: newJobId } });
        } catch (error) {
            console.error("Failed to create profile:", error);
        }
    };
    
    const MessageComponent: React.FC<{ msg: Message }> = ({ msg }) => {
        const [inputValue, setInputValue] = useState('');
        const [error, setError] = useState('');

        const handleInputSubmit = () => {
            const validation = msg.question?.validation;
            if (validation) {
                const result = validation(inputValue);
                if (result !== true) {
                    setError(result);
                    return;
                }
            }
            if(!inputValue && msg.question.key !== 'name') {
                setError(t('create_profile_validation_required'));
                return;
            }
            handleAnswer(msg.question.key, inputValue || t('create_profile_anonymous'));
        };
        
        switch (msg.type) {
            case 'bot': return <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-primary-blue flex-shrink-0 flex items-center justify-center text-sm">🤖</div><div className="bg-mid-navy p-3 rounded-lg rounded-bl-none text-cream">{msg.content}</div></div>;
            case 'user': return <div className="flex justify-end"><div className="bg-secondary-blue p-3 rounded-lg rounded-br-none text-white">{msg.content}</div></div>;
            case 'typing': return <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-primary-blue flex-shrink-0"></div><div className="bg-mid-navy p-3 rounded-lg rounded-bl-none flex items-center gap-1.5"><div className="w-2 h-2 bg-cream/50 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-cream/50 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-cream/50 rounded-full animate-bounce [animation-delay:0.4s]"></div></div></div>;
            case 'input':
                const isTextarea = msg.question.type === 'textarea';
                const InputElement = isTextarea ? 'textarea' : 'input';
                return (
                    <div className="bg-mid-navy/50 p-4 rounded-lg mt-2">
                        <InputElement 
                            value={inputValue}
                            onChange={e => { setInputValue(e.target.value); setError(''); }}
                            onKeyDown={e => e.key === 'Enter' && !isTextarea && handleInputSubmit()}
                            placeholder={msg.question.placeholder || 'Type your answer...'}
                            className="w-full bg-dark-navy border border-cream/20 rounded-lg p-3 text-white placeholder-cream/50 focus:ring-2 focus:ring-secondary-blue focus:outline-none"
                            rows={isTextarea ? 4 : undefined}
                        />
                        {error && <p className="text-error text-xs mt-1">{error}</p>}
                        <div className="flex gap-2 mt-2">
                            <button onClick={handleInputSubmit} className="flex-1 bg-success text-white font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">{t('create_profile_submit')}</button>
                            {msg.question.skip && <button onClick={handleSkip} className="bg-cream/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-cream/30 transition-colors">{t('create_profile_skip')}</button>}
                        </div>
                    </div>
                );
            case 'options': return <div className="grid grid-cols-2 gap-2 mt-2">{msg.content.map((opt: string) => <button key={opt} onClick={() => handleAnswer(msg.question.key, opt)} className="bg-secondary-blue/80 text-white p-3 rounded-lg text-sm text-center hover:bg-secondary-blue transition-colors">{opt}</button>)}</div>;
             case 'loading': return <div className="text-center py-6"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary-blue mx-auto"></div><p className="mt-3 text-cream text-sm">{t('create_profile_loading')}</p></div>;
            case 'success': return (
                <div className="bg-success/10 border border-success rounded-lg p-6 text-center">
                    <div className="text-5xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-success mb-2">{t('create_profile_success_title')}</h2>
                    <p className="text-cream mb-6">{t('create_profile_success_desc')}</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => navigate('/jobs')} className="flex-1 bg-primary-blue text-white font-bold py-3 rounded-lg">{t('create_profile_success_btn_board')}</button>
                        <button onClick={() => window.location.reload()} className="flex-1 bg-cream/20 text-white font-bold py-3 rounded-lg">{t('create_profile_success_btn_another')}</button>
                    </div>
                </div>
            );
            default: return null;
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto pb-24">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-off-white to-secondary-blue text-transparent bg-clip-text">{t('create_profile_title')}</h1>
                <p className="text-md text-cream mt-1">{t('create_profile_subtitle')}</p>
            </div>
            
            <ProgressBar current={currentStep} total={questions.length} label={t('create_profile_progress')} />

            <div className="bg-dark-navy/70 backdrop-blur-md border border-cream/20 rounded-2xl p-4 md:p-6" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
                <div className="h-full overflow-y-auto space-y-4 pr-2">
                    {messages.map((msg, index) => <MessageComponent key={`${msg.id}-${index}`} msg={msg} />)}
                    <div ref={chatEndRef} />
                </div>
            </div>
        </div>
    );
}
