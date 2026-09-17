import { configuration, passwordHash } from "./app.js";
import { connect, run } from "./db.js";
import { randomUUID } from "node:crypto";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(),
  password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 14)
  throw new Error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 14 characters) for this command only.",
  );
const c = configuration(),
  db = await connect(c.database, c.dbToken);
const tx = await db.transaction("write");
try {
  await run(
    tx,
    "INSERT INTO users VALUES(?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET role='admin',password=excluded.password",
    [
      randomUUID(),
      email,
      "어른이아 운영자",
      await passwordHash(password),
      "admin",
      new Date().toISOString(),
    ],
  );
  await run(
    tx,
    "DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email=?)",
    [email],
  );
  await tx.commit();
} catch (e) {
  await tx.rollback();
  throw e;
} finally {
  tx.close();
}
console.log("운영자 계정이 준비되었습니다.");
db.close();
