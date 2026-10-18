"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Sparkles, ArrowRight, ArrowLeft, Target, Users, Shield, Zap, CheckCircle2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Domain } from "@/types/database";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  calculateStudyYear,
  GRADUATION_MONTHS,
  getGraduationYearOptions,
} from "@/lib/students/study-year";

const STEPS = ["Role", "Profile", "Expertise", "Intent", "Preferences"] as const;

const CANONICAL_DOMAINS = [
  "Computer Science",
  "AI / ML",
  "Data Science",
  "Web Development",
  "Cybersecurity",
  "Product Management",
  "Product Design",
  "Finance & FinTech",
  "Management Consulting",
  "Research & Academia",
  "Entrepreneurship",
  "HealthTech",
];

const HELP_FORMATS = [
  { id: "career_guidance", label: "Career Guidance", desc: "Long-term trajectory, role transitions, and industry insights" },
  { id: "interview_prep", label: "Interview Preparation", desc: "Mock behavioral/system interviews and question breakdowns" },
  { id: "resume_review", label: "Resume & Portfolio Review", desc: "Detailed feedback on project stories and presentation" },
  { id: "project_feedback", label: "Technical Project Feedback", desc: "Architecture reviews and code critique for student builds" },
  { id: "skill_roadmap", label: "Skill Roadmap Planning", desc: "Curated learning paths for specific tools, models, or stacks" },
  { id: "networking_advice", label: "Targeted Outreach Advice", desc: "Crafting high-signal cold outreach and company discovery" },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"student" | "alum">(
    (searchParams.get("role") as "student" | "alum") || "student"
  );
  const [fullName, setFullName] = useState(searchParams.get("name") || "");
  const [institution, setInstitution] = useState("Tech University");
  const [gradMonth, setGradMonth] = useState<number>(
    Number(searchParams.get("gradMonth")) || 5
  );
  const [expectedGradYear, setExpectedGradYear] = useState<number>(
    Number(searchParams.get("gradYear")) || 2028
  );
  const [graduationYear, setGraduationYear] = useState<number>(2023);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [bio, setBio] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>(["Product Management", "AI / ML"]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["career_guidance", "interview_prep"]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamically compute student study year based on expected graduation date
  const computedStudyYear = useMemo(() => {
    return calculateStudyYear(gradMonth, expectedGradYear);
  }, [gradMonth, expectedGradYear]);

  useEffect(() => {
    fetch("/api/domains")
      .then((r) => r.json())
      .then((d) => {
        if (d?.domains && d.domains.length > 0) {
          setDomains(d.domains);
        }
      })
      .catch(() => {});
  }, []);

  const toggleDomain = (name: string) => {
    if (selectedDomains.includes(name)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== name));
    } else {
      setSelectedDomains([...selectedDomains, name]);
    }
  };

  const toggleFormat = (id: string) => {
    if (selectedFormats.includes(id)) {
      setSelectedFormats(selectedFormats.filter((f) => f !== id));
    } else {
      setSelectedFormats([...selectedFormats, id]);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const payload = {
        full_name: fullName,
        role,
        institution,
        study_year: role === "student" ? computedStudyYear.studyYear : null,
        expected_graduation_year: role === "student" ? Number(expectedGradYear) : null,
        expected_graduation_month: role === "student" ? Number(gradMonth) : null,
        graduation_year: role === "alum" ? Number(graduationYear) : null,
        job_title: role === "alum" ? jobTitle : null,
        company: role === "alum" ? company : null,
        industry: role === "alum" ? industry : null,
        bio,
      };

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save profile");
      }

      if (role === "student") {
        router.push("/student/dashboard");
      } else {
        router.push("/alumni/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to complete onboarding");
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 2 && !fullName.trim()) {
      setError("Please provide your full name before continuing.");
      return;
    }
    setError(null);
    if (step === 5) {
      handleSubmit();
    } else {
      setStep((s) => Math.min(5, s + 1));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const displayDomains = domains.length > 0 ? domains.map((d) => d.name) : CANONICAL_DOMAINS;

  return (
    <div className="onboard">
      {/* Onboarding Header */}
      <header>
        <Link href="/" className="inline-flex items-center">
          <BrandLogo size="md" withText />
        </Link>
        <span className="text-sm">Profile setup</span>
        <button
          type="button"
          onClick={() => router.push(role === "student" ? "/student/dashboard" : "/alumni/dashboard")}
        >
          Save &amp; exit
        </button>
      </header>

      <main>
        {/* Progress Header */}
        <div className="progress-head">
          <div>
            <small>Step {step} of 5</small>
            <h1 className="font-heading">{STEPS[step - 1]}</h1>
          </div>
          <span>{step * 20}% complete</span>
        </div>

        {/* Progress Bar */}
        <div className="progress">
          <i style={{ width: `${step * 20}%` }} />
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error" title="Setup Notice">
              {error}
            </Alert>
          </div>
        )}

        {/* Wizard Container */}
        <div className="wizard">
          {/* Step Dots Sidebar */}
          <div className="step-dots">
            {STEPS.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = stepNum <= step;
              const isPast = stepNum < step;
              return (
                <span key={label} className={isActive ? "active" : ""}>
                  <i>{isPast ? <Check className="h-3.5 w-3.5" /> : stepNum}</i>
                  <span>{label}</span>
                </span>
              );
            })}
          </div>

          {/* Step Section Content */}
          <section>
            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="badge soft mb-3 inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#536df0]" /> Choose your path
                  </span>
                  <h2 className="font-heading">How will you use SyncTies?</h2>
                  <p>This shapes your matching profile and the experience we build for you.</p>
                </div>

                <div className="role-grid">
                  <button
                    type="button"
                    className={role === "student" ? "selected" : ""}
                    onClick={() => setRole("student")}
                  >
                    <Target className="h-6 w-6 text-[#536df0]" />
                    <div>
                      <b className="text-base text-[#15213b] block mb-1">I&apos;m a student</b>
                      <span>I&apos;m looking for focused guidance toward a specific career goal or transition.</span>
                    </div>
                    {role === "student" && (
                      <i>
                        <Check className="h-3.5 w-3.5" />
                      </i>
                    )}
                  </button>

                  <button
                    type="button"
                    className={role === "alum" ? "selected" : ""}
                    onClick={() => setRole("alum")}
                  >
                    <Users className="h-6 w-6 text-[#7c5ce7]" />
                    <div>
                      <b className="text-base text-[#15213b] block mb-1">I&apos;m an alumnus or professional</b>
                      <span>I want to share experience, review requests on my schedule, and help students progress.</span>
                    </div>
                    {role === "alum" && (
                      <i>
                        <Check className="h-3.5 w-3.5" />
                      </i>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Profile Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading">Tell us a little about you</h2>
                  <p>You can update these details at any time from your settings.</p>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="name">Full name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="e.g. Jordan Lee"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="inst">Institution / University</label>
                    <input
                      id="inst"
                      type="text"
                      required
                      placeholder="e.g. University of Manchester"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                    />
                  </div>

                  {role === "student" ? (
                    <>
                      <div className="field">
                        <label htmlFor="gradMonth">Expected Graduation Month</label>
                        <select
                          id="gradMonth"
                          value={gradMonth}
                          onChange={(e) => setGradMonth(Number(e.target.value))}
                        >
                          {GRADUATION_MONTHS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="gradYear">Expected Graduation Year</label>
                        <select
                          id="gradYear"
                          value={expectedGradYear}
                          onChange={(e) => setExpectedGradYear(Number(e.target.value))}
                        >
                          {getGraduationYearOptions().map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-full p-3.5 rounded-xl bg-[#f0f4ff] border border-[#d6e2ff] flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs text-[#2b44b8]">
                          <Sparkles className="h-4 w-4 text-[#3563ff] shrink-0" />
                          <span>
                            Auto-determined Classification: <b>{computedStudyYear.label}</b> ({computedStudyYear.description})
                          </span>
                        </div>
                        <span className="badge soft text-xs font-bold text-[#3563ff] bg-white border-[#d6e2ff]">
                          {computedStudyYear.badgeLabel}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="field">
                        <label htmlFor="alumGradYear">Graduation Year</label>
                        <select
                          id="alumGradYear"
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(Number(e.target.value))}
                        >
                          <option value={2026}>2026 (Recent Grad)</option>
                          <option value={2025}>2025</option>
                          <option value={2024}>2024</option>
                          <option value={2023}>2023</option>
                          <option value={2022}>2022</option>
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="job">Current Job Title</label>
                        <input
                          id="job"
                          type="text"
                          placeholder="e.g. Senior Product Manager"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="comp">Current Company</label>
                        <input
                          id="comp"
                          type="text"
                          placeholder="e.g. Northstar Labs, Stripe"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="ind">Industry / Specialization</label>
                        <input
                          id="ind"
                          type="text"
                          placeholder="e.g. Enterprise SaaS, Developer Tools"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="field full">
                    <label htmlFor="bio">Short bio</label>
                    <textarea
                      id="bio"
                      placeholder={
                        role === "student"
                          ? "What are you exploring, building, or working toward? (e.g. Final-year CS student exploring the transition into AI product management)"
                          : "What areas of your professional experience are you most excited to share with students?"
                      }
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Domain Chip Picker */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading">Choose your domains</h2>
                  <p>
                    Select the areas most relevant to your{" "}
                    {role === "student" ? "career interests and goals" : "professional expertise"}.
                  </p>
                </div>

                <div className="chip-picker">
                  {displayDomains.map((dom) => {
                    const isSelected = selectedDomains.includes(dom);
                    return (
                      <button
                        key={dom}
                        type="button"
                        className={isSelected ? "selected" : ""}
                        onClick={() => toggleDomain(dom)}
                      >
                        <span>{dom}</span>
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[#8896ab]">
                  Tip: Selecting 2 to 4 focused domains yields the highest quality recommendation scores.
                </p>
              </div>
            )}

            {/* Step 4: Help Types / Formats */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading">
                    {role === "student" ? "What do you need help with?" : "What can you help with?"}
                  </h2>
                  <p>Choose the interaction formats most valuable for your upcoming goals.</p>
                </div>

                <div className="choice-list">
                  {HELP_FORMATS.map((f) => {
                    const isChecked = selectedFormats.includes(f.id);
                    return (
                      <label key={f.id} className={isChecked ? "border-[#8799f4] bg-[#f9faff]" : ""}>
                        <div>
                          <b className="text-sm text-[#15213b] block mb-0.5">{f.label}</b>
                          <p className="text-xs text-[#66758e] leading-snug">{f.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFormat(f.id)}
                          className="h-4 w-4 rounded border-[#cbd5fb] text-[#536df0] focus:ring-[#536df0]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Summary & Token Preference */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading">Your starting setup</h2>
                  <p>
                    {role === "student"
                      ? "Students receive 5 connection tokens each month. Use them for focused, purposeful introductions."
                      : "Alumni maintain complete control over review volume and can pause requests at any time."}
                  </p>
                </div>

                {role === "student" ? (
                  <div className="token-panel">
                    <Zap className="h-6 w-6 text-[#536df0] shrink-0" />
                    <div>
                      <b className="text-base text-[#15213b]">5 connection tokens granted</b>
                      <span>Refreshes monthly · 1 token per new request · Protected against race conditions</span>
                    </div>
                  </div>
                ) : (
                  <div className="token-panel">
                    <Shield className="h-6 w-6 text-[#536df0] shrink-0" />
                    <div>
                      <b className="text-base text-[#15213b]">Capacity control enabled</b>
                      <span>Default cap of 3 reviews per month · 1-click accept, defer, or polite decline</span>
                    </div>
                  </div>
                )}

                <div className="summary-list">
                  <span>
                    <b>Role</b>
                    <span className="text-[#15213b] font-medium">
                      {role === "student" ? "Student Pilot Member" : "Alumni Mentor / Professional"}
                    </span>
                  </span>
                  <span>
                    <b>Name</b>
                    <span className="text-[#15213b] font-medium">{fullName || "Not specified"}</span>
                  </span>
                  <span>
                    <b>Institution</b>
                    <span className="text-[#15213b] font-medium">{institution}</span>
                  </span>
                  <span>
                    <b>Domains ({selectedDomains.length})</b>
                    <span className="text-[#15213b] font-medium text-right max-w-xs truncate">
                      {selectedDomains.join(", ") || "General"}
                    </span>
                  </span>
                  <span>
                    <b>Preferred formats</b>
                    <span className="text-[#15213b] font-medium">
                      {selectedFormats.length} selected
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Wizard Actions */}
            <div className="wizard-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                disabled={step === 1 || loading}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                isLoading={loading}
              >
                <span>{step === 5 ? "Complete profile" : "Continue"}</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#66758e]">Loading onboarding...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
