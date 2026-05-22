const express = require('express');
const cors = require('cors');

const machinesRoutes = require('./routes/machines.routes');
const jigsRoutes = require('./routes/jigs.routes');
const adjustmentsRoutes = require('./routes/adjustments.routes');
const reasonsRoutes = require('./routes/reasons.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const solutionsRoutes = require('./routes/solutions.routes');
const checklistRoutes = require('./routes/checklist.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/machines', machinesRoutes);
app.use('/api/jigs', jigsRoutes);
app.use('/api/adjustments', adjustmentsRoutes);
app.use('/api/reasons', reasonsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/solutions', solutionsRoutes);
app.use('/api/checklist', checklistRoutes);

module.exports = app;