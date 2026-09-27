import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerTools } from "../tools.js";

// Minimal McpServer stub that records tool registrations without network/fs side effects.
function createStubServer() {
  const registered: Array<{ name: string; annotations?: Record<string, boolean> }> = [];

  const server = {
    tool(
      name: string,
      descriptionOrSchema: unknown,
      schemaOrAnnotationsOrHandler: unknown,
      annotationsOrHandler?: unknown,
      handler?: unknown
    ) {
      // Detect annotations: 5 args means (name, desc, schema, annotations, handler)
      let annotations: Record<string, boolean> | undefined;
      if (typeof handler === "function") {
        annotations = annotationsOrHandler as Record<string, boolean>;
      } else if (
        typeof annotationsOrHandler === "object" &&
        annotationsOrHandler !== null &&
        "readOnlyHint" in (annotationsOrHandler as object)
      ) {
        annotations = annotationsOrHandler as Record<string, boolean>;
      }
      registered.push({ name, annotations });
      return { name };
    },
  };

  return { server, registered };
}

const ALL_TOOL_NAMES = [
  "skillsmp_search",
  "skillsmp_ai_search",
  "skillsmp_scan_skill",
  "skillsmp_search_safe",
  "skillsmp_install_skill",
  "skillsmp_uninstall_skill",
  "skillsmp_list_installed",
  "skillsmp_audit_installed",
  "skillsync_configure",
  "skillsync_sync_now",
  "skillsync_status",
  "skillsmp_suggest",
  "skillsmp_compare",
] as const;

describe("tools — registration", () => {
  it("registers all 13 tools without errors", () => {
    const { server, registered } = createStubServer();
    registerTools(server as any);
    const names = registered.map((t) => t.name);
    assert.equal(names.length, ALL_TOOL_NAMES.length, `Expected ${ALL_TOOL_NAMES.length} tools, got ${names.length}: ${names.join(", ")}`);
  });

  for (const toolName of ALL_TOOL_NAMES) {
    it(`registers tool: ${toolName}`, () => {
      const { server, registered } = createStubServer();
      registerTools(server as any);
      const found = registered.find((t) => t.name === toolName);
      assert.ok(found, `Tool "${toolName}" was not registered`);
    });
  }
});

describe("tools — annotations", () => {
  it("every tool has all four annotation hints", () => {
    const { server, registered } = createStubServer();
    registerTools(server as any);

    const missing: string[] = [];
    for (const tool of registered) {
      const a = tool.annotations;
      if (
        !a ||
        typeof a.readOnlyHint !== "boolean" ||
        typeof a.destructiveHint !== "boolean" ||
        typeof a.idempotentHint !== "boolean" ||
        typeof a.openWorldHint !== "boolean"
      ) {
        missing.push(tool.name);
      }
    }
    assert.deepEqual(missing, [], `Tools missing annotation hints: ${missing.join(", ")}`);
  });

  it("read-only tools have readOnlyHint=true", () => {
    const readOnlyTools = [
      "skillsmp_search",
      "skillsmp_ai_search",
      "skillsmp_scan_skill",
      "skillsmp_search_safe",
      "skillsmp_list_installed",
      "skillsmp_audit_installed",
      "skillsync_status",
      "skillsmp_suggest",
      "skillsmp_compare",
    ];
    const { server, registered } = createStubServer();
    registerTools(server as any);

    for (const name of readOnlyTools) {
      const tool = registered.find((t) => t.name === name);
      assert.ok(tool?.annotations?.readOnlyHint === true, `${name} should have readOnlyHint=true`);
    }
  });

  it("uninstall tool has destructiveHint=true", () => {
    const { server, registered } = createStubServer();
    registerTools(server as any);
    const tool = registered.find((t) => t.name === "skillsmp_uninstall_skill");
    assert.ok(tool?.annotations?.destructiveHint === true, "skillsmp_uninstall_skill should have destructiveHint=true");
  });

  it("network tools have openWorldHint=true", () => {
    const networkTools = [
      "skillsmp_search",
      "skillsmp_ai_search",
      "skillsmp_scan_skill",
      "skillsmp_search_safe",
      "skillsmp_install_skill",
      "skillsync_sync_now",
      "skillsmp_suggest",
      "skillsmp_compare",
    ];
    const { server, registered } = createStubServer();
    registerTools(server as any);

    for (const name of networkTools) {
      const tool = registered.find((t) => t.name === name);
      assert.ok(tool?.annotations?.openWorldHint === true, `${name} should have openWorldHint=true`);
    }
  });
});
