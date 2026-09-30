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
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const count = db.prepare("SELECT COUNT(*) AS c FROM models").get().c;
if (count === 0) {
  const seed = db.prepare("INSERT INTO models (brand,name,price) VALUES (?,?,?)");
  const seedMany = db.transaction(rows => {
    for (const x of rows) seed.run(x.brand, x.name, x.price);
  });
  const initial = [{"id": 1, "brand": "Xiaomi", "name": "Redmi Note 15 256/8", "price": 13900}, {"id": 2, "brand": "Xiaomi", "name": "Redmi Note 15 5G 256/8", "price": 15500}, {"id": 3, "brand": "Xiaomi", "name": "Redmi 15C 256/8", "price": 9700}, {"id": 4, "brand": "Xiaomi", "name": "Redmi 15 256/8 ضمان شواحن زيرو", "price": 9850}, {"id": 5, "brand": "Xiaomi", "name": "Redmi Note 14 Pro 256/8", "price": 15500}, {"id": 6, "brand": "Xiaomi", "name": "Redmi Note 14 Pro 512/12", "price": 17500}, {"id": 7, "brand": "Xiaomi", "name": "Redmi Note 13 128/8", "price": 10700}, {"id": 8, "brand": "Xiaomi", "name": "Redmi 14C 128/4", "price": 7300}, {"id": 9, "brand": "Xiaomi", "name": "Redmi Note 14 Pro Plus 256/12", "price": 21000}, {"id": 10, "brand": "Honor", "name": "Honor X7d 4G 256/8", "price": 11900}, {"id": 11, "brand": "Realme", "name": "Realme C75 256/8", "price": 11000}, {"id": 12, "brand": "Oppo", "name": "Reno 15F 5G 256/12", "price": 23300}, {"id": 13, "brand": "Oppo", "name": "Oppo A6 256/8", "price": 14200}, {"id": 14, "brand": "Oppo", "name": "Reno 14F 5G 256/12", "price": 21500}, {"id": 15, "brand": "Oppo", "name": "Oppo A5 256/8", "price": 11500}, {"id": 16, "brand": "Oppo", "name": "Oppo A5 128/6", "price": 10200}, {"id": 17, "brand": "Vivo", "name": "Vivo Y31 128/8", "price": 11900}, {"id": 18, "brand": "Vivo", "name": "Vivo Y31D 256/8", "price": 12900}, {"id": 19, "brand": "Xiaomi", "name": "Redmi Note 13 128/8 ضمان شواحن زيرو", "price": 8800}, {"id": 20, "brand": "Honor", "name": "Honor 200 256/12", "price": 18900}, {"id": 21, "brand": "Honor", "name": "Honor 200 Pro 512/12", "price": 25000}, {"id": 22, "brand": "Samsung", "name": "Samsung A35 5G 256/8", "price": 15500}, {"id": 23, "brand": "Samsung", "name": "Samsung A26 5G 256/8", "price": 14900}, {"id": 24, "brand": "Samsung", "name": "Samsung A55 5G 256/8", "price": 17500}, {"id": 25, "brand": "Samsung", "name": "Samsung A57 256/12", "price": 25800}, {"id": 26, "brand": "Vivo", "name": "Vivo V60 Lite 5G 256/8", "price": 16500}, {"id": 27, "brand": "Vivo", "name": "Vivo Y21D 128/4", "price": 8600}, {"id": 28, "brand": "Vivo", "name": "Vivo Y21D 256/6", "price": 10300}, {"id": 29, "brand": "Samsung", "name": "Samsung A3 128/6", "price": 8200}, {"id": 30, "brand": "Honor", "name": "Honor 400 Lite 5G 256/8", "price": 17500}, {"id": 31, "brand": "Xiaomi", "name": "Redmi Note 15 Pro 256/12 ضمان خط عربي ضريبة", "price": 14500}, {"id": 32, "brand": "Xiaomi", "name": "Redmi Note 15 Pro 512/12 خط", "price": 22000}, {"id": 33, "brand": "Xiaomi", "name": "Xiaomi Pad Pro 5G 256/8", "price": 16500}, {"id": 34, "brand": "Xiaomi", "name": "Xiaomi Pad 7 256/8", "price": 17500}, {"id": 35, "brand": "Xiaomi", "name": "Redmi Note 13 Pro 256/8 ضمان شواحن زيرو", "price": 13650}, {"id": 36, "brand": "Honor", "name": "Honor Pad 128/8", "price": 9900}, {"id": 37, "brand": "Samsung", "name": "Samsung Pad 128/8", "price": 8400}, {"id": 38, "brand": "Vivo", "name": "Vivo Y21D 128/6", "price": 9500}, {"id": 39, "brand": "Vivo", "name": "Vivo Y31D 128/8", "price": 11800}, {"id": 40, "brand": "Vivo", "name": "Vivo Y31D 256/8", "price": 13000}, {"id": 41, "brand": "Vivo", "name": "Vivo Y11D 128/4", "price": 8450}, {"id": 42, "brand": "Vivo", "name": "Vivo Y500 256/8", "price": 16700}, {"id": 43, "brand": "Oppo", "name": "Oppo A6X 128/4", "price": 9450}, {"id": 44, "brand": "Xiaomi", "name": "Redmi 15 256/8", "price": 11000}, {"id": 45, "brand": "Xiaomi", "name": "Redmi Note 15 Pro 256/12", "price": 18500}, {"id": 46, "brand": "Samsung", "name": "Samsung A5 128/4", "price": 7100}, {"id": 47, "brand": "Samsung", "name": "Samsung A5 64/4", "price": 6300}, {"id": 48, "brand": "Xiaomi", "name": "Redmi Note 60X 128/4", "price": 7200}, {"id": 49, "brand": "Xiaomi", "name": "Redmi Note 60X 64/3", "price": 6100}, {"id": 50, "brand": "Realme", "name": "Realme C71 128/4", "price": 8400}, {"id": 51, "brand": "Realme", "name": "Realme C71 128/6", "price": 9000}, {"id": 52, "brand": "Realme", "name": "Realme C71 256/4", "price": 9400}, {"id": 53, "brand": "Realme", "name": "Realme C85 256/8", "price": 12400}, {"id": 54, "brand": "Realme", "name": "Realme C85 Pro 256/8", "price": 13600}, {"id": 55, "brand": "Realme", "name": "Realme X6C 256/6", "price": 9650}, {"id": 56, "brand": "Honor", "name": "Honor 400 256/12", "price": 21500}, {"id": 57, "brand": "Oppo", "name": "Reno 15 5G 512/12", "price": 28800}, {"id": 58, "brand": "Oppo", "name": "Reno 15F 5G 256/12", "price": 23300}, {"id": 59, "brand": "Oppo", "name": "Reno 15F 5G 256/8", "price": 21200}, {"id": 60, "brand": "Realme", "name": "Realme C53 128/6", "price": 6400}, {"id": 61, "brand": "Xiaomi", "name": "Redmi Note 14 256/8", "price": 10850}, {"id": 62, "brand": "Xiaomi", "name": "Redmi 14C 256/8", "price": 8200}, {"id": 63, "brand": "Xiaomi", "name": "Redmi 13C 128/4", "price": 6350}, {"id": 64, "brand": "Xiaomi", "name": "Redmi Hot 60 5G 128/12", "price": 8200}, {"id": 65, "brand": "Samsung", "name": "Samsung A36 5G 128/8", "price": 16800}, {"id": 66, "brand": "Samsung", "name": "Samsung A16 128/6", "price": 8500}, {"id": 67, "brand": "Samsung", "name": "Samsung A17 256/8", "price": 13850}, {"id": 68, "brand": "Samsung", "name": "Samsung Smart 10 64/4", "price": 5700}, {"id": 69, "brand": "Samsung", "name": "Samsung Smart 10 256/4", "price": 7800}, {"id": 70, "brand": "Vivo", "name": "Vivo Y18 128/6", "price": 7450}, {"id": 71, "brand": "Realme", "name": "Realme 16 Pro 256/12", "price": 22900}, {"id": 72, "brand": "Xiaomi", "name": "Redmi 17 256/4", "price": 10500}, {"id": 73, "brand": "OnePlus", "name": "OnePlus P1 Pro 256/12", "price": 14500}];
  seedMany(initial);
}

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 8*60*60*1000 }
}));

function requireAdmin(req,res,next){
  if (!req.session.admin) return res.status(401).json({error:"غير مصرح"});
  next();
}

app.get("/api/models", (req,res)=>{
  const q = (req.query.q || "").trim();
  const brand = (req.query.brand || "").trim();
  let sql = "SELECT id,brand,name,price FROM models";
  const where=[], params=[];
  if(q){ where.push("(lower(name) LIKE lower(?) OR lower(brand) LIKE lower(?))"); params.push(`%${q}%`,`%${q}%`); }
  if(brand){ where.push("brand=?"); params.push(brand); }
  if(where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY id ASC";
  res.json(db.prepare(sql).all(...params));
});

app.get("/api/brands", (req,res)=>{
  res.json(db.prepare("SELECT DISTINCT brand FROM models ORDER BY brand").all().map(x=>x.brand));
});

app.post("/api/login",(req,res)=>{
  if(req.body.password === ADMIN_PASSWORD){
    req.session.admin = true;
    return res.json({ok:true});
  }
  res.status(401).json({error:"الرقم السري غير صحيح"});
});

app.post("/api/logout",(req,res)=>{
  req.session.destroy(()=>res.json({ok:true}));
});

app.get("/api/me",(req,res)=>res.json({admin:!!req.session.admin}));

app.post("/api/models", requireAdmin, (req,res)=>{
  const brand=(req.body.brand||"").trim(), name=(req.body.name||"").trim(), price=Number(req.body.price);
  if(!brand || !name || !Number.isFinite(price) || price<=0) return res.status(400).json({error:"بيانات غير مكتملة"});
  const r=db.prepare("INSERT INTO models (brand,name,price) VALUES (?,?,?)").run(brand,name,price);
  res.json(db.prepare("SELECT id,brand,name,price FROM models WHERE id=?").get(r.lastInsertRowid));
});

app.put("/api/models/:id", requireAdmin, (req,res)=>{
  const id=Number(req.params.id), price=Number(req.body.price);
  if(!Number.isInteger(id) || !Number.isFinite(price) || price<=0) return res.status(400).json({error:"السعر غير صحيح"});
  const r=db.prepare("UPDATE models SET price=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(price,id);
  if(!r.changes) return res.status(404).json({error:"الموديل غير موجود"});
  res.json(db.prepare("SELECT id,brand,name,price FROM models WHERE id=?").get(id));
});

app.delete("/api/models/:id", requireAdmin, (req,res)=>{
  const id=Number(req.params.id);
  const r=db.prepare("DELETE FROM models WHERE id=?").run(id);
  if(!r.changes) return res.status(404).json({error:"الموديل غير موجود"});
  res.json({ok:true});
});

app.use(express.static(path.join(__dirname,"public")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

app.listen(PORT,()=>console.log(`iUsed running on port ${PORT}`));
