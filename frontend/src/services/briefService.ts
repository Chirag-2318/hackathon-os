/**
 * briefService.ts — Brief CRUD, intake parsing, and confirmation.
 */
import { apiFetch } from '@/api/client';
import { ApiError, API_BASE_URL } from '@/lib/apiClient';
import type { Brief, BriefFields, RubricCriterion, FileIntakeResult } from './types';

export const briefService = {
  async intakeFile(
    roomId: string,
    file: File,
    extract: boolean = false,
    onProgress?: (pct: number) => void
  ): Promise<FileIntakeResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const baseUrl = API_BASE_URL;
      xhr.open('POST', `${baseUrl}/api/v1/rooms/${roomId}/brief/intake/file?extract=${extract}`);
      xhr.withCredentials = true;

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new ApiError(xhr.status, 'Invalid server response', 'INVALID_RESPONSE'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new ApiError(xhr.status, err.message || `Upload failed with status ${xhr.status}`, err.code || 'UPLOAD_FAILED'));
          } catch {
            reject(new ApiError(xhr.status, `Upload failed with status ${xhr.status}`, 'UPLOAD_FAILED'));
          }
        }
      };

      xhr.onerror = () => {
        reject(new ApiError(0, 'Network error during upload', 'NETWORK_ERROR'));
      };

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  },

  async getBrief(roomId: string): Promise<Brief | null> {
    return apiFetch<Brief>(`/api/v1/rooms/${roomId}/brief`);
  },

  async saveBrief(brief: Brief): Promise<Brief> {
    return apiFetch<Brief>(`/api/v1/rooms/${brief.roomId}/brief`, {
      method: 'PUT',
      body: JSON.stringify({
        source: brief.source,
        sourceUrl: brief.sourceUrl,
        fileName: brief.fileName,
        rawText: brief.rawText,
        fields: brief.fields,
        confirmedFields: brief.confirmedFields,
        risks: brief.risks,
      }),
    });
  },

  async updateConfirmedField(roomId: string, fieldKey: string, confirmed: boolean): Promise<Brief> {
    return apiFetch<Brief>(`/api/v1/rooms/${roomId}/brief/confirmed-fields`, {
      method: 'PATCH',
      body: JSON.stringify({ fieldKey, confirmed }),
    });
  },

  async setLinkSource(roomId: string, url: string): Promise<Brief> {
    return apiFetch<Brief>(`/api/v1/rooms/${roomId}/brief/source/link`, {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },

  async setTextSource(roomId: string, text: string): Promise<Brief> {
    return apiFetch<Brief>(`/api/v1/rooms/${roomId}/brief/source/text`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async setPdfSource(roomId: string, file: File, onProgress?: (pct: number) => void): Promise<Brief> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const baseUrl = API_BASE_URL;
      xhr.open('POST', `${baseUrl}/api/v1/rooms/${roomId}/brief/source/pdf`);
      xhr.withCredentials = true;

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new ApiError(xhr.status, 'Invalid server response', 'INVALID_RESPONSE'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new ApiError(xhr.status, err.message || `Upload failed with status ${xhr.status}`, err.code || 'UPLOAD_FAILED'));
          } catch {
            reject(new ApiError(xhr.status, `Upload failed with status ${xhr.status}`, 'UPLOAD_FAILED'));
          }
        }
      };

      xhr.onerror = () => reject(new ApiError(0, 'Network error during upload', 'NETWORK_ERROR'));

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  },

  async setImagesSource(roomId: string, files: File[], onProgress?: (pct: number) => void): Promise<Brief> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const baseUrl = API_BASE_URL;
      xhr.open('POST', `${baseUrl}/api/v1/rooms/${roomId}/brief/source/images`);
      xhr.withCredentials = true;

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new ApiError(xhr.status, 'Invalid server response', 'INVALID_RESPONSE'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new ApiError(xhr.status, err.message || `Upload failed with status ${xhr.status}`, err.code || 'UPLOAD_FAILED'));
          } catch {
            reject(new ApiError(xhr.status, `Upload failed with status ${xhr.status}`, 'UPLOAD_FAILED'));
          }
        }
      };

      xhr.onerror = () => reject(new ApiError(0, 'Network error during upload', 'NETWORK_ERROR'));

      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      xhr.send(formData);
    });
  },

  async getExtractionPrompt(roomId: string): Promise<string> {
    const res = await apiFetch<{ prompt?: string; promptText?: string }>(`/api/v1/rooms/${roomId}/brief/extraction-prompt`);
    return res.prompt || res.promptText || '';
  },

  async validateExtract(roomId: string, jsonText: string): Promise<{ valid: boolean; fields?: BriefFields; errors: string[] }> {
    return apiFetch<{ valid: boolean; fields?: BriefFields; errors: string[] }>(`/api/v1/rooms/${roomId}/brief/extract/validate`, {
      method: 'POST',
      body: JSON.stringify({ jsonText }),
    });
  },

  async autoExtract(roomId: string): Promise<{ valid: boolean; fields?: BriefFields; errors: string[] }> {
    return apiFetch<{ valid: boolean; fields?: BriefFields; errors: string[] }>(`/api/v1/rooms/${roomId}/brief/extract/auto`, {
      method: 'POST',
    });
  },

  async extractBrief(roomId: string, text: string): Promise<{ applied: boolean; fields: BriefFields; brief: Brief; extractedFieldsCount: number }> {
    return apiFetch<{ applied: boolean; fields: BriefFields; brief: Brief; extractedFieldsCount: number }>(`/api/v1/rooms/${roomId}/brief/extract`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async confirmBrief(roomId: string, applyDatesToRoom: boolean = false): Promise<Brief> {
    return apiFetch<Brief>(`/api/v1/rooms/${roomId}/brief/confirm`, {
      method: 'POST',
      body: JSON.stringify({ applyDatesToRoom }),
    });
  },

  async deleteBrief(roomId: string): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/brief`, { method: 'DELETE' });
  },

  validateBriefJson(jsonStr: string): { valid: boolean; fields?: BriefFields; errors: string[] } {
    try {
      const data = JSON.parse(jsonStr);
      const errors: string[] = [];
      const requiredKeys = ['problemStatement', 'targetAudience', 'rubric', 'deadlines'];
      for (const key of requiredKeys) {
        if (!data[key]) errors.push(`Missing required key: ${key}`);
      }

      if (Array.isArray(data.rubric)) {
        const total = data.rubric.reduce((acc: number, r: RubricCriterion) => acc + (Number(r.weight) || 0), 0);
        if (total !== 100) {
          errors.push(`Rubric weights sum to ${total}, must equal 100.`);
        }
      } else {
        errors.push('Rubric must be an array of {criterion, weight}.');
      }

      if (errors.length > 0) {
        return { valid: false, errors };
      }

      const fields: BriefFields = {
        problemStatement: String(data.problemStatement ?? ''),
        targetAudience: String(data.targetAudience ?? ''),
        rubric: data.rubric ?? [],
        deadlines: {
          start: data.deadlines?.start ?? null,
          freeze: data.deadlines?.freeze ?? null,
          submission: data.deadlines?.submission ?? null,
        },
        eligibility: String(data.eligibility ?? ''),
        techRules: String(data.techRules ?? ''),
        aiPolicy: String(data.aiPolicy ?? ''),
        deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
        tracksAndPrizes: Array.isArray(data.tracksAndPrizes) ? data.tracksAndPrizes : [],
        judgingFormat: String(data.judgingFormat ?? ''),
      };

      return { valid: true, fields, errors: [] };
    } catch (e: any) {
      return { valid: false, errors: [`Invalid JSON: ${e.message}`] };
    }
  },
};
