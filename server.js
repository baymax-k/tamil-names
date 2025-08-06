const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database
const db = require('./setup-database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session management (simple session ID generation)
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// API Routes

// Get all names with filters
app.get('/api/names', (req, res) => {
    const { status, gender, category, letter, search, limit = 50, offset = 0 } = req.query;
    
    let query = `SELECT n.*, 
                        COUNT(v.id) as vote_count,
                        COUNT(f.id) as favorite_count
                 FROM names n 
                 LEFT JOIN votes v ON n.id = v.name_id 
                 LEFT JOIN favorites f ON n.id = f.name_id`;
    
    const conditions = [];
    const params = [];
    
    if (status && status !== 'all') {
        conditions.push('n.status = ?');
        params.push(status);
    } else if (!status || status === '') {
        // Default to approved names for public view only when no status is specified
        conditions.push("n.status IN ('approved', 'admin')");
    }
    // When status === 'all', don't add any status filter
    
    if (gender) {
        conditions.push('n.gender = ?');
        params.push(gender);
    }
    
    if (category) {
        conditions.push('n.category = ?');
        params.push(category);
    }
    
    if (letter) {
        conditions.push('n.name LIKE ?');
        params.push(letter + '%');
    }
    
    if (search) {
        conditions.push('(n.name LIKE ? OR n.meaning LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY n.id ORDER BY n.votes DESC, n.created_at DESC';
    
    if (limit) {
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(rows);
    });
});

// Get single name by ID
app.get('/api/names/:id', (req, res) => {
    const nameId = req.params.id;
    
    const query = `SELECT n.*, 
                          COUNT(v.id) as vote_count,
                          COUNT(f.id) as favorite_count
                   FROM names n 
                   LEFT JOIN votes v ON n.id = v.name_id 
                   LEFT JOIN favorites f ON n.id = f.name_id
                   WHERE n.id = ?
                   GROUP BY n.id`;
    
    db.get(query, [nameId], (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Name not found' });
            return;
        }
        res.json(row);
    });
});

// Submit new name
app.post('/api/names', (req, res) => {
    const { name, meaning, reference, gender, category, contributor, sessionId } = req.body;
    
    // Validation
    if (!name || !meaning || !gender || !category) {
        return res.status(400).json({ error: 'Required fields missing' });
    }
    
    const validGenders = ['ஆண்கள்', 'பெண்கள்'];
    const validCategories = ['தனித்துவமான', 'நவீன', 'தூய தமிழ்', 'இயற்கை'];
    
    if (!validGenders.includes(gender) || !validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid gender or category' });
    }
    
    // Check for duplicate names
    db.get('SELECT id FROM names WHERE name = ?', [name], (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (row) {
            res.status(409).json({ error: 'Name already exists' });
            return;
        }
        
        // Insert new name
        const query = `INSERT INTO names (name, meaning, reference, gender, category, contributor, status) 
                       VALUES (?, ?, ?, ?, ?, ?, 'pending')`;
        
        db.run(query, [name, meaning, reference || null, gender, category, contributor || null], function(err) {
            if (err) {
                console.error('Insert error:', err);
                res.status(500).json({ error: 'Failed to submit name' });
                return;
            }
            
            res.status(201).json({ 
                message: 'Name submitted successfully',
                id: this.lastID 
            });
        });
    });
});

// Vote for a name
app.post('/api/names/:id/vote', (req, res) => {
    const nameId = req.params.id;
    const { sessionId } = req.body;
    
    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
    }
    
    // Check if user already voted
    db.get('SELECT id FROM votes WHERE user_session_id = ? AND name_id = ?', 
           [sessionId, nameId], (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (row) {
            // User already voted, remove vote (toggle functionality)
            db.run('DELETE FROM votes WHERE user_session_id = ? AND name_id = ?', 
                   [sessionId, nameId], (err) => {
                if (err) {
                    res.status(500).json({ error: 'Failed to remove vote' });
                    return;
                }
                
                // Decrease vote count
                db.run('UPDATE names SET votes = votes - 1 WHERE id = ?', [nameId], (err) => {
                    if (err) {
                        res.status(500).json({ error: 'Failed to update vote count' });
                        return;
                    }
                    
                    // Get updated vote count
                    db.get('SELECT votes FROM names WHERE id = ?', [nameId], (err, nameRow) => {
                        if (err) {
                            res.status(500).json({ error: 'Database error' });
                            return;
                        }
                        
                        res.json({ 
                            message: 'Vote removed',
                            votes: nameRow.votes,
                            hasVoted: false
                        });
                    });
                });
            });
        } else {
            // Add new vote
            db.run('INSERT INTO votes (user_session_id, name_id) VALUES (?, ?)', 
                   [sessionId, nameId], (err) => {
                if (err) {
                    res.status(500).json({ error: 'Failed to add vote' });
                    return;
                }
                
                // Increase vote count
                db.run('UPDATE names SET votes = votes + 1 WHERE id = ?', [nameId], (err) => {
                    if (err) {
                        res.status(500).json({ error: 'Failed to update vote count' });
                        return;
                    }
                    
                    // Check if name should be auto-approved
                    db.get('SELECT votes, status FROM names WHERE id = ?', [nameId], (err, nameRow) => {
                        if (err) {
                            res.status(500).json({ error: 'Database error' });
                            return;
                        }
                        
                        if (nameRow.votes >= 25 && nameRow.status === 'pending') {
                            db.run('UPDATE names SET status = ? WHERE id = ?', ['approved', nameId]);
                        }
                        
                        res.json({ 
                            message: 'Vote added',
                            votes: nameRow.votes,
                            hasVoted: true
                        });
                    });
                });
            });
        }
    });
});

// Check user's votes
app.get('/api/users/:sessionId/votes', (req, res) => {
    const sessionId = req.params.sessionId;
    
    db.all('SELECT name_id FROM votes WHERE user_session_id = ?', [sessionId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        const votedNames = rows.map(row => row.name_id);
        res.json(votedNames);
    });
});

// Add to favorites
app.post('/api/names/:id/favorite', (req, res) => {
    const nameId = req.params.id;
    const { sessionId } = req.body;
    
    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
    }
    
    // Check if already favorited
    db.get('SELECT id FROM favorites WHERE user_session_id = ? AND name_id = ?', 
           [sessionId, nameId], (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (row) {
            // Remove from favorites
            db.run('DELETE FROM favorites WHERE user_session_id = ? AND name_id = ?', 
                   [sessionId, nameId], (err) => {
                if (err) {
                    res.status(500).json({ error: 'Failed to remove favorite' });
                    return;
                }
                res.json({ message: 'Removed from favorites', isFavorite: false });
            });
        } else {
            // Add to favorites
            db.run('INSERT INTO favorites (user_session_id, name_id) VALUES (?, ?)', 
                   [sessionId, nameId], (err) => {
                if (err) {
                    res.status(500).json({ error: 'Failed to add favorite' });
                    return;
                }
                res.json({ message: 'Added to favorites', isFavorite: true });
            });
        }
    });
});

// Get user favorites
app.get('/api/users/:sessionId/favorites', (req, res) => {
    const sessionId = req.params.sessionId;
    
    const query = `SELECT n.*, f.created_at as favorited_at
                   FROM names n 
                   JOIN favorites f ON n.id = f.name_id 
                   WHERE f.user_session_id = ?
                   ORDER BY f.created_at DESC`;
    
    db.all(query, [sessionId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(rows);
    });
});

// Admin Routes

// Get admin statistics
app.get('/api/admin/stats', (req, res) => {
    const queries = {
        pending: 'SELECT COUNT(*) as count FROM names WHERE status = "pending"',
        approved: 'SELECT COUNT(*) as count FROM names WHERE status = "admin"',
        totalVotes: 'SELECT SUM(votes) as total FROM names',
        contributors: 'SELECT COUNT(DISTINCT contributor) as count FROM names WHERE contributor IS NOT NULL'
    };
    
    const results = {};
    let completed = 0;
    
    Object.keys(queries).forEach(key => {
        db.get(queries[key], (err, row) => {
            if (err) {
                console.error(`Error in ${key} query:`, err);
                results[key] = 0;
            } else {
                results[key] = row.count || row.total || 0;
            }
            
            completed++;
            if (completed === Object.keys(queries).length) {
                res.json(results);
            }
        });
    });
});

// Admin approve name
app.post('/api/admin/names/:id/approve', (req, res) => {
    const nameId = req.params.id;
    
    db.run('UPDATE names SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
           ['admin', nameId], function(err) {
        if (err) {
            res.status(500).json({ error: 'Failed to approve name' });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Name not found' });
            return;
        }
        
        res.json({ message: 'Name approved successfully' });
    });
});

// Admin reject name
app.delete('/api/admin/names/:id', (req, res) => {
    const nameId = req.params.id;
    
    db.run('DELETE FROM names WHERE id = ?', [nameId], function(err) {
        if (err) {
            res.status(500).json({ error: 'Failed to delete name' });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Name not found' });
            return;
        }
        
        res.json({ message: 'Name deleted successfully' });
    });
});

// Admin update name
app.put('/api/admin/names/:id', (req, res) => {
    const nameId = req.params.id;
    const { name, meaning, reference, gender, category, contributor } = req.body;
    
    const query = `UPDATE names 
                   SET name = ?, meaning = ?, reference = ?, gender = ?, 
                       category = ?, contributor = ?, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?`;
    
    db.run(query, [name, meaning, reference, gender, category, contributor, nameId], function(err) {
        if (err) {
            res.status(500).json({ error: 'Failed to update name' });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Name not found' });
            return;
        }
        
        res.json({ message: 'Name updated successfully' });
    });
});

// Generate session ID
app.post('/api/session', (req, res) => {
    const sessionId = generateSessionId();
    res.json({ sessionId });
});

// Serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Tamil Names Website server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});

module.exports = app;
