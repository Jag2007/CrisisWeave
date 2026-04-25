// Upload controller accepts JSON body/file uploads and immediately starts the
// background agent graph so the dashboard can keep showing live progress.
import type { Request, Response, NextFunction } from "express";
import { startUploadedJsonProcessing } from "../services/uploadPipeline.service";

function parseMultipartJson(req: Request): unknown {
  const file = req.file;
  if (!file) {
    return req.body;
  }

  return JSON.parse(file.buffer.toString("utf-8"));
}

export async function uploadJson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = parseMultipartJson(req);
    const result = await startUploadedJsonProcessing({
      payload,
      originalFileName: req.file?.originalname || "json-body-upload.json",
      uploadSource: req.file ? "multipart_file" : "json_body"
    });

    res.status(202).json({
      ok: true,
      result
    });
  } catch (error) {
    next(error);
  }
}
