import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be configured in production");
    }
    return "sherlock-dev-secret-change-in-production";
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new AppError(401, "Missing authentication token");
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { sub?: string; role?: string };
    if (!payload.sub || !payload.role) {
      throw new Error("Invalid token payload");
    }
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      throw new AppError(403, "Insufficient permissions");
    }
    next();
  };
}

export function signTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: "1h" });
  const refreshToken = jwt.sign({ sub: userId, type: "refresh" }, JWT_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}
