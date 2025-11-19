import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { openai } from '$lib/server/openai';
import type { DataExtractorColumn, DataExtractorRow } from '$lib/types/data-extractor';

const columnsSchema = z.array(
	z.object({
		id: z.number().optional(),
		name: z.string().optional().nullable(),
		synonym: z.string().optional().nullable(),
		prompt: z.string().optional().nullable()
	})
);

const rowsSchema = z.array(
	z.object({
		id: z.number(),
		values: z.record(z.string())
	})
);

const fileMetaSchema = z.array(
	z.object({
		id: z.number(),
		filename: z.string().optional().nullable()
	})
);

const buildResponseFormat = (columns: DataExtractorColumn[]) => {
	const properties: Record<string, { type: string; description: string }> = {};
	const required: string[] = [];

	columns.forEach((column) => {
		const fallbackName = `column_${column.id}`;
		const key = column.name?.trim() ? column.name.trim().replace(/\s+/g, '_').toLowerCase() : fallbackName;
		properties[key] = {
			type: 'string',
			description: column.prompt?.trim() || `Value extracted for ${column.name || `column ${column.id}`}`
		};
		required.push(key);
	});

	return {
		type: 'json_schema',
		name: 'DataExtractorResponse',
		schema: {
			type: 'object',
			properties,
			required,
			additionalProperties: false
		}
	};
};

const buildPrompt = (columns: DataExtractorColumn[]) =>
	[
		'You are a document extraction specialist.',
		'Use file_extraction on the attachments, then fill the JSON schema exactly.',
		'Return ONLY the JSON object that satisfies the schema.',
		'Fields to extract:',
		...columns.map(
			(column) =>
				`- ${column.name?.trim() || `Column ${column.id}`}: ${column.prompt?.trim() || 'No description'}`
		)
	].join('\n');

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();

	const columnsRaw = formData.get('columns');
	if (typeof columnsRaw !== 'string') {
		throw error(400, 'Columns payload missing.');
	}
	const parsedColumns = columnsSchema.parse(JSON.parse(columnsRaw));
	const columns: DataExtractorColumn[] = parsedColumns.map((column, index) => ({
		id: column.id ?? index + 1,
		name: column.name ?? '',
		synonym: column.synonym ?? '',
		prompt: column.prompt ?? ''
	}));

	const activeColumns = columns.filter((column) => column.prompt?.trim());
	if (!activeColumns.length) {
		throw error(400, 'Please provide a description for at least one column.');
	}

	const rowsRaw = formData.get('rows');
	const parsedRows = rowsRaw ? rowsSchema.parse(JSON.parse(rowsRaw.toString())) : [];
	const rows: DataExtractorRow[] = parsedRows.map((row) => ({
		id: row.id,
		values: row.values
	}));

	const fileMetaRaw = formData.get('fileMeta');
	const fileMeta = fileMetaRaw ? fileMetaSchema.parse(JSON.parse(fileMetaRaw.toString())) : [];

	const documents = formData.getAll('documents') as File[];
	if (!documents.length) {
		throw error(400, 'Please upload at least one document.');
	}

	const responseFormat = buildResponseFormat(activeColumns);
	const prompt = buildPrompt(activeColumns);

	const uploads: { id: string; filename: string; rowId: number | null }[] = [];
	for (let index = 0; index < documents.length; index += 1) {
		const file = documents[index];
		const metadata = fileMeta[index];
		const filename = metadata?.filename ?? file.name ?? `document-${index + 1}`;

		const uploaded = await openai.files.create({
			file,
			purpose: 'user_data'
		});

		uploads.push({
			id: uploaded.id,
			filename,
			rowId: metadata?.id ?? null
		});
	}

	const responsePayload: Record<string, unknown> = {
		model: 'gpt-5-nano',
		input: [
			{
				role: 'user',
				content: [
					...uploads.map((upload) => ({
						type: 'input_file',
						file_id: upload.id
					})),
					{
						type: 'input_text',
						text: prompt
					}
				]
			}
		],
		text: {
			format: responseFormat
		}
	};

	console.log(responsePayload);
	const response = await openai.responses.create(responsePayload as never);

	return json({
		prompt,
		responseFormat,
		response,
		uploads,
		rows,
		activeColumns
	});
};
