const { readData, writeData } = require('../utils/fileDb');
const ExcelJS = require('exceljs');

exports.saveChecklist = async (req, res) => {
    const { jig_id, audited_by, items } = req.body;
    // items: [{ element: '...', status: 'OK/NOK/NA' }, ...]

    try {
        const checklists = await readData('jig_checklist.json');

        let startId = checklists.reduce((max, c) => Math.max(max, c.checklist_id || 0), 0) + 1;
        const now = new Date().toISOString();

        // 1. Save to JSON database
        items.forEach(item => {
            checklists.push({
                checklist_id: startId++,
                jig_id,
                audited_by,
                checked_element: item.element,
                status: item.status,
                created_at: now
            });
        });

        await writeData('jig_checklist.json', checklists);

        // 2. Fetch Jig Info for Excel
        const jigs = await readData('jigs.json');
        const jig = jigs.find(j => j.jig_id == jig_id);
        const jigName = jig ? jig.jig_identification : 'Unknown Jig';

        // 3. Generate Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Jig Checklist');

        // Styles
        const headerStyle = {
            font: { bold: true, size: 12 },
            alignment: { horizontal: 'center' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
        };

        // Layout
        worksheet.mergeCells('A1:B1');
        worksheet.getCell('A1').value = `Jig Checklist Report - ${new Date().toLocaleDateString()}`;
        worksheet.getCell('A1').style = headerStyle;

        worksheet.addRow(['Audited By:', audited_by]);
        worksheet.addRow(['Date:', new Date().toLocaleString()]);
        worksheet.addRow(['Jig Name:', jigName]);
        worksheet.addRow([]); // Empty row

        // Table Header
        const tableHeader = worksheet.addRow(['Element Verification', 'Status']);
        tableHeader.eachCell(cell => cell.style = headerStyle);

        // Data
        items.forEach(item => {
            worksheet.addRow([item.element, item.status]);
        });

        worksheet.getColumn(1).width = 40;
        worksheet.getColumn(2).width = 15;

        // Response headers for file download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=checklist_${jigName}_${Date.now()}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Error saving checklist:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getJigChecklists = async (req, res) => {
    try {
        const checklists = await readData('jig_checklist.json');
        const jigs = await readData('jigs.json');

        // Manual join
        const joined = checklists.map(c => {
            const jig = jigs.find(j => j.jig_id == c.jig_id) || {};
            return {
                ...c,
                jig_identification: jig.jig_identification
            };
        });

        // ORDER BY c.created_at DESC
        joined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        res.json(joined);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching checklists' });
    }
};

