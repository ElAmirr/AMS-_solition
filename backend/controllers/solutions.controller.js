const { readData, writeData } = require('../utils/fileDb');

// Jig Solutions
exports.getJigSolutions = async (req, res) => {
    try {
        const solutions = await readData('solution_for_jigs.json');
        res.json(solutions);
    } catch (err) {
        console.error('Error fetching jig solutions:', err);
        res.status(500).json({ error: 'Database error fetching jig solutions' });
    }
};

exports.createJigSolution = async (req, res) => {
    const { solution_for_jigs_label } = req.body;
    try {
        const solutions = await readData('solution_for_jigs.json');
        const newId = solutions.reduce((max, s) => Math.max(max, s.solution_for_jigs_id || 0), 0) + 1;

        solutions.push({
            solution_for_jigs_id: newId,
            solution_for_jigs_label
        });

        await writeData('solution_for_jigs.json', solutions);
        res.json({ message: 'Jig solution created', id: newId });
    } catch (err) {
        res.status(500).json({ error: 'Error creating jig solution' });
    }
};

exports.updateJigSolution = async (req, res) => {
    const { id } = req.params;
    const { solution_for_jigs_label } = req.body;
    try {
        const solutions = await readData('solution_for_jigs.json');
        const index = solutions.findIndex(s => s.solution_for_jigs_id == id);

        if (index !== -1) {
            solutions[index].solution_for_jigs_label = solution_for_jigs_label;
            await writeData('solution_for_jigs.json', solutions);
            res.json({ message: 'Jig solution updated' });
        } else {
            res.status(404).json({ error: 'Jig solution not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error updating jig solution' });
    }
};

exports.deleteJigSolution = async (req, res) => {
    const { id } = req.params;
    try {
        const solutions = await readData('solution_for_jigs.json');
        const filtered = solutions.filter(s => s.solution_for_jigs_id != id);
        await writeData('solution_for_jigs.json', filtered);
        res.json({ message: 'Jig solution deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting jig solution' });
    }
};

// Program Solutions
exports.getProgramSolutions = async (req, res) => {
    try {
        const solutions = await readData('solution_for_program.json');
        res.json(solutions);
    } catch (err) {
        console.error('Error fetching program solutions:', err);
        res.status(500).json({ error: 'Database error fetching program solutions' });
    }
};

exports.createProgramSolution = async (req, res) => {
    const { solution_for_program_label } = req.body;
    try {
        const solutions = await readData('solution_for_program.json');
        const newId = solutions.reduce((max, s) => Math.max(max, s.solution_for_program_id || 0), 0) + 1;

        solutions.push({
            solution_for_program_id: newId,
            solution_for_program_label
        });

        await writeData('solution_for_program.json', solutions);
        res.json({ message: 'Program solution created', id: newId });
    } catch (err) {
        res.status(500).json({ error: 'Error creating program solution' });
    }
};

exports.updateProgramSolution = async (req, res) => {
    const { id } = req.params;
    const { solution_for_program_label } = req.body;
    try {
        const solutions = await readData('solution_for_program.json');
        const index = solutions.findIndex(s => s.solution_for_program_id == id);

        if (index !== -1) {
            solutions[index].solution_for_program_label = solution_for_program_label;
            await writeData('solution_for_program.json', solutions);
            res.json({ message: 'Program solution updated' });
        } else {
            res.status(404).json({ error: 'Program solution not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error updating program solution' });
    }
};

exports.deleteProgramSolution = async (req, res) => {
    const { id } = req.params;
    try {
        const solutions = await readData('solution_for_program.json');
        const filtered = solutions.filter(s => s.solution_for_program_id != id);
        await writeData('solution_for_program.json', filtered);
        res.json({ message: 'Program solution deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting program solution' });
    }
};
