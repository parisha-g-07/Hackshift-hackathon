# Hackshift-hackathon
# SyncTies
**Alumni Networking for Making Meaningful Connections**[cite: 1]

### 🚨 The Problem
*   **The Cold-Start Black Hole:** Students rely on guessing games and cold emails on professional networks to find guidance, resulting in near-zero response rates[cite: 4]. 
*   **Mentor Burnout:** Alumni face a constant barrage of untargeted, repeated requests, giving them zero control over their time[cite: 4].
*   **No Outcome Tracking:** There is no structured mechanism to verify if an interaction actually helped a student achieve their goal[cite: 4].

### 💡 Our Solution
SyncTies transforms passive networks into an active intent-matching engine[cite: 3]. We eliminate the traditional search bar and replace it with a double-blind, capacity-constrained marketplace:
*   **Student Token Economy:** Students receive a fixed monthly token allowance to request connections, forcing them to prioritize outreach and physically preventing "spray and pray" spam[cite: 3].
*   **Alumni Capacity Limits:** Mentors set strict monthly limits on how many requests they can take[cite: 3]. Once filled, they are removed from the matching pool, completely preventing burnout[cite: 3].
*   **AI Connection Briefs:** To eliminate cold-messaging anxiety, our system uses OpenAI (GPT-4o-mini) to auto-generate a 2-3 sentence brief explaining exactly why the match makes sense[cite: 5, 6].
*   **Goal Lifecycle & Reputation:** Matches are tracked as actionable projects (Open → Done)[cite: 5]. Completed goals build the mentor's public reputation[cite: 5].

### ⚙️ The Matching Algorithm
Our backend calculates a weighted score out of 100 for eligible mentors using the following formula[cite: 6]:

$$Score = 0.40D + 0.30H + 0.20A + 0.10R$$

*   **D (Domain Overlap - 40%):** Similarity between student interests and mentor expertise[cite: 6].
*   **H (Help Type Match - 30%):** Whether the mentor offers the specific requested help[cite: 6].
*   **A (Availability - 20%):** Based on the capacity left out of the mentor's monthly limit[cite: 6].
*   **R (Recent Activity - 10%):** Prioritizes mentors who are recently active and responsive[cite: 6].

### 🛠️ Tech Stack
*   **Frontend:** Next.js, Tailwind CSS[cite: 5]
*   **Backend:** Next.js API Routes (Server-side)[cite: 5]
*   **Database & Auth:** Supabase (PostgreSQL), Google SSO[cite: 5]
*   **AI Integration:** OpenAI API (GPT-4o-mini)[cite: 5]
*   **Deployment:** Vercel[cite: 5]

### Setup
https://syncties.vercel.app/

### Demo Of Prototype
https://youtu.be/WJTRHzZJEqQ

