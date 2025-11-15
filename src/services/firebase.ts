import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { JobPost, ContactRequest } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCsCAw7bhuh-qP8YTlNlUf7zYZEbcYiPhM",
  authDomain: "xpat-jobs.firebaseapp.com",
  databaseURL: "https://xpat-jobs-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xpat-jobs",
  storageBucket: "xpat-jobs.appspot.com",
  messagingSenderId: "394519560254",
  appId: "1:394519560254:web:8b16467dbabaa399ae116f"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();

export const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    // Strip non-digits, then remove leading 60 or 0 for Malaysian numbers.
    return phone.replace(/\D/g, '').replace(/^(60|0)/, '');
};

export const fetchActiveJobs = async (): Promise<JobPost[]> => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    // Optimized: Query for jobs with a timestamp greater than or equal to sevenDaysAgo.
    const snapshot = await db.ref('jobs').orderByChild('timestamp').startAt(sevenDaysAgo).once('value');
    
    const jobs: JobPost[] = [];
    snapshot.forEach((childSnapshot) => {
        jobs.push({ ...childSnapshot.val(), id: childSnapshot.key as string });
    });
    
    // Sort client-side for descending order.
    return jobs.sort((a, b) => b.timestamp - a.timestamp);
};

export const createJobPost = async (postData: Omit<JobPost, 'id'>): Promise<string> => {
    const id = 'job_' + postData.timestamp + '_' + Math.random().toString(36).substring(2, 9);
    await db.ref('jobs/' + id).set(postData);
    return id;
};

export const incrementJobViews = async (jobId: string) => {
    const jobRef = db.ref(`jobs/${jobId}/views`);
    await jobRef.transaction((currentViews) => (currentViews || 0) + 1);
};

export const submitContactRequest = async (requestData: Omit<ContactRequest, 'id' | 'jobSeekerPhoneNormalized'>): Promise<string> => {
    // Denormalization: Fetch job to get seeker's phone for efficient querying later.
    const jobSnapshot = await db.ref(`jobs/${requestData.jobId}`).once('value');
    const job = jobSnapshot.val();

    if (!job || !job.phone) {
        throw new Error("Job seeker's phone not found for this job post.");
    }
    
    const jobSeekerPhoneNormalized = normalizePhone(job.phone);

    const id = 'req_' + requestData.timestamp + '_' + Math.random().toString(36).substring(2, 9);
    const fullRequestData = { ...requestData, id, jobSeekerPhoneNormalized };
    await db.ref('contactRequests/' + id).set(fullRequestData);
    return id;
};

export const fetchRequestsForJobSeeker = async (jobSeekerPhone: string): Promise<ContactRequest[]> => {
    const normalizedPhone = normalizePhone(jobSeekerPhone);
    // Optimized: Query directly on the new indexed field instead of iterating all jobs.
    const requestsSnapshot = await db.ref('contactRequests').orderByChild('jobSeekerPhoneNormalized').equalTo(normalizedPhone).once('value');
    
    const allRequests: ContactRequest[] = [];
    if (requestsSnapshot.exists()) {
        requestsSnapshot.forEach(child => {
            allRequests.push({ ...child.val(), id: child.key! });
        });
    }

    return allRequests;
};

export const fetchRequestsByEmployer = async (employerPhone: string): Promise<ContactRequest[]> => {
    const normalizedPhone = normalizePhone(employerPhone);
    // Optimized: Query directly on the indexed employer phone field instead of fetching all requests.
    const requestsSnapshot = await db.ref('contactRequests').orderByChild('employerPhoneNormalized').equalTo(normalizedPhone).once('value');
    
    const matchingRequests: ContactRequest[] = [];
    if(requestsSnapshot.exists()){
        requestsSnapshot.forEach(child => {
            matchingRequests.push({ ...child.val(), id: child.key! });
        });
    }

    // Fetch job data for approved requests, which is necessary.
    const requestsWithJobData = await Promise.all(
        matchingRequests.map(async (req) => {
            if (req.status === 'approved') {
                const jobSnapshot = await db.ref('jobs/' + req.jobId).once('value');
                return { ...req, jobData: jobSnapshot.val() };
            }
            return req;
        })
    );
    
    return requestsWithJobData;
};

export const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
    const updates = {
        status,
        [`${status}At`]: Date.now()
    };
    await db.ref('contactRequests/' + requestId).update(updates);
};
