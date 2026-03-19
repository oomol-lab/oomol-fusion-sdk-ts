import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function readSpec(specPath) {
  return JSON.parse(readFileSync(resolve(specPath), "utf8"));
}

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

function literal(value) {
  return JSON.stringify(value);
}

function schemaRefName(ref) {
  const parts = ref.split("/");
  return parts[parts.length - 1];
}

function createRenderer(spec) {
  const emitted = new Map();
  const components = spec.components?.schemas ?? {};

  function renderType(schema, inlineNameHint = "Anonymous") {
    if (!schema) {
      return "unknown";
    }

    if (schema.$ref) {
      return schemaRefName(schema.$ref);
    }

    if (schema.allOf) {
      return schema.allOf.map((item) => renderType(item, inlineNameHint)).join(" & ");
    }

    if (schema.anyOf) {
      return schema.anyOf.map((item) => renderType(item, inlineNameHint)).join(" | ");
    }

    if (schema.oneOf) {
      return schema.oneOf.map((item) => renderType(item, inlineNameHint)).join(" | ");
    }

    if (Array.isArray(schema.type)) {
      return schema.type
        .map((typeName) => renderType({ ...schema, type: typeName }, inlineNameHint))
        .join(" | ");
    }

    if (schema.enum) {
      return schema.enum.map((item) => literal(item)).join(" | ");
    }

    switch (schema.type) {
      case "string":
        return "string";
      case "integer":
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "null":
        return "null";
      case "array":
        return `Array<${renderType(schema.items, `${inlineNameHint}Item`)}>`;
      case "object":
      default:
        return renderObjectType(schema, inlineNameHint);
    }
  }

  function renderObjectType(schema, inlineNameHint) {
    const properties = schema.properties ?? {};
    const required = new Set(schema.required ?? []);
    const propertyNames = Object.keys(properties);
    const lines = [];

    for (const [key, value] of Object.entries(properties)) {
      const optional = required.has(key) ? "" : "?";
      lines.push(`  ${JSON.stringify(key)}${optional}: ${renderType(value, `${inlineNameHint}${toPascalCase(key)}`)};`);
    }

    if (schema.additionalProperties) {
      const valueType =
        schema.additionalProperties === true
          ? "unknown"
          : renderType(schema.additionalProperties, `${inlineNameHint}Value`);
      lines.push(`  [key: string]: ${valueType};`);
    }

    if (propertyNames.length === 0 && schema.additionalProperties) {
      const valueType =
        schema.additionalProperties === true
          ? "unknown"
          : renderType(schema.additionalProperties, `${inlineNameHint}Value`);
      return `Record<string, ${valueType}>`;
    }

    if (lines.length === 0) {
      return "Record<string, unknown>";
    }

    return `{\n${lines.join("\n")}\n}`;
  }

  function emitNamedSchema(name, schema) {
    if (emitted.has(name)) {
      return;
    }

    const body = renderType(schema, name);
    const canUseInterface =
      schema &&
      !schema.$ref &&
      !schema.allOf &&
      !schema.anyOf &&
      !schema.oneOf &&
      !schema.enum &&
      (schema.type === "object" || (!schema.type && schema.properties));

    if (canUseInterface && body.startsWith("{")) {
      emitted.set(name, `export interface ${name} ${body}\n`);
      return;
    }

    emitted.set(name, `export type ${name} = ${body};\n`);
  }

  for (const [name, schema] of Object.entries(components)) {
    emitNamedSchema(name, schema);
  }

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operation || typeof operation !== "object") {
        continue;
      }

      const nameBase = path
        .replace(/^\/v1\//, "")
        .replace(/[{}]/g, "")
        .split("/")
        .map((part) => toPascalCase(part))
        .join("");

      const requestSchema =
        operation.requestBody?.content?.["application/json"]?.schema;
      if (requestSchema && !requestSchema.$ref) {
        emitNamedSchema(`${nameBase}${toPascalCase(method)}Request`, requestSchema);
      }

      for (const [statusCode, response] of Object.entries(operation.responses ?? {})) {
        const responseSchema = response.content?.["application/json"]?.schema;
        if (!responseSchema || responseSchema.$ref) {
          continue;
        }
        emitNamedSchema(
          `${nameBase}${statusCode}Response`,
          responseSchema,
        );
      }
    }
  }

  return [...emitted.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, code]) => code)
    .join("\n");
}

function main() {
  const specPath = process.argv[2] ?? "./openapi.full.snapshot.json";

  const spec = readSpec(specPath);
  const output = `// Auto-generated by scripts/generate-openapi-types.mjs
// Do not edit this file manually.

${createRenderer(spec)}`;

  const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
  const outputPath = resolve(projectRoot, "src/generated/openapi-types.ts");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output, "utf8");
}

main();
