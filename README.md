# தமிழ் பெயர்கள் (Tamil Names) - Community Website

A full-featured, community-driven Tamil baby names collection website with voting, favorites, and admin moderation features.

## Features

✅ **Complete Tamil Interface** - 100% Tamil language UI
✅ **Community Voting** - Vote toggle functionality (vote/revoke vote)
✅ **Favorites Management** - Add/remove favorites with export options
✅ **Name Submission** - Community can submit new names for approval
✅ **Admin Moderation** - Complete admin panel for managing submissions
✅ **Advanced Filtering** - By gender, category, Tamil letters, and search
✅ **Database Backend** - SQLite database with proper API endpoints
✅ **Responsive Design** - Mobile-first minimal design
✅ **Data Export** - CSV export functionality for admin

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express
- **Database**: SQLite3
- **Features**: RESTful API, Session management, Vote toggling

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   ```bash
   npm run setup
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## API Endpoints

### Public APIs
- `GET /api/names` - Get all approved names with filters
- `GET /api/names/:id` - Get single name details
- `POST /api/names` - Submit new name
- `POST /api/names/:id/vote` - Vote for name (toggle vote/unvote)
- `POST /api/names/:id/favorite` - Add/remove from favorites
- `GET /api/users/:sessionId/votes` - Get user's votes
- `GET /api/users/:sessionId/favorites` - Get user's favorites

### Admin APIs
- `GET /api/admin/stats` - Get admin statistics
- `POST /api/admin/names/:id/approve` - Approve name
- `DELETE /api/admin/names/:id` - Delete name
- `PUT /api/admin/names/:id` - Update name details

## Key Features Implemented

### Vote Toggle Functionality
- Users can vote for names and revoke their votes
- Real-time vote count updates
- Vote persistence across sessions
- Visual feedback for voted/unvoted states

### Community Features
- Name submission with validation
- Admin moderation workflow
- Auto-approval at 25+ votes
- Contributor tracking
- Category and gender filtering

### Data Management
- SQLite database for production use
- Session-based user tracking
- Bulk admin operations
- CSV export for data analysis
- Fallback to localStorage when API unavailable

## Database Schema

### Names Table
- `id`, `name`, `meaning`, `reference`, `gender`, `category`
- `contributor`, `status`, `votes`, `created_at`, `updated_at`

### Votes Table
- User session tracking with vote history
- Prevents duplicate voting
- Supports vote toggle functionality

### Favorites Table
- User-specific favorites list
- Session-based persistence

## File Structure

```
├── server.js              # Express server
├── setup-database.js      # Database initialization
├── api-client.js          # Frontend API client
├── script.js              # Main frontend logic
├── styles.css             # Styling
├── index.html             # Homepage
├── names.html             # Names browser
├── submit.html            # Name submission
├── favorites.html         # Favorites management
├── admin.html             # Admin panel
└── about.html             # About page
```

## Production Deployment

1. Set environment variables in `.env`
2. Run `npm start` to start the server
3. Access the website at `http://localhost:3000`
4. Admin panel available at `/admin.html`

## Contributing

This website preserves Tamil cultural heritage through community participation. Contributors can:
- Submit new meaningful Tamil names
- Vote on name quality and authenticity
- Help moderate submissions through the admin panel

## License

MIT License - Feel free to use and modify for educational and cultural preservation purposes.

---

**Built with ❤️ for Tamil culture and language preservation**
