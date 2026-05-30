type UploadInput = {
  path: string;
  content: string | Buffer;
  contentType: string;
};

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

export class StorageService {
  async upload({ path, content, contentType }: UploadInput) {
    const storageUrl = process.env.SUPABASE_STORAGE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "exports";

    if (!storageUrl || !serviceKey) {
      return `/${bucket}/${path}`;
    }

    const baseUrl = normalizeBaseUrl(storageUrl);
    const objectPath = path.replace(/^\/+/, "");
    const uploadUrl = `${baseUrl}/storage/v1/object/${bucket}/${objectPath}`;

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: content as unknown as BodyInit,
    });

    if (!response.ok) {
      throw new Error(`Falha ao enviar arquivo para o storage: ${response.status} ${await response.text()}`);
    }

    return `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
  }
}
