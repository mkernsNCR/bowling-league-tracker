# BowlTrack - Bowling League Score Tracker

A comprehensive bowling league management system with handicap support, AI-powered photo scanning, and real-time score tracking.

## 🎯 Features

- **League Management**: Create and manage bowling leagues with customizable rules
- **Handicap Support**: Configurable handicap basis, percentage, and maximum values
- **Point Systems**: Flexible point allocation (simple or matchup-based)
- **AI Photo Scanning**: Automatically extract scores from bowling photos using OCR
- **Real-time Updates**: Live score tracking and standings calculations
- **Responsive Design**: Modern UI built with React and Tailwind CSS

## 🏗️ Application Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast development server and build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **Wouter** - Lightweight routing
- **React Query** - Server state management
- **React Hook Form** - Form handling with validation

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe backend development
- **Drizzle ORM** - Database toolkit
- **PostgreSQL** - Primary database
- **Passport.js** - Authentication
- **OpenAI API** - AI-powered OCR functionality
- **WebSocket** - Real-time communication

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **tsx** - TypeScript execution

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenAI API key (for photo scanning feature)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bowling-league-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/bowling_league
   
   # OpenAI (for OCR functionality)
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Server
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up the database**
   
   Make sure PostgreSQL is running and create the database:
   ```sql
   CREATE DATABASE bowling_league;
   ```
   
   Push the database schema:
   ```bash
   npm run db:push
   ```

### Running the Application

#### Development Mode

Start the development server (runs both frontend and backend):
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

- Frontend hot-reloads automatically
- Backend restarts on changes
- Database migrations are applied automatically

#### Production Mode

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
bowling-league-tracker/
├── client/                 # Frontend React application
│   ├── index.html         # HTML template
│   ├── public/            # Static assets
│   └── src/               # React components and pages
├── server/                # Backend Express application
│   ├── index.ts           # Main server entry point
│   ├── routes.ts          # API routes
│   ├── ocr.ts             # OpenAI OCR integration
│   ├── storage.ts         # Database operations
│   └── vite.ts            # Vite development setup
├── shared/                # Shared types and schemas
│   └── schema.ts          # Zod validation schemas
├── migrations/            # Database migration files
├── script/                # Build and utility scripts
└── package.json           # Dependencies and scripts
```

## 🎳 Core Concepts

### League Configuration

Each league supports:
- **Team Size**: 1-10 bowlers per team
- **Games Per Session**: 1-5 games
- **Season Length**: 1-52 weeks
- **Handicap System**: 
  - Basis: 180-250 pins
  - Percentage: 0-100%
  - Maximum handicap: 0-100 pins

### Point Systems

#### Simple System
- Points awarded for overall wins/ties/losses
- Configurable points for each outcome

#### Matchup System
- **Individual Game Points**: Bowler vs opponent each game
- **Team Game Points**: Team totals for each game
- **Team Series Points**: Overall series totals
- **Bonus Points**: Optional series bonuses

### AI Photo Scanning

The application uses OpenAI's vision API to:
1. Extract bowling scores from photos
2. Identify bowler names and frame-by-frame scores
3. Automatically populate score entries

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run check        # TypeScript type checking

# Database
npm run db:push      # Push schema changes to database

# Production
npm run build        # Build for production
npm start           # Start production server
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Leagues**: League configuration and rules
- **Teams**: Team information and league association
- **Bowlers**: Individual bowler details and averages
- **Games**: Individual game scores and results
- **Standings**: Calculated league standings

## 🔐 Authentication

The application uses Passport.js with local authentication strategy:
- Session-based authentication
- Secure password hashing
- User management interface

## 🌐 API Endpoints

The application provides RESTful APIs for:
- League management (`/api/leagues`)
- Team operations (`/api/teams`)
- Bowler management (`/api/bowlers`)
- Score tracking (`/api/games`)
- OCR processing (`/api/ocr`)
- Authentication (`/api/auth`)

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablet devices
- Mobile phones (iOS and Android)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Ensure database exists

**OCR Not Working**
- Verify OpenAI API key is valid
- Check API quota and usage
- Ensure image format is supported

**Build Errors**
- Run `npm install` to update dependencies
- Check Node.js version (18+ required)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

### Getting Help

- Check the console for error messages
- Review the database logs
- Verify environment variables are set correctly
