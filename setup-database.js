const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database setup
const dbPath = path.join(__dirname, 'database', 'tamil_names.db');

// Create database directory if it doesn't exist
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Create tables
    db.serialize(() => {
        // Names table
        db.run(`CREATE TABLE IF NOT EXISTS names (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            meaning TEXT NOT NULL,
            reference TEXT,
            gender TEXT NOT NULL CHECK(gender IN ('ஆண்கள்', 'பெண்கள்')),
            category TEXT NOT NULL CHECK(category IN ('தனித்துவமான', 'நவீன', 'தூய தமிழ்', 'இயற்கை')),
            contributor TEXT,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'admin', 'rejected')),
            votes INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Users table for tracking votes and favorites
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Votes table for tracking user votes
        db.run(`CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_session_id TEXT NOT NULL,
            name_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (name_id) REFERENCES names (id) ON DELETE CASCADE,
            UNIQUE(user_session_id, name_id)
        )`);

        // Favorites table
        db.run(`CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_session_id TEXT NOT NULL,
            name_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (name_id) REFERENCES names (id) ON DELETE CASCADE,
            UNIQUE(user_session_id, name_id)
        )`);

        // Admin users table
        db.run(`CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT,
            role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'super_admin')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Analytics table for tracking website statistics
        db.run(`CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            data TEXT,
            user_session_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create indexes for better performance
        db.run(`CREATE INDEX IF NOT EXISTS idx_names_status ON names(status)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_names_gender ON names(gender)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_names_category ON names(category)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_votes_user_session ON votes(user_session_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_votes_name_id ON votes(name_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_favorites_user_session ON favorites(user_session_id)`);

        // Insert sample data
        insertSampleData();
    });
}

function insertSampleData() {
    const sampleNames = [
        // Approved Tamil Names
        {
            name: 'அருள்மொழி',
            meaning: 'அருளின் மொழி பேசுபவர்',
            reference: 'சோழ வம்சத்தில் பிரசித்தி பெற்ற பெயர்',
            gender: 'ஆண்கள்',
            category: 'தூய தமிழ்',
            contributor: 'தமிழ் ஆர்வலர்',
            status: 'admin',
            votes: 45
        },
        {
            name: 'கவிதா',
            meaning: 'கவிதை போன்றவள்',
            reference: 'இலக்கியத்தில் பிரபலமான பெயர்',
            gender: 'பெண்கள்',
            category: 'நவீன',
            contributor: 'கவிஞர் குடும்பம்',
            status: 'admin',
            votes: 38
        },
        {
            name: 'வேதன்',
            meaning: 'வேதங்களை அறிந்தவன்',
            reference: 'பண்டைய தமிழ் இலக்கியம்',
            gender: 'ஆண்கள்',
            category: 'தூய தமிழ்',
            contributor: 'வரலாற்று ஆராய்ச்சியாளர்',
            status: 'admin',
            votes: 52
        },
        {
            name: 'முல்லை',
            meaning: 'முல்லை மலர்',
            reference: 'குறிஞ்சி, முல்லை, மருதம், நெய்தல், பாலை',
            gender: 'பெண்கள்',
            category: 'இயற்கை',
            contributor: 'இயற்கை ஆர்வலர்',
            status: 'admin',
            votes: 41
        },
        {
            name: 'தென்றல்',
            meaning: 'மெல்லிய காற்று',
            reference: 'இயற்கையின் அழகிய நிகழ்வு',
            gender: 'பெண்கள்',
            category: 'இயற்கை',
            contributor: 'கவிஞர்',
            status: 'admin',
            votes: 33
        },
        {
            name: 'நிலவன்',
            meaning: 'நிலவு போன்றவன்',
            reference: 'நிலவின் அழகை குறிக்கும் பெயர்',
            gender: 'ஆண்கள்',
            category: 'தனித்துவமான',
            contributor: 'ஜோதிடர்',
            status: 'admin',
            votes: 29
        },
        {
            name: 'இன்பமொழி',
            meaning: 'இனிய மொழி பேசுபவள்',
            reference: 'சங்க காலத்து பெயர்',
            gender: 'பெண்கள்',
            category: 'தூய தமிழ்',
            contributor: 'தமிழ் அறிஞர்',
            status: 'admin',
            votes: 36
        },
        {
            name: 'அறிவன்',
            meaning: 'அறிவு நிறைந்தவன்',
            reference: 'திருக்குறளில் குறிப்பிடப்பட்ட குணம்',
            gender: 'ஆண்கள்',
            category: 'தனித்துவமான',
            contributor: 'குறள் ஆராய்ச்சியாளர்',
            status: 'admin',
            votes: 48
        },
        // Additional Tamil Names for variety
        {
            name: 'கமலா',
            meaning: 'தாமரை மலர்',
            reference: 'இந்திய புராணங்களில் அழகின் சின்னம்',
            gender: 'பெண்கள்',
            category: 'இயற்கை',
            contributor: 'மலர் ஆர்வலர்',
            status: 'admin',
            votes: 42
        },
        {
            name: 'ஆதிமன்',
            meaning: 'முதல் மனிதன்',
            reference: 'சங்க இலக்கியத்தில் குறிப்பிடப்பட்ட பெயர்',
            gender: 'ஆண்கள்',
            category: 'தூய தமிழ்',
            contributor: 'இலக்கிய ஆராய்ச்சியாளர்',
            status: 'admin',
            votes: 39
        },
        {
            name: 'சுந்தரி',
            meaning: 'அழகானவள்',
            reference: 'தமிழ் கவிதைகளில் அடிக்கடி வரும் பெயர்',
            gender: 'பெண்கள்',
            category: 'தனித்துவமான',
            contributor: 'கவிதை ஆர்வலர்',
            status: 'admin',
            votes: 44
        },
        {
            name: 'வேல்',
            meaning: 'முருகனின் ஆயுதம்',
            reference: 'திருமுருகனின் வேல்',
            gender: 'ஆண்கள்',
            category: 'தூய தமிழ்',
            contributor: 'பக்தி இலக்கிய ஆர்வலர்',
            status: 'admin',
            votes: 37
        },
        {
            name: 'மணி',
            meaning: 'விலையுயர்ந்த கல்',
            reference: 'பண்டைய தமிழர்களின் நகைகளில் பயன்படும்',
            gender: 'பெண்கள்',
            category: 'தனித்துவமான',
            contributor: 'வரலாற்று ஆர்வலர்',
            status: 'admin',
            votes: 35
        },
        {
            name: 'கார்த்திக்',
            meaning: 'முருகப் பெருமான்',
            reference: 'கார்த்திகை மாதத்தில் பிறந்தவர்',
            gender: 'ஆண்கள்',
            category: 'தூய தமிழ்',
            contributor: 'ஜோதிட ஆராய்ச்சியாளர்',
            status: 'admin',
            votes: 46
        },
        {
            name: 'பூவழகி',
            meaning: 'மலர் போல் அழகானவள்',
            reference: 'இயற்கையின் அழகை குறிக்கும் பெயர்',
            gender: 'பெண்கள்',
            category: 'இயற்கை',
            contributor: 'இயற்கை கவிஞர்',
            status: 'admin',
            votes: 40
        },
        // Pending names for admin review
        {
            name: 'ஆகாசன்',
            meaning: 'வானம் போன்றவன்',
            reference: 'விசாலமான மனம் கொண்டவன்',
            gender: 'ஆண்கள்',
            category: 'நவீன',
            contributor: 'நவீன பெற்றோர்',
            status: 'pending',
            votes: 12
        },
        {
            name: 'தாமரை',
            meaning: 'புனித தாமரை மலர்',
            reference: 'ஆன்மிக தூய்மையின் அடையாளம்',
            gender: 'பெண்கள்',
            category: 'இயற்கை',
            contributor: 'ஆன்மிக ஆர்வலர்',
            status: 'pending',
            votes: 18
        },
        {
            name: 'விக்ரம்',
            meaning: 'வீரம் மிக்கவன்',
            reference: 'வீர வரலாற்றில் பிரபலமான பெயர்',
            gender: 'ஆண்கள்',
            category: 'தனித்துவமான',
            contributor: 'வீர கதை ஆர்வலர்',
            status: 'pending',
            votes: 15
        },
        {
            name: 'மீனாட்சி',
            meaning: 'மீன் போன்ற கண்கள் கொண்டவள்',
            reference: 'மதுரை மீனாட்சி அம்மன்',
            gender: 'பெண்கள்',
            category: 'தூய தமிழ்',
            contributor: 'தமிழ் கலாச்சார ஆர்வலர்',
            status: 'pending',
            votes: 22
        },
        {
            name: 'செல்வன்',
            meaning: 'செல்வம் மிக்கவன்',
            reference: 'வளமையின் அடையாளம்',
            gender: 'ஆண்கள்',
            category: 'நவீன',
            contributor: 'வணிகர் குடும்பம்',
            status: 'pending',
            votes: 8
        }
    ];

    // Check if sample data already exists
    db.get("SELECT COUNT(*) as count FROM names", (err, row) => {
        if (err) {
            console.error('Error checking existing data:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('Inserting sample data...');
            const stmt = db.prepare(`INSERT INTO names 
                (name, meaning, reference, gender, category, contributor, status, votes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            
            sampleNames.forEach(name => {
                stmt.run([
                    name.name,
                    name.meaning,
                    name.reference,
                    name.gender,
                    name.category,
                    name.contributor,
                    name.status,
                    name.votes
                ]);
            });
            
            stmt.finalize();
            console.log('Sample data inserted successfully!');
        }
    });
}

module.exports = db;
