import dns from "dns";
import db_connect from "./config/db_connect.js";
import dotenv from "dotenv";
import { app } from "./app.js";
import { startJobNotificationWorker } from "./workers/jobNotification.worker.js";

dotenv.config({
  path: "./.env",
});

// Opt-in escape hatch. Some machines hand Node a DNS resolver that refuses
// queries (e.g. 127.0.0.1 with nothing listening), which breaks the SRV lookup
// that mongodb+srv:// depends on — Atlas then fails with querySrv ECONNREFUSED
// even though the OS resolves names fine. Unset, this is a no-op.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

db_connect()
  .then(() => {
    startJobNotificationWorker();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
