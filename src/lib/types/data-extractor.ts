export type DataExtractorColumn = {
	id: number;
	name: string;
	synonym: string;
	prompt: string;
};

export type DataExtractorRow = {
	id: number;
	file?: File;
	filename?: string;
	values: Record<number, string>;
	uploadId?: string;
};

export type DataExtractorUpload = {
	rowId: number | null;
	filename: string;
	fileId: string;
};
