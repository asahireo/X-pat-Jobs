export interface JobPost {
  id: string;
  name: string;
  age: string;
  visa: string;
  nationality: string;
  experience: string;
  job: string;
  skills: string;
  phone: string;
  location: string;
  timestamp: number;
  views: number;
  status: 'active' | 'expired';
}

export interface ContactRequest {
  id: string;
  jobId: string;
  jobSeekerName: string;
  employerName: string;
  employerPhone: string;
  employerPhoneNormalized: string;
  jobSeekerPhoneNormalized?: string; // Added for efficient querying
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: number;
  rejectedAt?: number;
  jobData?: JobPost; // Optional, for employer view
}
