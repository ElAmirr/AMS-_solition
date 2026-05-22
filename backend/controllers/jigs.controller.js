const { readData, writeData } = require('../utils/fileDb');

exports.getJigs = async (req, res) => {
  try {
    const jigs = await readData('jigs.json');
    res.json(jigs);
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching jigs' });
  }
};

exports.createJig = async (req, res) => {
  const { jig_identification, program } = req.body;
  try {
    const jigs = await readData('jigs.json');
    const newId = jigs.reduce((max, j) => Math.max(max, j.jig_id || 0), 0) + 1;

    jigs.push({
      jig_id: newId,
      jig_identification,
      program
    });

    await writeData('jigs.json', jigs);
    res.json({ message: 'Jig created', id: newId });
  } catch (err) {
    res.status(500).json({ error: 'Error creating jig' });
  }
};

exports.updateJig = async (req, res) => {
  const { id } = req.params;
  const { jig_identification, program } = req.body;
  try {
    const jigs = await readData('jigs.json');
    const index = jigs.findIndex(j => j.jig_id == id);

    if (index !== -1) {
      jigs[index].jig_identification = jig_identification;
      jigs[index].program = program;
      await writeData('jigs.json', jigs);
      res.json({ message: 'Jig updated' });
    } else {
      res.status(404).json({ error: 'Jig not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error updating jig' });
  }
};

exports.deleteJig = async (req, res) => {
  const { id } = req.params;
  try {
    const jigs = await readData('jigs.json');
    const filtered = jigs.filter(j => j.jig_id != id);
    await writeData('jigs.json', filtered);
    res.json({ message: 'Jig deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting jig' });
  }
};