import mongoose from "mongoose";
import { db_name } from "../constants.js";

// Atlas URIs often already carry a database path and/or query params
// (mongodb+srv://user:pass@host/mydb?retryWrites=true). Appending "/db_name"
// blindly would corrupt those, so only add it when no database is named.
const buildConnectionUri = (uri) => {
  const [base, query] = uri.split("?");
  const trimmed = base.replace(/\/+$/, "");
  const afterProtocol = trimmed.split("//")[1] || "";
  const alreadyNamesDatabase = afterProtocol.includes("/");

  const withDatabase = alreadyNamesDatabase ? trimmed : `${trimmed}/${db_name}`;
  return query ? `${withDatabase}?${query}` : withDatabase;
};

const db_connect = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set. Add it to backend/.env");
    }

    const connection = await mongoose.connect(buildConnectionUri(uri));
    console.log(
      `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`,
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default db_connect;
