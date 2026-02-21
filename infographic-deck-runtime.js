
    // Wrapped in IIFE to prevent global scope pollution and "Identifier already declared" errors
    (function() {
        const theme = {
            text: '#e7e7ea',
            strong: '#f2f3f8',
            muted: '#b5b6bf',
            grid: 'rgba(255, 255, 255, 0.08)',
            primary: '#7aa2f7',
            accent: '#bb9af7',
            vibrant: '#2ac3de',
            danger: '#f7768e'
        };

        // --- UTILITY: Label Wrapping for Chart.js ---
        const wrapLabel = function(label, maxLen = 16) {
            if (label.length <= maxLen) return label;
            const words = label.split(' ');
            const lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                if (currentLine.length + 1 + words[i].length <= maxLen) {
                    currentLine += ' ' + words[i];
                } else {
                    lines.push(currentLine);
                    currentLine = words[i];
                }
            }
            lines.push(currentLine);
            return lines;
        }

        // --- GLOBAL: Common Chart Options ---
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            color: theme.muted,
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(17, 19, 26, 0.98)',
                    padding: 12,
                    titleColor: theme.strong,
                    bodyColor: theme.text,
                    titleFont: { size: 14, family: 'Inter' },
                    bodyFont: { size: 13, family: 'Inter' },
                    callbacks: {
                        title: function(tooltipItems) {
                            const item = tooltipItems[0];
                            const labels = item.chart.data && item.chart.data.labels;
                            if (labels && labels[item.dataIndex] !== undefined) {
                                const label = labels[item.dataIndex];
                                return Array.isArray(label) ? label.join(' ') : String(label);
                            }
                            const parsedX = item.parsed && typeof item.parsed.x === 'number' ? item.parsed.x : undefined;
                            if (parsedX !== undefined) return `x=${parsedX}`;
                            return item.label ? String(item.label) : '';
                        }
                    }
                },
                legend: {
                    labels: {
                        color: theme.muted,
                        font: { family: 'Inter', size: 12 },
                        usePointStyle: true,
                        boxWidth: 8
                    }
                }
            }
        };

        const setupSandwichDiagram = function() {
            const highlight = document.getElementById('sandwichHighlight');
            const title = document.getElementById('sandwichTitle');
            const body = document.getElementById('sandwichBody');
            const detail = document.getElementById('sandwichDetail');
            const point1 = document.getElementById('sandwichPoint1');
            const point2 = document.getElementById('sandwichPoint2');
            const triggers = Array.from(document.querySelectorAll('[data-sandwich]'));
            const toggles = Array.from(document.querySelectorAll('.sandwich-select'));

            if (!highlight || !title || !body || !detail || !point1 || !point2 || triggers.length === 0 || toggles.length === 0) return;

            const parts = {
                prep: {
                    label: 'Prep / Mission Object',
                    color: theme.primary,
                    box: { left: 16, top: 18, width: 68, height: 16 },
                    description:
                        'Deterministically compile authority (Mission) and assemble a bounded context slice. Treat untrusted Terrain text as evidence with provenance.',
                    detail:
                        'Prep converts intent into a typed mission packet the model can safely consume without improvising scope.',
                    point1:
                        'Authority is compiled up front: objective, scope, constraints, budgets, and allowed effectors.',
                    point2:
                        'Context is sliced with provenance so downstream reasoning can cite evidence instead of guessing.',
                },
                model: {
                    label: 'Model / GenAI',
                    color: theme.accent,
                    box: { left: 24, top: 42, width: 52, height: 14 },
                    description:
                        'One bounded stochastic step. Output is untrusted until it passes Validation. The goal is not “trust the model,” but “trust the loop.”',
                    detail:
                        'The middle layer explores candidate patches or decisions inside the mission boundary; it does not commit.',
                    point1:
                        'Candidate generation can use cheaper models for breadth and reserve frontier models for irreducible ambiguity.',
                    point2:
                        'Outputs remain proposals until validators approve structure, semantics, policy, and budget compliance.',
                },
                validation: {
                    label: 'Validation / Gate',
                    color: theme.vibrant,
                    box: { left: 20, top: 62, width: 60, height: 22 },
                    description:
                        'Parse strictly and run validators. Enforce scope + budgets. If it fails Physics, the change does not exist.',
                    detail:
                        'Validation is fail-closed: parse, tests, and policy checks decide acceptance, not model confidence.',
                    point1:
                        'Rejected outputs are discarded with receipts; no partial apply and no side-channel execution.',
                    point2:
                        'Accepted outputs produce ledger evidence for replay, audit, rollback, and continuous process improvement.',
                },
            };

            const apply = function(key) {
                const part = parts[key] || parts.model;
                highlight.style.left = `${part.box.left}%`;
                highlight.style.top = `${part.box.top}%`;
                highlight.style.width = `${part.box.width}%`;
                highlight.style.height = `${part.box.height}%`;
                highlight.style.borderColor = part.color;
                title.textContent = part.label;
                body.textContent = part.description;
                detail.textContent = part.detail;
                point1.textContent = part.point1;
                point2.textContent = part.point2;

                toggles.forEach((btn) => {
                    const isActive = btn.dataset.sandwich === key;
                    btn.setAttribute('aria-pressed', String(isActive));
                });
            };

            triggers.forEach((btn) => {
                btn.addEventListener('click', () => apply(btn.dataset.sandwich));
            });

            apply('model');
        };

	        const setupLimitCaseChart = function() {
	            const canvas = document.getElementById('limitCaseChart');
	            const slider = document.getElementById('limitVelocitySlider');
	            const velocityValue = document.getElementById('limitVelocityValue');
	            const unguardedValue = document.getElementById('limitUnguardedValue');
	            const stewardedValue = document.getElementById('limitStewardedValue');

            if (!canvas || !slider || !velocityValue || !unguardedValue || !stewardedValue) return;

            const toInt = (value, fallback) => {
                const n = Number.parseInt(String(value), 10);
                return Number.isFinite(n) ? n : fallback;
            };
            const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

            const maxVelocity = 100;
            const velocities = new Array(maxVelocity).fill(0).map((_, i) => i + 1);

            const unguardedRaw = velocities.map((v) => Math.exp((v - 30) / 12));
            const rawMin = Math.min(...unguardedRaw);
            const rawMax = Math.max(...unguardedRaw);
            const unguardedY = unguardedRaw.map((v) => ((v - rawMin) / (rawMax - rawMin)) * 100);

            const stewardedY = velocities.map((v) => 3 + v * 0.02);

            const unguardedData = velocities.map((v, i) => ({ x: v, y: unguardedY[i] }));
            const stewardedData = velocities.map((v, i) => ({ x: v, y: stewardedY[i] }));

            const state = {
                currentX: clamp(toInt(slider.value, 75), 1, maxVelocity),
                limitX: 95,
            };

            const markerPlugin = {
                id: 'aoi_vertical_markers',
                afterDatasetsDraw(chart) {
                    const { ctx, chartArea, scales } = chart;
                    if (!chartArea || !scales || !scales.x || !scales.y) return;

                    const { top, bottom, left, right } = chartArea;
                    const xScale = scales.x;
                    const yScale = scales.y;

                    const drawLine = (xValue, color, dash) => {
                        const xPixel = xScale.getPixelForValue(xValue);
                        if (!Number.isFinite(xPixel)) return;
                        ctx.save();
                        ctx.beginPath();
                        ctx.setLineDash(dash || []);
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 1;
                        ctx.moveTo(xPixel, top);
                        ctx.lineTo(xPixel, bottom);
                        ctx.stroke();
                        ctx.restore();
                    };

                    drawLine(state.limitX, 'rgba(255, 255, 255, 0.28)', [6, 6]);
                    drawLine(state.currentX, 'rgba(122, 162, 247, 0.55)', [2, 6]);

                    const label = 'The Limit Case';
                    const limitXPixel = xScale.getPixelForValue(state.limitX);
                    if (Number.isFinite(limitXPixel)) {
                        ctx.save();
                        ctx.font = '600 12px Inter, sans-serif';
                        ctx.fillStyle = 'rgba(181, 182, 191, 0.9)';
                        const textWidth = ctx.measureText(label).width;
                        const x = Math.min(Math.max(limitXPixel + 8, left + 4), right - textWidth - 4);
                        ctx.fillText(label, x, bottom - 10);
                        ctx.restore();
                    }

                    const idx = clamp(state.currentX, 1, maxVelocity) - 1;
                    const xPixel = xScale.getPixelForValue(state.currentX);
                    const uPixel = yScale.getPixelForValue(unguardedY[idx]);
                    const sPixel = yScale.getPixelForValue(stewardedY[idx]);
                    if (!Number.isFinite(xPixel) || !Number.isFinite(uPixel) || !Number.isFinite(sPixel)) return;

                    const drawDot = (yPixel, color) => {
                        ctx.save();
                        ctx.beginPath();
                        ctx.fillStyle = color;
                        ctx.arc(xPixel, yPixel, 4, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    };

                    drawDot(uPixel, theme.danger);
                    drawDot(sPixel, theme.primary);
                },
            };

            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'Unguarded AI (Exponential Risk)',
                            data: unguardedData,
                            borderColor: theme.danger,
                            backgroundColor: 'transparent',
                            borderWidth: 3,
                            pointRadius: 0,
                            tension: 0.35,
                        },
                        {
                            label: 'Stewarded Loops (Deterministic)',
                            data: stewardedData,
                            borderColor: theme.primary,
                            backgroundColor: 'transparent',
                            borderWidth: 3,
                            pointRadius: 0,
                            tension: 0.2,
                        },
                    ],
                },
                options: {
                    ...commonOptions,
                    parsing: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: {
                            type: 'linear',
                            min: 1,
                            max: maxVelocity,
                            title: { display: true, text: 'AI Generation Velocity (approaching Infinity)', color: theme.muted },
                            ticks: {
                                color: theme.muted,
                                callback: (value) => (value % 10 === 0 ? value : ''),
                            },
                            grid: { color: theme.grid },
                        },
                        y: {
                            beginAtZero: true,
                            suggestedMax: 105,
                            title: { display: true, text: 'System Entropy / Risk', color: theme.muted },
                            ticks: { color: theme.muted },
                            grid: { color: theme.grid },
                        },
                    },
                    plugins: {
                        ...commonOptions.plugins,
                        tooltip: {
                            ...commonOptions.plugins.tooltip,
                            callbacks: {
                                ...commonOptions.plugins.tooltip.callbacks,
                                label: function(context) {
                                    const y = context.parsed && typeof context.parsed.y === 'number' ? context.parsed.y : null;
                                    if (y === null) return context.dataset.label || '';
                                    return `${context.dataset.label}: ${y.toFixed(1)}`;
                                },
                            },
                        },
                    },
                },
                plugins: [markerPlugin],
            });

            const updateReadout = function(nextX) {
                const x = clamp(nextX, 1, maxVelocity);
                state.currentX = x;
                velocityValue.textContent = String(x);
                unguardedValue.textContent = unguardedY[x - 1].toFixed(1);
                stewardedValue.textContent = stewardedY[x - 1].toFixed(1);
                chart.update('none');
            };

	            slider.addEventListener('input', () => updateReadout(toInt(slider.value, state.currentX)));
	            updateReadout(state.currentX);
	        };

	        const setupRecursiveProjectTree = function() {
	            const slider = document.getElementById('fsCycleSlider');
	            const cycleValue = document.getElementById('fsCycleValue');
	            const cycleInline = document.getElementById('fsCycleInline');
	            const treePre = document.getElementById('fsTree');
	            const stageLabel = document.getElementById('fsStageLabel');
	            const foldersCount = document.getElementById('fsFoldersCount');
	            const filesCount = document.getElementById('fsFilesCount');
	            const touchesCount = document.getElementById('fsTouchesCount');
	            const treeCard = document.getElementById('fsTreeCard');
	            const playBtn = document.getElementById('fsPlayBtn');

	            const growthStage = document.getElementById('fsGrowthStage');
	            const growthCaption = document.getElementById('fsGrowthCaption');
	            const seedGroup = document.getElementById('fsTreeSeed');
	            const saplingGroup = document.getElementById('fsTreeSapling');
	            const treeGroup = document.getElementById('fsTreeTree');

	            if (
	                !slider ||
	                !cycleValue ||
	                !cycleInline ||
	                !treePre ||
	                !stageLabel ||
	                !foldersCount ||
	                !filesCount ||
	                !touchesCount ||
	                !treeCard ||
	                !playBtn ||
	                !growthStage ||
	                !growthCaption ||
	                !seedGroup ||
	                !saplingGroup ||
	                !treeGroup
	            ) return;

	            const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
	            const toInt = (value, fallback) => {
	                const n = Number.parseInt(String(value), 10);
	                return Number.isFinite(n) ? n : fallback;
	            };

	            const MAX_CYCLE = 12;
	            const trees = [
	                `project/\n├── README.md\n└── main.py`,
	                `project/\n├── README.md\n├── pyproject.toml\n└── src/\n    └── main.py`,
	                `project/\n├── README.md\n├── pyproject.toml\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   └── cli.py\n│   └── main.py\n└── tests/\n    └── test_cli.py`,
	                `project/\n├── README.md\n├── pyproject.toml\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   ├── cli.py\n│   │   ├── core.py\n│   │   └── io.py\n│   └── main.py\n├── tests/\n│   ├── test_cli.py\n│   └── test_core.py\n└── docs/\n    └── overview.md`,
	                `project/\n├── README.md\n├── pyproject.toml\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   ├── cli.py\n│   │   ├── core.py\n│   │   ├── io.py\n│   │   └── validators/\n│   │       ├── schema.py\n│   │       └── policy.py\n│   └── main.py\n├── tests/\n│   ├── test_cli.py\n│   ├── test_core.py\n│   └── test_validators.py\n└── docs/\n    └── overview.md`,
	                `project/\n├── README.md\n├── pyproject.toml\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   ├── cli.py\n│   │   ├── core.py\n│   │   ├── io.py\n│   │   ├── validators/\n│   │   │   ├── schema.py\n│   │   │   └── policy.py\n│   │   └── workflows/\n│   │       ├── plan.py\n│   │       └── execute.py\n│   └── main.py\n├── tests/\n│   ├── test_cli.py\n│   ├── test_core.py\n│   ├── test_validators.py\n│   └── test_workflows.py\n├── docs/\n│   └── overview.md\n└── .github/\n    └── workflows/\n        └── ci.yml`,
	                `project/\n├── README.md\n├── pyproject.toml\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   ├── cli.py\n│   │   ├── core.py\n│   │   ├── io.py\n│   │   ├── validators/\n│   │   │   ├── schema.py\n│   │   │   └── policy.py\n│   │   ├── workflows/\n│   │   │   ├── plan.py\n│   │   │   └── execute.py\n│   │   └── ledger/\n│   │       ├── events.py\n│   │       └── store.py\n│   └── main.py\n├── tests/\n│   ├── test_cli.py\n│   ├── test_core.py\n│   ├── test_validators.py\n│   ├── test_workflows.py\n│   └── test_ledger.py\n├── docs/\n│   ├── overview.md\n│   └── loop-notes.md\n└── .github/\n    └── workflows/\n        └── ci.yml`,
	                `project/\n├── README.md\n├── pyproject.toml\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   ├── cli.py\n│   │   ├── core.py\n│   │   ├── io.py\n│   │   ├── validators/\n│   │   │   ├── schema.py\n│   │   │   └── policy.py\n│   │   ├── workflows/\n│   │   │   ├── plan.py\n│   │   │   └── execute.py\n│   │   ├── ledger/\n│   │   │   ├── events.py\n│   │   │   └── store.py\n│   │   └── contracts/\n│   │       ├── types.py\n│   │       └── serde.py\n│   └── main.py\n├── tests/\n│   ├── test_cli.py\n│   ├── test_core.py\n│   ├── test_validators.py\n│   ├── test_workflows.py\n│   ├── test_ledger.py\n│   └── test_contracts.py\n├── docs/\n│   ├── overview.md\n│   └── loop-notes.md\n└── .github/\n    └── workflows/\n        └── ci.yml`,
	                `project/\n├── README.md\n├── pyproject.toml\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   ├── cli.py\n│   │   ├── core.py\n│   │   ├── io.py\n│   │   ├── validators/\n│   │   │   ├── schema.py\n│   │   │   └── policy.py\n│   │   ├── workflows/\n│   │   │   ├── plan.py\n│   │   │   └── execute.py\n│   │   ├── ledger/\n│   │   │   ├── events.py\n│   │   │   └── store.py\n│   │   ├── contracts/\n│   │   │   ├── types.py\n│   │   │   └── serde.py\n│   │   └── agents/\n│   │       ├── writer.py\n│   │       ├── judge.py\n│   │       └── refiner.py\n│   └── main.py\n├── tests/\n│   ├── test_cli.py\n│   ├── test_core.py\n│   ├── test_validators.py\n│   ├── test_workflows.py\n│   ├── test_ledger.py\n│   ├── test_contracts.py\n│   └── test_agents.py\n├── docs/\n│   ├── overview.md\n│   └── loop-notes.md\n└── .github/\n    └── workflows/\n        └── ci.yml`,
	                `project/\n├── README.md\n├── pyproject.toml\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   ├── cli.py\n│   │   ├── core.py\n│   │   ├── io.py\n│   │   ├── validators/\n│   │   │   ├── schema.py\n│   │   │   └── policy.py\n│   │   ├── workflows/\n│   │   │   ├── plan.py\n│   │   │   └── execute.py\n│   │   ├── ledger/\n│   │   │   ├── events.py\n│   │   │   └── store.py\n│   │   ├── contracts/\n│   │   │   ├── types.py\n│   │   │   └── serde.py\n│   │   ├── agents/\n│   │   │   ├── writer.py\n│   │   │   ├── judge.py\n│   │   │   └── refiner.py\n│   │   └── context/\n│   │       ├── graph.py\n│   │       └── retrieval.py\n│   └── main.py\n├── tests/\n│   ├── test_cli.py\n│   ├── test_core.py\n│   ├── test_validators.py\n│   ├── test_workflows.py\n│   ├── test_ledger.py\n│   ├── test_contracts.py\n│   ├── test_agents.py\n│   └── test_context.py\n├── docs/\n│   ├── overview.md\n│   ├── loop-notes.md\n│   └── contracts.md\n└── .github/\n    └── workflows/\n        └── ci.yml`,
	                `project/\n├── README.md\n├── pyproject.toml\n├── scripts/\n│   └── bootstrap.sh\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   ├── cli.py\n│   │   ├── core.py\n│   │   ├── io.py\n│   │   ├── validators/\n│   │   │   ├── schema.py\n│   │   │   └── policy.py\n│   │   ├── workflows/\n│   │   │   ├── plan.py\n│   │   │   └── execute.py\n│   │   ├── ledger/\n│   │   │   ├── events.py\n│   │   │   └── store.py\n│   │   ├── contracts/\n│   │   │   ├── types.py\n│   │   │   └── serde.py\n│   │   ├── agents/\n│   │   │   ├── writer.py\n│   │   │   ├── judge.py\n│   │   │   └── refiner.py\n│   │   └── context/\n│   │       ├── graph.py\n│   │       └── retrieval.py\n│   └── main.py\n├── tests/\n│   ├── test_cli.py\n│   ├── test_core.py\n│   ├── test_validators.py\n│   ├── test_workflows.py\n│   ├── test_ledger.py\n│   ├── test_contracts.py\n│   ├── test_agents.py\n│   └── test_context.py\n├── docs/\n│   ├── overview.md\n│   ├── loop-notes.md\n│   ├── contracts.md\n│   └── runbook.md\n└── .github/\n    └── workflows/\n        └── ci.yml`,
	                `project/\n├── README.md\n├── pyproject.toml\n├── scripts/\n│   └── bootstrap.sh\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   ├── cli.py\n│   │   ├── core.py\n│   │   ├── io.py\n│   │   ├── validators/\n│   │   │   ├── schema.py\n│   │   │   └── policy.py\n│   │   ├── workflows/\n│   │   │   ├── plan.py\n│   │   │   └── execute.py\n│   │   ├── ledger/\n│   │   │   ├── events.py\n│   │   │   └── store.py\n│   │   ├── contracts/\n│   │   │   ├── types.py\n│   │   │   └── serde.py\n│   │   ├── agents/\n│   │   │   ├── writer.py\n│   │   │   ├── judge.py\n│   │   │   └── refiner.py\n│   │   ├── context/\n│   │   │   ├── graph.py\n│   │   │   └── retrieval.py\n│   │   └── observability/\n│   │       ├── metrics.py\n│   │       └── tracing.py\n│   └── main.py\n├── tests/\n│   ├── test_cli.py\n│   ├── test_core.py\n│   ├── test_validators.py\n│   ├── test_workflows.py\n│   ├── test_ledger.py\n│   ├── test_contracts.py\n│   ├── test_agents.py\n│   ├── test_context.py\n│   └── test_observability.py\n├── docs/\n│   ├── overview.md\n│   ├── loop-notes.md\n│   ├── contracts.md\n│   ├── runbook.md\n│   └── architecture.md\n└── .github/\n    └── workflows/\n        └── ci.yml`,
	                `project/\n├── README.md\n├── LICENSE\n├── pyproject.toml\n├── scripts/\n│   └── bootstrap.sh\n├── docker/\n│   ├── Dockerfile\n│   └── compose.yml\n├── src/\n│   ├── app/\n│   │   ├── __init__.py\n│   │   ├── cli.py\n│   │   ├── core.py\n│   │   ├── io.py\n│   │   ├── validators/\n│   │   │   ├── schema.py\n│   │   │   └── policy.py\n│   │   ├── workflows/\n│   │   │   ├── plan.py\n│   │   │   └── execute.py\n│   │   ├── ledger/\n│   │   │   ├── events.py\n│   │   │   └── store.py\n│   │   ├── contracts/\n│   │   │   ├── types.py\n│   │   │   └── serde.py\n│   │   ├── agents/\n│   │   │   ├── writer.py\n│   │   │   ├── judge.py\n│   │   │   └── refiner.py\n│   │   ├── context/\n│   │   │   ├── graph.py\n│   │   │   └── retrieval.py\n│   │   ├── observability/\n│   │   │   ├── metrics.py\n│   │   │   └── tracing.py\n│   │   └── api/\n│   │       ├── server.py\n│   │       └── routes.py\n│   └── main.py\n├── tests/\n│   ├── test_cli.py\n│   ├── test_core.py\n│   ├── test_validators.py\n│   ├── test_workflows.py\n│   ├── test_ledger.py\n│   ├── test_contracts.py\n│   ├── test_agents.py\n│   ├── test_context.py\n│   ├── test_observability.py\n│   └── test_api.py\n├── docs/\n│   ├── overview.md\n│   ├── loop-notes.md\n│   ├── contracts.md\n│   ├── runbook.md\n│   └── architecture.md\n└── .github/\n    └── workflows/\n        └── ci.yml`,
	            ];

	            const stageForCycle = (cycle) => {
	                if (cycle <= 3) return { label: 'Seed', caption: 'A few files. One executable path. Minimal structure.' };
	                if (cycle <= 7) return { label: 'Sapling', caption: 'Modules + tests + validators. The loop starts to converge.' };
	                return { label: 'Tree', caption: 'Stable interfaces, evidence, and deployment. The system compounds.' };
	            };

	            const countStats = (treeText) => {
	                const lines = String(treeText || '').split('\n');
	                let dirs = 0;
	                let files = 0;
	                for (const raw of lines) {
	                    const stripped = raw.replace(/^[\s│├└─]+/g, '').trim();
	                    if (!stripped) continue;
	                    if (stripped.endsWith('/')) {
	                        dirs += 1;
	                        continue;
	                    }
	                    // Avoid counting "project/" and other non-file lines without extensions.
	                    if (/\.[a-z0-9]{1,6}$/i.test(stripped)) files += 1;
	                }
	                return { dirs, files, touches: dirs + files };
	            };

	            let playTimer = null;
	            const stopPlay = () => {
	                if (playTimer) window.clearInterval(playTimer);
	                playTimer = null;
	                playBtn.textContent = 'Play';
	            };

	            const startPlay = () => {
	                stopPlay();
	                playBtn.textContent = 'Pause';
	                playTimer = window.setInterval(() => {
	                    const current = toInt(slider.value, 0);
	                    if (current >= MAX_CYCLE) {
	                        stopPlay();
	                        return;
	                    }
	                    const next = current + 1;
	                    slider.value = String(next);
	                    setCycle(next);
	                }, 420);
	            };

	            const setGroup = (el, opacity, scale) => {
	                el.style.opacity = String(clamp(opacity, 0, 1));
	                if (typeof scale === 'number') {
	                    el.style.transformBox = 'fill-box';
	                    el.style.transformOrigin = 'center';
	                    el.style.transform = `scale(${scale.toFixed(3)})`;
	                }
	            };

	            const pulseTree = () => {
	                treeCard.style.boxShadow = '0 0 0 1px rgba(122, 162, 247, 0.35), 0 0 28px rgba(122, 162, 247, 0.12)';
	                window.setTimeout(() => {
	                    treeCard.style.boxShadow = '';
	                }, 160);
	            };

	            const setCycle = (cycle) => {
	                const next = clamp(cycle, 0, MAX_CYCLE);
	                const stage = stageForCycle(next);
	                const treeText = trees[next] || trees[0];
	                const stats = countStats(treeText);

	                cycleValue.textContent = String(next);
	                cycleInline.textContent = String(next);
	                stageLabel.textContent = stage.label;
	                treePre.textContent = treeText;
	                foldersCount.textContent = String(stats.dirs);
	                filesCount.textContent = String(stats.files);
	                touchesCount.textContent = String(stats.touches);

	                growthStage.textContent = stage.label;
	                growthCaption.textContent = stage.caption;

	                const seedOpacity = clamp(1 - next / 3, 0, 1);
	                const saplingIn = clamp((next - 2) / 2, 0, 1);
	                const saplingOut = clamp((10 - next) / 2, 0, 1);
	                const saplingOpacity = Math.min(saplingIn, saplingOut);
	                const treeOpacity = clamp((next - 7) / 3, 0, 1);

	                setGroup(seedGroup, seedOpacity, 1);
	                setGroup(saplingGroup, saplingOpacity, 0.98 + (next / MAX_CYCLE) * 0.08);
	                setGroup(treeGroup, treeOpacity, 0.92 + (next / MAX_CYCLE) * 0.12);

	                pulseTree();
	            };

	            slider.addEventListener('input', () => {
	                stopPlay();
	                setCycle(toInt(slider.value, 0));
	            });

	            playBtn.addEventListener('click', () => {
	                if (playTimer) stopPlay();
	                else startPlay();
	            });

		            window.addEventListener('beforeunload', stopPlay, { once: true });
		            setCycle(toInt(slider.value, 0));
		        };

		        const setupInferenceHedgeBuilder = function() {
		            const card = document.getElementById('hedgeBuilderCard');
		            const slider = document.getElementById('hedgeAutonomySlider');
		            const autonomyValue = document.getElementById('hedgeAutonomyValue');
		            const expectedCost = document.getElementById('hedgeExpectedCost');
		            const p95Cost = document.getElementById('hedgeP95Cost');
		            const tailPremium = document.getElementById('hedgeTailPremium');
		            const p95Delta = document.getElementById('hedgeP95Delta');
		            const certainty = document.getElementById('hedgeCertainty');

		            const riskPricing = document.getElementById('hedgeRiskPricing');
		            const riskLockin = document.getElementById('hedgeRiskLockin');
		            const riskLatency = document.getElementById('hedgeRiskLatency');
		            const riskFrontier = document.getElementById('hedgeRiskFrontier');

		            const riskPricingBar = document.getElementById('hedgeRiskPricingBar');
		            const riskLockinBar = document.getElementById('hedgeRiskLockinBar');
		            const riskLatencyBar = document.getElementById('hedgeRiskLatencyBar');
		            const riskFrontierBar = document.getElementById('hedgeRiskFrontierBar');

		            const recommendation = document.getElementById('hedgeRecommendation');
		            const note = document.getElementById('hedgeNote');

		            if (
		                !card ||
		                !slider ||
		                !autonomyValue ||
		                !expectedCost ||
		                !p95Cost ||
		                !tailPremium ||
		                !p95Delta ||
		                !certainty ||
		                !riskPricing ||
		                !riskLockin ||
		                !riskLatency ||
		                !riskFrontier ||
		                !riskPricingBar ||
		                !riskLockinBar ||
		                !riskLatencyBar ||
		                !riskFrontierBar ||
		                !recommendation ||
		                !note
		            ) return;

		            const toggles = Array.from(card.querySelectorAll('[data-hedge-key]'));
		            const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
		            const toInt = (value, fallback) => {
		                const n = Number.parseInt(String(value), 10);
		                return Number.isFinite(n) ? n : fallback;
		            };

		            const formatInt = (n) => Math.round(Number(n)).toLocaleString('en-US');
		            const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		            const HEDGES = {
		                // Pricing volatility is treated as "spot price exposure". Some hedges cap it (fixed/owned),
		                // while others dampen it multiplicatively (routing / frontier minimization).
		                fixed: { cost: 6, pricingMult: 0.25, pricingCap: 12, lockin: +10, latency: 0, frontier: 0, label: 'Fixed-cost contracts' },
		                reserve: { cost: 8, pricingMult: 0.80, pricingCap: 30, lockin: +10, latency: -12, frontier: 0, label: 'Capacity reservations' },
		                multi: { cost: 4, pricingMult: 0.92, lockin: -34, latency: -6, frontier: 0, label: 'Multi-provider routing' },
		                hybrid: { cost: 12, pricingMult: 0.45, pricingCap: 18, lockin: -18, latency: -4, frontier: -10, label: 'Hybrid / owned compute' },
		                minFrontier: { cost: -8, pricingMult: 0.95, lockin: 0, latency: -10, frontier: -34, label: 'Minimize irreducible frontier calls' },
		            };

		            const state = {
		                autonomy: clamp(toInt(slider.value, 60), 0, 100),
		                active: new Set(),
		            };

		            const baseline = (autonomy) => {
		                const t = clamp(autonomy, 0, 100) / 100;
		                return {
		                    cost: 50 + t * 60,
		                    pricing: 25 + Math.pow(t, 1.35) * 75,
		                    lockin: 30 + t * 65,
		                    latency: 15 + t * 70,
		                    frontier: 10 + Math.pow(t, 1.70) * 90,
		                };
		            };

		            const compute = (activeSet = state.active) => {
		                const base = baseline(state.autonomy);
		                let cost = base.cost;
		                let pricing = base.pricing;
		                let pricingMult = 1;
		                let pricingAdd = 0;
		                let pricingCap = 100;
		                let lockin = base.lockin;
		                let latency = base.latency;
		                let frontier = base.frontier;

		                activeSet.forEach((key) => {
		                    const hedge = HEDGES[key];
		                    if (!hedge) return;
		                    cost += hedge.cost;
		                    if (typeof hedge.pricingMult === 'number') pricingMult *= hedge.pricingMult;
		                    if (typeof hedge.pricingAdd === 'number') pricingAdd += hedge.pricingAdd;
		                    if (typeof hedge.pricingCap === 'number') pricingCap = Math.min(pricingCap, hedge.pricingCap);
		                    lockin += hedge.lockin;
		                    latency += hedge.latency;
		                    frontier += hedge.frontier;
		                });

		                pricing = Math.min(pricing * pricingMult + pricingAdd, pricingCap);
		                pricing = clamp(pricing, 0, 100);
		                lockin = clamp(lockin, 0, 100);
		                latency = clamp(latency, 0, 100);
		                frontier = clamp(frontier, 0, 100);
		                cost = clamp(cost, 25, 160);

		                const certainty = clamp(100 - pricing, 0, 100);
		                // Tail risk rises with pricing volatility and frontier exposure. Hedging buys down P95 even if expected rises.
		                const tailFactor = 1 + pricing * 0.008 + frontier * 0.004;
		                const p95 = clamp(cost * tailFactor, cost, 260);
		                const tailPremium = clamp(p95 - cost, 0, 200);
		                const riskIndex = clamp(
		                    pricing * 0.36 + frontier * 0.30 + lockin * 0.20 + latency * 0.14,
		                    0,
		                    100
		                );

		                return { cost, p95, tailPremium, certainty, pricing, lockin, latency, frontier, riskIndex };
		            };

		            const recommendNext = (metrics) => {
		                const ordered = [
		                    { key: 'pricing', value: metrics.pricing },
		                    { key: 'frontier', value: metrics.frontier },
		                    { key: 'lockin', value: metrics.lockin },
		                    { key: 'latency', value: metrics.latency },
		                ].sort((a, b) => b.value - a.value);

		                const wants = (k) => !state.active.has(k);
		                for (const item of ordered) {
		                    if (item.key === 'pricing') {
		                        if (wants('fixed')) return 'Add fixed-cost contracts to cut pricing volatility.';
		                        if (wants('reserve')) return 'Add capacity reservations to stabilize cost and smooth latency.';
		                        if (wants('multi')) return 'Add multi-provider routing to reduce dependency and damp price shocks.';
		                    }
		                    if (item.key === 'frontier') {
		                        if (wants('minFrontier')) return 'Minimize irreducible frontier calls to reduce variance at the source.';
		                        if (wants('hybrid')) return 'Add hybrid / owned compute to reduce frontier exposure and dependency.';
		                    }
		                    if (item.key === 'lockin') {
		                        if (wants('multi')) return 'Add multi-provider routing to reduce systemic dependency.';
		                        if (wants('hybrid')) return 'Add hybrid / owned compute to improve negotiating leverage and resilience.';
		                    }
		                    if (item.key === 'latency') {
		                        if (wants('reserve')) return 'Add capacity reservations to reduce queue risk and architectural friction.';
		                        if (wants('minFrontier')) return 'Minimize frontier calls to cut tail latency and validation burden.';
		                    }
		                }
		                return 'Hedge stack is in place. Now treat compute capacity as a first-class SLO.';
		            };

		            const pulse = () => {
		                if (prefersReducedMotion) return;
		                card.style.boxShadow = '0 0 0 1px rgba(187, 154, 247, 0.30), 0 0 26px rgba(187, 154, 247, 0.10)';
		                window.setTimeout(() => {
		                    card.style.boxShadow = '';
		                }, 160);
		            };

		            const render = () => {
		                autonomyValue.textContent = `${formatInt(state.autonomy)}%`;
		                slider.value = String(state.autonomy);

		                const m = compute(state.active);
		                const spot = compute(new Set());

		                expectedCost.textContent = formatInt(m.cost);
		                p95Cost.textContent = formatInt(m.p95);
		                tailPremium.textContent = formatInt(m.tailPremium);
		                const delta = spot.p95 - m.p95;
		                if (Math.abs(delta) < 0.5) p95Delta.textContent = '0';
		                else if (delta > 0) p95Delta.textContent = `-${formatInt(delta)}`;
		                else p95Delta.textContent = `+${formatInt(-delta)}`;
		                certainty.textContent = formatInt(m.certainty);

		                riskPricing.textContent = formatInt(m.pricing);
		                riskLockin.textContent = formatInt(m.lockin);
		                riskLatency.textContent = formatInt(m.latency);
		                riskFrontier.textContent = formatInt(m.frontier);

		                riskPricingBar.style.width = `${m.pricing.toFixed(1)}%`;
		                riskLockinBar.style.width = `${m.lockin.toFixed(1)}%`;
		                riskLatencyBar.style.width = `${m.latency.toFixed(1)}%`;
		                riskFrontierBar.style.width = `${m.frontier.toFixed(1)}%`;

		                recommendation.textContent = recommendNext(m);

		                const notes = [];
		                const hasCommitment = state.active.has('fixed') || state.active.has('reserve');
		                const hasFlexMitigation = state.active.has('multi') || state.active.has('hybrid');
		                if (hasCommitment && !hasFlexMitigation) {
		                    notes.push('Commitments reduce volatility, but can increase lock-in. Mitigate with multi-provider routing or hybrid capacity.');
		                }
		                if (hasCommitment && spot.p95 > m.p95 + 8) {
		                    notes.push(`Hedge effect: P95 cost drops from ${formatInt(spot.p95)} → ${formatInt(m.p95)} while expected cost is ${formatInt(m.cost)}.`);
		                }
		                if (state.autonomy >= 75 && state.active.size === 0) {
		                    notes.push('High autonomy on spot pricing turns price swings into downtime and rework.');
		                }
		                if (state.active.size === 0 && state.autonomy <= 25) {
		                    notes.push('Low autonomy hides risk. The exposure shows up when the loop becomes production-critical.');
		                }
		                if (notes.length === 0) {
		                    notes.push(`Risk index: ${formatInt(m.riskIndex)}/100 at ${formatInt(state.autonomy)}% autonomy.`);
		                }
		                note.textContent = notes.join(' ');
		            };

		            slider.addEventListener('input', () => {
		                state.autonomy = clamp(toInt(slider.value, state.autonomy), 0, 100);
		                render();
		                pulse();
		            });

		            toggles.forEach((btn) => {
		                btn.addEventListener('click', () => {
		                    const key = btn.dataset.hedgeKey || '';
		                    if (!key || !HEDGES[key]) return;

		                    if (state.active.has(key)) state.active.delete(key);
		                    else state.active.add(key);

		                    btn.setAttribute('aria-pressed', state.active.has(key) ? 'true' : 'false');
		                    render();
		                    pulse();
		                });
		            });

		            render();
		        };

		        const setupRuleOfSevenExplorer = function() {
		            const slider = document.getElementById('ruleSevenSlider');
		            const valueEl = document.getElementById('ruleSevenValue');
		            const modeTitle = document.getElementById('ruleSevenModeTitle');
	            const modeBody = document.getElementById('ruleSevenModeBody');
            const stats = document.getElementById('ruleSevenStats');
            const tree = document.getElementById('ruleSevenTree');

            if (!slider || !valueEl || !modeTitle || !modeBody || !stats || !tree) return;

            const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
            const toInt = (value, fallback) => {
                const n = Number.parseInt(String(value), 10);
                return Number.isFinite(n) ? n : fallback;
            };
            const formatInt = (n) => Number(n).toLocaleString('en-US');

            const dirSeeds = ['mission', 'domain', 'workflow', 'service', 'policy', 'contract', 'ledger', 'validator', 'agent'];
            const fileSeeds = ['intent', 'budget', 'schema', 'checks', 'prompt', 'tests', 'risks', 'notes', 'history'];

            const fileNameFor = (level, index) => {
                const seed = fileSeeds[(index - 1) % fileSeeds.length];
                const ext = level % 2 === 0 ? 'md' : 'json';
                return `${seed}-${level}-${index}.${ext}`;
            };

            const dirNameFor = (level, index) => {
                const seed = dirSeeds[(index - 1) % dirSeeds.length];
                return `${seed}-${level}-${index}`;
            };

            const depthForTarget = (target) => {
                if (target <= 2) return 6;
                if (target <= 4) return 5;
                if (target <= 6) return 4;
                if (target <= 8) return 3;
                return 2;
            };

            const makeConvergingSampler = (target) => {
                const spread = target <= 2 ? 0.8 : (target >= 8 ? 1.35 : 2.1);
                let total = 0;
                let samples = 0;

                return {
                    next: () => {
                        const runningAvg = samples > 0 ? total / samples : target;
                        const drift = target - runningAvg;
                        const noise = (Math.random() - Math.random()) * spread;
                        const value = clamp(Math.round(target + noise + drift * 0.85), 1, 9);
                        total += value;
                        samples += 1;
                        return value;
                    },
                    avg: () => (samples > 0 ? total / samples : target),
                    samples: () => samples,
                };
            };

            const buildTreeModel = function(rawValue) {
                const target = clamp(rawValue, 1, 9);
                const depth = depthForTarget(target);
                const lines = ['workspace/'];
                const visibleCounts = { dirs: 1, files: 0 };
                const lineCap = 140;
                let truncated = false;
                const pushBranch = (prefix, isLast, label) => {
                    if (truncated) return;
                    if (lines.length >= lineCap) {
                        lines.push(`${prefix}${isLast ? '└──' : '├──'} … output truncated`);
                        truncated = true;
                        return;
                    }
                    lines.push(`${prefix}${isLast ? '└──' : '├──'} ${label}`);
                };

                const dirSampler = makeConvergingSampler(target);
                const fileSampler = makeConvergingSampler(target);

                const rootDirCap = target >= 8 ? 8 : (target >= 6 ? 5 : (target >= 4 ? 3 : 1));
                const nestedDirCap = target >= 8 ? 2 : 1;
                const rootFileCap = target >= 8 ? 9 : (target >= 6 ? 6 : (target >= 4 ? 4 : 1));
                const nestedFileCap = target >= 8 ? 4 : (target >= 6 ? 3 : 1);

                const renderDir = function(prefix, level, isLast, label) {
                    if (truncated) return;
                    pushBranch(prefix, isLast, `${label}/`);
                    visibleCounts.dirs += 1;
                    if (truncated) return;

                    const childPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
                    const childDirCount = level < depth ? dirSampler.next() : 0;
                    const childFileCount = fileSampler.next();
                    const dirCap = nestedDirCap;
                    const fileCap = nestedFileCap;
                    const shownDirCount = Math.min(childDirCount, dirCap);
                    const shownFileCount = Math.min(childFileCount, fileCap);

                    const entries = [];

                    for (let i = 1; i <= shownDirCount; i += 1) {
                        entries.push({
                            type: 'dir',
                            label: dirNameFor(level + 1, i),
                            nextLevel: level + 1,
                        });
                    }
                    if (childDirCount > shownDirCount) {
                        entries.push({
                            type: 'summary',
                            label: `… +${childDirCount - shownDirCount} sibling dirs (same pattern)`,
                        });
                    }

                    for (let i = 1; i <= shownFileCount; i += 1) {
                        entries.push({
                            type: 'file',
                            label: fileNameFor(level, i),
                        });
                    }
                    visibleCounts.files += shownFileCount;
                    if (childFileCount > shownFileCount) {
                        entries.push({
                            type: 'summary',
                            label: `… +${childFileCount - shownFileCount} sibling files`,
                        });
                    }

                    entries.forEach((entry, index) => {
                        if (truncated) return;
                        const entryIsLast = index === entries.length - 1;
                        if (entry.type === 'dir') {
                            renderDir(childPrefix, entry.nextLevel, entryIsLast, entry.label);
                            return;
                        }
                        pushBranch(childPrefix, entryIsLast, entry.label);
                    });
                };

                const rootEntries = [];
                const rootDirCount = dirSampler.next();
                const rootFileCount = fileSampler.next();
                const shownRootDirCount = Math.min(rootDirCount, rootDirCap);
                const shownRootFileCount = Math.min(rootFileCount, rootFileCap);

                for (let i = 1; i <= shownRootDirCount; i += 1) {
                    rootEntries.push({
                        type: 'dir',
                        label: dirNameFor(1, i),
                        level: 1,
                    });
                }
                if (rootDirCount > shownRootDirCount) {
                    rootEntries.push({
                        type: 'summary',
                        label: `… +${rootDirCount - shownRootDirCount} root dirs (same pattern)`,
                    });
                }

                for (let i = 1; i <= shownRootFileCount; i += 1) {
                    rootEntries.push({
                        type: 'file',
                        label: fileNameFor(0, i),
                    });
                }
                visibleCounts.files += shownRootFileCount;
                if (rootFileCount > shownRootFileCount) {
                    rootEntries.push({
                        type: 'summary',
                        label: `… +${rootFileCount - shownRootFileCount} root files`,
                    });
                }

                rootEntries.forEach((entry, index) => {
                    if (truncated) return;
                    const isLast = index === rootEntries.length - 1;
                    if (entry.type === 'dir') {
                        renderDir('', entry.level, isLast, entry.label);
                        return;
                    }
                    pushBranch('', isLast, entry.label);
                });

                const convergenceSamples = 180;
                for (let i = 0; i < convergenceSamples; i += 1) {
                    dirSampler.next();
                    fileSampler.next();
                }

                let mode = {
                    title: 'Balanced zone',
                    body: 'This is the workable middle band. Breadth and depth are both high enough to stay navigable.',
                };

                if (target <= 2) {
                    mode = {
                        title: 'Rabbit-hole edge',
                        body: 'Very low branching forces deep drilling. Context becomes brittle and handoffs get expensive.',
                    };
                } else if (target <= 4) {
                    mode = {
                        title: 'Depth-heavy tree',
                        body: 'Still narrow. Better than 1–2, but structure remains chain-like and retrieval costs stay higher.',
                    };
                } else if (target >= 8) {
                    mode = {
                        title: 'Junk-drawer edge',
                        body: 'Very wide layers flatten the map. Discovery is fast, but curation pressure and naming collisions spike.',
                    };
                } else if (target >= 7) {
                    mode = {
                        title: 'Wide-but-usable',
                        body: 'Fast top-level discovery, but you need strict naming and governance to avoid category sprawl.',
                    };
                }

                return {
                    target,
                    depth,
                    lines,
                    visibleCounts,
                    avgDirs: dirSampler.avg(),
                    avgFiles: fileSampler.avg(),
                    sampleCount: Math.min(dirSampler.samples(), fileSampler.samples()),
                    mode,
                };
            };

            const render = function(rawValue) {
                const next = buildTreeModel(toInt(rawValue, 5));
                valueEl.textContent = String(next.target);
                modeTitle.textContent = next.mode.title;
                modeBody.textContent = next.mode.body;
                stats.textContent =
                    `target=${next.target} • avg sibling dirs≈${next.avgDirs.toFixed(2)} • avg files/dir≈${next.avgFiles.toFixed(2)} • depth≈${next.depth} • sampled branches=${formatInt(next.sampleCount)} • visible sample=${next.visibleCounts.dirs} dirs / ${next.visibleCounts.files} files`;
                tree.textContent = next.lines.join('\n');
            };

            slider.addEventListener('input', () => render(slider.value));
            render(slider.value);
        };

        const setupShapeOfAllWork = function() {
            const scales = [
                { id: 'keystroke', label: 'Keystroke', state: 'Buffer Content', process: 'Editor + Habits', time: '~100ms', desc: 'A single character typed. The loop is instant.', speed: 0.5 },
                { id: 'function', label: 'Function', state: 'Implementation', process: 'Developer + Tools', time: '~minutes', desc: 'Logic is structured. Unit tests run.', speed: 2 },
                { id: 'feature', label: 'Feature', state: 'Codebase', process: 'Team + Practices', time: '~days', desc: 'Features merge. Integration tests pass.', speed: 4 },
                { id: 'product', label: 'Product', state: 'System', process: 'Org + Strategy', time: '~months', desc: 'Value reaches customers. Metrics update.', speed: 6 },
                { id: 'company', label: 'Company', state: 'Market Position', process: 'Culture + Leadership', time: '~years', desc: 'The entity evolves.', speed: 10 },
            ];

            const scaleButtons = Array.from(document.querySelectorAll('[data-shape-scale]'));
            const toggle = document.getElementById('shapeSdacToggle');
            const toggleKnob = document.getElementById('shapeSdacKnob');
            const sdacCard = document.getElementById('shapeSdacCard');
            const sdacDescription = document.getElementById('shapeSdacDescription');
            const sdacBadges = document.getElementById('shapeSdacBadges');
            const stateLabel = document.getElementById('shapeStateLabel');
            const processLabel = document.getElementById('shapeProcessLabel');
            const processCardLabel = document.getElementById('shapeProcessCardLabel');
            const timeLabel = document.getElementById('shapeTimeLabel');
            const scaleDescription = document.getElementById('shapeScaleDescription');
            const modeBadge = document.getElementById('shapeLoopModeBadge');
            const guardRing = document.getElementById('shapeGuardRing');
            const guardStatus = document.getElementById('shapeGuardStatus');
            const orbitRing = document.getElementById('shapeOrbitRing');
            const particleLayer = document.getElementById('shapeParticles');
            const tabButtons = Array.from(document.querySelectorAll('[data-shape-tab]'));
            const tabPanels = Array.from(document.querySelectorAll('[data-shape-panel]'));

            if (
                scales.length === 0 ||
                scaleButtons.length === 0 ||
                !toggle ||
                !toggleKnob ||
                !sdacCard ||
                !sdacDescription ||
                !sdacBadges ||
                !stateLabel ||
                !processLabel ||
                !processCardLabel ||
                !timeLabel ||
                !scaleDescription ||
                !modeBadge ||
                !guardRing ||
                !guardStatus ||
                !orbitRing ||
                !particleLayer ||
                tabButtons.length === 0 ||
                tabPanels.length === 0
            ) return;

            let activeScale = 2;
            let isSDaC = false;
            let activeTab = 'concept';
            let rotation = 0;
            let particles = [];
            let particleId = 0;
            let frameHandle = null;

            const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

            const renderScale = function() {
                const scale = scales[activeScale];
                scaleButtons.forEach((button) => {
                    const idx = Number.parseInt(button.dataset.shapeScale || '0', 10);
                    const isActive = idx === activeScale;
                    button.classList.toggle('is-active', isActive);
                    button.setAttribute('aria-pressed', String(isActive));
                });
                stateLabel.textContent = scale.state;
                processLabel.textContent = scale.process;
                processCardLabel.textContent = scale.process;
                timeLabel.textContent = scale.time;
                scaleDescription.textContent = scale.desc;
            };

            const renderSdac = function() {
                toggle.setAttribute('aria-pressed', String(isSDaC));
                toggle.style.backgroundColor = isSDaC ? 'rgba(187, 154, 247, 0.95)' : 'rgba(17, 19, 26, 0.92)';
                toggle.style.borderColor = isSDaC ? 'rgba(187, 154, 247, 0.95)' : 'rgba(255, 255, 255, 0.08)';
                toggleKnob.style.transform = isSDaC ? 'translateX(24px)' : 'translateX(0px)';

                sdacCard.style.borderColor = isSDaC ? 'rgba(187, 154, 247, 0.55)' : 'rgba(255, 255, 255, 0.08)';
                sdacCard.style.background = isSDaC ? 'rgba(187, 154, 247, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                sdacDescription.textContent = isSDaC
                    ? 'Convergence mode: explicit intent surfaces, bounded effectors, and deterministic validation are active.'
                    : 'Standard mode: acceleration without structure. Faster loops can also accelerate drift.';
                sdacBadges.classList.toggle('hidden', !isSDaC);
                guardRing.classList.toggle('hidden', !isSDaC);
                guardStatus.classList.toggle('hidden', !isSDaC);
                guardStatus.classList.toggle('flex', isSDaC);
                modeBadge.textContent = isSDaC ? 'CONVERGING LOOP' : 'STANDARD LOOP';
                modeBadge.style.borderColor = isSDaC ? 'rgba(79, 209, 197, 0.65)' : 'rgba(255, 255, 255, 0.10)';
                modeBadge.style.backgroundColor = isSDaC ? 'rgba(79, 209, 197, 0.10)' : 'rgba(17, 19, 26, 0.92)';
                modeBadge.style.color = isSDaC ? '#4FD1C5' : '#b5b6bf';
            };

            const renderTabs = function() {
                tabButtons.forEach((button) => {
                    const key = button.dataset.shapeTab || '';
                    const isActive = key === activeTab;
                    button.classList.toggle('is-active', isActive);
                    button.setAttribute('aria-selected', String(isActive));
                });
                tabPanels.forEach((panel) => {
                    const key = panel.dataset.shapePanel || '';
                    panel.classList.toggle('hidden', key !== activeTab);
                });
            };

            const renderParticles = function() {
                const fragment = document.createDocumentFragment();
                particles.forEach((particle) => {
                    const element = document.createElement('div');
                    element.className = 'shape-particle absolute w-3 h-3 rounded-full';
                    const radians = (particle.angle * Math.PI) / 180;
                    const x = Math.cos(radians) * particle.radius;
                    const y = Math.sin(radians) * particle.radius;
                    const fade = particle.radius > 160 ? Math.max(0, 1 - (particle.radius - 160) / 60) : 1;
                    element.style.left = `calc(50% + ${x.toFixed(2)}px)`;
                    element.style.top = `calc(50% + ${y.toFixed(2)}px)`;
                    element.style.transform = 'translate(-50%, -50%)';
                    element.style.opacity = String(fade);
                    element.style.backgroundColor = particle.type === 'bad' ? 'rgba(246, 173, 85, 0.95)' : 'rgba(79, 209, 197, 0.95)';
                    fragment.appendChild(element);
                });
                particleLayer.replaceChildren(fragment);
            };

            const tick = function() {
                const scale = scales[activeScale];
                const baseSpeed = 2 / scale.speed;
                rotation = (rotation + baseSpeed) % 360;
                orbitRing.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

                if (Math.random() > 0.95 && particles.length < 26) {
                    particleId += 1;
                    particles.push({
                        id: particleId,
                        angle: 0,
                        radius: 128,
                        type: !isSDaC && Math.random() > 0.8 ? 'bad' : 'good',
                    });
                }

                particles = particles
                    .map((particle) => {
                        const nextAngle = particle.angle + baseSpeed * 2;
                        const ejecting = isSDaC && particle.type === 'bad' && nextAngle > 200;
                        const nextRadius = ejecting ? particle.radius + 4.5 : particle.radius;
                        return {
                            ...particle,
                            angle: nextAngle,
                            radius: nextRadius,
                        };
                    })
                    .filter((particle) => particle.angle < 360 && particle.radius < 220);

                renderParticles();
                frameHandle = requestAnimationFrame(tick);
            };

            scaleButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    const idx = Number.parseInt(button.dataset.shapeScale || '0', 10);
                    activeScale = clamp(idx, 0, scales.length - 1);
                    renderScale();
                });
            });

            toggle.addEventListener('click', () => {
                isSDaC = !isSDaC;
                renderSdac();
            });

            tabButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    const key = button.dataset.shapeTab || 'concept';
                    activeTab = key;
                    renderTabs();
                });
            });

            renderScale();
            renderSdac();
            renderTabs();
            frameHandle = requestAnimationFrame(tick);

            window.addEventListener('beforeunload', () => {
                if (frameHandle !== null) cancelAnimationFrame(frameHandle);
            }, { once: true });
        };

		        setupSandwichDiagram();
		        setupLimitCaseChart();
		        setupInferenceHedgeBuilder();
		        setupRecursiveProjectTree();
		        setupRuleOfSevenExplorer();
		        setupShapeOfAllWork();

	        // --- CHART 2: Value Migration (Stacked Bar) ---
	        const valueCanvas = document.getElementById('valueShiftChart');
	        if (valueCanvas && typeof Chart !== 'undefined') {
	            const ctxValue = valueCanvas.getContext('2d');
	            if (ctxValue) {
	                const valueLabels = ['Pre-AI Era', 'Copilot Era', 'Agent Era', 'The Limit Case'];
        const wrappedValueLabels = valueLabels.map(l => wrapLabel(l));

        new Chart(ctxValue, {
            type: 'bar',
            data: {
                labels: wrappedValueLabels,
                datasets: [
                    {
                        label: 'Execution (Doing)',
                        data: [80, 50, 20, 5],
                        backgroundColor: 'rgba(255, 255, 255, 0.14)',
                        borderRadius: 4
                    },
                    {
                        label: 'Loop Arch. (Building)',
                        data: [10, 30, 50, 45],
                        backgroundColor: theme.primary,
                        borderRadius: 4
                    },
                    {
                        label: 'Terrain Shaping (Intent)',
                        data: [10, 20, 30, 50],
                        backgroundColor: theme.accent,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    x: { stacked: true, grid: { display: false }, ticks: { color: theme.muted } },
                    y: { 
                        stacked: true, 
                        grid: { color: theme.grid },
                        ticks: { color: theme.muted },
                        title: { display: true, text: '% Value', color: theme.muted }
                    }
                }
            }
        });
	            }
	        }

        // --- PLOTLY: 3D TERRAIN ---
        const terrainSize = 30;
        const terrainX = new Array(terrainSize).fill(0).map((_, i) => i);
        const terrainY = new Array(terrainSize).fill(0).map((_, i) => i);

        const terrainPresets = [
            {
                key: 'central',
                label: 'Central Optima',
                waveAmp: 5,
                waveX: 5,
                waveY: 5,
                peaks: [
                    { cx: 15, cy: 15, height: 15, spread: 50 },
                    { cx: 5, cy: 25, height: 10, spread: 30 },
                ],
                valleys: [{ cx: 24, cy: 6, depth: 9, spread: 40 }],
            },
            {
                key: 'shifted',
                label: 'Shifted Intent',
                waveAmp: 4,
                waveX: 6,
                waveY: 4,
                peaks: [
                    { cx: 20, cy: 10, height: 14, spread: 45 },
                    { cx: 10, cy: 22, height: 12, spread: 35 },
                ],
                valleys: [{ cx: 14, cy: 14, depth: 8, spread: 55 }],
            },
            {
                key: 'ridge',
                label: 'Ridge + Narrow Peak',
                waveAmp: 3,
                waveX: 8,
                waveY: 6,
                ridge: { amp: 8, spread: 14 },
                peaks: [{ cx: 24, cy: 24, height: 11, spread: 22 }],
                valleys: [{ cx: 8, cy: 8, depth: 10, spread: 30 }],
            },
        ];

        const gaussian = function(i, j, cx, cy, height, spread) {
            const dx = i - cx;
            const dy = j - cy;
            return Math.exp(-((dx * dx) + (dy * dy)) / spread) * height;
        };

        const generateTerrainZ = function(preset) {
            const z = [];
            const waveAmp = preset.waveAmp ?? 0;
            const waveX = preset.waveX ?? 6;
            const waveY = preset.waveY ?? 6;
            const peaks = preset.peaks ?? [];
            const valleys = preset.valleys ?? [];
            const ridge = preset.ridge ?? null;

            for (let i = 0; i < terrainSize; i++) {
                const row = [];
                for (let j = 0; j < terrainSize; j++) {
                    let value = Math.sin(i / waveX) * Math.cos(j / waveY) * waveAmp;

                    if (ridge) {
                        value += Math.exp(-(((i - j) * (i - j)) / ridge.spread)) * ridge.amp;
                    }

                    for (const peak of peaks) {
                        value += gaussian(i, j, peak.cx, peak.cy, peak.height, peak.spread);
                    }
                    for (const valley of valleys) {
                        value -= gaussian(i, j, valley.cx, valley.cy, valley.depth, valley.spread);
                    }

                    row.push(value);
                }
                z.push(row);
            }
            return z;
        };

        const makeTerrainData = function(z) {
            return [
                {
                    z,
                    x: terrainX,
                    y: terrainY,
                    type: 'surface',
                    colorscale: [
                        [0, '#0b0c10'],   // Dark valleys
                        [0.5, '#7aa2f7'], // Mid slopes
                        [1, '#2ac3de']    // Bright peaks
                    ],
                    showscale: false,
                    contours: {
                        z: {
                            show: true,
                            usecolormap: true,
                            highlightcolor: "#9ece6a",
                            project: { z: true }
                        }
                    }
                }
            ];
        };

        const terrainLayout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            scene: {
                xaxis: { title: '', showgrid: true, gridcolor: theme.grid, showticklabels: false, zeroline: false },
                yaxis: { title: '', showgrid: true, gridcolor: theme.grid, showticklabels: false, zeroline: false },
                zaxis: {
                    title: 'Value',
                    showgrid: true,
                    gridcolor: theme.grid,
                    tickfont: { color: theme.muted },
                    titlefont: { color: theme.muted },
                    zeroline: false,
                },
                camera: {
                    eye: {x: 1.5, y: 1.5, z: 1.2}
                }
            }
        };

        const terrainConfig = { responsive: true, displayModeBar: false };

        const terrainEl = document.getElementById('terrainPlot');
        const terrainLabelEl = document.getElementById('terrainPresetLabel');
        const terrainButtonEl = document.getElementById('terrainReshapeButton');
        if (!terrainEl || typeof Plotly === 'undefined' || typeof Plotly.newPlot !== 'function') return;

        let terrainPresetIndex = 0;

        const applyTerrainPreset = function(index) {
            const preset = terrainPresets[index] || terrainPresets[0];
            if (terrainLabelEl) terrainLabelEl.textContent = preset.label;
            const z = generateTerrainZ(preset);
            const data = makeTerrainData(z);
            if (typeof Plotly.react === 'function') {
                Plotly.react(terrainEl, data, terrainLayout, terrainConfig);
            }
        };

        Plotly.newPlot(
            terrainEl,
            makeTerrainData(generateTerrainZ(terrainPresets[0])),
            terrainLayout,
            terrainConfig
        );

        if (terrainButtonEl) {
            terrainButtonEl.addEventListener('click', function() {
                terrainPresetIndex = (terrainPresetIndex + 1) % terrainPresets.length;
                applyTerrainPreset(terrainPresetIndex);
            });
        }
    })();
    
    (function() {
        const wrapLabel = (str, max) => {
            const words = str.split(' ');
            let lines = [];
            let current = words[0];
            for (let i = 1; i < words.length; i++) {
                if (current.length + 1 + words[i].length <= max) {
                    current += ' ' + words[i];
                } else {
                    lines.push(current);
                    current = words[i];
                }
            }
            lines.push(current);
            return lines;
        };

        let iterationCount = 0;
        const btn = document.getElementById('run-loop-btn');
        const statePrev = document.getElementById('state-prev');
        const stateNext = document.getElementById('state-next');
        const log = document.getElementById('loop-log');

        if (btn && statePrev && stateNext && log) {
            btn.addEventListener('click', () => {
                iterationCount += 1;

                statePrev.classList.add('scale-90', 'opacity-50');
                stateNext.classList.add('scale-110', 'border-cyber-neon');

                const messages = [
                    'Compiling intent...',
                    'Running deterministic validators...',
                    'Bounded effector active...',
                    'Integration successful.'
                ];
                log.innerText = `Iteration #${iterationCount}: ${messages[iterationCount % messages.length]}`;
                log.classList.add('text-cyber-neon');

                setTimeout(() => {
                    statePrev.classList.remove('scale-90', 'opacity-50');
                    stateNext.classList.remove('scale-110', 'border-cyber-neon');
                    log.classList.remove('text-cyber-neon');
                }, 300);

                const prevStateText = statePrev.querySelector('span.text-2xl');
                const nextStateText = stateNext.querySelector('span.text-2xl');
                if (prevStateText) prevStateText.innerHTML = `Z<span class="text-sm">${iterationCount}</span>`;
                if (nextStateText) nextStateText.innerHTML = `Z<span class="text-sm">${iterationCount + 1}</span>`;
            });
        }

        const processBtn = document.getElementById('run-process-btn');
        const processStatePrev = document.getElementById('state-prev-process');
        const processStateNext = document.getElementById('state-next-process');
        const processLog = document.getElementById('loop-log-process');
        const processPrev = document.getElementById('process-prev');
        const processNext = document.getElementById('process-next');
        const processPrevBubble = document.getElementById('process-prev-value');
        const processNextBubble = document.getElementById('process-next-value');
        const processFormula = document.getElementById('process-note');
        const evidenceSlider = document.getElementById('evidence-slider');
        const evidenceValue = document.getElementById('evidence-value');
        const velocityBar = document.getElementById('velocity-bar');
        const velocityValue = document.getElementById('velocity-value');
        const reliabilityBar = document.getElementById('reliability-bar');
        const reliabilityValue = document.getElementById('reliability-value');
        const defensibilityBar = document.getElementById('defensibility-bar');
        const defensibilityValue = document.getElementById('defensibility-value');
        const processPrevValueText = processPrevBubble ? processPrevBubble.querySelector('p') : null;
        const processNextValueText = processNextBubble ? processNextBubble.querySelector('p') : null;
        const hasProcessUi = Boolean(
            processStatePrev &&
            processStateNext &&
            processLog &&
            processPrevBubble &&
            processNextBubble &&
            processFormula &&
            velocityBar &&
            velocityValue &&
            reliabilityBar &&
            reliabilityValue &&
            defensibilityBar &&
            defensibilityValue
        );
        const processCapacity = {
            velocity: 50,
            reliability: 50,
            defensibility: 50
        };
        let processIteration = 0;

        const clampPercent = (value) => Math.min(100, Math.max(0, value));
        const renderProcessCapacity = () => {
            if (!hasProcessUi) return;
            velocityBar.style.width = `${processCapacity.velocity}%`;
            velocityValue.innerText = `${Math.round(processCapacity.velocity)}%`;

            reliabilityBar.style.width = `${processCapacity.reliability}%`;
            reliabilityValue.innerText = `${Math.round(processCapacity.reliability)}%`;

            defensibilityBar.style.width = `${processCapacity.defensibility}%`;
            defensibilityValue.innerText = `${Math.round(processCapacity.defensibility)}%`;
        };

        if (hasProcessUi && evidenceSlider && evidenceValue) {
            evidenceSlider.addEventListener('input', () => {
                evidenceValue.innerText = evidenceSlider.value;
            });
        }

        if (hasProcessUi) renderProcessCapacity();

        if (hasProcessUi && processBtn) {
            processBtn.addEventListener('click', () => {
                processIteration += 1;
                const evidenceLevel = Number(evidenceSlider ? evidenceSlider.value : 1);

                processStatePrev.classList.add('scale-90', 'opacity-50');
                processStateNext.classList.add('scale-110', 'border-cyber-neon');

                const messages = [
                    'Capturing process deltas...',
                    'Updating Pk from evidence...',
                    'Strengthening the loop operator...',
                    'Producing both stronger state and process.'
                ];
                processLog.innerText = `Iteration #${processIteration}: ${messages[processIteration % messages.length]}`;
                processLog.classList.add('text-cyber-neon');

                processCapacity.velocity = clampPercent(processCapacity.velocity + (3 * evidenceLevel));
                processCapacity.reliability = clampPercent(processCapacity.reliability + (4 * evidenceLevel));
                processCapacity.defensibility = clampPercent(processCapacity.defensibility + (2 * evidenceLevel));
                renderProcessCapacity();

                setTimeout(() => {
                    processPrevBubble.classList.add('scale-90', 'opacity-50');
                    processNextBubble.classList.add('scale-110', 'border-cyber-neon');
                }, 100);

                setTimeout(() => {
                    processStatePrev.classList.remove('scale-90', 'opacity-50');
                    processStateNext.classList.remove('scale-110', 'border-cyber-neon');
                    processLog.classList.remove('text-cyber-neon');
                    processPrevBubble.classList.remove('scale-90', 'opacity-50');
                    processNextBubble.classList.remove('scale-110', 'border-cyber-neon');
                }, 400);

	                const processStatePrevText = processStatePrev.querySelector('span.text-2xl');
	                const processStateNextText = processStateNext.querySelector('span.text-2xl');
	                if (processStatePrevText) processStatePrevText.innerHTML = `Z<sub>${processIteration}</sub>`;
	                if (processStateNextText) processStateNextText.innerHTML = `Z<sub>${processIteration + 1}</sub>`;
	                const prevProcessIndex = Math.max(0, processIteration - 1);
	                const prevProcessLabel = prevProcessIndex === 0 ? 'k' : `k+${prevProcessIndex}`;
	                const nextProcessLabel = `k+${processIteration}`;

	                if (processPrevValueText) processPrevValueText.innerHTML = `P<sub>${prevProcessLabel}</sub>`;
	                if (processNextValueText) processNextValueText.innerHTML = `P<sub>${nextProcessLabel}</sub>`;
	                processFormula.innerText = `Evidence ${evidenceLevel}: P_{${prevProcessLabel}} → P_{${nextProcessLabel}}. Next: Z_{n+1}=P_{${nextProcessLabel}}(Z_n).`;
	            });
	        }

        if (typeof window.Chart === "undefined") return;

        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = '#1e293b';

        const clockCanvas = document.getElementById('clockSpeedChart');
        if (clockCanvas && clockCanvas.getContext) {
            const ctxClock = clockCanvas.getContext('2d');
            new Chart(ctxClock, {
            type: 'bar',
            data: {
                labels: ['Function Edit', 'Feature Cycle', 'System Refactor'],
                datasets: [
                    {
                        label: 'Traditional (Human Only)',
                        data: [60, 14400, 43200],
                        backgroundColor: '#334155',
                        barPercentage: 0.6,
                    },
                    {
                        label: 'AI Accelerated (Human + Agent)',
                        data: [2, 480, 120],
                        backgroundColor: '#06b6d4',
                        barPercentage: 0.6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'logarithmic',
                        title: { display: true, text: 'Time Cost (Minutes) - Log Scale' },
                        grid: { color: '#1e293b' }
                    },
                    x: { grid: { display: false } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += `${context.parsed.y} mins`;
                                return label;
                            }
                        }
                    }
                }
            }
            });
        }

        const driftCanvas = document.getElementById('driftChart');
        const driftWeekSlider = document.getElementById('drift-week-slider');
        const driftWeekValue = document.getElementById('drift-week-value');
        const driftPlayBtn = document.getElementById('drift-play-btn');
        const driftVelocityReadout = document.getElementById('drift-velocity-readout');
        const driftViewWeekly = document.getElementById('drift-view-weekly');
        const driftViewCumulative = document.getElementById('drift-view-cumulative');
        const vibeOutputLabel = document.getElementById('vibe-output-label');
        const sdacOutputLabel = document.getElementById('sdac-output-label');

        const vibeOutput = document.getElementById('vibe-output');
        const vibeVariance = document.getElementById('vibe-variance');
        const vibeDebt = document.getElementById('vibe-debt');
        const vibeDebtBar = document.getElementById('vibe-debt-bar');
        const sdacOutput = document.getElementById('sdac-output');
        const sdacVariance = document.getElementById('sdac-variance');
        const sdacMaturity = document.getElementById('sdac-maturity');
        const sdacMaturityBar = document.getElementById('sdac-maturity-bar');

        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
        const sigmoid = (x) => 1 / (1 + Math.exp(-x));
        const DRIFT_WEEKS = 26;
        const CROSSOVER_WEEK = 8;

        const computeVelocity = (week) => 1 + (9 * (week - 1)) / (DRIFT_WEEKS - 1); // 1..10
        const computeVibeDebt = (week) => sigmoid((week - 10) / 2.2);
        const computeSdacMaturity = (week) => sigmoid((week - CROSSOVER_WEEK) / 2.0);

        const computeVibeOutput = (week) => {
            const baseline = 13.5 - (0.5 * (week - 1));
            const debtPenalty = week <= CROSSOVER_WEEK ? 0 : (0.45 * Math.pow(week - CROSSOVER_WEEK, 1.2));
            return clamp(baseline - debtPenalty, -8, 16);
        };

        const computeSdacOutput = (week) => {
            const maturity = computeSdacMaturity(week);
            return clamp(7 + (6 * maturity), -8, 16);
        };
        const computeSdacVariance = (week) => {
            const progress = clamp((week - 1) / (CROSSOVER_WEEK - 1), 0, 1);
            return clamp(0.50 - (0.40 * progress), 0.10, 0.50);
        };

        const timeline = Array.from({ length: DRIFT_WEEKS }, (_, i) => {
            const week = i + 1;
            const velocity = computeVelocity(week);
            const vibeMean = computeVibeOutput(week);
            const sdacMean = computeSdacOutput(week);

            const vibeVarPct = clamp(0.30 + ((velocity - 1) * 0.04), 0.30, 0.80);
            const sdacVarPct = computeSdacVariance(week);

            const vibeAmp = Math.max(2, Math.abs(vibeMean));
            const sdacAmp = Math.max(2, Math.abs(sdacMean));
            const yMin = -10;
            const yMax = 18;

            return {
                week,
                velocity,
                vibeMean,
                vibeUpper: clamp(vibeMean + (vibeAmp * vibeVarPct), yMin, yMax),
                vibeLower: clamp(vibeMean - (vibeAmp * vibeVarPct), yMin, yMax),
                vibeVarPct,
                vibeDebt: computeVibeDebt(week),
                sdacMean,
                sdacUpper: clamp(sdacMean + (sdacAmp * sdacVarPct), yMin, yMax),
                sdacLower: clamp(sdacMean - (sdacAmp * sdacVarPct), yMin, yMax),
                sdacVarPct,
                sdacMaturity: computeSdacMaturity(week)
            };
        });

        const labels = timeline.map((row) => `W${row.week}`);
        const vibeUpperFull = timeline.map((row) => row.vibeUpper);
        const vibeLowerFull = timeline.map((row) => row.vibeLower);
        const vibeMeanFull = timeline.map((row) => row.vibeMean);
        const sdacUpperFull = timeline.map((row) => row.sdacUpper);
        const sdacLowerFull = timeline.map((row) => row.sdacLower);
        const sdacMeanFull = timeline.map((row) => row.sdacMean);

        const cumulative = (values) => {
            let sum = 0;
            return values.map((value) => {
                sum += value;
                return sum;
            });
        };

        const vibeUpperCumFull = cumulative(vibeUpperFull);
        const vibeLowerCumFull = cumulative(vibeLowerFull);
        const vibeMeanCumFull = cumulative(vibeMeanFull);
        const sdacUpperCumFull = cumulative(sdacUpperFull);
        const sdacLowerCumFull = cumulative(sdacLowerFull);
        const sdacMeanCumFull = cumulative(sdacMeanFull);
        const findClosestCrossoverWeek = (leftSeries, rightSeries) => {
            let closestWeek = 1;
            let minAbsGap = Number.POSITIVE_INFINITY;
            for (let i = 0; i < Math.min(leftSeries.length, rightSeries.length); i++) {
                const gap = Math.abs(leftSeries[i] - rightSeries[i]);
                if (gap < minAbsGap) {
                    minAbsGap = gap;
                    closestWeek = i + 1;
                }
            }
            return clamp(closestWeek, 1, DRIFT_WEEKS);
        };
        const CUMULATIVE_CROSSOVER_WEEK = findClosestCrossoverWeek(vibeMeanCumFull, sdacMeanCumFull);

        const initialWeek = Number(driftWeekSlider ? driftWeekSlider.value : CROSSOVER_WEEK);
        const slice = (arr, n) => arr.slice(0, n);
        let driftView = 'weekly';

        const crossoverLinePlugin = {
            id: 'crossoverLine',
            afterDraw(chart, args, opts) {
                const week = (opts && opts.week) ? opts.week : CROSSOVER_WEEK;
                const xScale = chart.scales.x;
                if (!xScale) return;
                const index = week - 1;
                if (index < 0 || index >= xScale.ticks.length) return;

                const x = xScale.getPixelForTick(index);
                const { ctx, chartArea } = chart;

                ctx.save();
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(x, chartArea.top);
                ctx.lineTo(x, chartArea.bottom);
                ctx.stroke();

                ctx.setLineDash([]);
                ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
                ctx.font = "12px 'JetBrains Mono', monospace";
                ctx.fillText(`week ${week}`, x + 6, chartArea.top + 14);
                ctx.restore();
            }
        };

        const hasDriftElements = Boolean(
            driftCanvas &&
                driftCanvas.getContext &&
                driftWeekSlider &&
                driftWeekValue &&
                driftPlayBtn &&
                driftVelocityReadout &&
                driftViewWeekly &&
                driftViewCumulative &&
                vibeOutputLabel &&
                sdacOutputLabel &&
                vibeOutput &&
                vibeVariance &&
                vibeDebt &&
                vibeDebtBar &&
                sdacOutput &&
                sdacVariance &&
                sdacMaturity &&
                sdacMaturityBar
        );
        let driftChart = null;

        if (hasDriftElements) {
            const ctxDrift = driftCanvas.getContext('2d');
            driftChart = new Chart(ctxDrift, {
            type: 'line',
            data: {
                labels: labels.slice(0, initialWeek),
	                datasets: [
	                    {
	                        label: 'Vibe band (upper)',
	                        data: slice(vibeUpperFull, initialWeek),
	                        borderColor: 'rgba(239, 68, 68, 0)',
	                        backgroundColor: 'rgba(239, 68, 68, 0.14)',
	                        pointRadius: 0,
	                        borderWidth: 0,
	                        fill: false,
	                        isBand: true
	                    },
	                    {
	                        label: 'Vibe band (lower)',
	                        data: slice(vibeLowerFull, initialWeek),
	                        borderColor: 'rgba(239, 68, 68, 0)',
	                        backgroundColor: 'rgba(239, 68, 68, 0.14)',
	                        pointRadius: 0,
	                        borderWidth: 0,
	                        fill: 0,
	                        isBand: true
	                    },
	                    {
	                        label: 'SDaC band (upper)',
	                        data: slice(sdacUpperFull, initialWeek),
	                        borderColor: 'rgba(16, 185, 129, 0)',
	                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
	                        pointRadius: 0,
	                        borderWidth: 0,
	                        fill: false,
	                        isBand: true
	                    },
	                    {
	                        label: 'SDaC band (lower)',
	                        data: slice(sdacLowerFull, initialWeek),
	                        borderColor: 'rgba(16, 185, 129, 0)',
	                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
	                        pointRadius: 0,
	                        borderWidth: 0,
	                        fill: 2,
	                        isBand: true
	                    },
                    {
                        label: 'Vibe coding',
                        data: slice(vibeMeanFull, initialWeek),
                        borderColor: '#ef4444',
                        backgroundColor: '#ef4444',
                        pointRadius: 0,
                        borderWidth: 2,
                        tension: 0.25,
                        fill: false
                    },
                    {
                        label: 'SDaC',
                        data: slice(sdacMeanFull, initialWeek),
                        borderColor: '#10b981',
                        backgroundColor: '#10b981',
                        pointRadius: 0,
                        borderWidth: 2,
                        tension: 0.25,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        title: { display: true, text: 'Weeks' },
                        grid: { color: '#1e293b' }
                    },
                    y: {
                        title: { display: true, text: 'Net Output / Week' },
                        grid: { color: '#1e293b' },
                        suggestedMin: -10,
                        suggestedMax: 16
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#f8fafc',
                            filter: (item, data) => !data.datasets[item.datasetIndex].isBand
                        }
                    },
                    tooltip: {
                        filter: (ctx) => !ctx.dataset.isBand
                    },
                    crossoverLine: { week: CROSSOVER_WEEK }
                }
            },
            plugins: [crossoverLinePlugin]
        });
        }

        const renderDriftReadout = (week) => {
            const row = timeline[week - 1];
            if (!row) return;

            if (driftWeekValue) driftWeekValue.innerText = `Iteration ${week}/${DRIFT_WEEKS} (simulated week)`;
            if (driftVelocityReadout) driftVelocityReadout.innerText = row.velocity.toFixed(1);

            const vibeValue = driftView === 'weekly' ? row.vibeMean : vibeMeanCumFull[week - 1];
            const sdacValue = driftView === 'weekly' ? row.sdacMean : sdacMeanCumFull[week - 1];

            if (vibeOutputLabel) vibeOutputLabel.innerText = driftView === 'weekly' ? 'Net Output' : 'Cumulative Value';
            if (sdacOutputLabel) sdacOutputLabel.innerText = driftView === 'weekly' ? 'Net Output' : 'Cumulative Value';

            if (vibeOutput) vibeOutput.innerText = vibeValue.toFixed(1);
            if (vibeVariance) vibeVariance.innerText = `${Math.round(row.vibeVarPct * 100)}%`;
            if (vibeDebt) vibeDebt.innerText = `${Math.round(row.vibeDebt * 100)}%`;
            if (vibeDebtBar) vibeDebtBar.style.width = `${Math.round(row.vibeDebt * 100)}%`;

            if (sdacOutput) sdacOutput.innerText = sdacValue.toFixed(1);
            if (sdacVariance) sdacVariance.innerText = `${Math.round(row.sdacVarPct * 100)}%`;
            if (sdacMaturity) sdacMaturity.innerText = `${Math.round(row.sdacMaturity * 100)}%`;
            if (sdacMaturityBar) sdacMaturityBar.style.width = `${Math.round(row.sdacMaturity * 100)}%`;
        };

        const updateDriftViewButtons = () => {
            if (!driftViewWeekly || !driftViewCumulative) return;

            if (driftView === 'weekly') {
                driftViewWeekly.className = 'px-3 py-1.5 rounded-md bg-cyber-success/20 text-white border border-cyber-success/40';
                driftViewCumulative.className = 'px-3 py-1.5 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors';
            } else {
                driftViewWeekly.className = 'px-3 py-1.5 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors';
                driftViewCumulative.className = 'px-3 py-1.5 rounded-md bg-cyber-success/20 text-white border border-cyber-success/40';
            }
        };

        const applyYAxisForView = (week) => {
            if (!driftChart || !driftChart.options || !driftChart.options.scales || !driftChart.options.scales.y) return;
            if (driftView === 'weekly') {
                driftChart.options.scales.y.title.text = 'Net Output / Week';
                driftChart.options.scales.y.suggestedMin = -10;
                driftChart.options.scales.y.suggestedMax = 16;
            } else {
                driftChart.options.scales.y.title.text = 'Cumulative Value';
                const w = clamp(week, 1, DRIFT_WEEKS);
                const candidates = [
                    vibeLowerCumFull.slice(0, w),
                    vibeUpperCumFull.slice(0, w),
                    sdacLowerCumFull.slice(0, w),
                    sdacUpperCumFull.slice(0, w)
                ];
                let min = Infinity;
                let max = -Infinity;
                for (const arr of candidates) {
                    for (const value of arr) {
                        if (value < min) min = value;
                        if (value > max) max = value;
                    }
                }
                const pad = Math.max(4, (max - min) * 0.08);
                driftChart.options.scales.y.suggestedMin = min - pad;
                driftChart.options.scales.y.suggestedMax = max + pad;
            }
        };

        const setDriftWeek = (week) => {
            if (!driftChart) return;
            const w = clamp(week, 1, DRIFT_WEEKS);
            driftChart.data.labels = labels.slice(0, w);
            if (driftView === 'weekly') {
                driftChart.data.datasets[0].data = slice(vibeUpperFull, w);
                driftChart.data.datasets[1].data = slice(vibeLowerFull, w);
                driftChart.data.datasets[2].data = slice(sdacUpperFull, w);
                driftChart.data.datasets[3].data = slice(sdacLowerFull, w);
                driftChart.data.datasets[4].data = slice(vibeMeanFull, w);
                driftChart.data.datasets[5].data = slice(sdacMeanFull, w);
            } else {
                driftChart.data.datasets[0].data = slice(vibeUpperCumFull, w);
                driftChart.data.datasets[1].data = slice(vibeLowerCumFull, w);
                driftChart.data.datasets[2].data = slice(sdacUpperCumFull, w);
                driftChart.data.datasets[3].data = slice(sdacLowerCumFull, w);
                driftChart.data.datasets[4].data = slice(vibeMeanCumFull, w);
                driftChart.data.datasets[5].data = slice(sdacMeanCumFull, w);
            }
            applyYAxisForView(w);
            if (driftChart.options && driftChart.options.plugins && driftChart.options.plugins.crossoverLine) {
                driftChart.options.plugins.crossoverLine.week = driftView === 'cumulative' ? CUMULATIVE_CROSSOVER_WEEK : CROSSOVER_WEEK;
            }
            driftChart.update();
            renderDriftReadout(w);
        };

        let driftPlayTimer = null;
        const stopDriftPlay = () => {
            if (driftPlayTimer) window.clearInterval(driftPlayTimer);
            driftPlayTimer = null;
            if (driftPlayBtn) driftPlayBtn.innerText = 'Play';
        };

        const startDriftPlay = () => {
            if (!driftWeekSlider) return;
            stopDriftPlay();
            let current = Number(driftWeekSlider.value);
            if (current >= DRIFT_WEEKS) {
                driftWeekSlider.value = '1';
                setDriftWeek(1);
            }
            if (driftPlayBtn) driftPlayBtn.innerText = 'Pause';
            driftPlayTimer = window.setInterval(() => {
                const current = Number(driftWeekSlider.value);
                if (current >= DRIFT_WEEKS) {
                    stopDriftPlay();
                    return;
                }
                const next = current + 1;
                driftWeekSlider.value = String(next);
                setDriftWeek(next);
            }, 250);
        };

        if (hasDriftElements && driftChart) {
            if (driftWeekSlider) {
                driftWeekSlider.addEventListener('input', () => {
                    stopDriftPlay();
                    setDriftWeek(Number(driftWeekSlider.value));
                });
            }

            if (driftPlayBtn) {
                driftPlayBtn.addEventListener('click', () => {
                    if (driftPlayTimer) {
                        stopDriftPlay();
                    } else {
                        startDriftPlay();
                    }
                });
            }

            if (driftWeekSlider) driftWeekSlider.value = String(initialWeek);
            updateDriftViewButtons();
            setDriftWeek(initialWeek);

            if (driftViewWeekly) {
                driftViewWeekly.addEventListener('click', () => {
                    stopDriftPlay();
                    driftView = 'weekly';
                    updateDriftViewButtons();
                    setDriftWeek(Number(driftWeekSlider ? driftWeekSlider.value : initialWeek));
                });
            }

            if (driftViewCumulative) {
                driftViewCumulative.addEventListener('click', () => {
                    stopDriftPlay();
                    driftView = 'cumulative';
                    updateDriftViewButtons();
                    setDriftWeek(Number(driftWeekSlider ? driftWeekSlider.value : initialWeek));
                });
            }
        }

	        const moatLoop = document.querySelector('.moat-loop');
	        if (moatLoop && typeof window !== 'undefined') {
	            const reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
	            const reduceMotion = Boolean(reduceMotionQuery && reduceMotionQuery.matches);

	            if (!reduceMotion) {
	                const START_SECONDS = 3.2; // slow start
	                const MIN_SECONDS = 1.35;  // max speed (lower = faster)
	                const TAU_MS = 14000;      // acceleration curve (higher = slower ramp)

	                let raf = null;
	                let tStart = null;
	                let elapsed = 0;
	                let lastNow = null;
	                let isIntersecting = false;

	                const updateDurations = (tMs) => {
	                    const p = 1 - Math.exp(-tMs / TAU_MS); // 0..1
	                    const duration = START_SECONDS - ((START_SECONDS - MIN_SECONDS) * p);
	                    const hoverDuration = Math.max(0.9, duration * 0.72);
	                    moatLoop.style.setProperty('--moat-loop-duration', `${duration.toFixed(3)}s`);
	                    moatLoop.style.setProperty('--moat-loop-duration-hover', `${hoverDuration.toFixed(3)}s`);
	                };

	                const tick = (now) => {
	                    lastNow = now;
	                    if (tStart === null) tStart = now;
	                    const tMs = elapsed + (now - tStart);
	                    updateDurations(tMs);
	                    raf = window.requestAnimationFrame(tick);
	                };

	                const start = () => {
	                    if (raf) return;
	                    tStart = null;
	                    raf = window.requestAnimationFrame(tick);
	                };

	                const stop = () => {
	                    if (!raf) return;
	                    window.cancelAnimationFrame(raf);
	                    raf = null;
	                    if (tStart !== null && lastNow !== null) {
	                        elapsed += lastNow - tStart;
	                    }
	                    tStart = null;
	                    lastNow = null;
	                };

	                const reconcileRunState = () => {
	                    if (document.hidden) {
	                        stop();
	                        return;
	                    }
	                    if (isIntersecting) start();
	                    else stop();
	                };

	                updateDurations(0);

	                if ('IntersectionObserver' in window) {
	                    const observer = new IntersectionObserver((entries) => {
	                        const entry = entries && entries[0];
	                        isIntersecting = Boolean(entry && entry.isIntersecting);
	                        reconcileRunState();
	                    }, { threshold: 0.35 });
	                    observer.observe(moatLoop);
	                } else {
	                    isIntersecting = true;
	                    reconcileRunState();
	                }

	                document.addEventListener('visibilitychange', reconcileRunState, { passive: true });
	            }
	        }

	        const chartLabels = ['Function Edit', 'Feature Cycle', 'System Refactor'];
	        wrapLabel(chartLabels.join(' '), 16);
	    })();
	    
    (function() {
        const theme = {
            text: '#e7e7ea',
            strong: '#f2f3f8',
            muted: '#b5b6bf',
            grid: 'rgba(255, 255, 255, 0.08)',
            primary: '#7aa2f7',
            accent: '#bb9af7',
            vibrant: '#2ac3de',
            danger: '#f7768e'
        };

        const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
        const toInt = (value, fallback) => {
            const n = Number.parseInt(String(value), 10);
            return Number.isFinite(n) ? n : fallback;
        };

        const escapeHtml = (s) =>
            String(s || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

        const setPressed = (btn, pressed) => btn && btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');

        const commonChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 350 },
            plugins: {
                legend: {
                    labels: {
                        color: theme.muted,
                        font: { family: 'Inter', size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 19, 26, 0.98)',
                    padding: 12,
                    titleColor: theme.strong,
                    bodyColor: theme.text,
                    titleFont: { size: 14, family: 'Inter' },
                    bodyFont: { size: 13, family: 'Inter' },
                },
            },
            scales: {
                x: { ticks: { color: theme.muted }, grid: { color: theme.grid } },
                y: { ticks: { color: theme.muted }, grid: { color: theme.grid } }
            }
        };

        // Section 1: Substrate explorer
        const setupSubstrateExplorer = () => {
            const buttons = Array.from(document.querySelectorAll('[data-substrate-tab]'));
            const traceBtn = document.getElementById('substrateTraceToggle');
            const treeEl = document.getElementById('substrateTree');
            const fileEl = document.getElementById('substrateFile');
            const fileLabel = document.getElementById('substrateFileLabel');
            if (!buttons.length || !traceBtn || !treeEl || !fileEl || !fileLabel) return;

            const state = { tab: 'map', trace: false };

            const data = {
                map: {
                    fileLabel: 'map/mission.yaml',
                    file: `id: mission_bugfix_auth\nowner: platform\nobjective: Fix auth redirect loop\nconstraints:\n  - do not change public API\n  - keep p95 login < 250ms\nacceptance:\n  - unit tests pass\n  - integration: login flow green\nbudgets:\n  max_calls: 120\n  max_latency_s: 45`,
                    tree: [
                        { text: 'workspace/', kind: null },
                        { text: '├── map/', kind: null },
                        { text: '│   ├── mission.yaml', kind: 'read' },
                        { text: '│   ├── contracts/', kind: null },
                        { text: '│   │   └── login-flow.json', kind: 'read' },
                        { text: '│   └── budgets.yaml', kind: 'read' },
                        { text: '├── terrain/', kind: null },
                        { text: '└── ledger/', kind: null },
                    ],
                },
                terrain: {
                    fileLabel: 'terrain/policies/auth.policy',
                    file: `package auth\n\ndef allow_redirect(uri):\n  not startswith(uri, \"http\")\n  not contains(uri, \"//\")\n\n# deterministic policy gate\n`,
                    tree: [
                        { text: 'workspace/', kind: null },
                        { text: '├── map/', kind: null },
                        { text: '├── terrain/', kind: null },
                        { text: '│   ├── src/', kind: 'exec' },
                        { text: '│   │   └── auth/', kind: 'exec' },
                        { text: '│   │       └── redirect.ts', kind: 'exec' },
                        { text: '│   ├── schemas/', kind: 'read' },
                        { text: '│   │   └── login.json', kind: 'read' },
                        { text: '│   ├── tests/', kind: 'exec' },
                        { text: '│   │   ├── test_login.ts', kind: 'exec' },
                        { text: '│   │   └── test_redirect.ts', kind: 'exec' },
                        { text: '│   └── policies/', kind: null },
                        { text: '│       └── auth.policy', kind: 'read' },
                        { text: '└── ledger/', kind: null },
                    ],
                },
                ledger: {
                    fileLabel: 'ledger/runs/run_1042.json',
                    file: `{\n  \"run_id\": \"run_1042\",\n  \"mission_id\": \"mission_bugfix_auth\",\n  \"inputs\": { \"git_ref\": \"a1b2c3d\" },\n  \"validators\": {\n    \"tests\": \"pass\",\n    \"policy\": \"pass\",\n    \"security\": \"pass\"\n  },\n  \"diff\": { \"hash\": \"sha256:...\", \"files\": 3 },\n  \"decision\": \"merge\",\n  \"timestamp\": \"2026-02-13T21:18:00Z\"\n}`,
                    tree: [
                        { text: 'workspace/', kind: null },
                        { text: '├── map/', kind: null },
                        { text: '├── terrain/', kind: null },
                        { text: '└── ledger/', kind: null },
                        { text: '    ├── runs/', kind: null },
                        { text: '    │   └── run_1042.json', kind: 'write' },
                        { text: '    ├── evidence/', kind: null },
                        { text: '    │   └── validators_1042.txt', kind: 'write' },
                        { text: '    └── decisions.log', kind: 'write' },
                    ],
                },
            };

            const render = () => {
                buttons.forEach((b) => setPressed(b, b.dataset.substrateTab === state.tab));
                traceBtn.textContent = state.trace ? 'Trace: On' : 'Trace: Off';
                traceBtn.setAttribute('aria-pressed', state.trace ? 'true' : 'false');

                const d = data[state.tab] || data.map;
                fileLabel.textContent = d.fileLabel;
                fileEl.textContent = d.file;

                const lines = d.tree.map((line) => {
                    const safe = escapeHtml(line.text);
                    if (!state.trace || !line.kind) return safe;
                    const cls = line.kind === 'read' ? 'trace-line trace-read' : (line.kind === 'write' ? 'trace-line trace-write' : 'trace-line trace-exec');
                    return `<span class=\"${cls}\">${safe}</span>`;
                });
                treeEl.innerHTML = lines.join('\n');
            };

            traceBtn.addEventListener('click', () => {
                state.trace = !state.trace;
                render();
            });

            buttons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    const next = btn.dataset.substrateTab || 'map';
                    state.tab = next;
                    render();
                });
            });

            render();
        };

        // Section 2: Mission object builder
        const setupMissionObjectBuilder = () => {
            const presetButtons = Array.from(document.querySelectorAll('[data-mission-preset]'));
            const slider = document.getElementById('missionTightnessSlider');
            const tightValue = document.getElementById('missionTightnessValue');
            const missionYaml = document.getElementById('missionYaml');
            const missionIdLabel = document.getElementById('missionIdLabel');
            const gateMapEl = document.getElementById('missionGateMap');
            const retriesEl = document.getElementById('missionRetries');
            const convEl = document.getElementById('missionConvergence');
            const driftEl = document.getElementById('missionDrift');
            const callsEl = document.getElementById('missionMaxCalls');
            const latencyEl = document.getElementById('missionMaxLatency');
            const lifecycleEl = document.getElementById('missionLifecycleStatus');
            const attemptEl = document.getElementById('missionAttemptLabel');
            const runEl = document.getElementById('missionLastRun');
            const evidenceEl = document.getElementById('missionEvidencePath');
            const flexEl = document.getElementById('missionFlex');
            const flexBar = document.getElementById('missionFlexBar');
            const tightEl = document.getElementById('missionTight');
            const tightBar = document.getElementById('missionTightBar');
            const schemaStatusEl = document.getElementById('missionSchemaStatus');
            const scopeStatusEl = document.getElementById('missionScopeStatus');
            const qualityStatusEl = document.getElementById('missionQualityGateStatus');
            const schemaNoteEl = document.getElementById('missionSchemaNote');

            if (
                !presetButtons.length ||
                !slider ||
                !tightValue ||
                !missionYaml ||
                !missionIdLabel ||
                !gateMapEl ||
                !retriesEl ||
                !convEl ||
                !driftEl ||
                !callsEl ||
                !latencyEl ||
                !lifecycleEl ||
                !attemptEl ||
                !runEl ||
                !evidenceEl ||
                !flexEl ||
                !flexBar ||
                !tightEl ||
                !tightBar ||
                !schemaStatusEl ||
                !scopeStatusEl ||
                !qualityStatusEl ||
                !schemaNoteEl
            ) return;

            const presets = {
                bugfix: {
                    id: 'mission_bugfix_auth',
                    version: 1,
                    objective: 'Fix auth redirect loop',
                    scope: {
                        modify: ['services/auth/redirect_handler.ts'],
                        readOnly: ['contracts/auth_flow.schema.json'],
                        doNotTouch: ['.github/**', 'policies/**'],
                        editRegions: {
                            'services/auth/redirect_handler.ts': ['function handleRedirect'],
                        },
                    },
                    budgets: { calls: 120, latency: '45s' },
                    accepts: ['unit tests', 'integration: login flow'],
                    constraints: ['do not change public API', 'keep p95 login < 250ms'],
                    qualityGate: './scripts/validate_auth_flow.sh',
                    rollbackOn: ['quality_gate_fail', 'scope_violation'],
                    fallbacks: { maxIterations: 3, onFail: 'revert' },
                },
                feature: {
                    id: 'mission_feature_billing',
                    version: 1,
                    objective: 'Add usage-based billing endpoint',
                    scope: {
                        modify: ['services/billing/routes/v2_usage.ts', 'docs/api/reference.md'],
                        readOnly: ['contracts/billing.openapi.json'],
                        doNotTouch: ['infra/**', 'policies/**'],
                        editRegions: {
                            'services/billing/routes/v2_usage.ts': ['router.post("/v2/usage")'],
                        },
                    },
                    budgets: { calls: 180, latency: '70s' },
                    accepts: ['contract tests', 'docs updated'],
                    constraints: ['idempotent endpoint', 'no PII in logs'],
                    qualityGate: './scripts/validate_billing_contracts.sh',
                    rollbackOn: ['quality_gate_fail', 'schema_mismatch'],
                    fallbacks: { maxIterations: 4, onFail: 'revert' },
                },
                refactor: {
                    id: 'mission_refactor_queue',
                    version: 1,
                    objective: 'Refactor queue worker for determinism',
                    scope: {
                        modify: ['services/queue/worker.ts'],
                        readOnly: ['contracts/queue_jobs.schema.json'],
                        doNotTouch: ['services/public_api/**', '.github/**'],
                        editRegions: {
                            'services/queue/worker.ts': ['class QueueWorker'],
                        },
                    },
                    budgets: { calls: 150, latency: '55s' },
                    accepts: ['load test passes', 'no behavior regression'],
                    constraints: ['keep schema stable', 'preserve retry semantics'],
                    qualityGate: './scripts/validate_queue_worker.sh',
                    rollbackOn: ['quality_gate_fail', 'performance_regression'],
                    fallbacks: { maxIterations: 3, onFail: 'revert' },
                },
                compliance: {
                    id: 'mission_compliance_policy',
                    version: 1,
                    objective: 'Enforce retention policy in storage layer',
                    scope: {
                        modify: ['services/storage/retention_policy.ts', 'ledger/audit_rules.md'],
                        readOnly: ['policy/retention_v4.yaml'],
                        doNotTouch: ['runtime/secrets/**', '.github/**'],
                        editRegions: {
                            'services/storage/retention_policy.ts': ['applyRetentionPolicy'],
                        },
                    },
                    budgets: { calls: 200, latency: '90s' },
                    accepts: ['policy gate green', 'audit log entries'],
                    constraints: ['append-only ledger', 'no bypass path'],
                    qualityGate: './scripts/validate_retention_policy.sh',
                    rollbackOn: ['policy_gate_fail', 'scope_violation'],
                    fallbacks: { maxIterations: 2, onFail: 'escalate' },
                },
            };

            const state = { preset: 'bugfix', tight: clamp(toInt(slider.value, 55), 0, 100) };
            const statusPalette = {
                pass: { fg: 'rgba(198, 246, 232, 0.98)', border: 'rgba(16, 185, 129, 0.55)', bg: 'rgba(16, 185, 129, 0.16)' },
                warn: { fg: 'rgba(255, 236, 179, 0.98)', border: 'rgba(245, 158, 11, 0.55)', bg: 'rgba(245, 158, 11, 0.16)' },
                fail: { fg: 'rgba(255, 221, 225, 0.98)', border: 'rgba(247, 118, 142, 0.60)', bg: 'rgba(247, 118, 142, 0.18)' },
                info: { fg: 'rgba(223, 235, 255, 0.98)', border: 'rgba(122, 162, 247, 0.55)', bg: 'rgba(122, 162, 247, 0.16)' },
            };
            const badgeStyle = (tone) => {
                const t = statusPalette[tone] || statusPalette.info;
                return [
                    'display:inline-flex',
                    'align-items:center',
                    'justify-content:center',
                    'padding:0.12rem 0.4rem',
                    'border-radius:999px',
                    `border:1px solid ${t.border}`,
                    `background:${t.bg}`,
                    `color:${t.fg}`,
                    'font-family:JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
                    'font-size:0.68rem',
                    'line-height:1.15',
                    'font-weight:700',
                    'letter-spacing:0.01em',
                    'white-space:nowrap',
                ].join(';');
            };
            const badgeHtml = (label, tone) => `<span style="${badgeStyle(tone)}">${escapeHtml(label)}</span>`;
            const setBadge = (el, label, tone) => {
                if (!el) return;
                el.textContent = label;
                el.setAttribute('style', badgeStyle(tone));
            };

            const render = () => {
                presetButtons.forEach((b) => setPressed(b, b.dataset.missionPreset === state.preset));
                tightValue.textContent = `${state.tight}%`;
                slider.value = String(state.tight);

                const p = presets[state.preset] || presets.bugfix;
                missionIdLabel.textContent = p.id;

                const retries = clamp(1 + Math.round((100 - state.tight) / 18), 1, 7);
                const convergence = clamp(Math.round(25 + 75 * Math.pow(state.tight / 100, 0.65)), 0, 100);
                const drift = clamp(Math.round(85 - state.tight * 0.7), 5, 95);
                const flex = clamp(100 - state.tight, 0, 100);
                const schemaPass = true;
                const scopePass = state.tight >= 42;
                const qualityPass = state.tight >= 50;

                let lifecycle = 'DRAFT';
                if (!scopePass && drift >= 65) lifecycle = 'REVERTED';
                else if (scopePass && qualityPass && convergence >= 82) lifecycle = 'COMPLETED';
                else if (scopePass) lifecycle = 'ACTIVE';

                const lifecycleTone = lifecycle === 'COMPLETED'
                    ? 'pass'
                    : lifecycle === 'ACTIVE'
                        ? 'info'
                        : lifecycle === 'REVERTED'
                            ? 'fail'
                            : 'warn';
                const attempt = lifecycle === 'COMPLETED'
                    ? 1
                    : clamp(Math.max(1, Math.round((100 - convergence) / 18) + 1), 1, p.fallbacks.maxIterations);
                const runId = `run_${String(1000 + state.tight + p.budgets.calls + attempt).padStart(4, '0')}`;
                const versionTag = `${p.id}@v${p.version}`;

                retriesEl.textContent = String(retries);
                convEl.textContent = String(convergence);
                driftEl.textContent = String(drift);
                callsEl.textContent = String(p.budgets.calls);
                latencyEl.textContent = p.budgets.latency;
                setBadge(lifecycleEl, lifecycle, lifecycleTone);
                attemptEl.textContent = `${attempt}/${p.fallbacks.maxIterations}`;
                runEl.textContent = runId;
                evidenceEl.textContent = `ledger/runs/${versionTag}/${runId}.json`;

                flexEl.textContent = String(flex);
                flexBar.style.width = `${flex}%`;
                tightEl.textContent = String(state.tight);
                tightBar.style.width = `${state.tight}%`;

                setBadge(schemaStatusEl, schemaPass ? 'PASS' : 'FAIL', schemaPass ? 'pass' : 'fail');
                setBadge(scopeStatusEl, scopePass ? 'PASS' : 'WARN', scopePass ? 'pass' : 'warn');
                setBadge(qualityStatusEl, qualityPass ? 'PASS' : 'WARN', qualityPass ? 'pass' : 'warn');
                if (!scopePass) {
                    schemaNoteEl.textContent = 'Scope boundary is too loose for safe activation. Tighten constraints before opening the write window.';
                } else if (!qualityPass) {
                    schemaNoteEl.textContent = `Schema is valid, but ${escapeHtml(p.qualityGate)} is under-constrained. Add stricter acceptance criteria before scale-up.`;
                } else {
                    schemaNoteEl.textContent = `Schema + scope + quality gate compiled. Mission can run deterministically under ${escapeHtml(p.qualityGate)}.`;
                }

                const gateRows = [
                    {
                        key: 'scope.do_not_touch',
                        gate: 'protected path validator',
                        detail: p.scope.doNotTouch[0],
                        tone: scopePass ? 'pass' : 'warn',
                        label: scopePass ? 'PASS' : 'WARN',
                    },
                    {
                        key: 'scope.edit_regions',
                        gate: 'edit region validator',
                        detail: Object.values(p.scope.editRegions)[0][0],
                        tone: state.tight >= 48 ? 'pass' : 'warn',
                        label: state.tight >= 48 ? 'PASS' : 'WARN',
                    },
                    {
                        key: 'constraints.forbidden',
                        gate: 'policy assertion check',
                        detail: p.constraints[0],
                        tone: state.tight >= 45 ? 'pass' : 'warn',
                        label: state.tight >= 45 ? 'PASS' : 'WARN',
                    },
                    {
                        key: 'acceptance_criteria',
                        gate: 'deterministic content/test checks',
                        detail: p.accepts[0],
                        tone: qualityPass ? 'pass' : 'warn',
                        label: qualityPass ? 'PASS' : 'WARN',
                    },
                    {
                        key: 'quality_gate.cmd',
                        gate: p.qualityGate,
                        detail: p.fallbacks.onFail === 'escalate' ? 'on_fail: escalate' : 'on_fail: revert',
                        tone: qualityPass ? 'pass' : 'warn',
                        label: qualityPass ? 'PASS' : 'WARN',
                    },
                ];
                gateMapEl.innerHTML = gateRows.map((row) => (
                    `<div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                            <div class="text-brand-strong">${escapeHtml(row.key)} → ${escapeHtml(row.gate)}</div>
                            <div class="text-brand-muted">${escapeHtml(row.detail)}</div>
                        </div>
                        ${badgeHtml(row.label, row.tone)}
                    </div>`
                )).join('');

                const [editFile, editSections] = Object.entries(p.scope.editRegions)[0];
                const yaml = [
                    `mission_id: ${p.id}`,
                    `mission_version: ${p.version}`,
                    `goal: "${p.objective}"`,
                    `scope:`,
                    `  modify:`,
                    ...p.scope.modify.map((f) => `    - ${f}`),
                    `  read_only:`,
                    ...p.scope.readOnly.map((f) => `    - ${f}`),
                    `  do_not_touch:`,
                    ...p.scope.doNotTouch.map((f) => `    - ${f}`),
                    `  edit_regions:`,
                    `    ${editFile}:`,
                    ...editSections.map((r) => `      - "${r}"`),
                    `constraints:`,
                    `  forbidden:`,
                    ...p.constraints.map((c) => `    - "${c}"`),
                    `acceptance_criteria:`,
                    `  must_pass:`,
                    ...p.accepts.map((a) => `    - "${a}"`),
                    `budgets:`,
                    `  max_calls: ${p.budgets.calls}`,
                    `  max_latency: ${p.budgets.latency}`,
                    `  constraint_tightness: ${state.tight}%`,
                    `quality_gate:`,
                    `  cmd: ${p.qualityGate}`,
                    `rollback_on:`,
                    ...p.rollbackOn.map((r) => `  - "${r}"`),
                    `fallbacks:`,
                    `  max_iterations: ${p.fallbacks.maxIterations}`,
                    `  on_fail: ${p.fallbacks.onFail}`,
                    `telemetry:`,
                    `  status: ${lifecycle.toLowerCase()}`,
                    `  attempt: ${attempt}`,
                    `  last_run_id: ${runId}`,
                    `derived:`,
                    `  expected_retries: ${retries}x`,
                    `  convergence_rate: ${convergence}/100`,
                    `  drift_risk: ${drift}/100`,
                ].join('\n');

                missionYaml.textContent = yaml;
            };

            slider.addEventListener('input', () => {
                state.tight = clamp(toInt(slider.value, state.tight), 0, 100);
                render();
            });

            presetButtons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    state.preset = btn.dataset.missionPreset || 'bugfix';
                    render();
                });
            });

            render();
        };

        // Section 3: Sandwich simulator
        const setupSandwichSimulator = () => {
            const entropySlider = document.getElementById('sandwichEntropySlider');
            const gateSlider = document.getElementById('sandwichGateSlider');
            const entropyValue = document.getElementById('sandwichEntropyValue');
            const gateValue = document.getElementById('sandwichGateValue');
            const runBtn = document.getElementById('sandwichRunBtn');
            const attempts = document.getElementById('sandwichAttempts');
            const retriesEl = document.getElementById('sandwichRetries');
            const qualityEl = document.getElementById('sandwichQuality');
            const costEl = document.getElementById('sandwichExpectedCost');
            const exitEl = document.getElementById('sandwichExit');
            if (!entropySlider || !gateSlider || !entropyValue || !gateValue || !runBtn || !attempts || !retriesEl || !qualityEl || !costEl || !exitEl) return;

            const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            const state = {
                entropy: clamp(toInt(entropySlider.value, 60), 0, 100),
                gate: clamp(toInt(gateSlider.value, 70), 0, 100),
                running: false,
                timer: null,
            };

            const ensurePills = () => {
                if (attempts.childElementCount >= 12) return;
                attempts.innerHTML = '';
                for (let i = 0; i < 12; i++) {
                    const el = document.createElement('div');
                    el.className = 'attempt-pill';
                    attempts.appendChild(el);
                }
            };

            const metrics = () => {
                const entropy = state.entropy;
                const gate = state.gate;
                const retries = clamp(1 + Math.round(entropy / 18 + gate / 34), 1, 12);
                const quality = clamp(Math.round(40 + gate * 0.55 - entropy * 0.18), 10, 95);
                const expectedCost = clamp(Math.round(55 + retries * 8 + entropy * 0.12 + gate * 0.08), 40, 220);
                const exit = gate >= 30 ? 'PASS' : 'PASS';
                return { retries, quality, expectedCost, exit };
            };

            const render = () => {
                entropySlider.value = String(state.entropy);
                gateSlider.value = String(state.gate);
                entropyValue.textContent = String(state.entropy);
                gateValue.textContent = String(state.gate);

                const m = metrics();
                retriesEl.textContent = String(m.retries);
                qualityEl.textContent = String(m.quality);
                costEl.textContent = String(m.expectedCost);
                exitEl.textContent = m.exit;
            };

            const clearRun = () => {
                if (state.timer) window.clearInterval(state.timer);
                state.timer = null;
                state.running = false;
                runBtn.textContent = 'Run';
            };

            const run = () => {
                ensurePills();
                clearRun();
                state.running = true;
                runBtn.textContent = 'Running…';

                const pills = Array.from(attempts.children);
                pills.forEach((p) => p.classList.remove('is-fail', 'is-pass'));

                const m = metrics();
                let idx = 0;
                const total = m.retries;

                const tick = () => {
                    if (idx >= total) {
                        clearRun();
                        render();
                        return;
                    }
                    const isLast = idx === total - 1;
                    const el = pills[idx];
                    if (el) {
                        el.classList.add(isLast ? 'is-pass' : 'is-fail');
                        if (!prefersReducedMotion) el.style.transform = 'translateY(-1px)';
                        window.setTimeout(() => { if (el) el.style.transform = ''; }, 90);
                    }
                    idx += 1;
                };

                if (prefersReducedMotion) {
                    // no animation, just final state
                    for (let i = 0; i < total; i++) {
                        const el = pills[i];
                        if (el) el.classList.add(i === total - 1 ? 'is-pass' : 'is-fail');
                    }
                    clearRun();
                    render();
                    return;
                }

                tick();
                state.timer = window.setInterval(tick, 140);
            };

            entropySlider.addEventListener('input', () => {
                state.entropy = clamp(toInt(entropySlider.value, state.entropy), 0, 100);
                render();
            });
            gateSlider.addEventListener('input', () => {
                state.gate = clamp(toInt(gateSlider.value, state.gate), 0, 100);
                render();
            });
            runBtn.addEventListener('click', () => {
                if (state.running) clearRun();
                else run();
            });

            window.addEventListener('beforeunload', clearRun, { once: true });
            ensurePills();
            render();
        };

        // Section 4: Validator bundle
        const setupValidatorBundle = () => {
            const diffEl = document.getElementById('validatorDiff');
            const ledgerEl = document.getElementById('validatorLedger');
            const resultsEl = document.getElementById('validatorResults');
            const runIdEl = document.getElementById('validatorRunId');
            const budgetSlider = document.getElementById('validatorBudgetSlider');
            const budgetValue = document.getElementById('validatorBudgetValue');
            const runBtn = document.getElementById('validatorRunBtn');
            const toggleButtons = Array.from(document.querySelectorAll('[data-validator]'));
            if (!diffEl || !ledgerEl || !resultsEl || !runIdEl || !budgetSlider || !budgetValue || !runBtn || !toggleButtons.length) return;

            const issues = [
                { key: 'schema', label: 'Schema mismatch: login.redirectUri missing', caughtBy: 'schema' },
                { key: 'tests', label: 'Unit regression: redirect loop not covered', caughtBy: 'tests' },
                { key: 'security', label: 'Security: open redirect possible', caughtBy: 'security' },
                { key: 'policy', label: 'Policy: external URL disallowed', caughtBy: 'policy' },
                { key: 'style', label: 'Style: lint + formatting', caughtBy: 'style' },
                { key: 'integration', label: 'Integration: login flow end-to-end', caughtBy: 'integration' },
            ];

            const sampleDiff = [
                'diff --git a/src/auth/redirect.ts b/src/auth/redirect.ts',
                'index 11aa22..33bb44 100644',
                '--- a/src/auth/redirect.ts',
                '+++ b/src/auth/redirect.ts',
                '@@',
                '-export function redirect(uri: string) {',
                '-  return uri;',
                '-}',
                '+export function redirect(uri: string) {',
                '+  // TODO: validate uri',
                '+  return decodeURIComponent(uri);',
                '+}',
                '',
                'diff --git a/schemas/login.json b/schemas/login.json',
                '@@',
                '-  \"redirectUri\": { \"type\": \"string\" }',
                '+  \"redirect\": { \"type\": \"string\" }',
            ].join('\n');

            diffEl.textContent = sampleDiff;

            const state = {
                active: new Set(toggleButtons.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.validator)),
                budget: clamp(toInt(budgetSlider.value, 4), 1, 10),
                runId: 0,
            };

            const render = () => {
                budgetValue.textContent = String(state.budget);
                budgetSlider.value = String(state.budget);

                const activeValidators = Array.from(state.active).sort();
                const caught = issues.filter((i) => state.active.has(i.caughtBy));
                const neededAttempts = 1 + caught.length;
                const attemptsUsed = Math.min(state.budget, neededAttempts);
                const boundedFail = state.budget < neededAttempts;
                const outcome = boundedFail ? 'bounded-fail' : (caught.length === 0 ? 'pass' : 'pass');

                resultsEl.innerHTML = '';
                issues.forEach((issue) => {
                    const isEnabled = state.active.has(issue.caughtBy);
                    const isCaught = isEnabled;
                    const status = isEnabled ? (isCaught ? 'FAIL' : 'PASS') : 'SKIP';
                    const color = status === 'FAIL' ? 'text-brand-danger' : (status === 'PASS' ? 'text-brand-vibrant' : 'text-brand-muted');
                    const line = document.createElement('div');
                    line.className = 'flex items-start justify-between gap-3';
                    line.innerHTML = `<span class="text-brand-muted">${escapeHtml(issue.label)}</span><span class="font-mono ${color}">${status}</span>`;
                    resultsEl.appendChild(line);
                });

                runIdEl.textContent = `run_${String(state.runId).padStart(3, '0')}`;
                const ledger = {
                    run_id: runIdEl.textContent,
                    mission_id: 'mission_bugfix_auth',
                    budget: { max_attempts: state.budget },
                    validators: activeValidators,
                    attempts_used: attemptsUsed,
                    outcome,
                    notes: boundedFail
                        ? 'Budget exhausted: deterministic exit with partial evidence.'
                        : 'Bundle executed: evidence recorded; deterministic decision available.',
                };
                ledgerEl.textContent = JSON.stringify(ledger, null, 2);
            };

            const bumpRun = () => {
                state.runId += 1;
                render();
            };

            budgetSlider.addEventListener('input', () => {
                state.budget = clamp(toInt(budgetSlider.value, state.budget), 1, 10);
                render();
            });

            runBtn.addEventListener('click', () => bumpRun());

            toggleButtons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.validator || '';
                    if (!key) return;
                    if (state.active.has(key)) state.active.delete(key);
                    else state.active.add(key);
                    btn.setAttribute('aria-pressed', state.active.has(key) ? 'true' : 'false');
                    render();
                });
            });

            render();
        };

        // Section 5: Always-on loops chart
        const setupAlwaysOnLoops = () => {
            const root = document.querySelector('[data-infographic-section-id="i3-section-05-always-on-loops"]');
            if (!root) return;

            const weekSlider = root.querySelector('#maintWeekSlider');
            const weekValue = root.querySelector('#maintWeekValue');
            const budgetSlider = root.querySelector('#maintCycleBudgetSlider');
            const budgetValue = root.querySelector('#maintCycleBudgetValue');
            const stepBtn = root.querySelector('#maintRunCycleButton');
            const runToGateBtn = root.querySelector('#maintRunToGateButton');
            const resetBtn = root.querySelector('#maintResetButton');
            const debtEl = root.querySelector('#maintDebt');
            const incidentsEl = root.querySelector('#maintIncidents');
            const p95El = root.querySelector('#maintP95');
            const budgetRemainingEl = root.querySelector('#maintBudgetRemaining');
            const targetEl = root.querySelector('#maintTarget');
            const expectedGainEl = root.querySelector('#maintExpectedGain');
            const gateSignalEl = root.querySelector('#maintGateSignal');
            const gateGuardrailsEl = root.querySelector('#maintGateGuardrails');
            const gateBudgetEl = root.querySelector('#maintGateBudget');
            const gateLedgerEl = root.querySelector('#maintGateLedger');
            const statusEl = root.querySelector('#maintStatus');
            const cycleEl = root.querySelector('#maintCycle');
            const lastRunEl = root.querySelector('#maintLastRun');
            const receiptEl = root.querySelector('#maintReceipt');
            const trendStatusEl = root.querySelector('#maintTrendStatus');
            const trendWindowEl = root.querySelector('#maintTrendWindow');
            const outcomeEl = root.querySelector('#maintOutcome');
            const attemptsEl = root.querySelector('#maintAttempts');
            const chartEl = root.querySelector('#maintenanceChart');
            const loopButtons = Array.from(root.querySelectorAll('[data-maint-loop]'));

            if (!weekSlider || !weekValue || !budgetSlider || !budgetValue || !stepBtn || !runToGateBtn || !resetBtn ||
                !debtEl || !incidentsEl || !p95El || !budgetRemainingEl || !targetEl || !expectedGainEl ||
                !gateSignalEl || !gateGuardrailsEl || !gateBudgetEl || !gateLedgerEl || !statusEl || !cycleEl ||
                !lastRunEl || !receiptEl || !trendStatusEl || !trendWindowEl || !outcomeEl || !attemptsEl ||
                !chartEl || !loopButtons.length) {
                return;
            }

            const MAX_WEEK = 26;
            const state = {
                week: clamp(toInt(weekSlider.value, 8), 0, MAX_WEEK),
                loops: new Set(loopButtons.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.maintLoop)),
                cycleBudget: clamp(toInt(budgetSlider.value, 6), 2, 12),
                cycle: 0,
                history: [],
            };

            const simulate = (loops) => {
                const weeks = [];
                const debt = [];
                const p95 = [];
                const incidents = [];

                for (let w = 0; w <= MAX_WEEK; w++) {
                    const autonomy = clamp(20 + w * 3.2, 0, 100);
                    let d = 38 + w * 2.7;
                    if (loops.has('map')) d -= w * 0.9;
                    if (loops.has('dream')) d -= Math.max(0, w - 4) * 1.0;
                    if (loops.has('refactor')) d -= Math.max(0, w - 2) * 1.25;
                    if (loops.has('governance')) d -= w * 0.55;
                    d = clamp(d, 0, 100);

                    let expected = 62 + autonomy * 0.55 + d * 0.38;
                    expected += loops.has('map') ? 2.0 : 0;
                    expected += loops.has('dream') ? 2.5 : 0;
                    expected += loops.has('refactor') ? 2.5 : 0;
                    expected += loops.has('governance') ? 2.0 : 0;

                    let pricing = 25 + Math.pow(autonomy / 100, 1.25) * 75;
                    let frontier = 18 + Math.pow(autonomy / 100, 1.55) * 65;
                    if (loops.has('governance')) frontier = clamp(frontier * 0.92, 0, 100);

                    if (loops.has('hedged')) {
                        expected += 6;
                        pricing = Math.min(pricing * 0.35, 18);
                    }

                    const tailFactor = 1 + pricing * 0.008 + frontier * 0.004;
                    const p95Cost = clamp(expected * tailFactor, expected, 260);

                    const incBase = Math.pow(d / 100, 2) * 8;
                    const inc = clamp(Math.round(incBase * (loops.has('governance') ? 0.55 : 1.0)), 0, 10);

                    weeks.push(`W${w}`);
                    debt.push(d);
                    p95.push(p95Cost);
                    incidents.push(inc);
                }

                return { weeks, debt, p95, incidents };
            };

            const markerPlugin = {
                id: 'weekMarker',
                afterDraw(chart) {
                    const xScale = chart.scales.x;
                    const area = chart.chartArea;
                    if (!xScale || !area) return;
                    const x = xScale.getPixelForValue(state.week);
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(242, 243, 248, 0.22)';
                    ctx.setLineDash([4, 4]);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, area.top);
                    ctx.lineTo(x, area.bottom);
                    ctx.stroke();
                    ctx.restore();
                }
            };

            const ctx = chartEl.getContext('2d');
            const chartState = { chart: null };

            const setGate = (el, ok, pending) => {
                if (pending) {
                    el.textContent = 'PENDING';
                    el.style.color = '#b5b6bf';
                    return;
                }
                el.textContent = ok ? 'PASS' : 'FAIL';
                el.style.color = ok ? '#2ac3de' : '#f7768e';
            };

            const statusColor = (status) => {
                if (status === 'PASS') return '#2ac3de';
                if (status === 'ESCALATE') return '#bb9af7';
                if (status === 'DEFER') return '#ff9e64';
                return '#e2e8f0';
            };

            const targetLabel = (debt, incidents) => {
                if (debt >= 65) return 'Map drift hotspots';
                if (incidents >= 4) return 'Incident-prone modules';
                if (!state.loops.has('refactor')) return 'Refactor queue (guarded)';
                if (!state.loops.has('dream')) return 'Backlog triage candidates';
                return 'Validation debt sweep';
            };

            const expectedDelta = (cycleIndex = state.cycle + 1) => {
                const pattern = [0.28, -0.12, 0.18, -0.08, 0.12, -0.04][cycleIndex % 6];
                let base = 0;
                if (state.loops.has('map')) base += 0.65;
                if (state.loops.has('dream')) base += 0.95;
                if (state.loops.has('refactor')) base += 0.8;
                if (state.loops.has('governance')) base += 0.45;
                const pressurePenalty = clamp((state.week - 8) * 0.05, 0, 0.9);
                const hedgeTax = state.loops.has('hedged') ? 0.08 : 0;
                return clamp(base - pressurePenalty + pattern - hedgeTax, -0.7, 1.8);
            };

            const metricFromHistory = (baseDebt, baseP95) => {
                const gains = state.history.reduce((sum, entry) => sum + Math.max(entry.delta, 0), 0);
                const regressions = state.history.reduce((sum, entry) => sum + Math.max(-entry.delta, 0), 0);
                const debt = clamp(baseDebt - gains * 2.4 + regressions * 1.5, 0, 100);
                const p95 = clamp(baseP95 - gains * 4.2 + regressions * 3.4 - (state.loops.has('hedged') ? 4 : 0), 40, 260);
                const inc = clamp(Math.round(Math.pow(debt / 100, 2) * 8 * (state.loops.has('governance') ? 0.55 : 1.0)), 0, 10);
                return { debt, p95, inc };
            };

            const computeTrend = (signalPass) => {
                if (state.history.length === 0) {
                    return { state: 'baseline', text: 'Collecting baseline.' };
                }
                if (state.cycle >= state.cycleBudget && !signalPass) {
                    return { state: 'unreachable', text: 'Budget exhausted without sufficient signal gain.' };
                }

                const window = state.history.slice(-4).map((entry) => entry.delta);
                const avg = window.reduce((sum, value) => sum + value, 0) / window.length;
                const improving = window.length > 1 && window[window.length - 1] > window[0];

                if (signalPass && improving) {
                    return { state: 'converged', text: 'Converging: minimum progress gate satisfied.' };
                }
                if (signalPass) {
                    return { state: 'improving', text: 'Signal is acceptable; continue bounded cycles.' };
                }
                if (avg <= 0.05) {
                    return { state: 'flat', text: 'Signal flat; defer writes and keep sensing.' };
                }
                return { state: 'defer', text: 'Partial gain only; stay in bounded defer mode.' };
            };

            const renderTrendWindow = () => {
                trendWindowEl.innerHTML = '';
                const slots = state.history.slice(-4);

                for (let i = 0; i < 4; i += 1) {
                    const entry = slots[i];
                    const pill = document.createElement('div');
                    pill.className = 'maint-trend-pill';

                    if (!entry) {
                        pill.dataset.state = 'empty';
                        pill.innerHTML = '<div class="text-[10px] font-mono text-brand-muted">cycle --</div><div class="mt-1 text-xs text-brand-muted">Δ --</div>';
                        trendWindowEl.appendChild(pill);
                        continue;
                    }

                    const delta = entry.delta;
                    const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`;
                    const pillState = delta >= 0.45 ? 'pass' : (delta >= 0 ? 'defer' : 'fail');
                    pill.dataset.state = pillState;
                    pill.innerHTML =
                        `<div class="text-[10px] font-mono text-brand-muted">cycle ${entry.cycle}</div>` +
                        `<div class="mt-1 text-xs font-mono text-brand-strong">Δ ${deltaLabel}</div>`;
                    trendWindowEl.appendChild(pill);
                }
            };

            const pushAttemptDot = (status) => {
                const dot = document.createElement('span');
                dot.className = 'inline-block w-2.5 h-2.5 rounded-full';
                if (status === 'PASS') dot.style.backgroundColor = 'rgba(42, 195, 222, 0.95)';
                else if (status === 'ESCALATE') dot.style.backgroundColor = 'rgba(187, 154, 247, 0.95)';
                else dot.style.backgroundColor = 'rgba(255, 158, 100, 0.95)';
                attemptsEl.appendChild(dot);
                while (attemptsEl.children.length > 28) {
                    attemptsEl.removeChild(attemptsEl.firstChild);
                }
            };

            const resetLoopState = () => {
                state.cycle = 0;
                state.history = [];
                attemptsEl.innerHTML = '';
            };

            const render = () => {
                weekValue.textContent = String(state.week);
                weekSlider.value = String(state.week);
                budgetValue.textContent = String(state.cycleBudget);
                budgetSlider.value = String(state.cycleBudget);

                const series = simulate(state.loops);
                const baseDebt = series.debt[state.week] ?? series.debt[0];
                const baseP95 = series.p95[state.week] ?? series.p95[0];
                const metrics = metricFromHistory(baseDebt, baseP95);

                debtEl.textContent = String(Math.round(metrics.debt));
                incidentsEl.textContent = String(metrics.inc);
                p95El.textContent = String(Math.round(metrics.p95));
                budgetRemainingEl.textContent = String(Math.max(0, state.cycleBudget - state.cycle));
                targetEl.textContent = targetLabel(metrics.debt, metrics.inc);
                const nextGain = expectedDelta();
                expectedGainEl.textContent = `${nextGain >= 0 ? '+' : ''}${nextGain.toFixed(2)} debt/cycle`;

                const window = state.history.slice(-4).map((entry) => entry.delta);
                const avgDelta = window.length ? (window.reduce((sum, value) => sum + value, 0) / window.length) : 0;
                const signalPass = state.history.length > 0 && (window.length >= 3 ? avgDelta >= 0.45 : window[window.length - 1] >= 0.75);
                const guardrailsPass = state.loops.has('map') && state.loops.has('governance');
                const budgetExhausted = state.cycle >= state.cycleBudget && !signalPass;

                setGate(gateSignalEl, signalPass, state.cycle === 0);
                setGate(gateGuardrailsEl, guardrailsPass, false);
                setGate(gateBudgetEl, !budgetExhausted, false);
                setGate(gateLedgerEl, state.cycle > 0, state.cycle === 0);

                let status = 'READY';
                if (state.cycle > 0) {
                    if (budgetExhausted) status = 'ESCALATE';
                    else if (signalPass && guardrailsPass) status = 'PASS';
                    else status = 'DEFER';
                }

                statusEl.textContent = status;
                statusEl.style.color = statusColor(status);
                cycleEl.textContent = `${state.cycle}/${state.cycleBudget}`;
                lastRunEl.textContent = state.cycle === 0 ? '--' : `T+${state.cycle}`;
                receiptEl.textContent = `ledger/dream-daemon/week-${String(state.week).padStart(2, '0')}/cycle-${String(state.cycle).padStart(2, '0')}.json`;

                const trend = computeTrend(signalPass);
                trendStatusEl.textContent = trend.text;
                trendStatusEl.dataset.state = trend.state;
                renderTrendWindow();

                if (state.cycle === 0) {
                    outcomeEl.textContent = 'Ready to run one bounded cycle.';
                } else if (status === 'PASS') {
                    outcomeEl.textContent = 'Signal gain and guardrails pass. Admit one bounded maintenance diff.';
                } else if (status === 'DEFER' && !guardrailsPass) {
                    outcomeEl.textContent = 'Defer: guardrails incomplete. Keep sensing and route to human triage.';
                } else if (status === 'DEFER') {
                    outcomeEl.textContent = 'Defer: progress is below threshold. Keep bounded sensing cycles.';
                } else {
                    outcomeEl.textContent = 'Circuit break: budget exhausted without convergence. Escalate.';
                }

                if (!chartState.chart) {
                    chartState.chart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: series.weeks,
                            datasets: [
                                {
                                    label: 'Entropy debt',
                                    data: series.debt,
                                    borderColor: theme.danger,
                                    backgroundColor: 'rgba(247, 118, 142, 0.12)',
                                    borderWidth: 2,
                                    tension: 0.28,
                                    pointRadius: 0,
                                    yAxisID: 'yDebt',
                                },
                                {
                                    label: 'P95 cost/outcome',
                                    data: series.p95,
                                    borderColor: theme.accent,
                                    backgroundColor: 'rgba(187, 154, 247, 0.10)',
                                    borderWidth: 2,
                                    tension: 0.28,
                                    pointRadius: 0,
                                    yAxisID: 'yCost',
                                },
                            ],
                        },
                        options: {
                            ...commonChartOptions,
                            interaction: { mode: 'index', intersect: false },
                            scales: {
                                x: { ticks: { color: theme.muted }, grid: { color: theme.grid } },
                                yDebt: {
                                    position: 'left',
                                    min: 0,
                                    max: 100,
                                    title: { display: true, text: 'Debt', color: theme.muted },
                                    ticks: { color: theme.muted },
                                    grid: { color: theme.grid },
                                },
                                yCost: {
                                    position: 'right',
                                    min: 40,
                                    max: 260,
                                    title: { display: true, text: 'P95 cost', color: theme.muted },
                                    ticks: { color: theme.muted },
                                    grid: { display: false },
                                },
                            },
                        },
                        plugins: [markerPlugin],
                    });
                } else {
                    chartState.chart.data.labels = series.weeks;
                    chartState.chart.data.datasets[0].data = series.debt;
                    chartState.chart.data.datasets[1].data = series.p95;
                    chartState.chart.update('none');
                }

                return { status };
            };

            const runOne = () => {
                state.cycle += 1;
                state.history.push({
                    cycle: state.cycle,
                    delta: expectedDelta(state.cycle),
                });
                while (state.history.length > 28) {
                    state.history.shift();
                }
                const current = render();
                pushAttemptDot(current.status);
                return current;
            };

            weekSlider.addEventListener('input', () => {
                state.week = clamp(toInt(weekSlider.value, state.week), 0, MAX_WEEK);
                resetLoopState();
                render();
            });

            budgetSlider.addEventListener('input', () => {
                state.cycleBudget = clamp(toInt(budgetSlider.value, state.cycleBudget), 2, 12);
                if (state.cycle > state.cycleBudget) {
                    state.cycle = state.cycleBudget;
                }
                render();
            });

            loopButtons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.maintLoop || '';
                    if (!key) return;
                    if (state.loops.has(key)) state.loops.delete(key);
                    else state.loops.add(key);
                    btn.setAttribute('aria-pressed', state.loops.has(key) ? 'true' : 'false');
                    resetLoopState();
                    render();
                });
            });

            stepBtn.addEventListener('click', () => {
                runOne();
            });

            runToGateBtn.addEventListener('click', () => {
                let current = { status: 'READY' };
                while (state.cycle < state.cycleBudget) {
                    current = runOne();
                    if (current.status === 'PASS' || current.status === 'ESCALATE') break;
                }
                if (current.status !== 'PASS' && state.cycle >= state.cycleBudget) {
                    render();
                }
            });

            resetBtn.addEventListener('click', () => {
                resetLoopState();
                render();
            });

            render();
        };

        // Landing fragment: Illusion vs Reality of Results
        const setupIllusionVsResults = () => {
            const roots = Array.from(
                document.querySelectorAll('[data-infographic-section-id="i4-section-01-illusion-vs-results"]')
            );
            if (!roots.length) return;

            const setHidden = (el, isHidden) => {
                if (!el) return;
                if (isHidden) el.setAttribute('hidden', '');
                else el.removeAttribute('hidden');
            };

            const showEl = (el, show) => setHidden(el, !show);

            const setPressed = (btn, pressed) => {
                if (!btn) return;
                btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
            };

            const TAB_ACTIVE_CLASSES = [
                'bg-[rgba(42,195,222,0.20)]',
                'text-brand-strong',
                'shadow-[0_0_16px_rgba(42,195,222,0.22)]',
                'border-[rgba(42,195,222,0.35)]',
            ];
            const TAB_INACTIVE_CLASSES = [
                'bg-brand-light',
                'text-brand-muted',
                'border-brand-border',
                'hover:bg-brand-surface',
                'hover:text-brand-strong',
            ];

            const cardClassReset = (card) => {
                if (!card) return;
                card.classList.remove(
                    'opacity-60',
                    'border-brand-border',
                    'bg-brand-light',
                    'border-[rgba(42,195,222,0.35)]',
                    'bg-[rgba(42,195,222,0.08)]',
                    'shadow-[0_0_20px_rgba(42,195,222,0.12)]',
                    'border-[rgba(187,154,247,0.35)]',
                    'bg-[rgba(187,154,247,0.08)]',
                    'shadow-[0_0_20px_rgba(187,154,247,0.12)]',
                    'border-[rgba(96,165,250,0.35)]',
                    'bg-[rgba(96,165,250,0.08)]',
                    'shadow-[0_0_20px_rgba(96,165,250,0.12)]',
                    'border-[rgba(255,158,100,0.40)]',
                    'bg-[rgba(255,158,100,0.08)]',
                    'shadow-[0_0_20px_rgba(255,158,100,0.10)]',
                    'border-[rgba(16,185,129,0.35)]',
                    'bg-[rgba(16,185,129,0.08)]',
                    'shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                );
            };

            const setCard = (card, { active, borderClass, bgClass, shadowClass }) => {
                if (!card) return;
                cardClassReset(card);
                if (!active) {
                    card.classList.add('border-brand-border', 'bg-brand-light', 'opacity-60');
                    return;
                }
                card.classList.remove('opacity-60');
                if (borderClass) card.classList.add(borderClass);
                if (bgClass) card.classList.add(bgClass);
                if (shadowClass) card.classList.add(shadowClass);
            };

            roots.forEach((root) => {
                if (!root || root.dataset.i4Bound === '1') return;
                root.dataset.i4Bound = '1';

                const tabButtons = Array.from(root.querySelectorAll('[data-i4-tab]'));
                const panels = Array.from(root.querySelectorAll('[data-i4-panel]'));

                const startBtn = root.querySelector('[data-i4-action="start"]');
                const resetBtn = root.querySelector('[data-i4-action="reset"]');
                const runningBtn = root.querySelector('[data-i4-action="running"]');
                const attemptEl = root.querySelector('[data-i4-attempt]');
                const loopsEl = root.querySelector('[data-i4-loops]');
                const resultEl = root.querySelector('[data-i4-result]');
                const feedbackEl = root.querySelector('[data-i4-feedback]');
                const missionStatusEl = root.querySelector('[data-i4-status="mission"]');
                const generatorStatusEl = root.querySelector('[data-i4-status="generator"]');
                const validatorStatusEl = root.querySelector('[data-i4-status="validator"]');
                const cardMission = root.querySelector('[data-i4-step-card="mission"]');
                const cardGenerator = root.querySelector('[data-i4-step-card="generator"]');
                const cardValidator = root.querySelector('[data-i4-step-card="validator"]');

                const state = { step: 0, attempt: 1, isRunning: false };
                let timers = [];

                const clearTimers = () => {
                    timers.forEach((t) => clearTimeout(t));
                    timers = [];
                };
                const schedule = (fn, ms) => {
                    const t = setTimeout(fn, ms);
                    timers.push(t);
                    return t;
                };

                const setActionButtons = () => {
                    if (!startBtn || !resetBtn || !runningBtn) return;

                    if (state.isRunning) {
                        startBtn.classList.add('hidden');
                        resetBtn.classList.add('hidden');
                        runningBtn.classList.remove('hidden');
                    } else if (state.step === 5) {
                        startBtn.classList.add('hidden');
                        runningBtn.classList.add('hidden');
                        resetBtn.classList.remove('hidden');
                    } else {
                        resetBtn.classList.add('hidden');
                        runningBtn.classList.add('hidden');
                        startBtn.classList.remove('hidden');
                    }
                };

                const renderSim = () => {
                    if (attemptEl) attemptEl.textContent = String(state.attempt);
                    if (loopsEl) loopsEl.textContent = String(Math.max(0, state.attempt - 1));

                    showEl(missionStatusEl, state.step === 1);
                    showEl(generatorStatusEl, state.step === 2);
                    showEl(feedbackEl, state.step === 4);

                    if (validatorStatusEl) {
                        showEl(validatorStatusEl, state.step >= 3);
                        validatorStatusEl.classList.remove('text-brand-muted', 'text-[rgba(96,165,250,0.95)]', 'text-[rgba(255,158,100,0.95)]', 'text-[rgba(16,185,129,0.95)]');
                        if (state.step === 3) {
                            validatorStatusEl.textContent = 'Running physics check…';
                            validatorStatusEl.classList.add('text-[rgba(96,165,250,0.95)]');
                        } else if (state.step === 4) {
                            validatorStatusEl.textContent = 'Failed! Try again.';
                            validatorStatusEl.classList.add('text-[rgba(255,158,100,0.95)]');
                        } else if (state.step === 5) {
                            validatorStatusEl.textContent = 'Passed & trusted!';
                            validatorStatusEl.classList.add('text-[rgba(16,185,129,0.95)]');
                        } else {
                            validatorStatusEl.textContent = '';
                            validatorStatusEl.classList.add('text-brand-muted');
                        }
                    }

                    setCard(cardMission, {
                        active: state.step >= 1,
                        borderClass: 'border-[rgba(42,195,222,0.35)]',
                        bgClass: 'bg-[rgba(42,195,222,0.08)]',
                        shadowClass: 'shadow-[0_0_20px_rgba(42,195,222,0.12)]',
                    });
                    setCard(cardGenerator, {
                        active: state.step >= 2 && state.step !== 5,
                        borderClass: 'border-[rgba(187,154,247,0.35)]',
                        bgClass: 'bg-[rgba(187,154,247,0.08)]',
                        shadowClass: 'shadow-[0_0_20px_rgba(187,154,247,0.12)]',
                    });

                    let validatorTheme = {
                        active: state.step >= 3,
                        borderClass: 'border-[rgba(96,165,250,0.35)]',
                        bgClass: 'bg-[rgba(96,165,250,0.08)]',
                        shadowClass: 'shadow-[0_0_20px_rgba(96,165,250,0.12)]',
                    };
                    if (state.step === 4) {
                        validatorTheme = {
                            active: true,
                            borderClass: 'border-[rgba(255,158,100,0.40)]',
                            bgClass: 'bg-[rgba(255,158,100,0.08)]',
                            shadowClass: 'shadow-[0_0_20px_rgba(255,158,100,0.10)]',
                        };
                    } else if (state.step === 5) {
                        validatorTheme = {
                            active: true,
                            borderClass: 'border-[rgba(16,185,129,0.35)]',
                            bgClass: 'bg-[rgba(16,185,129,0.08)]',
                            shadowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
                        };
                    }
                    setCard(cardValidator, validatorTheme);

                    showEl(resultEl, state.step === 5);
                    setActionButtons();
                };

                const resetSim = () => {
                    clearTimers();
                    state.step = 0;
                    state.attempt = 1;
                    state.isRunning = false;
                    renderSim();
                };

                const runLoop = (attempt) => {
                    state.attempt = attempt;
                    state.step = 2;
                    renderSim();

                    schedule(() => {
                        state.step = 3;
                        renderSim();

                        schedule(() => {
                            if (attempt < 3) {
                                state.step = 4;
                                renderSim();
                                schedule(() => runLoop(attempt + 1), 1500);
                            } else {
                                state.step = 5;
                                state.isRunning = false;
                                renderSim();
                            }
                        }, 1500);
                    }, 1500);
                };

                const startSim = () => {
                    if (state.isRunning) return;
                    clearTimers();
                    state.isRunning = true;
                    state.step = 1;
                    state.attempt = 1;
                    renderSim();
                    schedule(() => runLoop(1), 1500);
                };

                if (startBtn) startBtn.addEventListener('click', () => startSim());
                if (resetBtn) resetBtn.addEventListener('click', () => resetSim());

                const showTab = (tabKey) => {
                    const key = (tabKey || '').trim() || 'concept';
                    if (panels.length) {
                        panels.forEach((panel) => {
                            const p = panel.dataset.i4Panel || '';
                            setHidden(panel, p !== key);
                        });
                    }
                    if (tabButtons.length) {
                        tabButtons.forEach((btn) => {
                            const isActive = (btn.dataset.i4Tab || '') === key;
                            setPressed(btn, isActive);
                            btn.classList.remove(...TAB_ACTIVE_CLASSES, ...TAB_INACTIVE_CLASSES);
                            if (isActive) btn.classList.add(...TAB_ACTIVE_CLASSES);
                            else btn.classList.add(...TAB_INACTIVE_CLASSES);
                        });
                    }
                    if (key !== 'simulator') resetSim();
                };

                if (tabButtons.length) {
                    tabButtons.forEach((btn) => {
                        btn.addEventListener('click', () => showTab(btn.dataset.i4Tab || 'concept'));
                    });
                    const initial = tabButtons.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.i4Tab || 'concept';
                    showTab(initial);
                } else {
                    renderSim();
                }
            });
        };

        // Boot
        setupSubstrateExplorer();
        setupMissionObjectBuilder();
        setupSandwichSimulator();
        setupValidatorBundle();
        setupAlwaysOnLoops();
        setupIllusionVsResults();
    })();
    
