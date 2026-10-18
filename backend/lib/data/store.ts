import {
  Profile,
  Domain,
  HelpType,
  Intent,
  Offer,
  MatchResult,
  ConnectionRequest,
  Goal,
  Feedback,
  TokenSummary,
  CapacitySummary,
} from "@/types/database";
import {
  calculateDomainOverlap,
  calculateHelpTypeScore,
  calculateCapacityScore,
  calculateRecentActivityScore,
  calculateTotalMatchScore,
  compareCandidates,
} from "@/lib/matching/score";

// Canonical Domains Seed
export const CANONICAL_DOMAINS: Domain[] = [
  { id: "11111111-1111-1111-1111-111111111101", slug: "computer-science", name: "Computer Science", category: "Technology", is_active: true },
  { id: "11111111-1111-1111-1111-111111111102", slug: "data-science", name: "Data Science", category: "Technology", is_active: true },
  { id: "11111111-1111-1111-1111-111111111103", slug: "ai-ml", name: "AI & Machine Learning", category: "Technology", is_active: true },
  { id: "11111111-1111-1111-1111-111111111104", slug: "web-development", name: "Web Development", category: "Technology", is_active: true },
  { id: "11111111-1111-1111-1111-111111111105", slug: "cybersecurity", name: "Cybersecurity", category: "Technology", is_active: true },
  { id: "11111111-1111-1111-1111-111111111106", slug: "product-management", name: "Product Management", category: "Business & Product", is_active: true },
  { id: "11111111-1111-1111-1111-111111111107", slug: "finance", name: "Finance & Investment", category: "Business & Finance", is_active: true },
  { id: "11111111-1111-1111-1111-111111111108", slug: "consulting", name: "Consulting & Strategy", category: "Business & Strategy", is_active: true },
  { id: "11111111-1111-1111-1111-111111111109", slug: "design", name: "UI/UX & Product Design", category: "Design", is_active: true },
  { id: "11111111-1111-1111-1111-111111111110", slug: "research", name: "Academic & Industrial Research", category: "Research", is_active: true },
  { id: "11111111-1111-1111-1111-111111111111", slug: "entrepreneurship", name: "Entrepreneurship & Startups", category: "Business", is_active: true },
  { id: "11111111-1111-1111-1111-111111111112", slug: "marketing", name: "Growth & Marketing", category: "Business", is_active: true },
  { id: "11111111-1111-1111-1111-111111111113", slug: "healthcare", name: "Healthcare & BioTech", category: "Life Sciences", is_active: true },
  { id: "11111111-1111-1111-1111-111111111114", slug: "other", name: "Other Professional Domains", category: "General", is_active: true },
];

// Canonical Help Types Seed
export const CANONICAL_HELP_TYPES: HelpType[] = [
  { id: "22222222-2222-2222-2222-222222222201", slug: "referral", name: "Job or Internship Referral", description: "Direct internal employee referral for an active opening", is_active: true },
  { id: "22222222-2222-2222-2222-222222222202", slug: "mock-interview", name: "Mock Interview & Feedback", description: "Technical, behavioral, or product case interview simulation", is_active: true },
  { id: "22222222-2222-2222-2222-222222222203", slug: "resume-review", name: "Resume & CV Review", description: "Constructive critique and line-by-line feedback on your resume", is_active: true },
  { id: "22222222-2222-2222-2222-222222222204", slug: "career-guidance", name: "Career & Field Guidance", description: "Strategic advice on role transitions, career roadmap, and industry trends", is_active: true },
  { id: "22222222-2222-2222-2222-222222222205", slug: "higher-ed-guidance", name: "Higher Education Guidance", description: "Advice on master degrees, PhD applications, GRE/GMAT, and universities", is_active: true },
  { id: "22222222-2222-2222-2222-222222222206", slug: "portfolio-review", name: "Portfolio & Code Review", description: "Review of design portfolio, GitHub projects, or open-source PRs", is_active: true },
  { id: "22222222-2222-2222-2222-222222222207", slug: "project-guidance", name: "Capstone & Project Mentorship", description: "Technical direction on university or side projects", is_active: true },
  { id: "22222222-2222-2222-2222-222222222208", slug: "other", name: "General Mentoring", description: "Custom professional discussion", is_active: true },
];

export const HELP_TYPE_COMPATIBILITY_MAP: Record<string, number> = {
  // exact matches are 100
  "22222222-2222-2222-2222-222222222201:22222222-2222-2222-2222-222222222201": 100,
  "22222222-2222-2222-2222-222222222202:22222222-2222-2222-2222-222222222202": 100,
  "22222222-2222-2222-2222-222222222203:22222222-2222-2222-2222-222222222203": 100,
  "22222222-2222-2222-2222-222222222204:22222222-2222-2222-2222-222222222204": 100,
  "22222222-2222-2222-2222-222222222205:22222222-2222-2222-2222-222222222205": 100,
  "22222222-2222-2222-2222-222222222206:22222222-2222-2222-2222-222222222206": 100,
  "22222222-2222-2222-2222-222222222207:22222222-2222-2222-2222-222222222207": 100,
  "22222222-2222-2222-2222-222222222208:22222222-2222-2222-2222-222222222208": 100,
  // related
  "22222222-2222-2222-2222-222222222202:22222222-2222-2222-2222-222222222204": 70, // mock interview -> career guidance
  "22222222-2222-2222-2222-222222222203:22222222-2222-2222-2222-222222222204": 70, // resume review -> career guidance
  "22222222-2222-2222-2222-222222222206:22222222-2222-2222-2222-222222222203": 70, // portfolio -> resume review
  "22222222-2222-2222-2222-222222222207:22222222-2222-2222-2222-222222222204": 70, // capstone -> career guidance
  "22222222-2222-2222-2222-222222222201:22222222-2222-2222-2222-222222222202": 40, // referral -> mock interview
  "22222222-2222-2222-2222-222222222201:22222222-2222-2222-2222-222222222203": 40, // referral -> resume review
  "22222222-2222-2222-2222-222222222205:22222222-2222-2222-2222-222222222204": 70, // higher ed -> career guidance
};

// Seed Profiles for Demo
export const SEED_PROFILES: Profile[] = [
  {
    id: "33333333-3333-3333-3333-333333333301",
    email: "priya.sharma@alumni.edu",
    full_name: "Priya Sharma",
    avatar_url: "",
    role: "alum",
    institution: "Tech University",
    graduation_year: 2023,
    job_title: "Senior Product Manager",
    company: "Stripe",
    industry: "FinTech & Payments",
    bio: "Ex-APM at Google, currently building global billing infrastructure at Stripe. Happy to conduct mock PM interviews and product sense drills.",
    verification_status: "verified",
    is_active: true,
    last_active_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h ago
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333302",
    email: "marcus.chen@alumni.edu",
    full_name: "Marcus Chen",
    avatar_url: "",
    role: "alum",
    institution: "Tech University",
    graduation_year: 2022,
    job_title: "Staff Machine Learning Engineer",
    company: "DeepMind",
    industry: "Artificial Intelligence",
    bio: "Working on generative AI systems. Can assist 4th-year students with technical interview prep and AI capstone design.",
    verification_status: "verified",
    is_active: true,
    last_active_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333303",
    email: "ananya.patel@alumni.edu",
    full_name: "Ananya Patel",
    avatar_url: "",
    role: "alum",
    institution: "Tech University",
    graduation_year: 2024,
    job_title: "Full-Stack Software Engineer",
    company: "Vercel",
    industry: "Developer Tools",
    bio: "Recent 2024 graduate! Built web systems with Next.js, TypeScript, and edge computing. Excited to review junior resumes and code portfolios.",
    verification_status: "verified",
    is_active: true,
    last_active_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333304",
    email: "rohan.deshmukh@student.edu",
    full_name: "Rohan Deshmukh",
    avatar_url: "",
    role: "student",
    institution: "Tech University",
    study_year: 4,
    expected_graduation_year: 2027,
    bio: "Final year Computer Science student targeting associate product manager and software engineering graduate roles.",
    verification_status: "verified",
    is_active: true,
    last_active_at: new Date().toISOString(),
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
];

// Seed Offers for Alumni
export const SEED_OFFERS: (Offer & { domain_ids: string[] })[] = [
  {
    id: "44444444-4444-4444-4444-444444444401",
    user_id: "33333333-3333-3333-3333-333333333301", // Priya
    title: "Product Management Mock Interviews & Portfolio Critique",
    description: "45-minute structured mock interview with real product design, prioritization, and analytical case prompts, followed by detailed feedback.",
    help_type_id: "22222222-2222-2222-2222-222222222202", // Mock Interview
    status: "active",
    opportunity_available: true,
    opportunity_title: "APM Fall 2027 Referral Available",
    opportunity_company: "Stripe",
    domain_ids: [
      "11111111-1111-1111-1111-111111111106", // Product Management
      "11111111-1111-1111-1111-111111111107", // Finance
    ],
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "44444444-4444-4444-4444-444444444402",
    user_id: "33333333-3333-3333-3333-333333333302", // Marcus
    title: "AI/ML Systems Technical Architecture & Interview Prep",
    description: "Deep-dive on ML modeling, inference optimization, and graduate research directions.",
    help_type_id: "22222222-2222-2222-2222-222222222204", // Career Guidance
    status: "active",
    opportunity_available: false,
    domain_ids: [
      "11111111-1111-1111-1111-111111111103", // AI/ML
      "11111111-1111-1111-1111-111111111102", // Data Science
      "11111111-1111-1111-1111-111111111101", // CS
    ],
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "44444444-4444-4444-4444-444444444403",
    user_id: "33333333-3333-3333-3333-333333333303", // Ananya
    title: "Frontend & Full-Stack Resume Line-by-Line Review",
    description: "Detailed actionable feedback on how to present GitHub open-source projects, Next.js applications, and system design on your resume.",
    help_type_id: "22222222-2222-2222-2222-222222222203", // Resume Review
    status: "active",
    opportunity_available: true,
    opportunity_title: "Software Engineer I Openings",
    opportunity_company: "Vercel",
    domain_ids: [
      "11111111-1111-1111-1111-111111111104", // Web Dev
      "11111111-1111-1111-1111-111111111101", // CS
    ],
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
];

// Seed Capacity for Alumni
export const SEED_CAPACITIES: Record<string, CapacitySummary> = {
  "33333333-3333-3333-3333-333333333301": {
    monthly_limit: 4,
    reserved_count: 1,
    processed_count: 1,
    remaining_capacity: 2,
    period_start: "2026-10-01",
  },
  "33333333-3333-3333-3333-333333333302": {
    monthly_limit: 3,
    reserved_count: 0,
    processed_count: 1,
    remaining_capacity: 2,
    period_start: "2026-10-01",
  },
  "33333333-3333-3333-3333-333333333303": {
    monthly_limit: 5,
    reserved_count: 0,
    processed_count: 0,
    remaining_capacity: 5,
    period_start: "2026-10-01",
  },
};

// Seed Intents for Students
export const SEED_INTENTS: (Intent & { domain_ids: string[] })[] = [
  {
    id: "55555555-5555-5555-5555-555555555501",
    user_id: "33333333-3333-3333-3333-333333333304", // Rohan
    title: "Prepare for Associate Product Manager Case Interviews",
    description: "Looking for advice and mock case interviews focused on product sense, metric definitions, and fintech trade-offs before upcoming campus placements.",
    help_type_id: "22222222-2222-2222-2222-222222222202", // Mock Interview
    status: "open",
    target_role: "Associate Product Manager",
    target_company: "Stripe, Razorpay, or Google",
    domain_ids: [
      "11111111-1111-1111-1111-111111111106", // Product Management
      "11111111-1111-1111-1111-111111111107", // Finance
    ],
    created_at: "2026-10-10T10:00:00Z",
    updated_at: "2026-10-10T10:00:00Z",
  },
];

// Seed Requests
export const SEED_REQUESTS: ConnectionRequest[] = [
  {
    id: "66666666-6666-6666-6666-666666666601",
    student_id: "33333333-3333-3333-3333-333333333304",
    alum_id: "33333333-3333-3333-3333-333333333301",
    intent_id: "55555555-5555-5555-5555-555555555501",
    offer_id: "44444444-4444-4444-4444-444444444401",
    status: "accepted",
    student_message: "Hi Priya! I loved your article on Stripe billing APIs. I'm preparing for APM interviews and would value your feedback on my product design drill.",
    repeat_contact_in_month: false,
    alumni_response_note: "Happy to help Rohan! Let's schedule 45 mins this Saturday.",
    expires_at: "2026-10-24T10:00:00Z",
    responded_at: "2026-10-11T14:30:00Z",
    created_at: "2026-10-10T12:00:00Z",
    updated_at: "2026-10-11T14:30:00Z",
  },
];

// Seed Goals
export const SEED_GOALS: Goal[] = [
  {
    id: "77777777-7777-7777-7777-777777777701",
    request_id: "66666666-6666-6666-6666-666666666601",
    student_id: "33333333-3333-3333-3333-333333333304",
    alum_id: "33333333-3333-3333-3333-333333333301",
    title: "Prepare for Associate Product Manager Case Interviews",
    description: "Complete 1 structured mock interview and review feedback notes.",
    status: "fulfilled",
    student_confirmed_at: "2026-10-14T16:00:00Z",
    alum_confirmed_at: "2026-10-14T17:00:00Z",
    fulfilled_at: "2026-10-14T17:00:00Z",
    created_at: "2026-10-10T12:00:00Z",
    updated_at: "2026-10-14T17:00:00Z",
  },
];

// In-Memory Database Store for Graceful Standalone/Local Operation
class LocalDataStore {
  profiles: Profile[] = [...SEED_PROFILES];
  domains: Domain[] = [...CANONICAL_DOMAINS];
  helpTypes: HelpType[] = [...CANONICAL_HELP_TYPES];
  offers: (Offer & { domain_ids: string[] })[] = [...SEED_OFFERS];
  intents: (Intent & { domain_ids: string[] })[] = [...SEED_INTENTS];
  requests: ConnectionRequest[] = [...SEED_REQUESTS];
  goals: Goal[] = [...SEED_GOALS];
  capacities: Record<string, CapacitySummary> = { ...SEED_CAPACITIES };
  studentTokens: Record<string, TokenSummary> = {
    "33333333-3333-3333-3333-333333333304": {
      tokens_granted: 5,
      tokens_spent: 1,
      tokens_remaining: 4,
      period_start: "2026-10-01",
    },
  };
  feedback: Feedback[] = [];

  getProfile(id: string): Profile | undefined {
    return this.profiles.find((p) => p.id === id);
  }

  saveProfile(profile: Partial<Profile> & { id: string }): Profile {
    const existingIndex = this.profiles.findIndex((p) => p.id === profile.id);
    if (existingIndex >= 0) {
      this.profiles[existingIndex] = {
        ...this.profiles[existingIndex],
        ...profile,
        updated_at: new Date().toISOString(),
      };
      return this.profiles[existingIndex];
    } else {
      const newP: Profile = {
        email: "user@example.com",
        full_name: "New User",
        role: "student",
        institution: "University Pilot",
        study_year: 3,
        verification_status: "verified",
        is_active: true,
        last_active_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...profile,
        id: profile.id,
      };
      this.profiles.push(newP);
      return newP;
    }
  }

  // Matching logic
  getMatchesForIntent(intentId: string, studentId: string): MatchResult[] {
    const intent = this.intents.find((i) => i.id === intentId && i.status === "open");
    if (!intent) return [];

    const requestedHelpTypeId = intent.help_type_id;
    const studentDomainIds = intent.domain_ids || [];

    const results: MatchResult[] = [];

    // Filter active alumni
    const alumni = this.profiles.filter(
      (p) => p.role === "alum" && p.is_active && p.id !== studentId
    );

    for (const alum of alumni) {
      // Find candidate's active offers
      const alumOffers = this.offers.filter((o) => o.user_id === alum.id && o.status === "active");
      if (alumOffers.length === 0) continue;

      const cap = this.capacities[alum.id] || {
        monthly_limit: 3,
        reserved_count: 0,
        processed_count: 0,
        remaining_capacity: 3,
        period_start: "2026-10-01",
      };

      if (cap.remaining_capacity <= 0) continue; // Exclude zero capacity

      // Check duplicate pending/accepted request
      const hasDuplicate = this.requests.some(
        (r) =>
          r.student_id === studentId &&
          r.alum_id === alum.id &&
          r.intent_id === intentId &&
          (r.status === "pending" || r.status === "accepted")
      );
      if (hasDuplicate) continue;

      // Repeat contact in current month?
      const isRepeat = this.requests.some(
        (r) => r.student_id === studentId && r.alum_id === alum.id
      );

      // Score best offer
      let bestOfferScore = -1;
      let bestOfferResult: MatchResult | null = null;

      for (const offer of alumOffers) {
        const dScore = calculateDomainOverlap(studentDomainIds, offer.domain_ids || []);
        const hScore = calculateHelpTypeScore(
          requestedHelpTypeId,
          [offer.help_type_id],
          HELP_TYPE_COMPATIBILITY_MAP
        );
        const cScore = calculateCapacityScore(cap.monthly_limit, cap.reserved_count + cap.processed_count);
        const rScore = calculateRecentActivityScore(alum.last_active_at);

        const totalScore = calculateTotalMatchScore(dScore, hScore, cScore, rScore);

        const helpTypeObj = this.helpTypes.find((ht) => ht.id === offer.help_type_id);
        const matchedDomains = this.domains
          .filter((d) => (offer.domain_ids || []).includes(d.id) && studentDomainIds.includes(d.id))
          .map((d) => ({ id: d.id, name: d.name, slug: d.slug }));

        const candidateResult: MatchResult = {
          alum_id: alum.id,
          full_name: alum.full_name,
          avatar_url: alum.avatar_url,
          job_title: alum.job_title || undefined,
          company: alum.company || undefined,
          industry: alum.industry || undefined,
          bio: alum.bio || undefined,
          graduation_year: alum.graduation_year || undefined,
          last_active_at: alum.last_active_at,
          offer_id: offer.id,
          offer_title: offer.title,
          offer_help_type_id: offer.help_type_id,
          offer_help_type_name: helpTypeObj?.name || "General Guidance",
          d_score: dScore,
          h_score: hScore,
          c_score: cScore,
          r_score: rScore,
          total_score: totalScore,
          matched_domains: matchedDomains,
          remaining_capacity: cap.remaining_capacity,
          monthly_limit: cap.monthly_limit,
          is_repeat_contact: isRepeat,
        };

        if (totalScore > bestOfferScore) {
          bestOfferScore = totalScore;
          bestOfferResult = candidateResult;
        }
      }

      if (bestOfferResult) {
        results.push(bestOfferResult);
      }
    }

    results.sort(compareCandidates);
    return results;
  }
}

// Global singleton instance for local runtime demo
export const localStore = new LocalDataStore();
