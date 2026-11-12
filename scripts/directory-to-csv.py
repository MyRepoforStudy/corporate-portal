#!/usr/bin/env python3
"""Converts the bank's employee directory (.xlsx) into the CSV accepted by the
portal's Admin -> Import screen (/admin/import).

    python scripts/directory-to-csv.py "Справочник сотрудников.xlsx" import.csv
        [--keep-zero-location]   keep a "0" location as "0 этаж" (default: treat as "not set")
        [--no-categories]        drop the "Категория" level from the department tree
        [--no-root]              keep every category as its own top-level node. By default the first
                                 category (the Management Board) becomes the single root "Правление"
                                 and the other categories are its children, as the org chart looked
                                 before the directory was imported

Only the Python standard library is used. Columns are found by their header
text, merged cells are expanded, and the result has these columns:
fullName, email, position, position_rank, department_path, location.

The output contains personal data: keep it OUT of the repository (it is
git-ignored) and delete it after the import.
"""
import csv
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter, OrderedDict

M = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

# ---- known fixes for this directory (edit when the next version has others) ----
POSITION_FIXES = {"Специалист в филиале г.Шымент": "Специалист в филиале г. Шымкент"}
LOCATION_ALIASES = {"ШФ": "Шымкентский филиал"}
ROOT_NAME = "Правление"  # name of the single top node (see --no-root)

# Seniority by position title, first match wins. A higher rank sorts higher in a
# department and decides who is shown as its head.
RANK_RULES = [
    (r"^председатель правления$", 100),
    (r"^заместитель председателя правления$", 90),
    (r"директор филиала", 80),
    (r"^(главный бухгалтер|руководитель ит|руководитель сва|главный комплаенс-контролер|корпоративный секретарь)$", 80),
    (r"^заместитель директора филиала", 70),
    (r"^заместитель главного бухгалтера", 75),
    (r"^директор департамента$", 70),
    (r"^(руководитель центра|начальник управления)$", 60),
    (r"^начальник отдела$", 50),
    (r"^руководитель проектов$", 45),
    (r"^главный специалист", 40),
    (r"^ведущий специалист", 30),
    (r"^старший кассир$", 25),
    (r"^специалист", 20),
    (r"^кассир$", 15),
    (r"^(архивариус|комендант)", 10),
]


def col_index(ref):
    n = 0
    for ch in ref:
        if ch.isalpha():
            n = n * 26 + (ord(ch.upper()) - 64)
    return n - 1


def clean(value):
    """Collapses any whitespace (incl. non-breaking spaces and line breaks)."""
    return re.sub(r"\s+", " ", (value or "").replace("\u00a0", " ")).strip()


def read_first_sheet(path):
    """Returns (rows, merges): rows = {row: {col: text}}, merges = [(r1, c1, r2, c2)]."""
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("{%s}si" % M):
            shared.append("".join(t.text or "" for t in si.iter("{%s}t" % M)))
    book = ET.fromstring(z.read("xl/workbook.xml"))
    rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    first = book.find("{%s}sheets" % M)[0]
    target = rels[first.get("{%s}id" % R)].lstrip("/")
    root = ET.fromstring(z.read(target if target.startswith("xl/") else "xl/" + target))

    rows = {}
    for row in root.iter("{%s}row" % M):
        cells = {}
        for c in row.findall("{%s}c" % M):
            t, v = c.get("t"), c.find("{%s}v" % M)
            if t == "s" and v is not None:
                text = shared[int(v.text)]
            elif t == "inlineStr":
                text = "".join(x.text or "" for x in c.iter("{%s}t" % M))
            else:
                text = (v.text or "") if v is not None else ""
            cells[col_index(c.get("r"))] = text
        rows[int(row.get("r"))] = cells

    merges = []
    for m in root.iter("{%s}mergeCell" % M):
        a, b = (m.get("ref").split(":") + [m.get("ref")])[:2]
        ma, mb = re.match(r"([A-Z]+)(\d+)", a), re.match(r"([A-Z]+)(\d+)", b)
        merges.append((int(ma.group(2)), col_index(ma.group(1)), int(mb.group(2)), col_index(mb.group(1))))
    return first.get("name"), rows, merges


def find_columns(rows):
    """Finds the header row (the one holding "ФИО") and maps column roles to indexes."""
    for r in sorted(rows):
        if r > 30:
            break
        texts = {c: clean(t) for c, t in rows[r].items()}
        if not any("фио" in t.lower() for t in texts.values()):
            continue
        cols = {}
        for c, t in sorted(texts.items()):
            low = t.lower()
            if low.startswith("категория"):
                cols.setdefault("category", c)
            elif "структурное подразделение" in low:
                cols["dept"] = c
            elif low.startswith("должность"):
                cols["position"] = c
            elif "фио" in low:
                cols["name"] = c
            elif "электронн" in low or "e-mail" in low or "email" in low:
                cols["email"] = c
            elif low.startswith("локация"):
                cols["location"] = c
        # The second department level has no header of its own: it is the
        # column right after "Структурное подразделение" (its header is merged).
        if "dept" in cols and not texts.get(cols["dept"] + 1):
            cols["sub"] = cols["dept"] + 1
        return r, cols
    return None, {}


def make_getter(rows, merges):
    """cell(r, c) with merged ranges expanded: every cell of a merge shows the top-left value."""
    merged = {}
    for r1, c1, r2, c2 in merges:
        value = rows.get(r1, {}).get(c1, "")
        for r in range(r1, r2 + 1):
            for c in range(c1, c2 + 1):
                merged[(r, c)] = value

    def get(r, c):
        if c is None:
            return ""
        return clean(merged[(r, c)] if (r, c) in merged else rows.get(r, {}).get(c, ""))

    return get


def rank_for(title):
    low = title.lower()
    for pattern, rank in RANK_RULES:
        if re.search(pattern, low):
            return rank
    return None


def normalize_location(raw, keep_zero):
    """"2/левое крыло" -> "2 этаж, левое крыло"; "0" -> "" (not set) unless keep_zero."""
    s = clean(raw)
    if not s or s in ("-", "\u2014"):
        return ""
    if s in LOCATION_ALIASES:
        return LOCATION_ALIASES[s]
    m = re.fullmatch(r"(\d+)(?:\.0+)?\s*(?:/\s*(.+))?", s)
    if m:
        floor, extra = int(m.group(1)), (m.group(2) or "").strip()
        if floor == 0 and not extra and not keep_zero:
            return ""
        return "%d этаж, %s" % (floor, extra) if extra else "%d этаж" % floor
    return s


def edit_distance(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def read_people(rows, merges, cols, header_row, args):
    """One record per row that has a name, with the department path resolved."""
    get = make_getter(rows, merges)
    # A header cell merged over several rows ("ФИО" spanning rows 3-4) would
    # otherwise read as data in the rows below the header.
    header_end = max([header_row] + [r2 for r1, c1, r2, c2 in merges if r1 <= header_row <= r2])
    first_category = next(
        (get(r, cols.get("category")) for r in sorted(rows)
         if r > header_end and get(r, cols["name"]) and get(r, cols.get("category"))), "")
    last_dept = {}
    people, problems, position_fixes = [], [], []
    for r in sorted(rows):
        if r <= header_end or not get(r, cols["name"]):
            continue
        category = get(r, cols.get("category"))
        dept, sub = get(r, cols["dept"]), get(r, cols.get("sub"))
        if sub == dept:  # E:F merged horizontally: the unit has no second level
            sub = ""
        if dept:
            last_dept[category] = dept
        elif sub and category in last_dept:  # a sub-unit listed under the department above it
            dept = last_dept[category]

        path = []
        if category and not args.no_categories:
            path.append(category)
        for part in (dept, sub):
            if part and (not path or part != path[-1]):
                path.append(part)
        if args.root and category and not args.no_categories:
            # The first category is the Management Board itself: its people sit directly in the
            # root node, while every other category becomes a child of that root.
            path = [ROOT_NAME] + (path[1:] if category == first_category else path)
        if not path:
            problems.append((r, get(r, cols["name"]), "нет подразделения"))
            continue

        position = get(r, cols["position"])
        if position in POSITION_FIXES:
            position_fixes.append((position, POSITION_FIXES[position]))
            position = POSITION_FIXES[position]
        people.append(OrderedDict(
            row=r, name=get(r, cols["name"]), email=get(r, cols["email"]), position=position,
            rank=rank_for(position), path=path,
            location=normalize_location(get(r, cols.get("location")), args.keep_zero_location),
        ))
    return people, problems, position_fixes


def fix_email_domains(people):
    """Fixes a domain that is a near-miss of the dominant one (a typo); returns what changed."""
    domains = Counter(p["email"].lower().split("@")[-1] for p in people if "@" in p["email"])
    if not domains:
        return []
    dominant = domains.most_common(1)[0][0]
    fixed = []
    for p in people:
        if "@" not in p["email"]:
            continue
        local, domain = p["email"].rsplit("@", 1)
        low = domain.lower()
        if low != dominant and low.rsplit(".", 1)[-1] == dominant.rsplit(".", 1)[-1] and edit_distance(low, dominant) <= 4:
            fixed.append((p["row"], p["name"], p["email"], local + "@" + dominant))
            p["email"] = local + "@" + dominant
    return fixed


def split_duplicate_emails(people):
    """Keeps the first holder of each e-mail (case-insensitive); returns (kept, [(dropped, kept_one)])."""
    seen, kept, dropped = {}, [], []
    for p in people:
        key = p["email"].lower()
        if key in seen:
            dropped.append((p, seen[key]))
        else:
            seen[key] = p
            kept.append(p)
    return kept, dropped


def print_report(sheet, header_row, total, kept, problems, dropped, domain_fixes, position_fixes, unranked, dst,
                 root_used=False):
    print("Лист «%s», заголовок в строке %d, людей в файле: %d" % (sheet, header_row, total))
    print("Записано в CSV: %d строк -> %s" % (len(kept), dst))

    nodes = {tuple(p["path"][:i]) for p in kept for i in range(1, len(p["path"]) + 1)}
    levels = Counter(len(n) for n in nodes)
    print("\nПодразделения: %d узлов (%s)" % (len(nodes), ", ".join("уровень %d: %d" % kv for kv in sorted(levels.items()))))
    # with a single root the interesting grouping is its direct children (the blocks)
    block = lambda p: p["path"][1] if root_used and len(p["path"]) > 1 else p["path"][0]
    for top, n in Counter(block(p) for p in kept).items():
        print("   %3d чел.  %s" % (n, top))

    by_title = OrderedDict()
    for p in sorted(kept, key=lambda p: (-(p["rank"] or 0), p["position"])):
        by_title.setdefault(p["position"], [p["rank"], 0])[1] += 1
    print("\nДолжности: %d (ранг: чем выше, тем старше)" % len(by_title))
    for title, (rank, n) in by_title.items():
        print("   ранг %-4s %3d чел.  %s" % ("?" if rank is None else rank, n, title))

    print("\nЛокация:")
    for loc, n in Counter(p["location"] or "(не указана)" for p in kept).most_common():
        print("   %3d  %s" % (n, loc))

    if domain_fixes or position_fixes:
        print("\nИсправлено автоматически (проверьте):")
        for row, name, old, new in domain_fixes:
            print("   e-mail, строка %d (%s): %s -> %s" % (row, name, old, new))
        for old, new in sorted(set(position_fixes)):
            print("   должность: «%s» -> «%s»" % (old, new))
    if dropped or problems:
        print("\nНЕ попали в CSV (исправьте в файле и запустите снова):")
        for p, first in dropped:
            print("   строка %d: %s: e-mail %s уже у «%s» (строка %d)" % (p["row"], p["name"], p["email"], first["name"], first["row"]))
        for row, name, why in problems:
            print("   строка %d: %s: %s" % (row, name, why))
    if unranked:
        print("\nВНИМАНИЕ: нет правила ранга для должностей (получат ранг 0): " + "; ".join(unranked))


def main(argv):
    flags = {a for a in argv if a.startswith("--")}
    paths = [a for a in argv if not a.startswith("--")]
    if len(paths) != 2 or flags - {"--keep-zero-location", "--no-categories", "--no-root"}:
        print(__doc__)
        return 2

    class Args:
        keep_zero_location = "--keep-zero-location" in flags
        no_categories = "--no-categories" in flags
        root = "--no-root" not in flags

    src, dst = paths
    sheet, rows, merges = read_first_sheet(src)
    header_row, cols = find_columns(rows)
    missing = [k for k in ("dept", "position", "name", "email") if k not in cols]
    if header_row is None or missing:
        print("В листе «%s» не найдены колонки: %s" % (sheet, ", ".join(missing) or "строка заголовка с «ФИО»"))
        return 2

    people, problems, position_fixes = read_people(rows, merges, cols, header_row, Args)
    unplaced = len(problems)  # rows that have a name but no department
    domain_fixes = fix_email_domains(people)
    valid = []
    for p in people:
        if re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", p["email"]):
            valid.append(p)
        else:
            problems.append((p["row"], p["name"], "некорректный e-mail: %r" % p["email"]))
    kept, dropped = split_duplicate_emails(valid)

    with open(dst, "w", encoding="utf-8-sig", newline="") as f:  # BOM: Excel opens Cyrillic correctly
        out = csv.writer(f, lineterminator="\r\n")
        out.writerow(["fullName", "email", "position", "position_rank", "department_path", "location"])
        for p in kept:
            out.writerow([p["name"], p["email"], p["position"], "" if p["rank"] is None else p["rank"],
                          " > ".join(p["path"]), p["location"]])

    unranked = sorted({p["position"] for p in kept if p["rank"] is None})
    print_report(sheet, header_row, len(people) + unplaced, kept, problems, dropped,
                 domain_fixes, position_fixes, unranked, dst, Args.root and not Args.no_categories)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
