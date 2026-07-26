import { Request, Response } from "express";

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(err: Error, _req: Request, res: Response) {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error(`[ERROR] ${message}`);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (process.env.NODE_ENV !== "production") {
    return res.status(500).json({ error: message });
  }

  return res.status(500).json({ error: "Internal server error" });
}
