const { readData, writeData } = require('../utils/fileDb');

exports.getUsers = async (req, res) => {
    try {
        const users = await readData('users.json');
        // Filter out passwords
        const returnedUsers = users.map(u => ({
            user_id: u.user_id,
            user_name: u.user_name,
            role: u.role
        }));
        res.json(returnedUsers);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching users' });
    }
};

exports.createUser = async (req, res) => {
    const { user_name, password, role } = req.body;
    try {
        const users = await readData('users.json');

        if (users.find(u => u.user_name === user_name)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const newId = users.reduce((max, u) => Math.max(max, u.user_id || 0), 0) + 1;

        users.push({
            user_id: newId,
            user_name,
            password,
            role
        });

        await writeData('users.json', users);
        res.json({ message: 'User created', id: newId });
    } catch (err) {
        res.status(500).json({ error: 'Error creating user' });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { user_name, password, role } = req.body;
    try {
        const users = await readData('users.json');
        const index = users.findIndex(u => u.user_id == id);

        if (index !== -1) {
            users[index].user_name = user_name;
            users[index].role = role;
            if (password && password.trim() !== '') {
                users[index].password = password;
            }
            await writeData('users.json', users);
            res.json({ message: 'User updated' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error updating user' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const users = await readData('users.json');
        const filtered = users.filter(u => u.user_id != id);
        await writeData('users.json', filtered);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting user' });
    }
};
