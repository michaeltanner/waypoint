// --- WAYPOINT SCHEMA CONVERTER ENGINE (V1 -> V2) ---

function convertV1toV2(v1) {
  if (!v1 || typeof v1 !== 'object') {
    throw new Error("Invalid workspace data: Input must be a valid JSON object.");
  }
  if (v1.schemaVersion === 2) {
    return JSON.parse(JSON.stringify(v1));
  }
  if (v1.schemaVersion !== 1 && v1.schemaVersion !== undefined) {
    throw new Error(`Unsupported source schemaVersion: ${v1.schemaVersion}. Expected 1.`);
  }

  const v2 = JSON.parse(JSON.stringify(v1));
  v2.schemaVersion = 2;
  v2.lastUpdated = new Date().toISOString();

  // 1. Normalize Enums
  v2.enums = v2.enums || {};
  v2.enums.type = ["project", "objective", "key_result", "task", "milestone"];
  v2.enums.status = ["Not Started", "In Progress", "Blocked", "Completed"];
  v2.enums.health = ["Green", "Yellow", "Red"];

  // 2. Default Configurable Hierarchy & Member Flags
  if (!v2.hierarchy || !Array.isArray(v2.hierarchy) || v2.hierarchy.length === 0) {
    v2.hierarchy = [
      { level: 0, type: "project", label: "Project", icon: "📁" },
      { level: 1, type: "objective", label: "Objective", icon: "🎯" },
      { level: 2, type: "key_result", label: "Key Result", icon: "📊" },
      { level: 3, type: "task", label: "Task", icon: "📋" }
    ];
  }
  if (!v2.memberFlags || !Array.isArray(v2.memberFlags)) {
    v2.memberFlags = ["primary", "support", "inactive"];
  }

  // 3. Centralize Team Roster from tasks[0].teamMembers
  const memberIdMap = new Map();
  const teamRoster = [];

  const rawMembers = (v2.tasks && v2.tasks[0] && Array.isArray(v2.tasks[0].teamMembers))
    ? v2.tasks[0].teamMembers
    : (Array.isArray(v2.teamMembers) ? v2.teamMembers : []);

  rawMembers.forEach((oldMember, idx) => {
    const memberNum = (idx + 1).toString().padStart(3, '0');
    const displayId = `TM-${memberNum}`;
    const uuid = oldMember.uuid || (typeof generateUUID === 'function' ? generateUUID() : ('uuid-' + Math.random().toString(36).substr(2, 9)));
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
    if (!t.uuid) {
      t.uuid = (typeof generateUUID === 'function') ? generateUUID() : ('uuid-' + Math.random().toString(36).substr(2, 9));
    }
    const prefix = getSemanticPrefix(t.type);
    typeCounters[prefix] = (typeCounters[prefix] || 0) + 1;
    const newDisplayId = `${prefix}-${typeCounters[prefix].toString().padStart(3, '0')}`;
    t.displayId = t.displayId || newDisplayId;
    t.id = t.displayId;

    if (t.status === "Done") {
      t.status = "Completed";
    }
    if (t.blocked && t.status !== "Completed") {
      t.status = "Blocked";
    }
    delete t.blocked;
    delete t.estimatedDuration;

    if (t.leadId && memberIdMap.has(t.leadId.toLowerCase())) {
      t.leadId = memberIdMap.get(t.leadId.toLowerCase());
    }
    if (t.assigneeId && memberIdMap.has(t.assigneeId.toLowerCase())) {
      t.assigneeId = memberIdMap.get(t.assigneeId.toLowerCase());
    }

    if (isRoot && t.teamMembers) {
      delete t.teamMembers;
    }

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

function convertSchema(data, targetVersion = 2) {
  const currentVersion = data?.schemaVersion || 1;
  if (currentVersion === targetVersion) {
    return data;
  }
  if (currentVersion === 1 && targetVersion === 2) {
    return convertV1toV2(data);
  }
  throw new Error(`Conversion path from Schema v${currentVersion} to v${targetVersion} is not implemented.`);
}

if (typeof window !== 'undefined') {
  window.convertV1toV2 = convertV1toV2;
  window.convertSchema = convertSchema;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { convertV1toV2, convertSchema };
}
