const express = require("express");

const session = require("express-session");

const { createClient } = require("@libsql/client");

const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";

const SESSION_SECRET =

  process.env.SESSION_SECRET || "change-this-secret";

if (

  !process.env.TURSO_DATABASE_URL ||

  !process.env.TURSO_AUTH_TOKEN

) {

  throw new Error(

    "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required"

  );

}

const db = createClient({

  url: process.env.TURSO_DATABASE_URL,

  authToken: process.env.TURSO_AUTH_TOKEN

});

/* =========================

   HELPERS

========================= */

function normalizeText(value) {

  return String(value || "")

    .trim()

    .toLowerCase()

    .replace(/سامسونج/g, "samsung")

    .replace(/هواوي/g, "huawei")

    .replace(/هونر|honer/g, "honor")

    .replace(/اوبو|أوبو/g, "oppo")

    .replace(/شاومي/g, "xiaomi")

    .replace(/ريلمي|ريلمى/g, "realme")

    .replace(/انفينكس|انفينيكس/g, "infinix")

    .replace(/تكنو/g, "tecno")

    .replace(/نوكيا/g, "nokia")

    .replace(/جالاكسي/g, "galaxy")

    .replace(/\bgalaxy\b/g, "")

    .replace(/\bsamsung\b/g, "")

    .replace(/\brino\b/g, "reno")

    .replace(/\baltra\b/g, "ultra")

    .replace(/\bnot\b/g, "note")

    .replace(/\brd\b/g, "redmi")

    .replace(/[\s\-_.+]+/g, "")

    .replace(/[^a-z0-9\u0600-\u06FF]/g, "");

}

function normalizeBrand(value) {

  const raw = String(value || "").trim().toLowerCase();

  const brands = [

    ["samsung", /samsung|سامسونج/],

    ["oppo", /oppo|اوبو|أوبو/],

    ["xiaomi", /xiaomi|شاومي/],

    ["honor", /honor|honer|هونر/],

    ["realme", /realme|ريلمي|ريلمى/],

    ["infinix", /infinix|انفينكس|انفينيكس/],

    ["tecno", /tecno|تكنو/],

    ["nokia", /nokia|نوكيا/],

    ["itel", /itel|ايتل/],

    ["vivo", /vivo|فيفو/],

    ["huawei", /huawei|هواوي/]

  ];

  for (const [brand, pattern] of brands) {

    if (pattern.test(raw)) return brand;

  }

  return normalizeText(raw);

}

function normalizeSpec(value) {

  let v = String(value || "")

    .trim()

    .toLowerCase()

    .replace(/\s+/g, "")

    .replace(/gb/g, "");

  if (!v) return "";

  const tb = v.match(/^(\d+(?:\.\d+)?)tb$/);

  if (tb) {

    return String(

      Math.round(Number(tb[1]) * 1024)

    );

  }

  return v.replace(/[^0-9.]/g, "");

}

function sameBasicModel(a, b) {

  return (

    normalizeBrand(a.brand) === normalizeBrand(b.brand) &&

    normalizeText(a.name) === normalizeText(b.name) &&

    a.type === b.type

  );

}

function findExistingModel(

  rows,

  brand,

  name,

  storage,

  ram,

  type

) {

  const incoming = {

    brand,

    name,

    storage,

    ram,

    type

  };

  const candidates = rows.filter(x => {

    if (!sameBasicModel(incoming, x)) {

      return false;

    }

    const wantedStorage = normalizeSpec(storage);

    const wantedRam = normalizeSpec(ram);

    const oldStorage = normalizeSpec(x.storage);

    const oldRam = normalizeSpec(x.ram);

    if (

      wantedStorage &&

      oldStorage &&

      wantedStorage !== oldStorage

    ) {

      return false;

    }

    if (

      wantedRam &&

      oldRam &&

      wantedRam !== oldRam

    ) {

      return false;

    }

    return true;

  });

  if (candidates.length === 1) {

    return candidates[0];

  }

  const exact = candidates.filter(x =>

    normalizeSpec(x.storage) === normalizeSpec(storage) &&

    normalizeSpec(x.ram) === normalizeSpec(ram)

  );

  return exact.length === 1 ? exact[0] : null;

}

function rowsOf(result) {

  return (result.rows || []).map(x => ({ ...x }));

}

async function all(sql, args = []) {

  return rowsOf(

    await db.execute({

      sql,

      args

    })

  );

}

async function one(sql, args = []) {

  return (await all(sql, args))[0] || null;

}

function parseModel(item, defaultType = "used") {

  return {

    brand: String(item.brand || "").trim(),

    name: String(item.name || "").trim(),

    storage: String(item.storage || "").trim(),

    ram: String(item.ram || "").trim(),

    price: Number(item.price),

    type:

      item.type === "new"

        ? "new"

        : item.type === "used"

        ? "used"

        : defaultType

  };

}

function validModel(model) {

  return (

    model.brand &&

    model.name &&

    Number.isSafeInteger(model.price) &&

    model.price > 0

  );

}

/* =========================

   EXPRESS

========================= */

app.set("trust proxy", 1);

app.use(

  express.json({

    limit: "2mb"

  })

);

app.use(

  express.urlencoded({

    extended: true

  })

);

app.use(

  session({

    secret: SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {

      httpOnly: true,

      sameSite: "lax",

      secure: "auto",

      maxAge: 8 * 60 * 60 * 1000

    }

  })

);

function requireAdmin(req, res, next) {

  if (!req.session.admin) {

    return res.status(401).json({

      error: "غير مصرح"

    });

  }

  next();

}

const route = fn => (req, res, next) =>

  Promise.resolve(

    fn(req, res, next)

  ).catch(next);

/* =========================

   LOGIN

========================= */

app.post(

  "/api/login",

  (req, res, next) => {

    if (

      req.body.password !== ADMIN_PASSWORD

    ) {

      return res.status(401).json({

        error: "الرقم السري غير صحيح"

      });

    }

    req.session.regenerate(error => {

      if (error) return next(error);

      req.session.admin = true;

      req.session.save(error => {

        if (error) return next(error);

        res.json({

          ok: true

        });

      });

    });

  }

);

app.post(

  "/api/logout",

  (req, res, next) => {

    req.session.destroy(error => {

      if (error) return next(error);

      res.json({

        ok: true

      });

    });

  }

);

app.get(

  "/api/me",

  (req, res) => {

    res.json({

      admin: !!req.session.admin

    });

  }

);

/* =========================

   SEARCH

========================= */

app.get(

  "/api/models",

  route(async (req, res) => {

    let sql = "SELECT * FROM models";

    const where = [];

    const args = [];

    const q =

      String(req.query.q || "").trim();

    if (q) {

      where.push(`

        (

          lower(name) LIKE lower(?)

          OR lower(brand) LIKE lower(?)

        )

      `);

      args.push(

        `%${q}%`,

        `%${q}%`

      );

    }

    for (

      const field of [

        "brand",

        "storage",

        "ram"

      ]

    ) {

      const value =

        String(

          req.query[field] || ""

        ).trim();

      if (value) {

        where.push(`${field}=?`);

        args.push(value);

      }

    }

    if (

      ["used", "new"].includes(

        req.query.type

      )

    ) {

      where.push("type=?");

      args.push(req.query.type);

    }

    if (

      req.query.minPrice !== undefined &&

      req.query.minPrice !== ""

    ) {

      const value =

        Number(req.query.minPrice);

      if (Number.isFinite(value)) {

        where.push("price>=?");

        args.push(value);

      }

    }

    if (

      req.query.maxPrice !== undefined &&

      req.query.maxPrice !== ""

    ) {

      const value =

        Number(req.query.maxPrice);

      if (Number.isFinite(value)) {

        where.push("price<=?");

        args.push(value);

      }

    }

    if (where.length) {

      sql +=

        " WHERE " +

        where.join(" AND ");

    }

    sql += `

      ORDER BY

        CASE

          WHEN type='used'

          AND available=0

          THEN 1

          ELSE 0

        END,

        price ASC,

        id ASC

    `;

    res.json(

      await all(sql, args)

    );

  })

);

/* =========================

   FILTERS

========================= */

for (

  const [endpoint, field]

  of [

    ["brands", "brand"],

    ["storages", "storage"],

    ["rams", "ram"]

  ]

) {

  app.get(

    "/api/" + endpoint,

    route(async (req, res) => {

      const sql =

        `SELECT DISTINCT ${field}

         FROM models ` +

        (

          field === "brand"

            ? ""

            : `WHERE ${field}<>''`

        );

      const values =

        (await all(sql))

          .map(x => x[field]);

      values.sort(

        field === "brand"

          ? (a, b) =>

              String(a)

                .localeCompare(String(b))

          : (a, b) =>

              (Number(normalizeSpec(a)) || 0) -

              (Number(normalizeSpec(b)) || 0)

      );

      res.json(values);

    })

  );

}

/* =========================

   SAVE MODEL

========================= */

async function saveModel(model) {

  const rows =

    await all(

      "SELECT * FROM models WHERE type=?",

      [model.type]

    );

  const existing =

    findExistingModel(

      rows,

      model.brand,

      model.name,

      model.storage,

      model.ram,

      model.type

    );

  if (existing) {

    const storage =

      model.storage ||

      existing.storage ||

      "";

    const ram =

      model.ram ||

      existing.ram ||

      "";

    await db.execute({

      sql: `

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

      `,

      args: [

        model.brand,

        model.name,

        storage,

        ram,

        model.price,

        existing.id

      ]

    });

    return {

      updated: true,

      model:

        await one(

          "SELECT * FROM models WHERE id=?",

          [existing.id]

        )

    };

  }

  const result =

    await db.execute({

      sql: `

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

      `,

      args: [

        model.brand,

        model.name,

        model.storage,

        model.ram,

        model.price,

        model.type

      ]

    });

  return {

    added: true,

    model:

      await one(

        "SELECT * FROM models WHERE id=?",

        [Number(result.lastInsertRowid)]

      )

  };

}

/* =========================

   ADD ONE

========================= */

app.post(

  "/api/models",

  requireAdmin,

  route(async (req, res) => {

    const model =

      parseModel(

        req.body,

        "used"

      );

    if (!validModel(model)) {

      return res.status(400).json({

        error:

          "اكتب الشركة والموديل والسعر"

      });

    }

    res.json(

      await saveModel(model)

    );

  })

);

/* =========================

   BULK

========================= */

app.post(

  "/api/models/bulk",

  requireAdmin,

  route(async (req, res) => {

    const items =

      Array.isArray(req.body.models)

        ? req.body.models

        : [];

    if (!items.length) {

      return res.status(400).json({

        error:

          "قائمة الأسعار فارغة"

      });

    }

    let added = 0;

    let updated = 0;

    let skipped = 0;

    for (const item of items) {

      const model =

        parseModel(

          item,

          "new"

        );

      if (!validModel(model)) {

        skipped++;

        continue;

      }

      const result =

        await saveModel(model);

      if (result.updated) {

        updated++;

      } else {

        added++;

      }

    }

    res.json({

      ok: true,

      added,

      updated,

      skipped,

      total: items.length

    });

  })

);

/* =========================

   UPDATE PRICE

========================= */

app.put(

  "/api/models/:id",

  requireAdmin,

  route(async (req, res) => {

    const id =

      Number(req.params.id);

    const price =

      Number(req.body.price);

    if (

      !Number.isInteger(id) ||

      !Number.isSafeInteger(price) ||

      price <= 0

    ) {

      return res.status(400).json({

        error: "السعر غير صحيح"

      });

    }

    const old =

      await one(

        "SELECT id FROM models WHERE id=?",

        [id]

      );

    if (!old) {

      return res.status(404).json({

        error:

          "الموديل غير موجود"

      });

    }

    await db.execute({

      sql: `

        UPDATE models

        SET

          price=?,

          updated_at=CURRENT_TIMESTAMP

        WHERE id=?

      `,

      args: [

        price,

        id

      ]

    });

    res.json(

      await one(

        "SELECT * FROM models WHERE id=?",

        [id]

      )

    );

  })

);

/* =========================

   SOLD

========================= */

app.post(

  "/api/models/:id/sold",

  route(async (req, res) => {

    const id =

      Number(req.params.id);

    const model =

      await one(

        "SELECT * FROM models WHERE id=?",

        [id]

      );

    if (!model) {

      return res.status(404).json({

        error:

          "الجهاز غير موجود"

      });

    }

    if (model.type !== "used") {

      return res.status(400).json({

        error:

          "الخاصية للمستعمل فقط"

      });

    }

    await db.execute({

      sql: `

        UPDATE models

        SET

          available=0,

          sold_at=CURRENT_TIMESTAMP

        WHERE id=?

      `,

      args: [id]

    });

    res.json({

      ok: true,

      model:

        await one(

          "SELECT * FROM models WHERE id=?",

          [id]

        )

    });

  })

);

/* =========================

   RESTORE USED

========================= */

app.post(

  "/api/models/:id/available",

  requireAdmin,

  route(async (req, res) => {

    const id =

      Number(req.params.id);

    const model =

      await one(

        "SELECT * FROM models WHERE id=?",

        [id]

      );

    if (!model) {

      return res.status(404).json({

        error:

          "الجهاز غير موجود"

      });

    }

    if (model.type !== "used") {

      return res.status(400).json({

        error:

          "الخاصية للمستعمل فقط"

      });

    }

    await db.execute({

      sql: `

        UPDATE models

        SET

          available=1,

          sold_at=NULL

        WHERE id=?

      `,

      args: [id]

    });

    res.json({

      ok: true

    });

  })

);

/* =========================

   DELETE

========================= */

app.delete(

  "/api/models/:id",

  requireAdmin,

  route(async (req, res) => {

    const id =

      Number(req.params.id);

    const model =

      await one(

        "SELECT id FROM models WHERE id=?",

        [id]

      );

    if (!model) {

      return res.status(404).json({

        error:

          "الموديل غير موجود"

      });

    }

    await db.execute({

      sql:

        "DELETE FROM models WHERE id=?",

      args: [id]

    });

    res.json({

      ok: true

    });

  })

);

/* =========================

   HEALTH

========================= */

app.get(

  "/api/health",

  route(async (req, res) => {

    await db.execute("SELECT 1");

    res.json({

      ok: true,

      database: "turso"

    });

  })

);

/* =========================

   WEBSITE

========================= */

app.use(

  "/api",

  (req, res) => {

    res.status(404).json({

      error:

        "المسار غير موجود"

    });

  }

);

app.use(

  express.static(

    path.join(

      __dirname,

      "public"

    )

  )

);

app.use(

  (req, res, next) => {

    if (req.method !== "GET") {

      return next();

    }

    res.sendFile(

      path.join(

        __dirname,

        "public",

        "index.html"

      )

    );

  }

);

/* =========================

   ERROR

========================= */

app.use(

  (error, req, res, next) => {

    console.error(error);

    if (res.headersSent) {

      return next(error);

    }

    res.status(503).json({

      error:

        "تعذر الوصول لقاعدة البيانات"

    });

  }

);

/* =========================

   START

========================= */

async function start() {

  await db.execute(`

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

    )

  `);

  app.listen(

    PORT,

    () => {

      console.log(

        "iUsed running on port " +

        PORT +

        " (Turso)"

      );

    }

  );

}

start().catch(error => {

  console.error(

    "iUsed startup failed:",

    error

  );

  process.exit(1);

});
