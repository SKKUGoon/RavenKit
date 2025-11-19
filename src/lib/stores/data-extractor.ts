import { writable } from 'svelte/store';
import type { DataExtractorColumn } from '$lib/types/data-extractor';

export const dataExtractorColumns = writable<DataExtractorColumn[]>([]);
