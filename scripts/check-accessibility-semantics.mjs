#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const appPath = new URL("../App.tsx", import.meta.url);
const appSource = readFileSync(appPath, "utf8");
const sourceFile = ts.createSourceFile("App.tsx", appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const scopedComponents = new Map([
  ["Paywall", 6],
  ["Today", 14],
  ["Classes", 3],
  ["ClassDetail", 4],
  ["Tasks", 0],
  ["TaskDetail", 2],
  ["AssessmentDetail", 1],
  ["Plan", 8],
  ["Notes", 2],
  ["NoteDetail", 1],
  ["Profile", 2],
  ["TaskRow", 2],
  ["NoteCard", 1],
]);
const failures = [];
const inventory = [];

const componentDeclarations = new Map(
  sourceFile.statements
    .filter((statement) => ts.isFunctionDeclaration(statement) && statement.name)
    .map((statement) => [statement.name.text, statement]),
);

for (const [componentName, expectedPressables] of scopedComponents) {
  const declaration = componentDeclarations.get(componentName);
  assert(declaration?.body, `${componentName} component must be present`);
  let pressableCount = 0;

  const inspectNode = (node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(sourceFile) === "Pressable") {
      pressableCount += 1;
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      const attributes = new Map(
        node.attributes.properties
          .filter(ts.isJsxAttribute)
          .map((attribute) => [attribute.name.getText(sourceFile), attribute]),
      );
      const location = `${componentName} Pressable at App.tsx:${line}`;

      for (const required of ["accessibilityRole", "accessibilityLabel", "accessibilityHint"]) {
        const attribute = attributes.get(required);
        if (!attribute?.initializer) failures.push(`${location} needs an explicit ${required}`);
      }

      const roleSource = attributes.get("accessibilityRole")?.getText(sourceFile) || "";
      const stateSource = attributes.get("accessibilityState")?.getText(sourceFile) || "";
      if (roleSource.includes("checkbox") && !stateSource.includes("checked")) {
        failures.push(`${location} checkbox state must expose checked`);
      }
      if (roleSource.includes("radio") && !stateSource.includes("selected")) {
        failures.push(`${location} radio state must expose selected`);
      }
      if (attributes.has("disabled") && !stateSource.includes("disabled")) {
        failures.push(`${location} disabled state must match its disabled prop`);
      }
    }
    ts.forEachChild(node, inspectNode);
  };

  inspectNode(declaration.body);
  if (pressableCount !== expectedPressables) {
    failures.push(`${componentName} Pressable inventory changed: expected ${expectedPressables}, found ${pressableCount}; review and update this inventory intentionally`);
  }
  if (componentName === "Tasks" && !declaration.body.getText(sourceFile).includes("<TaskRow")) {
    failures.push("Tasks must continue to render its interactive rows through the audited TaskRow component");
  }
  inventory.push(`${componentName}: ${pressableCount}`);
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Accessibility Pressable inventory passed (${inventory.join(", ")})`);
