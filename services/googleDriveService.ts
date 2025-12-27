
import { UploadedDocument } from "../types";

// These values must be provided via the environment or defined here for the Drive integration to work.
const CLIENT_ID = (window as any).process?.env?.GOOGLE_DRIVE_CLIENT_ID || '';
const API_KEY = (window as any).process?.env?.GOOGLE_DRIVE_API_KEY || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient: any = null;
let accessToken: string | null = null;

/**
 * Initializes the Google API client and Identity Services.
 * Requires GSI and GAPI scripts to be loaded in index.html.
 */
export const initGoogleDrive = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const checkGapi = () => {
      const g = (window as any).google;
      const ga = (window as any).gapi;

      if (g && ga) {
        try {
          ga.load('picker', () => {
            // Only attempt initialization if CLIENT_ID is present to avoid GIS errors
            if (CLIENT_ID) {
              tokenClient = g.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                  if (response.error !== undefined) {
                    console.error("GIS Callback Error:", response);
                  }
                  accessToken = response.access_token;
                },
              });
            } else {
              console.warn("Google Drive CLIENT_ID is missing. Drive integration will be disabled.");
            }
            resolve();
          });
        } catch (err) {
          console.error("Failed to initialize Google Drive client:", err);
          reject(err);
        }
      } else {
        setTimeout(checkGapi, 100);
      }
    };
    checkGapi();
  });
};

/**
 * Requests an access token if not present
 */
const getAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (accessToken) {
      resolve(accessToken);
      return;
    }

    if (!tokenClient) {
      reject(new Error("Google Identity Services not initialized. Please ensure GOOGLE_DRIVE_CLIENT_ID is configured."));
      return;
    }

    tokenClient.callback = (response: any) => {
      if (response.error) {
        reject(new Error(`OAuth Error: ${response.error_description || response.error}`));
        return;
      }
      accessToken = response.access_token;
      resolve(accessToken!);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

/**
 * Downloads file content from Drive and converts it to Base64
 */
const downloadFile = async (fileId: string, mimeType: string): Promise<{ data: string, mime: string }> => {
  const token = await getAccessToken();
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  let targetMime = mimeType;

  // Handle Google Docs (must be exported to PDF for LLM ingestion)
  if (mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
    targetMime = 'application/pdf';
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ data: base64, mime: targetMime });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Opens the Google Picker to select files
 */
export const openGooglePicker = async (): Promise<UploadedDocument[]> => {
  if (!API_KEY || !CLIENT_ID) {
    throw new Error("Google Drive credentials (API_KEY/CLIENT_ID) are missing from the environment.");
  }

  const token = await getAccessToken();

  return new Promise((resolve, reject) => {
    const pickerCallback = async (data: any) => {
      const g = (window as any).google;
      if (data.action === g.picker.Action.PICKED) {
        const docs: UploadedDocument[] = [];
        const files = data.docs;

        for (const file of files) {
          try {
            const { data: base64, mime } = await downloadFile(file.id, file.mimeType);
            docs.push({
              id: file.id,
              name: file.name,
              mimeType: mime,
              data: base64,
              isActive: true,
              size: file.sizeBytes || 0
            });
          } catch (err) {
            console.error(`Error downloading ${file.name}:`, err);
          }
        }
        resolve(docs);
      } else if (data.action === g.picker.Action.CANCEL) {
        resolve([]);
      }
    };

    try {
      const g = (window as any).google;
      const picker = new g.picker.PickerBuilder()
        .addView(g.picker.ViewId.DOCS)
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setCallback(pickerCallback)
        .enableFeature(g.picker.Feature.MULTISELECT_ENABLED)
        .build();
      
      picker.setVisible(true);
    } catch (err) {
      reject(new Error("Failed to open Google Picker. Check your API key and Origin authorization."));
    }
  });
};
