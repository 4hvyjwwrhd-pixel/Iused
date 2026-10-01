const express = require("express");
const session = require("express-session");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-secret";

const db = new Database(path.join(__dirname, "iused.db"));
db.pragma("journal_mode = WAL");

/* =========================
   DATABASE
========================= */

db.exec(`
CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  storage TEXT NOT NULL DEFAULT '',
  ram TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'used',
  available INTEGER NOT NULL DEFAULT 1,
  sold_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

/* تحديث قواعد البيانات القديمة بدون حذف البيانات */

let columns = db.prepare("PRAGMA table_info(models)").all();

function addColumn(name, sql) {
  if (!columns.some(c => c.name === name)) {
    db.exec(sql);
    columns = db.prepare("PRAGMA table_info(models)").all();
  }
}

addColumn(
  "type",
  `ALTER TABLE models ADD COLUMN type TEXT NOT NULL DEFAULT 'used'`
);

addColumn(
  "storage",
  `ALTER TABLE models ADD COLUMN storage TEXT NOT NULL DEFAULT ''`
);

addColumn(
  "ram",
  `ALTER TABLE models ADD COLUMN ram TEXT NOT NULL DEFAULT ''`
);

addColumn(
  "available",
  `ALTER TABLE models ADD COLUMN available INTEGER NOT NULL DEFAULT 1`
);

addColumn(
  "sold_at",
  `ALTER TABLE models ADD COLUMN sold_at TEXT DEFAULT NULL`
);

addColumn(
  "updated_at",
  `ALTER TABLE models ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP`
);

/* =========================
   NORMALIZATION
========================= */

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/سامسونج/g, "samsung")
    .replace(/جالاكسي/g, "galaxy")
    .replace(/\bgalaxy\b/g, "")
    .replace(/\bsamsung\b/g, "")
    .replace(/[\s\-_.]+/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]/g, "");
}

function normalizeSpec(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/gb/g, "")
    .replace(/tb/g, "000")
    .replace(/\s/g, "")
    .trim();
}

function modelKey(brand, name, storage, ram, type) {
  return [
    normalizeText(brand),
    normalizeText(name),
    normalizeSpec(storage),
    normalizeSpec(ram),
    type
  ].join("|");
}

/* =========================
   EXPRESS
========================= */

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 8 * 60 * 60 * 1000
    }
  })
);

/* =========================
   ADMIN
========================= */

function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.status(401).json({
      error: "غير مصرح"
    });
  }

  next();
}

/* =========================
   MODELS SEARCH
========================= */

app.get("/api/models", (req, res) => {

  const q = (req.query.q || "").trim();
  const brand = (req.query.brand || "").trim();
  const type = (req.query.type || "").trim();
  const storage = (req.query.storage || "").trim();
  const ram = (req.query.ram || "").trim();

  const minPrice =
    req.query.minPrice !== undefined &&
    req.query.minPrice !== ""
      ? Number(req.query.minPrice)
      : null;

  const maxPrice =
    req.query.maxPrice !== undefined &&
    req.query.maxPrice !== ""
      ? Number(req.query.maxPrice)
      : null;

  let sql = `
    SELECT
      id,
      brand,
      name,
      storage,
      ram,
      price,
      type,
      available,
      sold_at,
      created_at,
      updated_at
    FROM models
  `;

  const where = [];
  const params = [];

  if (q) {
    where.push(`
      (
        lower(name) LIKE lower(?)
        OR lower(brand) LIKE lower(?)
      )
    `);

    params.push(`%${q}%`, `%${q}%`);
  }

  if (brand) {
    where.push("brand=?");
    params.push(brand);
  }

  if (type === "used" || type === "new") {
    where.push("type=?");
    params.push(type);
  }

  if (storage) {
    where.push("storage=?");
    params.push(storage);
  }

  if (ram) {
    where.push("ram=?");
    params.push(ram);
  }

  if (Number.isFinite(minPrice)) {
    where.push("price>=?");
    params.push(minPrice);
  }

  if (Number.isFinite(maxPrice)) {
    where.push("price<=?");
    params.push(maxPrice);
  }

  if (where.length) {
    sql += " WHERE " + where.join(" AND ");
  }

  sql += `
    ORDER BY
      CASE WHEN type='used' AND available=0 THEN 1 ELSE 0 END,
      price ASC,
      id ASC
  `;

  res.json(db.prepare(sql).all(...params));
});

/* =========================
   FILTER DATA
========================= */

app.get("/api/brands", (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT brand
    FROM models
    ORDER BY brand
  `).all();

  res.json(rows.map(x => x.brand));
});

app.get("/api/storages", (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT storage
    FROM models
    WHERE storage <> ''
    ORDER BY CAST(storage AS INTEGER)
  `).all();

  res.json(rows.map(x => x.storage));
});

app.get("/api/rams", (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT ram
    FROM models
    WHERE ram <> ''
    ORDER BY CAST(ram AS INTEGER)
  `).all();

  res.json(rows.map(x => x.ram));
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", (req, res) => {

  if (req.body.password === ADMIN_PASSWORD) {
    req.session.admin = true;

    return res.json({
      ok: true
    });
  }

  res.status(401).json({
    error: "الرقم السري غير صحيح"
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/me", (req, res) => {
  res.json({
    admin: !!req.session.admin
  });
});

/* =========================
   ADD ONE MODEL
========================= */

app.post(
  "/api/models",
  requireAdmin,
  (req, res) => {

    const brand = (req.body.brand || "").trim();
    const name = (req.body.name || "").trim();
    const storage = (req.body.storage || "").trim();
    const ram = (req.body.ram || "").trim();
    const price = Number(req.body.price);

    const type =
      req.body.type === "new"
        ? "new"
        : "used";

    if (
      !brand ||
      !name ||
      !storage ||
      !ram ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return res.status(400).json({
        error: "أكمل بيانات الجهاز"
      });
    }

    const wantedKey =
      modelKey(brand, name, storage, ram, type);

    const existing =
      db.prepare(`
        SELECT *
        FROM models
        WHERE type=?
      `).all(type)
      .find(x =>
        modelKey(
          x.brand,
          x.name,
          x.storage,
          x.ram,
          x.type
        ) === wantedKey
      );

    if (existing) {

      db.prepare(`
        UPDATE models
        SET
          brand=?,
          name=?,
          storage=?,
          ram=?,
          price=?,
          available=1,
          sold_at=NULL,
          updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).run(
        brand,
        name,
        storage,
        ram,
        price,
        existing.id
      );

      return res.json({
        updated: true,
        model: db.prepare(`
          SELECT *
          FROM models
          WHERE id=?
        `).get(existing.id)
      });
    }

    const r = db.prepare(`
      INSERT INTO models
      (
        brand,
        name,
        storage,
        ram,
        price,
        type,
        available
      )
      VALUES (?,?,?,?,?,?,1)
    `).run(
      brand,
      name,
      storage,
      ram,
      price,
      type
    );

    res.json({
      added: true,
      model: db.prepare(`
        SELECT *
        FROM models
        WHERE id=?
      `).get(r.lastInsertRowid)
    });
  }
);

/* =========================
   BULK PRICE LIST
========================= */

app.post(
  "/api/models/bulk",
  requireAdmin,
  (req, res) => {

    const rows =
      Array.isArray(req.body.models)
        ? req.body.models
        : [];

    if (!rows.length) {
      return res.status(400).json({
        error: "قائمة الأسعار فارغة"
      });
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    const transaction =
      db.transaction(items => {

        for (const item of items) {

          const brand =
            String(item.brand || "").trim();

          const name =
            String(item.name || "").trim();

          const storage =
            String(item.storage || "").trim();

          const ram =
            String(item.ram || "").trim();

          const price =
            Number(item.price);

          const type =
            item.type === "used"
              ? "used"
              : "new";

          if (
            !brand ||
            !name ||
            !storage ||
            !ram ||
            !Number.isFinite(price) ||
            price <= 0
          ) {
            skipped++;
            continue;
          }

          const wantedKey =
            modelKey(
              brand,
              name,
              storage,
              ram,
              type
            );

          const possible =
            db.prepare(`
              SELECT *
              FROM models
              WHERE type=?
            `).all(type);

          const existing =
            possible.find(x =>
              modelKey(
                x.brand,
                x.name,
                x.storage,
                x.ram,
                x.type
              ) === wantedKey
            );

          if (existing) {

            db.prepare(`
              UPDATE models
              SET
                brand=?,
                name=?,
                storage=?,
                ram=?,
                price=?,
                available=1,
                sold_at=NULL,
                updated_at=CURRENT_TIMESTAMP
              WHERE id=?
            `).run(
              brand,
              name,
              storage,
              ram,
              price,
              existing.id
            );

            updated++;

          } else {

            db.prepare(`
              INSERT INTO models
              (
                brand,
                name,
                storage,
                ram,
                price,
                type,
                available
              )
              VALUES (?,?,?,?,?,?,1)
            `).run(
              brand,
              name,
              storage,
              ram,
              price,
              type
            );

            added++;
          }
        }
      });

    transaction(rows);

    res.json({
      ok: true,
      added,
      updated,
      skipped,
      total: rows.length
    });
  }
);

/* =========================
   UPDATE PRICE
========================= */

app.put(
  "/api/models/:id",
  requireAdmin,
  (req, res) => {

    const id = Number(req.params.id);
    const price = Number(req.body.price);

    if (
      !Number.isInteger(id) ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return res.status(400).json({
        error: "السعر غير صحيح"
      });
    }

    const r = db.prepare(`
      UPDATE models
      SET
        price=?,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(price, id);

    if (!r.changes) {
      return res.status(404).json({
        error: "الموديل غير موجود"
      });
    }

    res.json(
      db.prepare(`
        SELECT *
        FROM models
        WHERE id=?
      `).get(id)
    );
  }
);

/* =========================
   USED - MARK SOLD
   متاح للموظف
========================= */

app.post(
  "/api/models/:id/sold",
  (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "الجهاز غير صحيح"
      });
    }

    const model =
      db.prepare(`
        SELECT *
        FROM models
        WHERE id=?
      `).get(id);

    if (!model) {
      return res.status(404).json({
        error: "الجهاز غير موجود"
      });
    }

    if (model.type !== "used") {
      return res.status(400).json({
        error: "الخاصية للمستعمل فقط"
      });
    }

    db.prepare(`
      UPDATE models
      SET
        available=0,
        sold_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(id);

    res.json({
      ok: true,
      model: db.prepare(`
        SELECT *
        FROM models
        WHERE id=?
      `).get(id)
    });
  }
);

/* =========================
   RESTORE USED MODEL
   للمدير فقط
========================= */

app.post(
  "/api/models/:id/available",
  requireAdmin,
  (req, res) => {

    const id = Number(req.params.id);

    const model =
      db.prepare(`
        SELECT *
        FROM models
        WHERE id=?
      `).get(id);

    if (!model) {
      return res.status(404).json({
        error: "الجهاز غير موجود"
      });
    }

    if (model.type !== "used") {
      return res.status(400).json({
        error: "الخاصية للمستعمل فقط"
      });
    }

    db.prepare(`
      UPDATE models
      SET
        available=1,
        sold_at=NULL
      WHERE id=?
    `).run(id);

    res.json({
      ok: true
    });
  }
);

/* =========================
   DELETE MODEL
========================= */

app.delete(
  "/api/models/:id",
  requireAdmin,
  (req, res) => {

    const id = Number(req.params.id);

    const r =
      db.prepare(`
        DELETE FROM models
        WHERE id=?
      `).run(id);

    if (!r.changes) {
      return res.status(404).json({
        error: "الموديل غير موجود"
      });
    }

    res.json({
      ok: true
    });
  }
);

/* =========================
   WEBSITE
========================= */

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.get("*", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log(
    `iUsed running on port ${PORT}`
  );
});
