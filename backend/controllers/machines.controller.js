const { readData, writeData } = require('../utils/fileDb');

exports.getMachines = async (req, res) => {
  try {
    const machines = await readData('machines.json');
    res.json(machines);
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching machines' });
  }
};

exports.createMachine = async (req, res) => {
  const { machine_name } = req.body;
  try {
    const machines = await readData('machines.json');
    const newId = machines.reduce((max, m) => Math.max(max, m.machine_id || 0), 0) + 1;

    const newMachine = {
      machine_id: newId,
      machine_name
    };

    machines.push(newMachine);
    await writeData('machines.json', machines);

    res.json({ message: 'Machine created', id: newId });
  } catch (err) {
    res.status(500).json({ error: 'Error creating machine' });
  }
};

exports.updateMachine = async (req, res) => {
  const { id } = req.params;
  const { machine_name } = req.body;
  try {
    const machines = await readData('machines.json');
    const index = machines.findIndex(m => m.machine_id == id);

    if (index !== -1) {
      machines[index].machine_name = machine_name;
      await writeData('machines.json', machines);
      res.json({ message: 'Machine updated' });
    } else {
      res.status(404).json({ error: 'Machine not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error updating machine' });
  }
};

exports.deleteMachine = async (req, res) => {
  const { id } = req.params;
  try {
    const machines = await readData('machines.json');
    const filtered = machines.filter(m => m.machine_id != id);
    await writeData('machines.json', filtered);
    res.json({ message: 'Machine deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting machine' });
  }
};