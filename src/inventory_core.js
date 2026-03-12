window.InventoryCore = {
    render: function (inventoryBody, products, inventoryData, searchTerm, aisleId, options = {}) {
        if (!inventoryBody) return;
        inventoryBody.innerHTML = '';

        const countedEl = document.getElementById('counted-total');
        const totalC = Object.values(inventoryData).filter(p => p.checkState === 1 && (p.qty > 0)).length;
        if (countedEl) countedEl.textContent = totalC;

        const filtered = products.filter(p => {
            if (!p.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (options.onlyWithStock) {
                const qty = (inventoryData[p] || {}).qty || 0;
                return qty > 0;
            }
            return true;
        });

        filtered.forEach(p => {
            const data = inventoryData[p] || { qty: 0, history: "0", checkState: 0, redQty: null };
            const row = document.createElement('tr');
            row.className = 'product-row';

            let diffV = "", diffC = "";
            if (data.redQty !== null && data.redQty !== undefined && (data.checkState > 0)) {
                const diff = (data.qty || 0) - (data.redQty || 0);
                diffV = diff > 0 ? `+${diff}` : `${diff}`;
                diffC = diff > 0 ? "diff-positive" : "diff-negative";
                if (diff === 0) diffV = "0";
            }

            const hText = ""; // History hidden by user request

            row.innerHTML = `
                <td class="col-check">
                    <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <div class="indicator state-${data.checkState || 0}"></div> 
                        <div style="display: flex; flex-direction: column;">
                            <span class="product-name" style="font-weight: 700;">${p}</span>
                            ${hText}
                        </div>
                        <span class="edit-btn" style="margin-left: 10px; cursor: pointer;">✏️</span>
                    </div>
                </td>
                <td class="col-qty" style="cursor: pointer; text-align: center;">
                    <span class="qty-val">${data.qty ?? 0}</span>
                </td>
                <td class="col-diff ${diffC}" style="text-align: center;">${diffV}</td>
            `;

            row.querySelector('.indicator').onclick = (e) => {
                e.stopPropagation();
                if (options.onCheckToggle) options.onCheckToggle(p);
            };

            row.querySelector('.col-qty').onclick = () => {
                if (options.onOpenCalc) options.onOpenCalc(p);
            };

            row.querySelector('.edit-btn').onclick = (e) => {
                e.stopPropagation();
                if (options.onEditClick) options.onEditClick(p);
            };

            inventoryBody.appendChild(row);
        });
    }
};
