import { writable } from 'svelte/store';
import type { DataExtractorColumn, DataExtractorRow, DataExtractorUpload } from '$lib/types/data-extractor';

export const dataExtractorColumns = writable<DataExtractorColumn[]>([]);
export const dataExtractorRows = writable<DataExtractorRow[]>([]);
export const dataExtractorUploads = writable<DataExtractorUpload[]>([]);
