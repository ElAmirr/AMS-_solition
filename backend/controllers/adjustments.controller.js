const { readData, writeData } = require('../utils/fileDb');

exports.createAdjustment = async (req, res) => {
  const { machine_id, jig_id, reason, requested_by } = req.body;

  try {
    const adjustments = await readData('adjustments.json');
    const newId = adjustments.reduce((max, a) => Math.max(max, a.adjustment_id || 0), 0) + 1;

    const newAdjustment = {
      adjustment_id: newId,
      machine_id,
      jig_id,
      reason,
      requested_by,
      adjustement_status: 'OPEN',
      created_at: new Date().toISOString()
    };

    adjustments.push(newAdjustment);
    await writeData('adjustments.json', adjustments);

    res.status(201).json({
      message: 'Intervention request created',
      adjustment_id: newId
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creating adjustment' });
  }
};

exports.getAdjustments = async (req, res) => {
  const { status } = req.query;

  try {
    let adjustments = await readData('adjustments.json');
    const machines = await readData('machines.json');
    const jigs = await readData('jigs.json');

    if (status) {
      adjustments = adjustments.filter(a => a.adjustement_status === status);
    }

    // Manual Join
    const joined = adjustments.map(a => {
      const machine = machines.find(m => m.machine_id == a.machine_id) || {};
      const jig = jigs.find(j => j.jig_id == a.jig_id) || {};

      return {
        ...a,
        machine_name: machine.machine_name,
        jig_identification: jig.jig_identification,
        program: jig.program
      };
    });

    // ORDER BY created_at DESC
    joined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    res.json(joined);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching adjustments' });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, solved_by, solution, canceled_reason } = req.body;

  const validStatuses = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  if (status === 'CANCELLED' && !canceled_reason) {
    return res.status(400).json({ error: 'canceled_reason is required when cancelling' });
  }

  if (status === 'CLOSED' && !solution) {
    return res.status(400).json({ error: 'solution is required when closing' });
  }

  try {
    const adjustments = await readData('adjustments.json');
    const index = adjustments.findIndex(a => a.adjustment_id == id);

    if (index === -1) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }

    const adjustment = adjustments[index];
    adjustment.adjustement_status = status;

    if (solved_by) adjustment.solved_by = solved_by;
    if (solution) adjustment.solution = solution;
    if (canceled_reason) adjustment.canceled_reason = canceled_reason;

    if (status === 'IN_PROGRESS' && !adjustment.started_at) {
      adjustment.started_at = new Date().toISOString();
    }

    if (status === 'CLOSED' || status === 'CANCELLED') {
      adjustment.ended_at = new Date().toISOString();
    }

    await writeData('adjustments.json', adjustments);

    res.json({ message: 'Adjustment updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating adjustment' });
  }
};

exports.deleteAdjustment = async (req, res) => {
  const { id } = req.params;
  try {
    const adjustments = await readData('adjustments.json');
    const filtered = adjustments.filter(a => a.adjustment_id != id);
    await writeData('adjustments.json', filtered);
    res.json({ message: 'Adjustment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting adjustment' });
  }
};