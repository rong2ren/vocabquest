# 📚 VocabQuest - Master Your Vocabulary

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rong2ren/vocabquest)

An engaging, interactive vocabulary learning platform designed specifically for elementary students (grades 3-4) preparing for the SSAT Elementary exam and academic success.

![VocabQuest Dashboard](https://img.shields.io/badge/React-18.3.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue) ![Supabase](https://img.shields.io/badge/Supabase-Backend-green) ![Vite](https://img.shields.io/badge/Vite-6.2.6-purple)

## ✨ Features

### 🎮 **Learning Modes**
- **Flashcards** - Interactive word cards with flip animations and audio pronunciations
- **Quiz Mode** - Multiple choice, fill-in-the-blank, and matching exercises  
- **Spelling Practice** - Audio-to-text spelling with progressive hints and feedback
- **Smart Review** - Spaced repetition algorithm optimized for children's learning patterns

### 🏆 **Gamification System**
- **Points & Rewards** - Earn points for correct answers, streaks, and milestones
- **Achievement Badges** - "Synonym Master", "Spelling Champion", "Definition Detective"
- **Level Progression** - Explorer → Adventurer → Scholar → Expert → Master
- **Learning Streaks** - Daily goals and streak multipliers for consistent practice

### 🔊 **Rich Learning Experience**
- **200+ SSAT Vocabulary Words** curated for grades 3-4
- **Audio Pronunciations** for every single word with high-quality MP3 files
- **Visual Examples** with synonyms, antonyms, and example sentences
- **Child-Friendly UI** with smooth animations and intuitive navigation
- **Offline-Capable** Progressive Web App for learning anywhere

### 👨‍🏫 **Admin Dashboard**
- **Word List Management** - Create, edit, and organize vocabulary lists
- **Student Progress Tracking** - Detailed analytics and performance reports
- **Bulk Import/Export** - CSV/JSON support for easy content management
- **Performance Analytics** - Learning velocity, accuracy trends, and recommendations

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS** + **Radix UI** for beautiful, accessible components
- **Framer Motion** for smooth animations and micro-interactions

### **Backend**
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Edge Functions** - Serverless functions for spaced repetition algorithms
- **Row Level Security** - COPPA-compliant data protection
- **Real-time Updates** - Live progress synchronization

### **State Management**
- **Zustand** for lightweight, efficient state management
- **React Query** for server state caching and synchronization
- **React Context** for authentication and global state

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- pnpm (recommended) or npm

### **Installation**

```bash
# Clone the repository
git clone https://github.com/rong2ren/vocabquest.git
cd vocabquest

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to see the application running locally.

### **Environment Setup**

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Database Setup**

1. Create a [Supabase](https://supabase.com) project
2. Run the migrations in `supabase/migrations/` to set up the database schema
3. Deploy the Edge Functions in `supabase/functions/` for spaced repetition algorithms

## 📊 Educational Features

### **Spaced Repetition Algorithm**
- **Child-Optimized** - 60-70% compressed intervals compared to adult algorithms
- **Adaptive Scheduling** - Reviews based on individual performance and forgetting curves
- **Smart Intervals** - 1 hour → 6 hours → 1 day → 3 days → 1 week → 2 weeks → 1 month
- **Performance Tracking** - 70-85% target success rate with real-time adjustments

### **SSAT-Focused Content**
- **200 High-Quality Words** selected specifically for SSAT Elementary
- **Difficulty Levels** - Graduated from basic (Level 1) to expert (Level 5)
- **Academic Categories** - Science terms, literature vocabulary, descriptive words
- **SSAT Importance Scoring** - Words ranked by frequency on actual exams

### **Child Development Considerations**
- **Attention Span Optimization** - 16-30 minute learning sessions
- **Visual Learning Support** - Images, colors, and animations
- **Positive Reinforcement** - Encouraging feedback and celebration animations
- **Progress Visualization** - Clear progress bars and achievement unlocks

## 🎯 Target Audience

### **Primary Users: Students (Ages 8-12)**
- Elementary students in grades 3-4 preparing for SSAT Elementary
- Basic digital literacy with comfort using tablets/smartphones
- Achievement-oriented learners who respond well to visual feedback
- Prefer interactive, game-like experiences over traditional study methods

### **Secondary Users: Educators & Parents**
- Teachers seeking customizable vocabulary tools for classroom use
- Parents wanting to support their child's SSAT preparation
- Educational administrators requiring progress tracking and analytics

## 📱 Deployment

### **Vercel (Recommended)**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rong2ren/vocabquest)

The project is optimized for zero-configuration deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Vercel automatically detects the Vite/React setup
3. Add your environment variables in Vercel dashboard
4. Deploy automatically on every push to main branch

### **Other Platforms**
The project can also be deployed on:
- **Netlify** - Static site hosting with continuous deployment
- **GitHub Pages** - Free hosting for public repositories
- **Docker** - Containerized deployment for any cloud provider

## 🔧 Development

### **Project Structure**
```
vocabquest/
├── src/                    # React application source
│   ├── components/         # Reusable UI components
│   ├── pages/             # Route-level page components
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand state stores
│   ├── lib/               # Utility functions and configurations
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
│   ├── audio/             # MP3 pronunciation files
│   ├── data/              # Vocabulary datasets
│   └── images/            # Educational images and icons
├── supabase/              # Backend configuration
│   ├── functions/         # Edge Functions (serverless)
│   └── migrations/        # Database schema migrations
└── code/                  # Development scripts for audio generation
```

### **Available Scripts**
```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler

# Database
supabase start        # Start local Supabase
supabase db reset     # Reset local database
supabase functions deploy  # Deploy edge functions
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Getting Started**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### **Development Guidelines**
- Follow the existing code style and conventions
- Write TypeScript with proper type definitions
- Add tests for new features when applicable
- Update documentation for significant changes
- Ensure accessibility standards are maintained

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SSAT** for providing vocabulary standards for elementary education
- **Supabase** for the excellent backend-as-a-service platform
- **Radix UI** for accessible, unstyled component primitives
- **Framer Motion** for smooth, performant animations
- **Tailwind CSS** for utility-first styling approach

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/rong2ren/vocabquest/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rong2ren/vocabquest/discussions)
- **Email**: [Contact the maintainer](mailto:your-email@example.com)

---

<div align="center">

**Made with ❤️ for elementary students learning vocabulary**

[⭐ Star this repository](https://github.com/rong2ren/vocabquest) if you find it helpful!

</div>