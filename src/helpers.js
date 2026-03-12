// --- HELPER SELECTION LOGIC ---
window.HelperApp = {
    open: function () {
        const modal = document.getElementById('helperModal');
        const list = document.getElementById('helperList');
        if (!list) return;

        list.innerHTML = '';
        const staff = window.STAFF_LIST || {};

        for (const category in staff) {
            const header = document.createElement('div');
            header.className = 'helper-category';
            header.textContent = category === 'SISTEMA' ? '💻 SISTEMA' : '🤝 COORDINACIÓN';
            list.appendChild(header);

            staff[category].forEach(name => {
                const btn = document.createElement('button');
                btn.className = 'helper-btn-select';
                btn.innerHTML = `<span>${name}</span> ➡️`;
                btn.onclick = () => this.select(category, name);
                list.appendChild(btn);
            });
        }

        if (modal) modal.style.display = 'flex';
    },

    close: function () {
        const modal = document.getElementById('helperModal');
        if (modal) modal.style.display = 'none';
    },

    select: function (cat, name) {
        const assistant = `${cat}: ${name}`;
        localStorage.setItem('assistantName', assistant);
        alert("✅ ASIGNADO: " + name);
        this.close();
    }
};

if (document.getElementById('helperBtn')) {
    document.getElementById('helperBtn').onclick = () => window.HelperApp.open();
}
