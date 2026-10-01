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

db.exec(`

CREATE TABLE IF NOT EXISTS models (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  brand TEXT NOT NULL,

  name TEXT NOT NULL,

  price INTEGER NOT NULL,

  type TEXT NOT NULL DEFAULT 'used',

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  updated_at TEXT DEFAULT CURRENT_TIMESTAMP

);

`);

/* لو قاعدة البيانات قديمة ومفيهاش type، نضيفه بدون حذف أي بيانات */

const columns = db.prepare("PRAGMA table_info(models)").all();

if (!columns.some(c => c.name === "type")) {

  db.exec("ALTER TABLE models ADD COLUMN type TEXT NOT NULL DEFAULT 'used'");

}

const count = db.prepare("SELECT COUNT(*) AS c FROM models").get().c;

if (count === 0) {

  const seed = db.prepare(

    "INSERT INTO models (brand,name,price,type) VALUES (?,?,?,?)"

  );

  const seedMany = db.transaction(rows => {

    for (const x of rows) {

      seed.run(x.brand, x.name, x.price, "used");

    }

  });

  const initial = [

    {brand:"Xiaomi",name:"Redmi Note 15 256/8",price:13900},

    {brand:"Xiaomi",name:"Redmi Note 15 5G 256/8",price:15500},

    {brand:"Xiaomi",name:"Redmi 15C 256/8",price:9700},

    {brand:"Xiaomi",name:"Redmi 15 256/8 ضمان شواحن زيرو",price:9850},

    {brand:"Xiaomi",name:"Redmi Note 14 Pro 256/8",price:15500},

    {brand:"Xiaomi",name:"Redmi Note 14 Pro 512/12",price:17500},

    {brand:"Xiaomi",name:"Redmi Note 13 128/8",price:10700},

    {brand:"Xiaomi",name:"Redmi 14C 128/4",price:7300},

    {brand:"Xiaomi",name:"Redmi Note 14 Pro Plus 256/12",price:21000},

    {brand:"Honor",name:"Honor X7d 4G 256/8",price:11900},

    {brand:"Realme",name:"Realme C75 256/8",price:11000},

    {brand:"Oppo",name:"Reno 15F 5G 256/12",price:23300},

    {brand:"Oppo",name:"Oppo A6 256/8",price:14200},

    {brand:"Oppo",name:"Reno 14F 5G 256/12",price:21500},

    {brand:"Oppo",name:"Oppo A5 256/8",price:11500},

    {brand:"Oppo",name:"Oppo A5 128/6",price:10200},

    {brand:"Vivo",name:"Vivo Y31 128/8",price:11900},

    {brand:"Vivo",name:"Vivo Y31D 256/8",price:12900},

    {brand:"Xiaomi",name:"Redmi Note 13 128/8 ضمان شواحن زيرو",price:8800},

    {brand:"Honor",name:"Honor 200 256/12",price:18900},

    {brand:"Honor",name:"Honor 200 Pro 512/12",price:25000},

    {brand:"Samsung",name:"Samsung A35 5G 256/8",price:15500},

    {brand:"Samsung",name:"Samsung A26 5G 256/8",price:14900},

    {brand:"Samsung",name:"Samsung A55 5G 256/8",price:17500},

    {brand:"Samsung",name:"Samsung A57 256/12",price:25800},

    {brand:"Vivo",name:"Vivo V60 Lite 5G 256/8",price:16500},

    {brand:"Vivo",name:"Vivo Y21D 128/4",price:8600},

    {brand:"Vivo",name:"Vivo Y21D 256/6",price:10300},

    {brand:"Samsung",name:"Samsung A3 128/6",price:8200},

    {brand:"Honor",name:"Honor 400 Lite 5G 256/8",price:17500},

    {brand:"Xiaomi",name:"Redmi Note 15 Pro 256/12 ضمان خط عربي ضريبة",price:14500},

    {brand:"Xiaomi",name:"Redmi Note 15 Pro 512/12 خط",price:22000},

    {brand:"Xiaomi",name:"Xiaomi Pad Pro 5G 256/8",price:16500},

    {brand:"Xiaomi",name:"Xiaomi Pad 7 256/8",price:17500},

    {brand:"Xiaomi",name:"Redmi Note 13 Pro 256/8 ضمان شواحن زيرو",price:13650},

    {brand:"Honor",name:"Honor Pad 128/8",price:9900},

    {brand:"Samsung",name:"Samsung Pad 128/8",price:8400},

    {brand:"Vivo",name:"Vivo Y21D 128/6",price:9500},

    {brand:"Vivo",name:"Vivo Y31D 128/8",price:11800},

    {brand:"Vivo",name:"Vivo Y31D 256/8",price:13000},

    {brand:"Vivo",name:"Vivo Y11D 128/4",price:8450},

    {brand:"Vivo",name:"Vivo Y500 256/8",price:16700},

    {brand:"Oppo",name:"Oppo A6X 128/4",price:9450},

    {brand:"Xiaomi",name:"Redmi 15 256/8",price:11000},

    {brand:"Xiaomi",name:"Redmi Note 15 Pro 256/12",price:18500},

    {brand:"Samsung",name:"Samsung A5 128/4",price:7100},

    {brand:"Samsung",name:"Samsung A5 64/4",price:6300},

    {brand:"Xiaomi",name:"Redmi Note 60X 128/4",price:7200},

    {brand:"Xiaomi",name:"Redmi Note 60X 64/3",price:6100},

    {brand:"Realme",name:"Realme C71 128/4",price:8400},

    {brand:"Realme",name:"Realme C71 128/6",price:9000},

    {brand:"Realme",name:"Realme C71 256/4",price:9400},

    {brand:"Realme",name:"Realme C85 256/8",price:12400},

    {brand:"Realme",name:"Realme C85 Pro 256/8",price:13600},

    {brand:"Realme",name:"Realme X6C 256/6",price:9650},

    {brand:"Honor",name:"Honor 400 256/12",price:21500},

    {brand:"Oppo",name:"Reno 15 5G 512/12",price:28800},

    {brand:"Oppo",name:"Reno 15F 5G 256/12",price:23300},

    {brand:"Oppo",name:"Reno 15F 5G 256/8",price:21200},

    {brand:"Realme",name:"Realme C53 128/6",price:6400},

    {brand:"Xiaomi",name:"Redmi Note 14 256/8",price:10850},

    {brand:"Xiaomi",name:"Redmi 14C 256/8",price:8200},

    {brand:"Xiaomi",name:"Redmi 13C 128/4",price:6350},

    {brand:"Xiaomi",name:"Redmi Hot 60 5G 128/12",price:8200},

    {brand:"Samsung",name:"Samsung A36 5G 128/8",price:16800},

    {brand:"Samsung",name:"Samsung A16 128/6",price:8500},

    {brand:"Samsung",name:"Samsung A17 256/8",price:13850},

    {brand:"Samsung",name:"Samsung Smart 10 64/4",price:5700},

    {brand:"Samsung",name:"Samsung Smart 10 256/4",price:7800},

    {brand:"Vivo",name:"Vivo Y18 128/6",price:7450},

    {brand:"Realme",name:"Realme 16 Pro 256/12",price:22900},

    {brand:"Xiaomi",name:"Redmi 17 256/4",price:10500},

    {brand:"OnePlus",name:"OnePlus P1 Pro 256/12",price:14500}

  ];

  seedMany(initial);

}

app.use(express.json());

app.use(express.urlencoded({extended:true}));

app.use(session({

  secret: SESSION_SECRET,

  resave:false,

  saveUninitialized:false,

  cookie:{

    httpOnly:true,

    sameSite:"lax",

    secure:false,

    maxAge:8*60*60*1000

  }

}));

function requireAdmin(req,res,next){

  if(!req.session.admin){

    return res.status(401).json({error:"غير مصرح"});

  }

  next();

}

/* البحث والفلترة */

app.get("/api/models",(req,res)=>{

  const q=(req.query.q||"").trim();

  const brand=(req.query.brand||"").trim();

  const type=(req.query.type||"").trim();

  const minPrice =

    req.query.minPrice !== undefined && req.query.minPrice !== ""

      ? Number(req.query.minPrice)

      : null;

  const maxPrice =

    req.query.maxPrice !== undefined && req.query.maxPrice !== ""

      ? Number(req.query.maxPrice)

      : null;

  let sql="SELECT id,brand,name,price,type FROM models";

  const where=[];

  const params=[];

  if(q){

    where.push(

      "(lower(name) LIKE lower(?) OR lower(brand) LIKE lower(?))"

    );

    params.push(`%${q}%`,`%${q}%`);

  }

  if(brand){

    where.push("brand=?");

    params.push(brand);

  }

  if(type==="used" || type==="new"){

    where.push("type=?");

    params.push(type);

  }

  if(Number.isFinite(minPrice)){

    where.push("price>=?");

    params.push(minPrice);

  }

  if(Number.isFinite(maxPrice)){

    where.push("price<=?");

    params.push(maxPrice);

  }

  if(where.length){

    sql+=" WHERE "+where.join(" AND ");

  }

  sql+=" ORDER BY price ASC, id ASC";

  res.json(db.prepare(sql).all(...params));

});

app.get("/api/brands",(req,res)=>{

  res.json(

    db.prepare(

      "SELECT DISTINCT brand FROM models ORDER BY brand"

    ).all().map(x=>x.brand)

  );

});

app.post("/api/login",(req,res)=>{

  if(req.body.password===ADMIN_PASSWORD){

    req.session.admin=true;

    return res.json({ok:true});

  }

  res.status(401).json({

    error:"الرقم السري غير صحيح"

  });

});

app.post("/api/logout",(req,res)=>{

  req.session.destroy(()=>{

    res.json({ok:true});

  });

});

app.get("/api/me",(req,res)=>{

  res.json({

    admin:!!req.session.admin

  });

});

/* إضافة جهاز */

app.post("/api/models",requireAdmin,(req,res)=>{

  const brand=(req.body.brand||"").trim();

  const name=(req.body.name||"").trim();

  const price=Number(req.body.price);

  const type=req.body.type==="new" ? "new" : "used";

  if(

    !brand ||

    !name ||

    !Number.isFinite(price) ||

    price<=0

  ){

    return res.status(400).json({

      error:"بيانات غير مكتملة"

    });

  }

  const r=db.prepare(`

    INSERT INTO models

    (brand,name,price,type)

    VALUES (?,?,?,?)

  `).run(

    brand,

    name,

    price,

    type

  );

  res.json(

    db.prepare(`

      SELECT id,brand,name,price,type

      FROM models

      WHERE id=?

    `).get(r.lastInsertRowid)

  );

});

/* تعديل السعر */

app.put("/api/models/:id",requireAdmin,(req,res)=>{

  const id=Number(req.params.id);

  const price=Number(req.body.price);

  if(

    !Number.isInteger(id) ||

    !Number.isFinite(price) ||

    price<=0

  ){

    return res.status(400).json({

      error:"السعر غير صحيح"

    });

  }

  const r=db.prepare(`

    UPDATE models

    SET price=?,

        updated_at=CURRENT_TIMESTAMP

    WHERE id=?

  `).run(price,id);

  if(!r.changes){

    return res.status(404).json({

      error:"الموديل غير موجود"

    });

  }

  res.json(

    db.prepare(`

      SELECT id,brand,name,price,type

      FROM models

      WHERE id=?

    `).get(id)

  );

});

/* حذف جهاز */

app.delete("/api/models/:id",requireAdmin,(req,res)=>{

  const id=Number(req.params.id);

  const r=db.prepare(

    "DELETE FROM models WHERE id=?"

  ).run(id);

  if(!r.changes){

    return res.status(404).json({

      error:"الموديل غير موجود"

    });

  }

  res.json({ok:true});

});

app.use(

  express.static(

    path.join(__dirname,"public")

  )

);

app.get("*",(req,res)=>{

  res.sendFile(

    path.join(

      __dirname,

      "public",

      "index.html"

    )

  );

});

app.listen(PORT,()=>{

  console.log(

    `iUsed running on port ${PORT}`

  );

});
