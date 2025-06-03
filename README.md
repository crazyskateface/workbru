# Workbru

Find your perfect workspace - A modern web application for discovering and reviewing workspaces, coffee shops, and coworking spaces.

## Features

- 🗺️ Interactive map view with workspace markers
- 📱 Responsive design for all devices
- 🌓 Dark/light mode support
- 🔍 Advanced search and filtering
- 📍 Real-time location-based results
- 👤 User authentication and profiles
- ⭐ Workspace ratings and reviews
- 🎯 Detailed amenity tracking
- 📊 Admin dashboard for management

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Maps**: Google Maps API
- **Backend**: Supabase
- **Database**: PostgreSQL with PostGIS
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Animations**: Anime.js

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account
- Google Maps API key
- Pica API key

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
PICA_API_KEY=your_pica_api_key
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── lib/           # Utility functions and API clients
├── pages/         # Page components
├── stores/        # State management
└── types/         # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.