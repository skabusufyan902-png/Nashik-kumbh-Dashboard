"use strict";

// ======================================================
// DATABASE & ROUTING CONFIGURATION
// ======================================================

const SUPABASE_URL = "https://kslhbevhhwktraownwkb.supabase.co";
const SUPABASE_KEY = "sb_publishable_dASuN7llAaLN78oPwdWrtg_eKsBMIjT";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MAX_CONNECTOR_DIST = 120; // 120m threshold
const ASSUMED_SPEED_KMPH = 30;  // 30 km/h urban emergency ambulance speed

const canvasRenderer = L.canvas({ padding: 0.5, tolerance: 12 });
const map = L.map("map", { renderer: canvasRenderer }).setView([19.9975, 73.7898], 13);

const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);

const nodes = new Map();
const links = [];
const linksMap = new Map();
const vertices = new Map();
const hospitals = [];
const graph = new Map();

const roadLayer = L.layerGroup().addTo(map);
const nodeLayer = L.layerGroup();
const hospitalLayer = L.layerGroup().addTo(map);

let routeLayer = null;
let incidentMarker = null;
let incidentPopup = null;
let actionPopup = null; // Separate popup for road/hospital edits so incident box never closes
let currentTop3Routes = [];
let currentIncidentPoint = null;
let currentSnappedRoad = null;
let currentEmergencyType = "";
let isSelectingMapPoint = false;

// Multi-link & Box-selection road closure state
let isMultiBlockMode = false;
let isBoxBlockMode = false;
let boxStartLatLng = null;
let selectionRect = null;
const queuedLinkIds = new Set();

const ROUTE_COLORS = [
    { main: "#00c853", connector: "#ff9800", label: "1st Best", badge: "#00c853" },
    { main: "#29b6f6", connector: "#ffb74d", label: "2nd Best", badge: "#0288d1" },
    { main: "#ab47bc", connector: "#ffcc80", label: "3rd Best", badge: "#7b1fa2" }
];

// ======================================================
// HELPER: CHECK IF LINK IS BLOCKED & FIND REVERSE LINK
// ======================================================

function isLinkBlocked(link) {
    return link.status === "CLOSED";
}

function getBidirectionalLinkIds(linkID) {
    const target = linksMap.get(String(linkID));
    if (!target) return [String(linkID)];

    const ids = [target.id];
    for (const l of links) {
        if (l.id !== target.id && l.from === target.to && l.to === target.from) {
            ids.push(l.id);
        }
    }
    return ids;
}

// ======================================================
// SIDEBAR MOBILE TOGGLE
// ======================================================

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("open");
}

// ======================================================
// MAKE LEAFLET POPUP DRAGGABLE & MINIMIZABLE
// ======================================================

function makePopupDraggable(popupInstance) {
    if (!popupInstance) return;
    const container = popupInstance.getElement();
    if (!container) return;

    const wrapper = container.querySelector('.leaflet-popup-content-wrapper');
    if (!wrapper) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    L.DomEvent.disableScrollPropagation(container);

    wrapper.addEventListener('mousedown', (e) => {
        if (
            ['SELECT', 'BUTTON', 'OPTION', 'INPUT', 'A'].includes(e.target.tagName) ||
            e.target.classList.contains('leaflet-popup-close-button') ||
            e.target.closest('.best-hospital')
        ) {
            return;
        }

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = container.getBoundingClientRect();
        const mapRect = map.getContainer().getBoundingClientRect();

        initialLeft = rect.left - mapRect.left;
        initialTop = rect.top - mapRect.top;

        container.style.transform = 'none';
        container.style.left = `${initialLeft}px`;
        container.style.top = `${initialTop}px`;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        container.style.left = `${initialLeft + dx}px`;
        container.style.top = `${initialTop + dy}px`;
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

function togglePopupMinimize() {
    const popupEl = document.querySelector('.emergency-popup');
    const minBtn = document.getElementById('popupMinBtn');
    if (popupEl && minBtn) {
        popupEl.classList.toggle('minimized');
        minBtn.textContent = popupEl.classList.contains('minimized') ? '+' : '-';
    }
}

// ======================================================
// STRICT 1000-ROW CHUNK FETCH
// ======================================================

async function fetchChunkWithRetry(tableName, selectColumns, from, to, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const { data, error } = await supabaseClient
                .from(tableName)
                .select(selectColumns)
                .range(from, to);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn(`[Supabase] Chunk ${from}-${to} attempt ${attempt} failed: ${err.message}`);
            if (attempt === retries) return [];
            await new Promise(res => setTimeout(res, 250 * attempt));
        }
    }
}

async function fetchAllRowsFast(tableName, selectColumns = "*") {
    const { count, error: countErr } = await supabaseClient
        .from(tableName)
        .select("*", { count: "exact", head: true });

    if (countErr) throw countErr;
    if (!count) return [];

    const chunkSize = 1000;
    const maxConcurrentRequests = 10;
    const ranges = [];

    for (let from = 0; from < count; from += chunkSize) {
        const to = Math.min(from + chunkSize - 1, count - 1);
        ranges.push({ from, to });
    }

    let allData = [];

    for (let i = 0; i < ranges.length; i += maxConcurrentRequests) {
        const pool = ranges.slice(i, i + maxConcurrentRequests);
        const poolPromises = pool.map(r => fetchChunkWithRetry(tableName, selectColumns, r.from, r.to));
        
        const poolResults = await Promise.all(poolPromises);
        for (const chunk of poolResults) {
            allData = allData.concat(chunk);
        }

        statusMessage(`Loading ${tableName}... (${Math.min(allData.length, count).toLocaleString()} / ${count.toLocaleString()})`);
    }

    return allData;
}

// ======================================================
// LOAD NETWORK DATA FROM DATABASE
// ======================================================

async function loadNetworkFromDB() {
    try {
        statusMessage("Loading nodes (28,126 rows)...");
        const dbNodes = await fetchAllRowsFast("nodes", "node_id, lat, long");

        nodes.clear();
        dbNodes.forEach(row => {
            const nodeID = String(row.node_id);
            nodes.set(nodeID, {
                id: nodeID,
                lat: Number(row.lat),
                lon: Number(row.long)
            });
        });

        statusMessage("Loading road links (70,272 rows)...");
        const dbLinks = await fetchAllRowsFast("road_links", "link_id, from_node, to_node, length_m, status");

        links.length = 0;
        linksMap.clear();

        dbLinks.forEach(row => {
            const linkID = String(row.link_id);
            const lengthVal = Number(row.length_m);
            const linkObj = {
                id: linkID,
                from: String(row.from_node),
                to: String(row.to_node),
                length: Number.isFinite(lengthVal) && lengthVal > 0 ? lengthVal : 1,
                status: String(row.status || "OPEN").toUpperCase()
            };
            links.push(linkObj);
            linksMap.set(linkID, linkObj);
        });

        statusMessage("Loading road vertices (236,676 rows)...");
        const dbVertices = await fetchAllRowsFast("vertices", "link_id, vertex_index, lat, long");

        vertices.clear();
        dbVertices.forEach(row => {
            const linkID = String(row.link_id);
            if (!vertices.has(linkID)) {
                vertices.set(linkID, []);
            }
            vertices.get(linkID).push({
                lat: Number(row.lat),
                lon: Number(row.long),
                order: Number(row.vertex_index || 0)
            });
        });

        statusMessage("Loading hospitals...");
        const dbHospitals = await fetchAllRowsFast("hospitals", "*");

        hospitals.length = 0;
        dbHospitals.forEach(row => {
            hospitals.push({
                id: String(row.id),
                name: row.Name || "Hospital",
                lat: Number(row.Latitude),
                lon: Number(row.Longitude),
                roadAccident: Number(row["Road Accident"]) === 1,
                drowning: Number(row["Drowning"]) === 1,
                stampede: Number(row["Stampede"]) === 1,
                heartAttack: Number(row["Heart Attack"]) === 1,
                heatStroke: Number(row["Heat Stroke"]) === 1,
                accessNode: String(row.access_node || ""),
                availableBeds: Number(row.available_beds || 0)
            });
        });

        hospitals.sort((a, b) => a.name.localeCompare(b.name));

        createGraph();
        drawRoads();
        drawHospitals();
        createLayerControl();

        document.getElementById("nodeCount").textContent = nodes.size.toLocaleString();
        document.getElementById("linkCount").textContent = links.length.toLocaleString();
        document.getElementById("hospitalCount").textContent = hospitals.length.toLocaleString();

        let vCount = 0;
        for (const list of vertices.values()) vCount += list.length;
        document.getElementById("vertexCount").textContent = vCount.toLocaleString();

        fitMap();

        statusMessage("Network Live & Operational");
        setTimeout(() => {
            const el = document.getElementById("loading");
            if (el) el.style.display = "none";
        }, 800);

        initReportingControls();
        initBoxSelectionEvents();
        map.on("click", handleMapClick);

        setupRealtimeSubscriptions();

    } catch (err) {
        console.error("Database connection error:", err);
        statusMessage("ERROR: " + err.message);
    }
}

// ======================================================
// REAL-TIME WEBSOCKET LISTENERS
// ======================================================

function setupRealtimeSubscriptions() {
    supabaseClient
        .channel('public:road_links')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'road_links' }, payload => {
            const link = linksMap.get(String(payload.new.link_id));
            if (link) {
                link.status = String(payload.new.status || "OPEN").toUpperCase();
                if (payload.new.length_m !== undefined) {
                    const lengthVal = Number(payload.new.length_m);
                    link.length = Number.isFinite(lengthVal) && lengthVal > 0 ? lengthVal : link.length;
                }
                createGraph();
                drawRoads();
                recalculateActiveIncidentIfAny();
            }
        })
        .subscribe();

    supabaseClient
        .channel('public:hospitals')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hospitals' }, payload => {
            const h = hospitals.find(item => item.id === String(payload.new.id));
            if (h) {
                h.availableBeds = Number(payload.new.available_beds);
                drawHospitals();
                filterHospitalList();
                recalculateActiveIncidentIfAny();
            }
        })
        .subscribe();
}

function recalculateActiveIncidentIfAny() {
    const resultDiv = document.getElementById("routeResult");
    if (currentIncidentPoint && currentEmergencyType && resultDiv) {
        currentSnappedRoad = findNearestLinkPoint(currentIncidentPoint.lat, currentIncidentPoint.lon);
        if (currentSnappedRoad) {
            findBestHospital(currentEmergencyType, currentIncidentPoint, currentSnappedRoad, resultDiv, false);
        }
    }
}

// ======================================================
// CASE-INSENSITIVE LIVE HOSPITAL SEARCH
// ======================================================

function filterHospitalList() {
    const searchInput = document.getElementById("hospitalSearchInput");
    const resultsBox = document.getElementById("hospitalSearchResults");
    if (!searchInput || !resultsBox) return;

    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
        resultsBox.style.display = "none";
        resultsBox.innerHTML = "";
        return;
    }

    const matches = hospitals.filter(h => h.name.toLowerCase().includes(query));

    if (!matches.length) {
        resultsBox.innerHTML = `<div style="padding:6px 8px; font-size:11px; color:#888;">No matching hospitals</div>`;
        resultsBox.style.display = "block";
        return;
    }

    resultsBox.innerHTML = matches.map(h => `
        <div class="search-result-item" onclick="selectHospitalFromSearch('${h.id}')">
            <span style="font-weight:600; color:#222;">${h.name}</span>
            <span style="background:#e0e0e0; padding:1px 5px; border-radius:4px; font-size:10px; font-weight:bold;">
                ${h.availableBeds} beds
            </span>
        </div>
    `).join("");

    resultsBox.style.display = "block";
}

function selectHospitalFromSearch(hospitalID) {
    const h = hospitals.find(item => item.id === String(hospitalID));
    if (!h) return;

    document.getElementById("selectedHospitalId").value = h.id;
    document.getElementById("selectedHospitalLabel").textContent = `Selected: ${h.name}`;
    document.getElementById("sidebarBedInput").value = h.availableBeds;
    document.getElementById("hospitalSearchInput").value = h.name;
    document.getElementById("hospitalSearchResults").style.display = "none";

    map.panTo([h.lat, h.lon]);
}

async function saveBedsFromSidebar() {
    const hospitalID = document.getElementById("selectedHospitalId")?.value;
    const bedInput = document.getElementById("sidebarBedInput");
    const btn = document.getElementById("sidebarSaveBedsBtn");

    if (!hospitalID) {
        alert("Type and click a hospital from the search list first.");
        return;
    }

    const newBeds = Math.max(0, parseInt(bedInput.value, 10) || 0);
    if (btn) {
        btn.textContent = "Saving...";
        btn.disabled = true;
    }

    await updateHospitalBedsInDB(hospitalID, newBeds);

    if (btn) {
        btn.textContent = "Update Beds";
        btn.disabled = false;
    }
}

// ======================================================
// MULTI-LINK & DRAG-BOX ROAD CLOSURE CONTROLS
// ======================================================

function toggleMultiBlockMode() {
    if (isBoxBlockMode) toggleBoxBlockMode();
    isMultiBlockMode = !isMultiBlockMode;

    const btn = document.getElementById("multiBlockToggleBtn");
    const panel = document.getElementById("multiBlockActions");

    if (isMultiBlockMode) {
        disableMapSelectionMode();
        btn.textContent = "Exit Multi-Link Mode";
        btn.style.background = "#e65100";
        panel.style.display = "block";
    } else {
        btn.textContent = "Click-Select Multiple Links";
        btn.style.background = "";
        if (queuedLinkIds.size === 0) panel.style.display = "none";
    }
}

function toggleBoxBlockMode() {
    if (isMultiBlockMode) toggleMultiBlockMode();
    isBoxBlockMode = !isBoxBlockMode;

    const btn = document.getElementById("boxBlockToggleBtn");
    const panel = document.getElementById("multiBlockActions");
    const banner = document.getElementById("selectionBanner");
    const bannerText = document.getElementById("selectionBannerText");

    if (isBoxBlockMode) {
        disableMapSelectionMode();
        map.dragging.disable();
        document.body.classList.add("box-selecting");
        btn.textContent = "Exit Box-Select Mode";
        btn.style.background = "#e65100";
        panel.style.display = "block";
        if (banner && bannerText) {
            bannerText.textContent = "Click and drag a rectangle on the map to select all road links inside";
            banner.style.display = "flex";
        }
    } else {
        map.dragging.enable();
        document.body.classList.remove("box-selecting");
        btn.textContent = "Drag Box to Block Zone";
        btn.style.background = "";
        if (banner) banner.style.display = "none";
        if (queuedLinkIds.size === 0) panel.style.display = "none";
    }
}

function initBoxSelectionEvents() {
    map.on("mousedown", (e) => {
        if (!isBoxBlockMode) return;
        boxStartLatLng = e.latlng;
        if (selectionRect) map.removeLayer(selectionRect);
        selectionRect = L.rectangle([boxStartLatLng, boxStartLatLng], {
            color: "#ff6f00",
            weight: 2,
            fillOpacity: 0.2
        }).addTo(map);
    });

    map.on("mousemove", (e) => {
        if (!isBoxBlockMode || !boxStartLatLng || !selectionRect) return;
        selectionRect.setBounds([boxStartLatLng, e.latlng]);
    });

    map.on("mouseup", (e) => {
        if (!isBoxBlockMode || !boxStartLatLng) return;
        const bounds = L.latLngBounds(boxStartLatLng, e.latlng);
        boxStartLatLng = null;

        if (selectionRect) {
            map.removeLayer(selectionRect);
            selectionRect = null;
        }

        let added = 0;
        for (const link of links) {
            const fromNode = nodes.get(link.from);
            const toNode = nodes.get(link.to);
            if (!fromNode || !toNode) continue;

            if (bounds.contains([fromNode.lat, fromNode.lon]) || bounds.contains([toNode.lat, toNode.lon])) {
                if (!queuedLinkIds.has(link.id)) {
                    queuedLinkIds.add(link.id);
                    added++;
                }
            }
        }

        const countEl = document.getElementById("queuedLinksCount");
        if (countEl) countEl.textContent = queuedLinkIds.size;

        if (added > 0) drawRoads();
        toggleBoxBlockMode();
    });
}

function toggleLinkInQueue(linkID) {
    const pairIds = getBidirectionalLinkIds(linkID);
    const alreadyQueued = pairIds.every(id => queuedLinkIds.has(id));

    if (alreadyQueued) {
        pairIds.forEach(id => queuedLinkIds.delete(id));
    } else {
        pairIds.forEach(id => queuedLinkIds.add(id));
    }

    const countEl = document.getElementById("queuedLinksCount");
    if (countEl) countEl.textContent = queuedLinkIds.size;
    drawRoads();
}

function clearQueuedLinks() {
    queuedLinkIds.clear();
    const countEl = document.getElementById("queuedLinksCount");
    if (countEl) countEl.textContent = "0";
    if (!isMultiBlockMode && !isBoxBlockMode) {
        const panel = document.getElementById("multiBlockActions");
        if (panel) panel.style.display = "none";
    }
    drawRoads();
}

async function applyBatchRoadStatus(newStatus) {
    if (queuedLinkIds.size === 0) {
        alert("Select one or more road links on the map first.");
        return;
    }

    const idsToUpdate = Array.from(queuedLinkIds);
    for (let i = 0; i < idsToUpdate.length; i += 500) {
        const batch = idsToUpdate.slice(i, i + 500);
        const { error } = await supabaseClient
            .from("road_links")
            .update({ status: newStatus })
            .in("link_id", batch);

        if (error) {
            alert("Batch Update Error: " + error.message);
            return;
        }
    }

    idsToUpdate.forEach(id => {
        const link = linksMap.get(String(id));
        if (link) link.status = newStatus;
    });

    queuedLinkIds.clear();
    const countEl = document.getElementById("queuedLinksCount");
    if (countEl) countEl.textContent = "0";

    if (isMultiBlockMode) toggleMultiBlockMode();
    const panel = document.getElementById("multiBlockActions");
    if (panel) panel.style.display = "none";

    createGraph();
    drawRoads();
    recalculateActiveIncidentIfAny();
}

// ======================================================
// SINGLE ROAD & HOSPITAL SUPABASE UPDATES
// ======================================================

async function toggleRoadStatus(linkID, newStatus) {
    if (actionPopup) {
        map.removeLayer(actionPopup);
        actionPopup = null;
    }
    const idsToUpdate = getBidirectionalLinkIds(linkID);

    const { error } = await supabaseClient
        .from("road_links")
        .update({ status: newStatus })
        .in("link_id", idsToUpdate);

    if (error) {
        alert("Supabase Update Error (Check RLS Policy): " + error.message);
        return;
    }

    idsToUpdate.forEach(id => {
        const link = linksMap.get(String(id));
        if (link) link.status = newStatus;
    });

    createGraph();
    drawRoads();
    recalculateActiveIncidentIfAny();
}

async function updateHospitalBedsInDB(hospitalID, newBeds) {
    const { error } = await supabaseClient
        .from("hospitals")
        .update({ available_beds: newBeds })
        .eq("id", hospitalID);

    if (error) {
        alert("Supabase Bed Update Error (Check RLS Policy): " + error.message);
        return;
    }

    const h = hospitals.find(item => item.id === String(hospitalID));
    if (h) {
        h.availableBeds = newBeds;
    }

    drawHospitals();
    filterHospitalList();
    recalculateActiveIncidentIfAny();
}

async function saveBedsFromPopup(hospitalID) {
    const input = document.getElementById(`bed-input-${hospitalID}`);
    if (!input) return;
    const newBeds = Math.max(0, parseInt(input.value, 10) || 0);
    if (actionPopup) {
        map.removeLayer(actionPopup);
        actionPopup = null;
    }
    await updateHospitalBedsInDB(hospitalID, newBeds);
}

// ======================================================
// DIRECTED GRAPH & POLYLINE GEOMETRY
// ======================================================

function createGraph() {
    graph.clear();
    for (const nodeID of nodes.keys()) {
        graph.set(nodeID, []);
    }

    for (const link of links) {
        if (isLinkBlocked(link)) continue;
        
        if (!graph.has(link.from)) graph.set(link.from, []);

        graph.get(link.from).push({
            to: link.to,
            linkID: link.id,
            distance: link.length
        });
    }
}

function getLinkCoordinates(link) {
    const from = nodes.get(link.from);
    const to = nodes.get(link.to);
    if (!from || !to) return [];

    const points = [[from.lat, from.lon]];
    const curvePoints = vertices.get(link.id) || [];
    for (const vertex of curvePoints) {
        points.push([vertex.lat, vertex.lon]);
    }
    points.push([to.lat, to.lon]);
    return points;
}

// ======================================================
// DISTANCE & ROAD SNAPPING
// ======================================================

function distanceMetres(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * rad) *
        Math.cos(lat2 * rad) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function projectPointToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) return { lat: ax, lon: ay, distance: distanceMetres(px, py, ax, ay), ratio: 0 };

    let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));

    const projLat = ax + t * dx;
    const projLon = ay + t * dy;

    return {
        lat: projLat,
        lon: projLon,
        distance: distanceMetres(px, py, projLat, projLon),
        ratio: t
    };
}

function findNearestLinkPoint(lat, lon) {
    let best = null;
    for (const link of links) {
        if (isLinkBlocked(link)) continue;
        
        const coords = getLinkCoordinates(link);

        for (let i = 0; i < coords.length - 1; i++) {
            const p1 = coords[i];
            const p2 = coords[i + 1];
            const proj = projectPointToSegment(lat, lon, p1[0], p1[1], p2[0], p2[1]);

            if (!best || proj.distance < best.distance) {
                best = {
                    lat: proj.lat,
                    lon: proj.lon,
                    distance: proj.distance,
                    link: link,
                    nearestNode: proj.ratio < 0.5 ? link.from : link.to
                };
            }
        }
    }
    return best;
}

// ======================================================
// PRIORITY QUEUE & DIJKSTRA ALGORITHM
// ======================================================

class MinHeap {
    constructor() { this.items = []; }
    push(item) {
        this.items.push(item);
        let i = this.items.length - 1;
        while (i > 0) {
            const p = Math.floor((i - 1) / 2);
            if (this.items[p].distance <= this.items[i].distance) break;
            [this.items[p], this.items[i]] = [this.items[i], this.items[p]];
            i = p;
        }
    }
    pop() {
        if (!this.items.length) return null;
        const root = this.items[0];
        const last = this.items.pop();
        if (this.items.length) {
            this.items[0] = last;
            let i = 0;
            while (true) {
                let smallest = i;
                const left = 2 * i + 1;
                const right = 2 * i + 2;
                if (left < this.items.length && this.items[left].distance < this.items[smallest].distance) smallest = left;
                if (right < this.items.length && this.items[right].distance < this.items[smallest].distance) smallest = right;
                if (smallest === i) break;
                [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]];
                i = smallest;
            }
        }
        return root;
    }
    get size() { return this.items.length; }
}

function shortestPath(startID, targetID) {
    if (!graph.has(startID) || !graph.has(targetID)) return null;
    if (startID === targetID) return { nodes: [startID], links: [], distance: 0 };

    const distances = new Map([[startID, 0]]);
    const previousNode = new Map();
    const previousLink = new Map();
    const queue = new MinHeap();

    queue.push({ id: startID, distance: 0 });

    while (queue.size) {
        const current = queue.pop();
        if (current.distance !== distances.get(current.id)) continue;
        if (current.id === targetID) break;

        for (const edge of graph.get(current.id) || []) {
            const newDist = current.distance + edge.distance;
            const oldDist = distances.get(edge.to) ?? Infinity;

            if (newDist < oldDist) {
                distances.set(edge.to, newDist);
                previousNode.set(edge.to, current.id);
                previousLink.set(edge.to, edge.linkID);
                queue.push({ id: edge.to, distance: newDist });
            }
        }
    }

    if (!distances.has(targetID)) return null;

    const routeNodes = [targetID];
    const routeLinks = [];
    let current = targetID;

    while (current !== startID) {
        const prev = previousNode.get(current);
        if (prev === undefined) return null;
        routeLinks.unshift(previousLink.get(current));
        routeNodes.unshift(prev);
        current = prev;
    }

    return { nodes: routeNodes, links: routeLinks, distance: distances.get(targetID) };
}

// ======================================================
// INTERACTIVE MAP POINT SELECTION MODE CONTROLS
// ======================================================

function initReportingControls() {
    const locateBtn = document.getElementById("locateBtn");
    const pickOnMapBtn = document.getElementById("pickOnMapBtn");
    const clearIncidentBtn = document.getElementById("clearIncidentBtn");
    const selectionBanner = document.getElementById("selectionBanner");
    const bannerText = document.getElementById("selectionBannerText");
    const cancelSelectionBtn = document.getElementById("cancelSelectionBtn");

    if (locateBtn) {
        locateBtn.addEventListener("click", () => {
            disableMapSelectionMode();
            if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser.");
                return;
            }

            locateBtn.textContent = "Acquiring GPS...";
            locateBtn.disabled = true;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    locateBtn.textContent = "Use My GPS Location";
                    locateBtn.disabled = false;
                    const userLatLng = { lat: position.coords.latitude, lng: position.coords.longitude };
                    map.setView([userLatLng.lat, userLatLng.lng], 16);
                    processIncidentLocation(userLatLng);
                },
                () => {
                    locateBtn.textContent = "Use My GPS Location";
                    locateBtn.disabled = false;
                    alert("Could not retrieve GPS location.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }

    if (pickOnMapBtn) {
        pickOnMapBtn.addEventListener("click", () => {
            if (isMultiBlockMode) toggleMultiBlockMode();
            if (isBoxBlockMode) toggleBoxBlockMode();
            isSelectingMapPoint = true;
            document.body.classList.add("selecting-point");
            if (bannerText) bannerText.textContent = "Click anywhere on the map to place the incident point";
            if (selectionBanner) selectionBanner.style.display = "flex";
        });
    }

    if (cancelSelectionBtn) {
        cancelSelectionBtn.addEventListener("click", () => {
            disableMapSelectionMode();
            if (isBoxBlockMode) toggleBoxBlockMode();
        });
    }

    if (clearIncidentBtn) {
        clearIncidentBtn.addEventListener("click", () => {
            clearCurrentIncident();
        });
    }
}

function disableMapSelectionMode() {
    isSelectingMapPoint = false;
    document.body.classList.remove("selecting-point");
    const selectionBanner = document.getElementById("selectionBanner");
    if (selectionBanner) selectionBanner.style.display = "none";
}

function handleMapClick(event) {
    if (!isSelectingMapPoint) return;
    disableMapSelectionMode();
    processIncidentLocation({ lat: event.latlng.lat, lng: event.latlng.lng });
}

function clearCurrentIncident() {
    if (incidentMarker) {
        map.removeLayer(incidentMarker);
        incidentMarker = null;
    }
    if (incidentPopup) {
        map.removeLayer(incidentPopup);
        incidentPopup = null;
    }
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    currentIncidentPoint = null;
    currentSnappedRoad = null;
    currentEmergencyType = "";
    currentTop3Routes = [];

    const metricsCard = document.getElementById("metricsCard");
    const clearIncidentBtn = document.getElementById("clearIncidentBtn");

    if (metricsCard) metricsCard.style.display = "none";
    if (clearIncidentBtn) clearIncidentBtn.style.display = "none";
}

function openOrRestoreIncidentPopup() {
    if (!currentIncidentPoint || !incidentPopup) return;
    if (!map.hasLayer(incidentPopup)) {
        incidentPopup.setLatLng([currentIncidentPoint.lat, currentIncidentPoint.lon]).addTo(map);
    }
    setTimeout(() => {
        makePopupDraggable(incidentPopup);
        bindIncidentPopupEvents();
    }, 50);
}

function bindIncidentPopupEvents() {
    const selectEl = document.getElementById("emergencySelect");
    if (selectEl && currentEmergencyType) {
        selectEl.value = currentEmergencyType;
    }

    const button = document.getElementById("findHospital");
    if (button) {
        button.onclick = () => {
            const emergency = document.getElementById("emergencySelect").value;
            const resultDiv = document.getElementById("routeResult");
            if (!emergency) {
                resultDiv.textContent = "Please select an emergency type.";
                return;
            }
            currentEmergencyType = emergency;
            findBestHospital(emergency, currentIncidentPoint, currentSnappedRoad, resultDiv, true);
        };
    }
}

function processIncidentLocation(latlng) {
    const metricsCard = document.getElementById("metricsCard");
    const clearIncidentBtn = document.getElementById("clearIncidentBtn");

    if (metricsCard) metricsCard.style.display = "block";
    if (clearIncidentBtn) clearIncidentBtn.style.display = "inline-flex";

    const incident = { lat: latlng.lat, lon: latlng.lng };
    currentIncidentPoint = incident;
    currentEmergencyType = "";
    currentTop3Routes = [];

    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    const snappedRoad = findNearestLinkPoint(incident.lat, incident.lon);
    currentSnappedRoad = snappedRoad;

    if (!snappedRoad) {
        alert("No open network roads found nearby.");
        return;
    }

    if (incidentMarker) map.removeLayer(incidentMarker);
    if (incidentPopup) map.removeLayer(incidentPopup);

    incidentMarker = L.circleMarker([incident.lat, incident.lon], {
        radius: 10, color: "#b71c1c", fillColor: "#f44336", fillOpacity: 1, weight: 3
    }).addTo(map);

    // Clicking the incident dot on the map always reopens the incident panel if closed
    incidentMarker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        openOrRestoreIncidentPopup();
    });

    const html = `
        <div class="emergency-popup">
            <div class="popup-header-controls">
                <h3>Incident Reported</h3>
                <div>
                    <button id="popupMinBtn" class="popup-minimize-btn" onclick="togglePopupMinimize()" title="Minimize / Restore">-</button>
                </div>
            </div>
            
            <div class="popup-body-content">
                <div style="font-size:11px; color:#555; margin-top:4px;">
                    Lat/Lon: ${incident.lat.toFixed(5)}, ${incident.lon.toFixed(5)}<br>
                    Road Snap Dist: <b>${snappedRoad.distance.toFixed(1)}m</b>
                </div>
                <hr style="margin:6px 0; border:0; border-top:1px solid #eee;">
                <label for="emergencySelect"><b>Select Condition:</b></label>
                <select id="emergencySelect">
                    <option value="">-- Choose Category --</option>
                    <option value="Road Accident">Road Accident</option>
                    <option value="Drowning">Drowning</option>
                    <option value="Stampede">Stampede</option>
                    <option value="Heart Attack">Heart Attack</option>
                    <option value="Heat Stroke">Heat Stroke</option>
                </select>
                <button id="findHospital" class="btn btn-primary" style="margin-top:8px;">Find Best Hospital Routes</button>
                <div id="routeResult"></div>
            </div>
        </div>
    `;

    // Standalone L.popup added via .addTo(map) will NEVER be auto-closed by other popups
    incidentPopup = L.popup({ 
        maxWidth: 290,
        autoPan: false,
        autoClose: false,
        closeOnClick: false
    }).setLatLng([incident.lat, incident.lon]).setContent(html).addTo(map);

    setTimeout(() => {
        makePopupDraggable(incidentPopup);
        bindIncidentPopupEvents();
    }, 60);
}

// ======================================================
// TOP 3 ROUTE CALCULATION (SHORTEST TOTAL DISTANCE)
// ======================================================

function canHandle(hospital, emergency) {
    const capabilities = {
        "Road Accident": hospital.roadAccident,
        "Drowning": hospital.drowning,
        "Stampede": hospital.stampede,
        "Heart Attack": hospital.heartAttack,
        "Heat Stroke": hospital.heatStroke
    };
    return capabilities[emergency] === true;
}

function findBestHospital(emergency, incident, snappedRoad, resultDiv, shouldFitBounds = true) {
    resultDiv.innerHTML = "<p style='font-size:11px; margin-top:6px;'>Calculating shortest available routes...</p>";
    
    const eligible = hospitals.filter(h => canHandle(h, emergency) && h.availableBeds > 0);

    if (!eligible.length) {
        resultDiv.innerHTML = `<p class="error" style="font-size:11px; margin-top:6px; color:#d32f2f;">No capable hospital currently has available beds.</p>`;
        if (routeLayer) map.removeLayer(routeLayer);
        if (incidentPopup) incidentPopup.setContent(document.querySelector('.emergency-popup').outerHTML);
        return;
    }

    const startNode = nodes.get(snappedRoad.nearestNode);
    if (!startNode) return;

    const hospitalBestRoutes = [];

    for (const hospital of eligible) {
        let access = null;

        if (hospital.accessNode && nodes.has(hospital.accessNode)) {
            const n = nodes.get(hospital.accessNode);
            const dist = distanceMetres(hospital.lat, hospital.lon, n.lat, n.lon);
            if (dist <= MAX_CONNECTOR_DIST) access = { node: n, lat: n.lat, lon: n.lon, distance: dist };
        }

        if (!access) {
            const snapped = findNearestLinkPoint(hospital.lat, hospital.lon);
            if (snapped && snapped.distance <= MAX_CONNECTOR_DIST) {
                access = {
                    node: nodes.get(snapped.nearestNode),
                    lat: snapped.lat, lon: snapped.lon, distance: snapped.distance
                };
            }
        }

        if (!access || !access.node) continue;

        const route = shortestPath(startNode.id, access.node.id);
        if (!route) continue;

        const totalDistance = snappedRoad.distance + route.distance + access.distance;

        hospitalBestRoutes.push({
            hospital,
            startPoint: { lat: snappedRoad.lat, lon: snappedRoad.lon },
            accessPoint: { lat: access.lat, lon: access.lon },
            accessNode: access.node,
            route,
            totalDistance
        });
    }

    if (!hospitalBestRoutes.length) {
        resultDiv.innerHTML = `<div class="error" style="font-size:11px; margin-top:6px; color:#d32f2f;">No connected open route found.</div>`;
        if (routeLayer) map.removeLayer(routeLayer);
        return;
    }

    hospitalBestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
    currentTop3Routes = hospitalBestRoutes.slice(0, 3);

    drawTop3Routes(currentTop3Routes, incident, null, shouldFitBounds);

    let html = `
        <div style="margin-top:8px;">
            <div style="font-size:12px; font-weight:bold; color:#087f23;">Top ${currentTop3Routes.length} Destination Hospitals</div>
            <small style="color: #666; font-size:10px;">Click card to isolate route | @ ${ASSUMED_SPEED_KMPH} km/h</small>
            <div style="margin-top: 4px;">
    `;

    currentTop3Routes.forEach((r, idx) => {
        const styleConfig = ROUTE_COLORS[idx];
        const distKm = r.totalDistance / 1000;
        const estTimeMins = ((distKm / ASSUMED_SPEED_KMPH) * 60).toFixed(1);

        html += `
            <div class="best-hospital" id="hospital-card-${idx}" onclick="selectSingleRoute(${idx})">
                <span style="background:${styleConfig.badge}; color:white; padding:2px 5px; border-radius:3px; font-size:9px; font-weight:bold;">
                    ${styleConfig.label}
                </span>
                <span style="font-weight:bold; font-size:11px; color:#333;"> ${r.hospital.name}</span><br>
                <small style="color:#555;">
                    Dist: <b>${distKm.toFixed(2)} km</b> | Time: <b>${estTimeMins} min</b> | Beds: <b>${r.hospital.availableBeds}</b>
                </small>
            </div>
        `;
    });

    html += `
            </div>
            <button class="btn" style="background:#757575; color:#fff; font-size:10px; padding:5px; margin-top:6px;" onclick="resetAllRoutesView()">Show All Routes</button>
        </div>
    `;

    resultDiv.innerHTML = html;

    // Sync updated HTML into incidentPopup memory so closing & reopening preserves results
    const popupWrapper = document.querySelector('.emergency-popup');
    if (popupWrapper && incidentPopup) {
        incidentPopup.setContent(popupWrapper.outerHTML);
        setTimeout(() => {
            makePopupDraggable(incidentPopup);
            bindIncidentPopupEvents();
        }, 30);
    }
}

// ======================================================
// SINGLE ROUTE SELECTION INTERACTION
// ======================================================

function selectSingleRoute(selectedIndex) {
    if (!currentTop3Routes || !currentTop3Routes[selectedIndex]) return;

    currentTop3Routes.forEach((_, idx) => {
        const card = document.getElementById(`hospital-card-${idx}`);
        if (card) {
            if (idx === selectedIndex) {
                card.classList.add("active-route");
            } else {
                card.classList.remove("active-route");
            }
        }
    });

    const selectedRouteObj = currentTop3Routes[selectedIndex];
    drawTop3Routes([selectedRouteObj], currentIncidentPoint, selectedIndex, false);
}

function resetAllRoutesView() {
    if (!currentTop3Routes.length) return;

    currentTop3Routes.forEach((_, idx) => {
        const card = document.getElementById(`hospital-card-${idx}`);
        if (card) card.classList.remove("active-route");
    });

    drawTop3Routes(currentTop3Routes, currentIncidentPoint, null, false);
}

// ======================================================
// INTERACTIVE MAP DRAWING FUNCTIONS
// ======================================================

function handleRoadPolylineClick(e, link) {
    if (isSelectingMapPoint || isBoxBlockMode) return;
    L.DomEvent.stopPropagation(e);

    if (isMultiBlockMode) {
        toggleLinkInQueue(link.id);
        return;
    }

    const blocked = isLinkBlocked(link);
    const nextStatus = blocked ? "OPEN" : "CLOSED";
    const btnColor = blocked ? "#2e7d32" : "#c62828";
    const btnLabel = blocked ? "Reopen Road (Both Directions)" : "Block Road (Both Directions)";
    const pairCount = getBidirectionalLinkIds(link.id).length;

    if (actionPopup) {
        map.removeLayer(actionPopup);
        actionPopup = null;
    }

    actionPopup = L.popup({ autoClose: false, closeOnClick: true })
        .setLatLng(e.latlng)
        .setContent(`
            <div style="font-size:12px; min-width:185px;">
                <b>Road Link ID:</b> ${link.id}<br>
                <b>Length:</b> ${Math.round(link.length)} m (${pairCount === 2 ? "Two-way" : "One-way"})<br>
                <b>Status:</b> <span style="color:${blocked ? '#d32f2f' : '#2e7d32'}; font-weight:bold;">${link.status}</span>
                <button onclick="toggleRoadStatus('${link.id}', '${nextStatus}')" 
                    style="margin-top:8px; width:100%; padding:6px; background:${btnColor}; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
                    ${btnLabel}
                </button>
            </div>
        `)
        .addTo(map);
}

function drawTop3Routes(top3Results, incident, forcedColorIndex = null, shouldFitBounds = true) {
    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.layerGroup();

    const allRoutePoints = [[incident.lat, incident.lon]];

    for (let i = top3Results.length - 1; i >= 0; i--) {
        const result = top3Results[i];
        
        const colorIdx = forcedColorIndex !== null ? forcedColorIndex : i;
        const colorConfig = ROUTE_COLORS[colorIdx] || ROUTE_COLORS[0];

        for (const linkID of result.route.links) {
            const link = linksMap.get(linkID);
            if (!link) continue;
            const coords = getLinkCoordinates(link);
            coords.forEach(pt => allRoutePoints.push(pt));

            const line = L.polyline(coords, {
                color: queuedLinkIds.has(link.id) ? "#ff6f00" : colorConfig.main,
                weight: 7 - (forcedColorIndex !== null ? 0 : i * 1.5),
                opacity: 0.95
            }).addTo(routeLayer);

            line.on("click", (e) => handleRoadPolylineClick(e, link));
        }

        L.polyline([[incident.lat, incident.lon], [result.startPoint.lat, result.startPoint.lon]], {
            color: colorConfig.connector, weight: 3, dashArray: "5,5"
        }).addTo(routeLayer);

        L.polyline([[result.accessPoint.lat, result.accessPoint.lon], [result.hospital.lat, result.hospital.lon]], {
            color: colorConfig.connector, weight: 3, dashArray: "5,5"
        }).addTo(routeLayer);
    }
    
    routeLayer.addTo(map);

    if (shouldFitBounds && allRoutePoints.length > 1) {
        map.fitBounds(L.latLngBounds(allRoutePoints), {
            paddingTopLeft: [300, 120],
            paddingBottomRight: [40, 40],
            maxZoom: 16
        });
    }
}

function drawRoads() {
    roadLayer.clearLayers();
    let closedCount = 0;

    for (const link of links) {
        const coords = getLinkCoordinates(link);
        if (coords.length < 2) continue;
        
        const blocked = isLinkBlocked(link);
        const queued = queuedLinkIds.has(link.id);
        if (blocked) closedCount++;

        let strokeColor = "#555";
        let strokeWeight = 2.2;
        let strokeOpacity = 0.5;

        if (queued) {
            strokeColor = "#ff6f00";
            strokeWeight = 4.5;
            strokeOpacity = 0.95;
        } else if (blocked) {
            strokeColor = "#d32f2f";
            strokeWeight = 3.8;
            strokeOpacity = 0.9;
        }

        const poly = L.polyline(coords, {
            color: strokeColor,
            weight: strokeWeight,
            opacity: strokeOpacity,
            interactive: true
        });

        poly.on("click", (e) => handleRoadPolylineClick(e, link));
        poly.addTo(roadLayer);
    }

    const closedEl = document.getElementById("closedLinkCount");
    if (closedEl) closedEl.textContent = closedCount.toLocaleString();
}

function drawNodes() {
    nodeLayer.clearLayers();
    for (const node of nodes.values()) {
        L.circleMarker([node.lat, node.lon], { radius: 2, color: "#222" }).addTo(nodeLayer);
    }
}

function drawHospitals() {
    hospitalLayer.clearLayers();
    for (const h of hospitals) {
        const marker = L.circleMarker([h.lat, h.lon], {
            radius: 6,
            color: "#a00000",
            fillColor: h.availableBeds > 0 ? "#f44336" : "#757575",
            fillOpacity: 0.9
        });

        marker.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            if (actionPopup) {
                map.removeLayer(actionPopup);
                actionPopup = null;
            }
            actionPopup = L.popup({ autoClose: false, closeOnClick: true })
                .setLatLng([h.lat, h.lon])
                .setContent(`
                    <div style="font-size:12px; min-width:190px;">
                        <b>${h.name}</b><br>
                        <div style="margin:6px 0;">
                            Available Beds: 
                            <input id="bed-input-${h.id}" type="number" min="0" value="${h.availableBeds}" 
                                style="width:55px; padding:2px 4px; font-weight:bold;">
                        </div>
                        <button onclick="saveBedsFromPopup('${h.id}')" 
                            style="width:100%; padding:5px; background:#1565c0; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
                            Save Bed Count
                        </button>
                    </div>
                `)
                .addTo(map);
        });

        marker.addTo(hospitalLayer);
    }
}

function createLayerControl() {
    L.control.layers(
        { "OpenStreetMap": osm },
        {
            "Road links": roadLayer,
            "Network nodes": nodeLayer,
            "Hospitals": hospitalLayer
        },
        { collapsed: false }
    ).addTo(map);
}

function fitMap() {
    const allPoints = Array.from(nodes.values()).map(n => [n.lat, n.lon]);
    if (allPoints.length) map.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] });
}

function statusMessage(msg) {
    const el = document.getElementById("loadingText");
    const container = document.getElementById("loading");
    if (el && container) { 
        container.style.display = "flex"; 
        el.textContent = msg; 
    }
}

loadNetworkFromDB();