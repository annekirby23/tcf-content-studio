import crypto from "crypto";
import { getRedis, kvGet, kvSet } from "./redis";

const USERS_KEY = "tcf:users";
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days

export function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = crypto.scryptSync(password, salt, 64);
  return `${salt}:${buf.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  try {
    const [salt, storedHash] = stored.split(":");
    const buf = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), buf);
  } catch {
    return false;
  }
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function getUsers() {
  return (await kvGet(USERS_KEY)) || [];
}

export async function setUsers(users) {
  await kvSet(USERS_KEY, users);
}

export async function createSession(userId) {
  const token = generateToken();
  await getRedis().setex(`tcf:session:${token}`, SESSION_TTL, userId);
  return token;
}

export async function deleteSession(token) {
  await getRedis().del(`tcf:session:${token}`);
}

export async function getSession(req) {
  const token = req.headers.get("x-session");
  if (!token) return null;
  const userId = await getRedis().get(`tcf:session:${token}`);
  if (!userId) return null;
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

export function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

export function avatarColor(name = "") {
  const palette = ["#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#06B6D4"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}
