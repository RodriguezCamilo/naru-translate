import { ImageAnnotatorClient } from "@google-cloud/vision";
import { v3 as TranslateV3 } from "@google-cloud/translate";

const projectId = process.env.GOOGLE_PROJECT_ID!;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL!;
const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const location = process.env.GOOGLE_LOCATION || "global";

export const visionClient = new ImageAnnotatorClient({
  credentials: { client_email: clientEmail, private_key: privateKey },
  projectId,
});

export const translateClient = new TranslateV3.TranslationServiceClient({
  credentials: { client_email: clientEmail, private_key: privateKey },
  projectId,
});

export const translateParent = `projects/${projectId}/locations/${location}`;
