# Hackshift-hackathon
# SyncTies
**Alumni Networking for Making Meaningful Connections**

### 🚨 The Problem
*   **The Cold-Start Black Hole:** Students rely on guessing games and cold emails on professional networks to find guidance, resulting in near-zero response rates. 
*   **Mentor Burnout:** Alumni face a constant barrage of untargeted, repeated requests, giving them zero control over their time.
*   **No Outcome Tracking:** There is no structured mechanism to verify if an interaction actually helped a student achieve their goal.

### 💡 Our Solution
SyncTies transforms passive networks into an active intent-matching engine. We eliminate the traditional search bar and replace it with a double-blind, capacity-constrained marketplace:
*   **Student Token Economy:** Students receive a fixed monthly token allowance to request connections this forces them to prioritize outreach and physically preventing "spray and pray" spam.
*   **Alumni Capacity Limits:** Mentors set strict monthly limits on how many requests they can take. Once filled, they are removed from the matching pool, completely preventing burnout.
*   **AI Connection Briefs:** To eliminate cold-messaging anxiety, our system uses OpenAI (GPT-4o-mini) to auto-generate a 2-3 sentence brief explaining exactly why the match makes sense.
*   **Goal Lifecycle & Reputation:** Matches are tracked as actionable projects (Open → Done). Completed goals build the mentor's public reputation.

### ⚙️ The Matching Algorithm
Our backend calculates a weighted score out of 100 for eligible mentors using the following formula:

$$Score = 0.40D + 0.30H + 0.20A + 0.10R$$

*   **D (Domain Overlap - 40%):** Similarity between student interests and mentor expertise.
*   **H (Help Type Match - 30%):** Whether the mentor offers the specific requested help.
*   **A (Availability - 20%):** Based on the capacity left out of the mentor's monthly limit.
*   **R (Recent Activity - 10%):** Prioritizes mentors who are recently active and responsive.

### 🛠️ Tech Stack
*   **Frontend:** Next.js, Tailwind CSS
*   **Backend:** Next.js API Routes (Server-side)
*   **Database & Auth:** Supabase (PostgreSQL), Google SSO
*   **AI Integration:** OpenAI API (GPT-4o-mini)
*   **Deployment:** Vercel

### Setup
https://syncties.vercel.app/

### Demo Of Prototype
https://youtu.be/WJTRHzZJEqQ

