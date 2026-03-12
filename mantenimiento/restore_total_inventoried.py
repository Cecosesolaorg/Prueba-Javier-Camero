import os

base_dir = r"c:\Users\javic\OneDrive\Desktop\inventario\contenedor"

expected_bad_fragment_start = "            const hasChecklistItems ="

correct_fragment = """            const hasChecklistItems = Object.values(inventoryData).some(p => p.checkState === 1 || p.checkState === 2);
            if (!hasChecklistItems) {
                alert("❌ PARA DESCARGAR, DEBE TENER AL MENOS UN PRODUCTO MARCADO EN EL CHECKLIST (VERDE O ROJO).");
                return;
            }
            const totalInventoried = Object.values(inventoryData).filter(p => p.checkState === 1 && (p.qty > 0)).length;"""

for i in range(1, 18):
    p_dir = os.path.join(base_dir, f"pasillo{i}")
    js_file = os.path.join(p_dir, "pasillo.js")
    
    if not os.path.exists(js_file): continue
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.splitlines()
    new_lines = []
    skip = 0
    for idx, line in enumerate(lines):
        if skip > 0:
            skip -= 1
            continue
            
        if expected_bad_fragment_start in line:
            # Check next lines to see if it's the block we just added
            if idx + 4 < len(lines) and "alert" in lines[idx+2] and "return" in lines[idx+3]:
                new_lines.append(correct_fragment)
                skip = 4
                continue
        
        new_lines.append(line)
    
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(new_lines))

print("Referencia a totalInventoried restaurada.")
