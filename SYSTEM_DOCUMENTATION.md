# PrepAssist - System Documentation & Architecture

## 📚 Overview
PrepAssist is an advanced AI-powered ecosystem designed for UPSC aspirants. It integrates news feeds, MCQ generation, mind mapping, professional mains evaluation, and personalized study roadmaps into a unified platform.

---

## 🏗️ System Architecture

### 1. High-Level Architecture
The system follows a **decoupled, service-oriented architecture** with a centralized backend.

- **Mobile Application**: Built with **Expo (React Native)** for cross-platform iOS and Android support.
- **Admin Dashboard**: A **Next.js** web application for content management, user analytics, and system oversight.
- **Landing Page**: A high-performance, premium **Next.js** site optimized for conversions and boutique brand identity.
- **Backend-as-a-Service (BaaS)**: Powered by **Supabase**, handling authentication, database management, and file storage.
- **AI Integration Layer**: A middle layer utilizing **OpenRouter** and **Supabase Edge Functions** to facilitate intelligent features (MCQ generation, Essay evaluation).

### 2. Physical Components
| Component | Environment | Technology |
| :--- | :--- | :--- |
| **Frontend (Web)** | Vercel | Next.js (Admin & Landing) |
| **Frontend (Mobile)** | iOS / Android | Expo (React Native) |
| **Backend / DB** | Supabase | Postgres + PostgREST |
| **AI Processing** | Serverless | Supabase Edge Functions |
| **Object Storage** | Supabase Storage | S3-compatible buckets |

---

## 🛠️ Technology Stack

### Core Frontend (Web)
- **Framework**: Next.js 14+ (App Router)
- **State Management**: React Context / Hooks
- **Styling**: Tailwind CSS + Vanilla CSS (Boutique)
- **Animations**: Framer Motion
- **ORM**: Drizzle ORM (for schema management)
- **Rich Text**: Lexical Editor

### Mobile App
- **Framework**: Expo (React Native)
- **Navigation**: React Navigation (Native Stack)
- **Animations**: React Native Reanimated
- **Charts**: React Native Chart Kit
- **Native Modules**: Camera, Document Picker, Notifications

### Backend & Infrastructure
- **Supabase**: 
  - **Auth**: JWT-based secure authentication.
  - **PostgreSQL**: Relational database with RLS (Row Level Security).
  - **Storage**: S3-compatible storage for user PDFs and mind maps.
  - **Realtime**: WebSocket-based database changes for live notifications.

---

## 🌐 External Services & APIs

| Service | Purpose | Integration Details |
| :--- | :--- | :--- |
| **Supabase** | Core Backend | Auth, DB, Storage, Edge Functions |
| **Vercel** | Web Hosting | CI/CD for Landing Page & Admin Panel |
| **Engagespot** | Push Notifications | Multi-channel notification delivery (iOS/Android) |
| **OpenRouter** | AI / LLM Gateway | Access to OpenAI (GPT-4), Gemini, and Claude |
| **Resend** | Email Infrastructure | Transactional emails and user verification |
| **Expo EAS** | Mobile Build/Deploy | Managed builds and over-the-air (OTA) updates |

---

## 📋 Core Features & Data Flow

### 1. AI MCQ Generator
1. User uploads a **PDF** or parses a **News Feed** article.
2. The file is uploaded to **Supabase Storage**.
3. A **Next.js API route** or **Edge Function** reads the text using `pdf-parse`.
4. Text is sent to **OpenRouter** with a specialized prompt.
5. Generated MCQs are saved to the `practice_questions` table and served to the user.

### 2. Mind Mapping Suite
- Users create nodes and connections.
- State is managed via **React Flow** (Web) or custom SVG/D3 logic (Mobile).
- Connections are persisted in the `mind_map_connections` table.

### 3. Mains Answer Evaluation
- Users submit hand-written or typed answers.
- AI analyzes the text against UPSC standards.
- Detailed feedback and marks are stored in `essay_evaluations`.

### 4. Push Engine
- Admin executes a broadcast from the **Push Engine** tab.
- The request hits the `/api/push/send` endpoint.
- Notifications are queued via **Engagespot** and delivered to endpoints (FCM/APNs/WebPush).

---

## 🔒 Security & Performance
- **Row Level Security (RLS)**: Users can only access their own notes, maps, and progress data.
- **Edge Deployment**: Heavy AI workloads are offloaded to distributed edge functions for low latency.
- **Responsive Design**: Mobile-first architecture ensures compatibility from small displays to desktops.

---

## 🚀 Deployment Workflow
1. **Web Deployment**: Triggered via GitHub push to `main` branch → Auto-build on **Vercel**.
2. **Mobile Build**: Managed via **Expo Application Services (EAS)** for production `.ipa` and `.aab` bundles.
3. **Database Migrations**: Managed via **Drizzle Kit** and Supabase SQL migrations.

---
*Last Updated: February 2026*
