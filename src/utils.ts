import * as YAML from 'yaml';
import * as path from 'path';

/**
 * Parse OpenAPI content from a file, handling both JSON and YAML formats
 */
export function parseOpenApiContent(content: string, filePath: string): object {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.yaml' || ext === '.yml') {
        return YAML.parse(content);
    } else if (ext === '.json') {
        return JSON.parse(content);
    }

    // Try to auto-detect format
    const trimmed = content.trim();
    if (trimmed.startsWith('{')) {
        return JSON.parse(content);
    } else {
        return YAML.parse(content);
    }
}

/**
 * Check if the parsed content appears to be a valid OpenAPI specification
 */
export function isValidOpenApiSpec(spec: unknown): spec is OpenApiSpec {
    if (typeof spec !== 'object' || spec === null) {
        return false;
    }

    const obj = spec as Record<string, unknown>;

    // Check for OpenAPI 3.x
    if (typeof obj.openapi === 'string' && obj.openapi.startsWith('3.')) {
        return true;
    }

    // Check for Swagger 2.0
    if (typeof obj.swagger === 'string' && obj.swagger.startsWith('2.')) {
        return true;
    }

    return false;
}

/**
 * Basic OpenAPI specification interface for type checking
 */
export interface OpenApiSpec {
    openapi?: string;
    swagger?: string;
    info?: {
        title?: string;
        version?: string;
        description?: string;
    };
    paths?: Record<string, unknown>;
    servers?: Array<{ url: string; description?: string }>;
}
