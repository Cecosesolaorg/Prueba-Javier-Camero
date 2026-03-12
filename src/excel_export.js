// --- EXPORT TO EXCEL PREMIUM LOGIC ---
window.ExportApp = {
    downloadAisle: async function (aisleTitle, responsable, companero, products, inventoryData) {
        // Validation: All items with qty > 0 must be marked Green (state 1)
        const allGreen = products.every(p => {
            const d = inventoryData[p];
            return (d && d.qty > 0) ? d.checkState === 1 : true;
        });

        if (!allGreen) {
            alert("❌ ERROR: Debes marcar en VERDE todos los productos con cantidad mayor a 0 antes de descargar.");
            return;
        }

        if (typeof ExcelJS === 'undefined') {
            alert("⚠️ Error: Librería ExcelJS no detectada. Revisa tu conexión.");
            return;
        }

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Inventario');

        // Style Helpers
        const darkGreen = 'FF1B5E20';
        const midGreen = 'FF2E7D32';
        const lightGreen = 'FFE8F5E9';
        const tableGreen = 'FF388E3C';
        const white = 'FFFFFFFF';
        const red = 'FFFF0000';

        // 1. Cabecera Principal
        const row1 = ws.getRow(1);
        row1.values = ["INVENTARIO DE VIVERES 🗃️ CECOSESOLA R.L J085030140 🗃️"];
        ws.mergeCells('A1:D1');
        row1.height = 30;
        row1.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: white } };
        row1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkGreen } };
        row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // 2. Sub-cabecera
        const row2 = ws.getRow(2);
        row2.values = [`${aisleTitle} 🛒 DE FERIA DEL ESTE 🛒`];
        ws.mergeCells('A2:D2');
        row2.height = 25;
        row2.getCell(1).font = { name: 'Arial', size: 12, bold: true, color: { argb: white } };
        row2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: midGreen } };
        row2.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // 3. Info Sesión
        ws.addRow(["FECHA", new Date().toLocaleDateString()]); ""; "";
        ws.addRow(["RESPONSABLE DIRECTO", responsable.toUpperCase()]); ""; "";
        ws.addRow(["COMPAÑERO :", companero.toUpperCase()]); ""; "";
        ws.addRow(["AYUDANTE :", (localStorage.getItem('assistantName') || "SIN ASIGNAR").toUpperCase()]); ""; "";

        const totalCounted = Object.values(inventoryData).filter(p => p.checkState === 1 && (p.qty > 0)).length;
        const rTotal = ws.addRow(["TOTAL PRODUCTOS CONTADOS", totalCounted]);
        rTotal.getCell(1).font = { bold: true, color: { argb: white } }; // Removed red color, defaults to black
        rTotal.getCell(4).font = { bold: true }; // Removed red color, defaults to black

        ws.addRow([]); // Spacer

        // 4. Encabezados Tabla
        const hRow = ws.addRow(["🖐️ PRODUCTO", "HISTORIAL", "CANTIDAD", "DIF"]);
        hRow.eachCell((cell, col) => {
            cell.font = { bold: true, color: { argb: white } }; // All headers white
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tableGreen } }; // All headers green
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { horizontal: 'center' };
        });

        // 5. Datos
        const isFullList = document.getElementById('fullListToggle')?.checked;
        const listToExport = products.filter(p => isFullList || (inventoryData[p] && inventoryData[p].checkState > 0));

        listToExport.forEach((p, idx) => {
            const data = inventoryData[p] || { qty: 0, history: "0", checkState: 0, redQty: null };
            let diffValue = (data.redQty !== null && data.checkState > 0) ? (data.qty - data.redQty) : "";

            const row = ws.addRow([p, data.history || "0", data.qty, diffValue]);
            row.eachCell((cell, col) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (col === 4 && diffValue !== "") cell.font = { color: { argb: red }, bold: true };
                if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGreen } };
            });
        });

        ws.getColumn(1).width = 45;
        ws.getColumn(2).width = 40;
        ws.getColumn(3).width = 20;
        ws.getColumn(4).width = 10;

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${responsable.toLowerCase()}.${aisleTitle.toLowerCase()}.xlsx`);

        // Firebase Sync (Backup)
        try {
            const today = new Date().toISOString().split('T')[0];
            firebase.database().ref(`respaldos/${today}/${aisleTitle}/${responsable.toUpperCase()}`).set({
                timestamp: new Date().toLocaleString(),
                responsable: responsable,
                ayudante: localStorage.getItem('assistantName'),
                data: inventoryData
            });
        } catch (e) { }
    }
};
