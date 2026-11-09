export type ProdiType = 
  | 'Animasi'
  | 'Matekstosi'
  | 'Manarita'
  | 'Manaprodsi'
  | 'MIK'
  | 'Game Design';

export const PRODI_LIST: { id: ProdiType; label: string; desc: string }[] = [
  { id: 'Animasi', label: 'Animasi', desc: 'Animasi 2D/3D, Motion Graphics, Rigging & VFX' },
  { id: 'Matekstosi', label: 'Matekstosi', desc: 'Manajemen Teknik Studio Produksi' },
  { id: 'Manarita', label: 'Manarita', desc: 'Manajemen Pemberitaan & Jurnalistik Penyiaran' },
  { id: 'Manaprodsi', label: 'Manaprodsi', desc: 'Manajemen Produksi Siaran TV & Radio' },
  { id: 'MIK', label: 'MIK', desc: 'Manajemen Informasi & Komunikasi / IT Penyiaran' },
  { id: 'Game Design', label: 'Game Design', desc: 'Game Development, Level Design, Art & Programming' }
];

export interface PortfolioItem {
  id: string;
  type: 'youtube' | 'pinterest' | 'behance' | 'image' | 'link';
  title: string;
  url: string;
  description?: string;
}

export interface CustomProfileLink {
  id: string;
  title: string;
  url: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  nomorAlumni: string;
  namaLengkap: string;
  prodi: ProdiType;
  angkatan: string;
  fotoProfil?: string;
  bio?: string;
  openToWork: boolean;
  cvFileUrl?: string;
  cvExternalLink?: string;
  hasCv?: boolean;
  portfolio: PortfolioItem[];
  phone?: string;
  linkedinUrl?: string;
  role?: 'admin' | 'alumni';
  pekerjaanSaatIni?: string;
  domisili?: string;
  customLinks?: CustomProfileLink[];
  following?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface JobPosting {
  id: string;
  postedBy: string;
  posterName: string;
  posterEmail: string;
  judul: string;
  perusahaan: string;
  lokasi: string;
  tipeKerja: 'Full-time' | 'Part-time' | 'Freelance' | 'Magang';
  prodiTarget: ProdiType[];
  deskripsi: string;
  kualifikasi: string[];
  gajiRange?: string;
  deadline?: string;
  status: 'active' | 'closed';
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantUid: string;
  applicantName: string;
  applicantEmail: string;
  applicantProdi: ProdiType;
  posterUid: string;
  pesan: string;
  cvUrl?: string;
  cvExternalLink?: string;
  applicantPhone?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  appliedAt: string;
}

export interface ContactRequest {
  id: string;
  requesterUid: string;
  requesterName: string;
  requesterEmail: string;
  requesterProdi?: string;
  targetUid: string;
  targetName: string;
  purpose: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  targetPhone?: string;
  targetEmail?: string;
}

export interface AlumniRegistryItem {
  id?: string;
  nomorAlumni: string;
  namaLengkap: string;
  prodi: ProdiType;
  angkatan: string;
  isRegistered?: boolean;
  registeredUid?: string;
  registeredEmail?: string;
  registeredAt?: string;
  createdAt?: string;
}

export type FeedCategory = 'showreel' | 'kolaborasi' | 'diskusi' | 'pencapaian';

export interface FeedComment {
  id: string;
  authorUid: string;
  authorName: string;
  authorProdi: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorProdi: string;
  authorAngkatan?: string;
  authorRole?: string;
  authorAvatar?: string;
  nomorAlumni?: string;
  category: FeedCategory;
  content: string;
  hashtags?: string[];
  mediaType?: 'youtube' | 'image' | 'pdf';
  mediaUrl?: string;
  mediaTitle?: string;
  mediaSize?: string;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  comments: FeedComment[];
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantProfiles?: Record<string, {
    namaLengkap: string;
    prodi?: string;
    fotoProfil?: string;
  }>;
  lastMessage: string;
  updatedAt: string;
  messages?: ChatMessage[];
}
