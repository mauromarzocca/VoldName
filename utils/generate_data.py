import os
import re
import json
import unicodedata
from pathlib import Path

# Configurazione
RAW_DIR = Path("data/raw")
BUILD_DIR = Path("data/build")

# Crea cartelle se non esistono
BUILD_DIR.mkdir(parents=True, exist_ok=True)

def normalize_name(name: str) -> str:
    """Normalizza un nome: minuscole, senza accenti, solo lettere."""
    # Rimuovi spazi iniziali/finali
    name = name.strip()
    # Converte in minuscolo
    name = name.lower()
    # Rimuovi accenti (es. à → a)
    name = unicodedata.normalize('NFD', name)
    name = ''.join(c for c in name if unicodedata.category(c) != 'Mn')
    # Mantieni solo lettere a-z
    name = re.sub(r'[^a-z]', '', name)
    return name

def load_raw_names(filepath: Path, min_len: int = 2, max_len: int = 15) -> list:
    """
    Carica nomi/cognomi da file di testo o CSV.
    Supporta:
      - file .txt con un nome per riga
      - file .csv con una colonna (senza header)
    """
    names = set()
    if filepath.suffix == '.csv':
        import csv
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if row:
                    raw = row[0]
                    clean = normalize_name(raw)
                    if min_len <= len(clean) <= max_len and clean:
                        names.add(clean)
    else:
        # .txt o altro: una parola per riga
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                raw = line.strip()
                clean = normalize_name(raw)
                if min_len <= len(clean) <= max_len and clean:
                    names.add(clean)
    return sorted(names)

def save_json(data: list, filepath: Path):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

def main():
    print("🔍 Generazione dizionari per VoldName...")

    # Configurazione per ogni lingua
    configs = [
        {"lang": "it", "type": "names", "file": "it_names_raw.txt"},
        {"lang": "it", "type": "surnames", "file": "it_surnames_raw.txt"},
        {"lang": "en", "type": "names", "file": "en_names_raw.csv"},
        {"lang": "en", "type": "surnames", "file": "en_surnames_raw.txt"},
    ]

    for cfg in configs:
        raw_path = RAW_DIR / cfg["file"]
        if not raw_path.exists():
            print(f"⚠️  File mancante: {raw_path} — saltato")
            continue

        print(f"   ➤ Caricamento {cfg['lang']} {cfg['type']} da {raw_path.name}...")
        names = load_raw_names(raw_path)
        print(f"     → {len(names)} voci uniche")

        output_path = BUILD_DIR / f"{cfg['lang']}_{cfg['type']}.json"
        save_json(names, output_path)
        print(f"     ✅ Salvato in {output_path}")

    print("\n✨ Dizionari generati con successo!")
    print(f"📁 Trovi i file in: {BUILD_DIR.resolve()}")

if __name__ == "__main__":
    main()