const { readData } = require('../utils/fileDb');

exports.login = async (req, res) => {
    const { user_name, password } = req.body;

    try {
        const users = await readData('users.json');
        const user = users.find(u => u.user_name === user_name);

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Simple password matching
        if (password !== user.password) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Don't send the password back
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error during login' });
    }
};
