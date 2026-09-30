function getBuiltinSampleData() {
      return {
        schemaVersion: SCHEMA_VERSION,
        lastUpdated: new Date().toISOString(),
        classification: "UNCLASSIFIED",
        enums: {
          type: ["project", "objective", "key_result", "task", "milestone"],
          status: ["Not Started", "In Progress", "Blocked", "Completed"],
          health: ["Green", "Yellow", "Red"]
        },
        hierarchy: [
          { level: 0, type: "project", label: "Project", icon: "📁" },
          { level: 1, type: "objective", label: "Objective", icon: "🎯" },
          { level: 2, type: "key_result", label: "Key Result", icon: "📊" },
          { level: 3, type: "task", label: "Task", icon: "📋" }
        ],
        memberFlags: ["primary", "support", "inactive"],
        teamRoster: [
          { id: "TM-001", displayId: "TM-001", uuid: "b8d362b8-bb59-4c03-84bf-afde1ad14dfe", name: "Marcus White", role: "Executive Sponsor / VP of Technology", email: "marcus.white@example.com", officePhone: "555-0100", cellPhone: "555-111-2222", flags: ["primary"], notes: "Portfolio executive sponsor; quarterly briefings required." },
          { id: "TM-002", displayId: "TM-002", uuid: "3a87cb5b-80df-4be2-ba6c-fb3026725bb2", name: "Jane A. Smith", role: "Program Director", email: "jane.smith@example.com", officePhone: "555-0150", cellPhone: "555-222-3333", flags: ["primary"], notes: "Primary operational contact for Zero-Trust and architecture milestones." },
          { id: "TM-003", displayId: "TM-003", uuid: "29e94db9-82bc-448f-aa6a-605ea667fc86", name: "John Doe", role: "Deputy Program Manager", email: "john.doe@example.com", officePhone: "555-0199", cellPhone: "555-333-4444", flags: ["primary"], notes: "Leads decision support engine (Waypoint) delivery and timeline sync." },
          { id: "TM-004", displayId: "TM-004", uuid: "1a8f9c12-3456-4789-a012-3456789abcde", name: "Alice Johnson", role: "Cyber Operations Lead", email: "alice.johnson@example.com", officePhone: "555-0188", cellPhone: "555-444-5555", flags: ["support"], notes: "Coordinates security review gates and ATO paperwork with accrediting officers." },
          { id: "TM-005", displayId: "TM-005", uuid: "5c839f84-9382-41a3-b291-019382746193", name: "E. Wright", role: "Lead Software Engineer", email: "e.wright@example.com", officePhone: "555-0177", cellPhone: "555-555-6666", flags: ["support"], notes: "Frontend architect for single-file zero-dependency offline web stack." },
          { id: "TM-006", displayId: "TM-006", uuid: "76984ed1-433d-4d3b-867a-54a9be317072", name: "M. Chen", role: "Systems Administrator", email: "m.chen@example.com", officePhone: "555-0166", cellPhone: "555-666-7777", flags: ["support"], notes: "Network routing, enclave firewall rules, and policy mapping lead." },
          { id: "TM-007", displayId: "TM-007", uuid: "0d3271ce-d008-499f-b3ff-9b194029736c", name: "Robert Miller", role: "Former Compliance Officer", email: "robert.miller@example.com", officePhone: "555-0144", cellPhone: "555-999-0000", flags: ["inactive"], notes: "Departed organization FY26 Q2; retained for historical audit trail." }
        ],
        tasks: [
          {
            id: "PRJ-001",
            displayId: "PRJ-001",
            uuid: "c9e473a1-772b-4e89-9a1f-0b2e4f6d8a9c",
            type: "project",
            title: "Operation Sentinel Dawn — Cyber Modernization Portfolio",
            status: "In Progress",
            health: "Yellow",
            progress: 68,
            leadId: "TM-001",
            endStateVision: "Establish fully resilient, zero-trust digital networks and air-gapped decision support nodes across all operational units by FY28.",
            definitionOfDone: "All operational command nodes functional on zero-trust architecture with security ATO sign-off.",
            startDate: "2026-09-01",
            dueDate: "2027-09-30",
            notes: "Primary strategic initiative modernizing enterprise infrastructure and offline decision tools.",
            teamMembers: [
              { id: "TM-001", displayId: "TM-001", uuid: "b8d362b8-bb59-4c03-84bf-afde1ad14dfe", name: "Marcus White", role: "Executive Sponsor / VP of Technology", email: "marcus.white@example.com", officePhone: "555-0100", cellPhone: "555-111-2222", flags: ["primary"] },
              { id: "TM-002", displayId: "TM-002", uuid: "3a87cb5b-80df-4be2-ba6c-fb3026725bb2", name: "Jane A. Smith", role: "Program Director", email: "jane.smith@example.com", officePhone: "555-0150", cellPhone: "555-222-3333", flags: ["primary"] },
              { id: "TM-003", displayId: "TM-003", uuid: "29e94db9-82bc-448f-aa6a-605ea667fc86", name: "John Doe", role: "Deputy Program Manager", email: "john.doe@example.com", officePhone: "555-0199", cellPhone: "555-333-4444", flags: ["primary"] },
              { id: "TM-004", displayId: "TM-004", uuid: "1a8f9c12-3456-4789-a012-3456789abcde", name: "Alice Johnson", role: "Cyber Operations Lead", email: "alice.johnson@example.com", officePhone: "555-0188", cellPhone: "555-444-5555", flags: ["support"] },
              { id: "TM-005", displayId: "TM-005", uuid: "5c839f84-9382-41a3-b291-019382746193", name: "E. Wright", role: "Lead Software Engineer", email: "e.wright@example.com", officePhone: "555-0177", cellPhone: "555-555-6666", flags: ["support"] },
              { id: "TM-006", displayId: "TM-006", uuid: "76984ed1-433d-4d3b-867a-54a9be317072", name: "M. Chen", role: "Systems Administrator", email: "m.chen@example.com", officePhone: "555-0166", cellPhone: "555-666-7777", flags: ["support"] },
              { id: "TM-007", displayId: "TM-007", uuid: "0d3271ce-d008-499f-b3ff-9b194029736c", name: "Robert Miller", role: "Former Compliance Officer", email: "robert.miller@example.com", officePhone: "555-0144", cellPhone: "555-999-0000", flags: ["inactive"] }
            ],
            subTasks: [
              {
                id: "OBJ-001",
                displayId: "OBJ-001",
                uuid: "d8392182-3829-4829-a839-281938291029",
                type: "objective",
                title: "Sub-Project A: Zero-Trust Network Architecture (ZTNA)",
                status: "In Progress",
                health: "Green",
                progress: 75,
                leadId: "TM-002",
                startDate: "2026-09-05",
                dueDate: "2026-12-15",
                notes: "Deploying identity provider integration and micro-segmentation security policies across network nodes.",
                subTasks: [
                  { id: "KR-001", displayId: "KR-001", uuid: "e8392819-3829-4920-b829-192039485728", type: "key_result", title: "Identity Provider (IdP) & SSO Integration", status: "Completed", assigneeId: "TM-004", definitionOfDone: "Single sign-on authentication verified on testbed environment with 100% pass rate.", startDate: "2026-09-06", dueDate: "2026-09-20", progress: 100, estimatedDuration: "2 weeks", blocked: false, notes: "Single sign-on authentication verified on testbed." },
                  { id: "TSK-001", displayId: "TSK-001", uuid: "f9283920-4920-4019-c819-203948572910", type: "task", title: "Micro-Segmentation Security Policy Mapping", status: "In Progress", assigneeId: "TM-006", definitionOfDone: "100% of server-to-client traffic flows mapped and firewall rules configured across base enclaves.", startDate: "2026-09-21", dueDate: "2026-10-18", progress: 60, estimatedDuration: "4 weeks", blocked: false, notes: "Mapping server-to-client traffic flows across base enclaves." },
                  { id: "MS-001", displayId: "MS-001", uuid: "a1829304-5829-4729-b829-394857291029", type: "milestone", title: "Zero-Trust Baseline Architecture Sign-Off", status: "In Progress", assigneeId: "TM-002", definitionOfDone: "Formal baseline architecture review document signed off by Cyber Security Directorate.", dueDate: "2026-10-30", progress: 40, notes: "Formal review gate with Cyber Security Directorate." }
                ]
              },
              {
                id: "OBJ-002",
                displayId: "OBJ-002",
                uuid: "b2938495-6930-4820-c930-495867382910",
                type: "objective",
                title: "Sub-Project B: Offline Decision Support Engine (Waypoint)",
                status: "In Progress",
                health: "Green",
                progress: 82,
                leadId: "TM-003",
                startDate: "2026-09-10",
                dueDate: "2026-11-15",
                notes: "Single-file HTML5/CSS3/JS offline portfolio management engine with zero external dependencies.",
                subTasks: [
                  { id: "KR-002", displayId: "KR-002", uuid: "c3849506-7940-4930-d040-506978493021", type: "key_result", title: "Single-File HTML5 Glassmorphic UI Framework", status: "Completed", assigneeId: "TM-005", definitionOfDone: "Single-file HTML5 UI framework created, styled, and verified offline with zero CDN calls.", startDate: "2026-09-10", dueDate: "2026-09-20", progress: 100, estimatedDuration: "10 days", blocked: false, notes: "High-contrast midnight theme, glassmorphic panels, and security classification banners." },
                  { id: "TSK-002", displayId: "TSK-002", uuid: "d4950617-8051-4041-e151-617089504132", type: "task", title: "Cascading Inheritance & Recursive Tree Resolver", status: "Completed", assigneeId: "TM-005", definitionOfDone: "Cascading resolver unit tests passing for team roster and vision inheritance down sub-task branches.", startDate: "2026-09-20", dueDate: "2026-09-28", progress: 100, estimatedDuration: "8 days", blocked: false, notes: "Automatic inheritance of teamMembers and endStateVision down subTask branches." },
                  { id: "TSK-003", displayId: "TSK-003", uuid: "e5061728-9162-4152-f262-728190615243", type: "task", title: "Interactive Gantt Timeline & Schedule Engine", status: "In Progress", assigneeId: "TM-005", definitionOfDone: "Timeline view charts date axes, project bars, and milestone diamonds accurately.", startDate: "2026-09-29", dueDate: "2026-10-15", progress: 50, estimatedDuration: "2 weeks", blocked: false, notes: "Time axis rendering days/weeks/months with project bars and milestone diamonds." },
                  { id: "MS-002", displayId: "MS-002", uuid: "f6172839-0273-4263-a373-839201726354", type: "milestone", title: "Full Prototype Briefing & Field Test", status: "In Progress", assigneeId: "TM-003", definitionOfDone: "Offline prototype briefing delivered to Program Director with full JSON import/export validation.", dueDate: "2026-11-01", progress: 30, notes: "Demonstrate offline JSON import/export and executive tree rendering." }
                ]
              },
              {
                id: "OBJ-003",
                displayId: "OBJ-003",
                uuid: "a7283940-1384-4374-b484-940312837465",
                type: "objective",
                title: "Sub-Project C: Cyber Authority to Operate (ATO) Package",
                status: "Blocked",
                health: "Red",
                progress: 35,
                leadId: "TM-004",
                startDate: "2026-09-12",
                dueDate: "2026-11-30",
                notes: "Formal cyber risk assessment, vulnerability scanning, and approval package.",
                subTasks: [
                  { id: "KR-003", displayId: "KR-003", uuid: "b8394051-2495-4485-c595-051423948576", type: "key_result", title: "Static Application Security Testing (SAST) Audit", status: "Completed", assigneeId: "TM-004", definitionOfDone: "SAST scan report clean with zero high or critical security findings.", startDate: "2026-09-15", dueDate: "2026-09-22", progress: 100, estimatedDuration: "1 week", blocked: false, notes: "Confirmed zero external network calls, CDNs, or dynamic script injections." },
                  { id: "TSK-004", displayId: "TSK-004", uuid: "c9405162-3506-4596-d606-162534059687", type: "task", title: "Obtain Cyber Security Approval Signature", status: "Blocked", assigneeId: "TM-004", definitionOfDone: "Designated Approving Authority signature affixed to official ATO memorandum.", startDate: "2026-09-22", dueDate: "2026-10-15", progress: 20, estimatedDuration: "3 weeks", blocked: true, delegatedToId: "TM-004", delegatedOnDate: "2026-09-22", delegatedDueDate: "2026-10-05", notes: "Designated Approving Authority on leave until Oct 5th." },
                  { id: "MS-003", displayId: "MS-003", uuid: "d0516273-4617-4607-e717-273645160798", type: "milestone", title: "ATO Package Formal Submission", status: "Not Started", assigneeId: "TM-004", definitionOfDone: "Complete compliance binder submitted to Accrediting Authority.", dueDate: "2026-11-15", progress: 0, notes: "Submit complete compliance binder to Accrediting Authority." }
                ]
              }
            ]
          }
        ]
      };
    }

    function seedSampleData() {
      loadBuiltinExample();
    }

    function resetSampleData() {
      if (confirm("Load default built-in example dataset (Operation Sentinel Dawn)?")) {
        loadBuiltinExample();
      }
    }