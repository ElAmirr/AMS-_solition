const { readData, writeData } = require('../utils/fileDb');

exports.getReasons = async (req, res) => {
    try {
        const reasons = await readData('reasons.json');

        // Emulate ORDER BY category ASC, reason_label ASC
        reasons.sort((a, b) => {
            const catCompare = (a.category || '').localeCompare(b.category || '');
            if (catCompare !== 0) return catCompare;
            return (a.reason_label || '').localeCompare(b.reason_label || '');
        });

        res.json(reasons);
    } catch (err) {
        res.status(500).json({ error: 'Database error fetching reasons' });
    }
};

exports.createReason = async (req, res) => {
    const { reason_label, category } = req.body;
    try {
        const reasons = await readData('reasons.json');
        const newId = reasons.reduce((max, r) => Math.max(max, r.reason_id || 0), 0) + 1;

        reasons.push({
            reason_id: newId,
            reason_label,
            category: category || 'Autres'
        });

        await writeData('reasons.json', reasons);
        res.json({ message: 'Reason created', id: newId });
    } catch (err) {
        res.status(500).json({ error: 'Error creating reason' });
    }
};

exports.updateReason = async (req, res) => {
    const { id } = req.params;
    const { reason_label, category } = req.body;
    try {
        const reasons = await readData('reasons.json');
        const index = reasons.findIndex(r => r.reason_id == id);

        if (index !== -1) {
            reasons[index].reason_label = reason_label;
            reasons[index].category = category;
            await writeData('reasons.json', reasons);
            res.json({ message: 'Reason updated' });
        } else {
            res.status(404).json({ error: 'Reason not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error updating reason' });
    }
};

exports.deleteReason = async (req, res) => {
    const { id } = req.params;
    try {
        const reasons = await readData('reasons.json');
        const filtered = reasons.filter(r => r.reason_id != id);
        await writeData('reasons.json', filtered);
        res.json({ message: 'Reason deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting reason' });
    }
};

