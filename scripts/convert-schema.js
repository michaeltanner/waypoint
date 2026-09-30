#!/usr/bin/env node

/**
 * Waypoint Schema Converter
 * Converts Waypoint workspace files between schema versions.
 * Currently supports: Version 1 -> Version 2.
 *
 * Usage as CLI:
 *   node scripts/convert-schema.js <inputFile> [outputFile] [--to=2]
 *
 * Usage as Module:
 *   const { convertSchema, convertV1toV2 } = require('./convert-schema');
 *   const v2Data = convertSchema(v1Data, 2);
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// RFC 4122 v4 UUID generator (Node.js & browser safe)
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_HIERARCHY_V2 = [
  { level: 0, type: "project", label: "Project", icon: "📁" },
  { level: 1, type: "objective", label: "Objective", icon: "🎯" },
  { level: 2, type: "key_result", label: "Key Result", icon: "📊" },
  { level: 3, type: "task", label: "Task", icon: "📋" }
];

const DEFAULT_MEMBER_FLAGS_V2 = ["primary", "support", "inactive"];

/**
 * Converts a Schema v1 workspace object to Schema v2.
 * @param {Object} v1 - Schema v1 workspace JSON object
 * @returns {Object} v2 - Schema v2 compliant workspace JSON object
 */
function convertV1toV2(v1) {
  if (!v1 || typeof v1 !== 'object') {
    throw new Error("Invalid workspace data: Input must be a valid JSON object.");
  }
  if (v1.schemaVersion === 2) {
    // Already v2
    return JSON.parse(JSON.stringify(v1));
  }
  if (v1.schemaVersion !== 1 && v1.schemaVersion !== undefined) {
    throw new Error(`Unsupported source schemaVersion: ${v1.schemaVersion}. Expected 1.`);
  }

  const v2 = JSON.parse(JSON.stringify(v1));
  v2.schemaVersion = 2;
  v2.lastUpdated = new Date().toISOString();

  // 1. Enums normalization
  v2.enums = v2.enums || {};
  v2.enums.type = ["project", "objective", "key_result", "task", "milestone"];
  v2.enums.status = ["Not Started", "In Progress", "Blocked", "Completed"];
  v2.enums.health = ["Green", "Yellow", "Red"];

  // 2. Hierarchy and Member Flags
  if (!v2.hierarchy || !Array.isArray(v2.hierarchy) || v2.hierarchy.length === 0) {
    v2.hierarchy = JSON.parse(JSON.stringify(DEFAULT_HIERARCHY_V2));
  }
  if (!v2.memberFlags || !Array.isArray(v2.memberFlags)) {
    v2.memberFlags = [...DEFAULT_MEMBER_FLAGS_V2];
  }

  // 3. Centralize Team Roster from tasks[0].teamMembers
  const memberIdMap = new Map(); // oldId -> newMember
  const teamRoster = [];

  const rawMembers = (v2.tasks && v2.tasks[0] && Array.isArray(v2.tasks[0].teamMembers))
    ? v2.tasks[0].teamMembers
    : (Array.isArray(v2.teamMembers) ? v2.teamMembers : []);

  rawMembers.forEach((oldMember, idx) => {
    const memberNum = (idx + 1).toString().padStart(3, '0');
    const displayId = `TM-${memberNum}`;
    const uuid = oldMember.uuid || generateUUID();
    const newMember = {
      id: displayId,
      displayId: displayId,
      uuid: uuid,
      name: oldMember.name || `Team Member ${idx + 1}`,
      role: oldMember.role || "Team Member",
      email: oldMember.email || "",
      officePhone: oldMember.officePhone || "",
      cellPhone: oldMember.cellPhone || "",
      tags: ["primary"],
      notes: oldMember.notes || ""
    };
    teamRoster.push(newMember);
    if (oldMember.id) {
      memberIdMap.set(oldMember.id.toLowerCase(), displayId);
    }
  });

  v2.teamRoster = teamRoster;

  // 4. Recursive Task Transformation
  const typeCounters = { PRJ: 0, OBJ: 0, KR: 0, TSK: 0, MS: 0, ITM: 0 };
  function getSemanticPrefix(type) {
    switch (type) {
      case 'project': return 'PRJ';
      case 'objective': return 'OBJ';
      case 'key_result': return 'KR';
      case 'task': return 'TSK';
      case 'milestone': return 'MS';
      default: return 'ITM';
    }
  }

  function transformTask(t, isRoot = false) {
    // Hybrid identity
    if (!t.uuid) t.uuid = generateUUID();
    const prefix = getSemanticPrefix(t.type);
    typeCounters[prefix] = (typeCounters[prefix] || 0) + 1;
    const newDisplayId = `${prefix}-${typeCounters[prefix].toString().padStart(3, '0')}`;
    t.displayId = t.displayId || newDisplayId;
    t.id = t.displayId;

    // Status normalization ('Done' -> 'Completed')
    if (t.status === "Done") {
      t.status = "Completed";
    }
    if (t.blocked && t.status !== "Completed") {
      t.status = "Blocked";
    }
    delete t.blocked;
    delete t.estimatedDuration;

    // Remap team member references
    if (t.leadId && memberIdMap.has(t.leadId.toLowerCase())) {
      t.leadId = memberIdMap.get(t.leadId.toLowerCase());
    }
    if (t.assigneeId && memberIdMap.has(t.assigneeId.toLowerCase())) {
      t.assigneeId = memberIdMap.get(t.assigneeId.toLowerCase());
    }

    // Remove embedded teamMembers array from root task
    if (isRoot && t.teamMembers) {
      delete t.teamMembers;
    }

    // Process subTasks recursively
    if (Array.isArray(t.subTasks)) {
      t.subTasks.forEach(sub => transformTask(sub, false));
    } else {
      t.subTasks = [];
    }
  }

  if (Array.isArray(v2.tasks) && v2.tasks.length > 0) {
    transformTask(v2.tasks[0], true);
  }

  return v2;
}

/**
 * Universal schema converter entry point.
 * @param {Object} data - Input workspace JSON object
 * @param {number} targetVersion - Desired schema version (currently 2)
 * @returns {Object} Converted workspace JSON object
 */
function convertSchema(data, targetVersion = 2) {
  const currentVersion = data.schemaVersion || 1;
  if (currentVersion === targetVersion) {
    return data;
  }
  if (currentVersion === 1 && targetVersion === 2) {
    return convertV1toV2(data);
  }
  throw new Error(`Conversion path from Schema v${currentVersion} to v${targetVersion} is not implemented.`);
}

// CLI Execution Support
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
Waypoint Schema Converter
-------------------------
Usage:
  node scripts/convert-schema.js <inputFile> [outputFile] [--to=2]

Examples:
  node scripts/convert-schema.js old-workspace-v1.json upgraded-workspace-v2.json
  node scripts/convert-schema.js old-workspace.json
`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const inputFile = args[0];
  let outputFile = args[1];
  let targetVersion = 2;

  // Check for --to flag
  args.forEach(arg => {
    if (arg.startsWith('--to=')) {
      targetVersion = parseInt(arg.split('=')[1], 10);
    }
  });

  if (!outputFile || outputFile.startsWith('--')) {
    const ext = path.extname(inputFile);
    const base = path.basename(inputFile, ext);
    const dir = path.dirname(inputFile);
    outputFile = path.join(dir, `${base}-v${targetVersion}${ext}`);
  }

  try {
    const raw = fs.readFileSync(inputFile, 'utf8');
    const data = JSON.parse(raw);
    const fromVer = data.schemaVersion || 1;
    console.log(`Converting '${inputFile}' (v${fromVer}) -> Schema v${targetVersion}...`);
    const converted = convertSchema(data, targetVersion);
    fs.writeFileSync(outputFile, JSON.stringify(converted, null, 2), 'utf8');
    console.log(`Successfully converted and wrote '${outputFile}' (${(new Blob([JSON.stringify(converted)]).size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`Conversion failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  convertSchema,
  convertV1toV2
};
