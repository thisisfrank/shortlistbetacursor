# Super Recruiter Platform

<!-- Test deployment after dashboard fix -->

An AI-powered recruitment that connects clients with expert sourcers to find top-tier candidates quickly and efficiently.

## 🚀 Features

### For Clients
- **AI-Powered Job Matching** - Submit job requirements and get perfectly matched candidates
- **Free Tier Available** - Get started with 1 job submission and 20 candidate credits
- **Real-time Candidate Scoring** - AI-generated match scores for each candidate
- **Comprehensive Candidate Profiles** - LinkedIn data with AI-generated summaries

### For Sourcers
- **Job Marketplace** - Browse and claim available job requests
- **LinkedIn Integration** - Automated profile scraping with ScrapingDog
- **AI-Enhanced Submissions** - Automatic candidate summary generation
- **Performance Tracking** - Monitor completion rates and earnings

### For Admins
- **Comprehensive Dashboard** - Monitor platform performance and user activity
- **User Management** - Manage clients, sourcers, and job requests
- **Analytics & Insights** - Track sourcer performance and client satisfaction
- **System Controls** - Advanced administrative functions

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI Integration**: Anthropic Claude for candidate analysis
- **Data Scraping**: ScrapingDog for LinkedIn profile extraction
- **Payments**: Stripe for subscription management
- **State Management**: React Context + localStorage persistence

## 🎨 Design System

- **Colors**: Supernova (#FFCF00), Shadowforce (#111111), Guardian (#E7E7E7)
- **Typography**: Anton (headings) + Plus Jakarta Sans (body)
- **Components**: Custom UI library with consistent styling

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Anthropic API key
- ScrapingDog account
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd super-recruiter-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SCRAPINGDOG_API_KEY`
- Anthropic API key (in Supabase Edge Functions)
- Stripe keys (in Supabase Edge Functions)

4. Start the development server:
```bash
npm run dev
```

## 🚀 Production Deployment

### Netlify Deployment

1. **Connect Repository**
   - Link your Git repository to Netlify
   - Netlify will automatically detect the build settings from `netlify.toml`

2. **Environment Variables**
   Set these in your Netlify project settings:
   ```
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_anon_key
   ```

3. **Deploy**
   - Push to your main branch to trigger automatic deployment
   - Or manually deploy from Netlify dashboard

### Supabase Setup

1. **Create Production Project**
   - Create a new Supabase project for production
   - Run all migrations to set up the database schema
   - Deploy Edge Functions (stripe-checkout, stripe-webhook, generate-summary, generate-match-score)

2. **Configure Environment Variables**
   - Update Supabase Edge Functions with production API keys
   - Set up Stripe webhook endpoints
   - Configure Anthropic API access

### User Authentication

- **Client Signup**: Users can self-register as clients or sourcers
- **Admin Access**: Admins must be created via database or admin panel
- **Role-Based Access**: Automatic redirection based on user role

## 🗄 Database Setup

The project uses Supabase with the following main tables:
- `user_profiles` - User authentication and roles
- `clients` - Client information and credit tracking
- `jobs` - Job postings and requirements
- `candidates` - Scraped candidate profiles
- `tiers` - Subscription tier definitions
- Stripe integration tables for payments

## 🔧 Key Components

### Role-Based Access Control
- **Client Role**: Submit jobs, view candidates
- **Sourcer Role**: Claim jobs, submit candidates  
- **Admin Role**: Full platform management

### AI Integration
- **Candidate Summaries**: Auto-generated professional summaries
- **Job Match Scoring**: AI-powered candidate-job fit analysis
- **Fallback Systems**: Keyword-based matching when AI unavailable

### Data Persistence
- **localStorage Integration**: Maintains data across page reloads
- **Real-time Updates**: Instant UI updates with persistent storage
- **Role Switching**: Seamless role changes without data loss

## 🧪 Testing Features

- **Role Switcher**: Easy role switching for testing workflows
- **Dummy Data**: Pre-populated test data for development
- **Local Storage**: All data persists locally for testing

## 📱 Responsive Design

Fully responsive design with:
- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly interactions
- Accessible UI components

## 🔐 Security

- **Row Level Security (RLS)**: Database-level access control
- **Role-based permissions**: Frontend and backend validation
- **API key management**: Secure handling of third-party APIs
- **Input validation**: Comprehensive form and data validation

## 🚀 Deployment

The project is designed to deploy on:
- **Frontend**: Netlify, Vercel, or similar
- **Backend**: Supabase (managed)
- **Edge Functions**: Supabase Edge Runtime

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is a private project. Contact the development team for contribution guidelines.

## 📞 Support

For support and questions, contact the development team.