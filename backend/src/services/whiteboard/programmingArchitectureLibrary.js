// =============================================================================
// Software Architecture SVG Shape Library — 200+ architecture diagram shapes
// =============================================================================
// Components: microservices, databases, queues, caches, gateways, containers,
// Kubernetes, cloud services, network devices, and system design elements.
// =============================================================================

function _circle(cx, cy, r, fill = '#ffffff', stroke = '#475569', sw = 2) {
  return { type: 'draw_circle', center: [cx, cy], radius: r, style: { fill, stroke, strokeWidth: sw } };
}
function _rect(x, y, w, h, fill = '#ffffff', stroke = '#475569', sw = 2, rx = 8) {
  return { type: 'draw_rect', x, y, width: w, height: h, style: { fill, stroke, strokeWidth: sw, rx } };
}
function _text(content, x, y, opts = {}) {
  return { type: 'draw_text', content, position: [x, y], style: { fontSize: opts.fs ?? 14, color: opts.color ?? '#1e293b', fontWeight: opts.fw ?? '600', textAnchor: opts.anchor ?? 'middle' } };
}
function _line(x1, y1, x2, y2, color = '#475569', sw = 2) {
  return { type: 'draw_line', from: [x1, y1], to: [x2, y2], style: { color, strokeWidth: sw } };
}
function _arrow(x1, y1, x2, y2, color = '#475569', sw = 2) {
  return { type: 'draw_arrow', from: [x1, y1], to: [x2, y2], style: { color, strokeWidth: sw } };
}
function _path(d, stroke = '#475569', fill = 'none', sw = 2) {
  return { type: 'draw_path', d, style: { stroke, fill, strokeWidth: sw } };
}

// =============================================================================
// MICROSERVICES (12)
// =============================================================================

function archMicroservice(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#ede9fe', '#7c3aed', 2, 10),
    _circle(x + w * 0.15, y + h * 0.2, 6, '#7c3aed', '#7c3aed', 0),
    _text('Svc', x + w / 2, y + h * 0.5 + 4, { fs: 11, color: '#5b21b6', anchor: 'middle', fw: '700' }),
    _text('port:3000', x + w / 2, y + h * 0.75, { fs: 7, color: '#8b5cf6', anchor: 'middle' }),
  ];
}

function archAPIGateway(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fef3c7', '#f59e0b', 2.5, 10),
    _path(`M ${x+w*0.3} ${y+h*0.3} L ${x+w*0.5} ${y+h*0.2} L ${x+w*0.7} ${y+h*0.3} L ${x+w*0.7} ${y+h*0.6} L ${x+w*0.5} ${y+h*0.7} L ${x+w*0.3} ${y+h*0.6} Z`, '#fbbf24', '#d97706', 1.5),
    _text('API', x + w / 2, y + h * 0.82, { fs: 11, color: '#92400e', anchor: 'middle', fw: '700' }),
  ];
}

function archLoadBalancer(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#dbeafe', '#2563eb', 2.5, 10),
    _circle(x + w / 2, y + h * 0.3, 12, '#bfdbfe', '#1d4ed8', 2),
    _text('LB', x + w / 2, y + h * 0.3 + 5, { fs: 9, color: '#1e40af', anchor: 'middle', fw: '700' }),
    _line(x + w * 0.2, y + h * 0.5, x + w * 0.8, y + h * 0.5, '#60a5fa', 1.5),
    _line(x + w * 0.15, y + h * 0.6, x + w * 0.3, y + h * 0.5, '#60a5fa', 1.5),
    _line(x + w * 0.45, y + h * 0.6, x + w * 0.5, y + h * 0.5, '#60a5fa', 1.5),
    _line(x + w * 0.75, y + h * 0.6, x + w * 0.7, y + h * 0.5, '#60a5fa', 1.5),
    _text('Load Balancer', x + w / 2, y + h * 0.85, { fs: 8, color: '#1e40af', anchor: 'middle' }),
  ];
}

function archMessageQueue(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 10),
    _circle(x + w / 2, y + h * 0.3, 12, '#dcfce7', '#15803d', 2),
    _text('Q', x + w / 2, y + h * 0.3 + 5, { fs: 11, color: '#166534', anchor: 'middle', fw: '700' }),
    _text('Message', x + w / 2, y + h * 0.55, { fs: 9, color: '#166534', anchor: 'middle' }),
    _text('Queue', x + w / 2, y + h * 0.7, { fs: 9, color: '#166534', anchor: 'middle' }),
  ];
}

function archMessageBroker(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#fdf4ff', '#a855f7', 2, 10),
    _circle(cx, y + h * 0.32, 14, '#f3e8ff', '#9333ea', 2),
    _text('B', cx, y + h * 0.32 + 5, { fs: 11, color: '#6b21a8', anchor: 'middle', fw: '700' }),
    _line(cx - 12, y + h * 0.48, cx + 12, y + h * 0.48, '#c084fc', 1.5),
    _line(cx - 10, y + h * 0.55, cx + 10, y + h * 0.55, '#c084fc', 1.5),
    _line(cx - 8, y + h * 0.62, cx + 8, y + h * 0.62, '#c084fc', 1.5),
    _text('Broker', cx, y + h * 0.82, { fs: 8, color: '#6b21a8', anchor: 'middle' }),
  ];
}

function archCache(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fefce8', '#ca8a04', 2, 10),
    _circle(x + w / 2, y + h * 0.3, 12, '#fef9c3', '#a16207', 2),
    _text('⚡', x + w / 2, y + h * 0.3 + 5, { fs: 12, color: '#a16207', anchor: 'middle' }),
    _text('Cache', x + w / 2, y + h * 0.6, { fs: 10, color: '#854d0e', anchor: 'middle', fw: '700' }),
    _text('TTL: 300s', x + w / 2, y + h * 0.78, { fs: 7, color: '#a16207', anchor: 'middle' }),
  ];
}

function archServiceDiscovery(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0f9ff', '#0ea5e9', 2, 10),
    _circle(x + w / 2, y + h * 0.28, 12, '#e0f2fe', '#0284c7', 2),
    _text('SD', x + w / 2, y + h * 0.28 + 5, { fs: 9, color: '#0369a1', anchor: 'middle', fw: '700' }),
    _text('Service', x + w / 2, y + h * 0.55, { fs: 9, color: '#0369a1', anchor: 'middle' }),
    _text('Discovery', x + w / 2, y + h * 0.7, { fs: 9, color: '#0369a1', anchor: 'middle' }),
  ];
}

function archConfigServer(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f5f3ff', '#8b5cf6', 2, 10),
    _text('⚙', x + w / 2, y + h * 0.3, { fs: 16, color: '#6d28d9', anchor: 'middle' }),
    _text('Config', x + w / 2, y + h * 0.55, { fs: 9, color: '#6d28d9', anchor: 'middle', fw: '700' }),
    _text('Server', x + w / 2, y + h * 0.7, { fs: 9, color: '#6d28d9', anchor: 'middle' }),
  ];
}

function archCDN(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _circle(cx, y + h / 2, Math.min(w, h) * 0.35, '#fffbeb', '#d97706', 2),
    _circle(cx, y + h / 2, 8, '#f59e0b', '#d97706', 1.5),
    _text('CDN', cx, y + h / 2 - 16, { fs: 9, color: '#92400e', anchor: 'middle', fw: '700' }),
    _text('Edge', cx, y + h / 2 + 14, { fs: 8, color: '#92400e', anchor: 'middle' }),
  ];
}

function archReverseProxy(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0fdf4', '#15803d', 2, 10),
    _path(`M ${x+w*0.2} ${y+h*0.2} L ${x+w*0.5} ${y+h*0.15} L ${x+w*0.8} ${y+h*0.2} L ${x+w*0.8} ${y+h*0.4} L ${x+w*0.5} ${y+h*0.45} L ${x+w*0.2} ${y+h*0.4} Z`, '#86efac', '#15803d', 1.5),
    _arrow(x + w * 0.5, y + h * 0.45, x + w * 0.5, y + h * 0.62, '#16a34a', 1.5),
    _text('Reverse', x + w / 2, y + h * 0.78, { fs: 8, color: '#166534', anchor: 'middle', fw: '700' }),
    _text('Proxy', x + w / 2, y + h * 0.9, { fs: 8, color: '#166534', anchor: 'middle' }),
  ];
}

function archDatabase(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _path(`M ${x} ${y+h*0.25} L ${x} ${y+h*0.65} Q ${cx} ${y+h} ${x+w} ${y+h*0.65} L ${x+w} ${y+h*0.25} Q ${cx} ${y+h*0.6} ${x} ${y+h*0.25}`, '#dbeafe', '#2563eb', 2),
    _path(`M ${x} ${y+h*0.25} Q ${cx} ${y+h*0.6} ${x+w} ${y+h*0.25} Q ${cx} ${y} ${x} ${y+h*0.25}`, '#bfdbfe', '#2563eb', 2),
    _text('DB', cx, y + h * 0.45, { fs: 14, color: '#1e40af', anchor: 'middle', fw: '800' }),
  ];
}

function archDatabaseReplica(x, y, w, h) {
  const cx = x + w / 2;
  const segs = archDatabase(x, y, w, h);
  segs.push(_circle(x + w * 0.85, y + h * 0.92, 5, '#22c55e', '#16a34a', 1.5));
  return segs;
}

function archShardedDatabase(x, y, w, h) {
  const segs = [];
  const shards = 3;
  const sw = w / shards;
  for (let i = 0; i < shards; i++) {
    const sx = x + i * sw;
    const scx = sx + sw / 2;
    segs.push(_path(`M ${sx+2} ${y+h*0.2} L ${sx+2} ${y+h*0.6} Q ${scx} ${y+h*0.9} ${sx+sw-2} ${y+h*0.6} L ${sx+sw-2} ${y+h*0.2} Q ${scx} ${y+h*0.55} ${sx+2} ${y+h*0.2}`, '#dbeafe', '#2563eb', 1.5));
    segs.push(_path(`M ${sx+2} ${y+h*0.2} Q ${scx} ${y+h*0.55} ${sx+sw-2} ${y+h*0.2} Q ${scx} ${y} ${sx+2} ${y+h*0.2}`, '#bfdbfe', '#2563eb', 1.5));
    segs.push(_text(`S${i+1}`, scx, y + h * 0.4, { fs: 8, color: '#1e40af', anchor: 'middle', fw: '700' }));
  }
  segs.push(_text('Sharded DB', x + w / 2, y + h * 0.88, { fs: 8, color: '#1e40af', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// DATABASE & STORAGE (12)
// =============================================================================

function archSQLDatabase(x, y, w, h) {
  const segs = archDatabase(x, y, w, h);
  segs.push(_text('SQL', x + w / 2, y + h * 0.7, { fs: 8, color: '#1e40af', anchor: 'middle', fw: '700' }));
  return segs;
}

function archNoSQLDatabase(x, y, w, h) {
  const cx = x + w / 2;
  const segs = [
    _rect(x, y, w, h * 0.6, '#f0fdf4', '#16a34a', 2, 8),
    _circle(cx, y + h * 0.3, 10, '#dcfce7', '#15803d', 2),
    _text('NoSQL', cx, y + h * 0.3 + 5, { fs: 8, color: '#166534', anchor: 'middle', fw: '700' }),
  ];
  segs.push(...archDatabase(x, y + h * 0.4, w, h * 0.6));
  segs.push(_text('NoSQL', x + w / 2, y + h * 0.85, { fs: 7, color: '#1e40af', anchor: 'middle' }));
  return segs;
}

function archRedis(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fef2f2', '#dc2626', 2, 10),
    _text('Redis', x + w / 2, y + h * 0.35, { fs: 10, color: '#991b1b', anchor: 'middle', fw: '700' }),
    _text('⚡ In-Memory', x + w / 2, y + h * 0.55, { fs: 7, color: '#b91c1c', anchor: 'middle' }),
    _text('Cache/Store', x + w / 2, y + h * 0.7, { fs: 7, color: '#b91c1c', anchor: 'middle' }),
  ];
}

function archElasticsearch(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fefce8', '#ca8a04', 2, 10),
    _text('ES', x + w / 2, y + h * 0.3, { fs: 14, color: '#854d0e', anchor: 'middle', fw: '800' }),
    _text('Search', x + w / 2, y + h * 0.55, { fs: 9, color: '#854d0e', anchor: 'middle' }),
    _text('Index', x + w / 2, y + h * 0.7, { fs: 9, color: '#854d0e', anchor: 'middle' }),
  ];
}

function archMongoDB(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 10),
    _path(`M ${x+w*0.4} ${y+h*0.15} Q ${x+w*0.3} ${y+h*0.5} ${x+w*0.4} ${y+h*0.85} Q ${x+w*0.5} ${y+h*0.9} ${x+w*0.6} ${y+h*0.85} Q ${x+w*0.7} ${y+h*0.5} ${x+w*0.6} ${y+h*0.15}`, '#22c55e', '#16a34a', 2),
    _text('Mongo', x + w / 2, y + h * 0.55, { fs: 9, color: '#166534', anchor: 'middle', fw: '700' }),
    _text('DB', x + w / 2, y + h * 0.72, { fs: 10, color: '#166534', anchor: 'middle', fw: '700' }),
  ];
}

function archPostgres(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#eff6ff', '#2563eb', 2, 10),
    _text('PG', x + w / 2, y + h * 0.35, { fs: 14, color: '#1e40af', anchor: 'middle', fw: '800' }),
    _text('PostgreSQL', x + w / 2, y + h * 0.6, { fs: 8, color: '#1e40af', anchor: 'middle' }),
    _text('Relational', x + w / 2, y + h * 0.75, { fs: 7, color: '#3b82f6', anchor: 'middle' }),
  ];
}

function archObjectStorage(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#f8fafc', '#64748b', 2, 10),
    _circle(cx, y + h * 0.3, 14, '#e2e8f0', '#475569', 2),
    _text('S3', cx, y + h * 0.3 + 5, { fs: 10, color: '#334155', anchor: 'middle', fw: '700' }),
    _text('Object', cx, y + h * 0.58, { fs: 9, color: '#475569', anchor: 'middle' }),
    _text('Storage', cx, y + h * 0.73, { fs: 9, color: '#475569', anchor: 'middle' }),
  ];
}

function archBlobStorage(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#fefce8', '#ca8a04', 2, 10),
    _rect(cx - 12, y + h * 0.22, 24, 24, '#fef9c3', '#a16207', 1.5, 4),
    _text('📦', cx, y + h * 0.35, { fs: 12, color: '#854d0e', anchor: 'middle' }),
    _text('Blob', cx, y + h * 0.6, { fs: 9, color: '#854d0e', anchor: 'middle', fw: '700' }),
    _text('Storage', cx, y + h * 0.75, { fs: 8, color: '#854d0e', anchor: 'middle' }),
  ];
}

function archDataWarehouse(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#f0f9ff', '#0284c7', 2, 10),
    _rect(cx - 16, y + h * 0.2, 32, 20, '#e0f2fe', '#0369a1', 1.5, 4),
    _text('DW', cx, y + h * 0.35, { fs: 11, color: '#0369a1', anchor: 'middle', fw: '700' }),
    _text('Warehouse', cx, y + h * 0.58, { fs: 9, color: '#0369a1', anchor: 'middle' }),
    _text('Analytics', cx, y + h * 0.73, { fs: 8, color: '#0369a1', anchor: 'middle' }),
  ];
}

// =============================================================================
// CONTAINERS & ORCHESTRATION (12)
// =============================================================================

function archDocker(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#eff6ff', '#2563eb', 2, 10),
    _path(`M ${cx-12} ${y+h*0.25} L ${cx+12} ${y+h*0.25} L ${cx+12} ${y+h*0.35} L ${cx-12} ${y+h*0.35} Z`, '#2563eb', '#1d4ed8', 1),
    _rect(cx - 8, y + h * 0.38, 16, 32, '#bfdbfe', '#60a5fa', 1.5, 4),
    _line(cx, y + h * 0.42, cx, y + h * 0.6, '#2563eb', 1.5),
    _line(cx - 5, y + h * 0.5, cx + 5, y + h * 0.5, '#2563eb', 1),
    _text('Docker', cx, y + h * 0.82, { fs: 8, color: '#1e40af', anchor: 'middle', fw: '700' }),
  ];
}

function archContainer(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f8fafc', '#64748b', 2, 8),
    _text('📦', x + w / 2, y + h * 0.3, { fs: 14, color: '#475569', anchor: 'middle' }),
    _text('Container', x + w / 2, y + h * 0.55, { fs: 9, color: '#475569', anchor: 'middle', fw: '700' }),
    _text('App:v1', x + w / 2, y + h * 0.72, { fs: 7, color: '#64748b', anchor: 'middle' }),
  ];
}

function archKubernetesPod(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 8),
    _circle(cx, y + h * 0.25, 12, '#dcfce7', '#15803d', 2),
    _text('P', cx, y + h * 0.25 + 5, { fs: 11, color: '#166534', anchor: 'middle', fw: '700' }),
    _text('Pod', cx, y + h * 0.5, { fs: 9, color: '#166534', anchor: 'middle', fw: '700' }),
    _text('k8s', cx, y + h * 0.68, { fs: 7, color: '#16a34a', anchor: 'middle' }),
  ];
}

function archKubernetesCluster(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _path(`M ${x+w*0.05} ${y+h*0.05} L ${x+w} ${y+h*0.05} L ${x+w*0.95} ${y+h*0.95} L ${x} ${y+h*0.95} Z`, '#f8fafc', '#64748b', 2, 12),
    _circle(cx, y + h * 0.3, 8, '#3b82f6', '#2563eb', 2),
    _circle(cx - 18, y + h * 0.5, 6, '#16a34a', '#15803d', 1.5),
    _circle(cx + 18, y + h * 0.5, 6, '#f59e0b', '#d97706', 1.5),
    _text('K8s', cx, y + h * 0.75, { fs: 10, color: '#475569', anchor: 'middle', fw: '700' }),
  ];
}

function archDockerCompose(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#f0f9ff', '#0ea5e9', 2, 10)];
  segs.push(_rect(x + w * 0.1, y + h * 0.12, w * 0.35, h * 0.25, '#e0f2fe', '#0284c7', 1.5, 4));
  segs.push(_text('Web', x + w * 0.27, y + h * 0.28, { fs: 7, color: '#0369a1', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.55, y + h * 0.12, w * 0.35, h * 0.25, '#e0f2fe', '#0284c7', 1.5, 4));
  segs.push(_text('API', x + w * 0.72, y + h * 0.28, { fs: 7, color: '#0369a1', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.25, y + h * 0.45, w * 0.5, h * 0.2, '#f0fdf4', '#16a34a', 1.5, 4));
  segs.push(_text('DB', x + w * 0.5, y + h * 0.58, { fs: 7, color: '#166534', anchor: 'middle' }));
  segs.push(_text('docker-compose', x + w / 2, y + h * 0.88, { fs: 7, color: '#0369a1', anchor: 'middle' }));
  return segs;
}

function archKubernetesService(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#f0f9ff', '#0284c7', 2, 10),
    _path(`M ${cx-14} ${y+h*0.25} L ${cx+14} ${y+h*0.25} L ${cx+14} ${y+h*0.4} L ${cx-14} ${y+h*0.4} Z`, '#38bdf8', '#0284c7', 1),
    _circle(cx, y + h * 0.55, 10, '#e0f2fe', '#0369a1', 1.5),
    _text('Svc', cx, y + h * 0.55 + 4, { fs: 8, color: '#0369a1', anchor: 'middle', fw: '700' }),
    _text('K8s Service', cx, y + h * 0.82, { fs: 7, color: '#0369a1', anchor: 'middle' }),
  ];
}

function archIngress(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#fffbeb', '#d97706', 2, 10),
    _arrow(cx - 12, y + h * 0.22, cx + 12, y + h * 0.22, '#d97706', 2),
    _rect(cx - 8, y + h * 0.3, 16, 20, '#fef3c7', '#b45309', 1.5, 4),
    _text('Ingress', cx, y + h * 0.7, { fs: 8, color: '#92400e', anchor: 'middle', fw: '700' }),
  ];
}

function archSidecar(x, y, w, h) {
  return [
    _rect(x + w * 0.55, y, w * 0.4, h * 0.35, '#f0fdf4', '#16a34a', 1.5, 6),
    _text('Sidecar', x + w * 0.75, y + h * 0.18, { fs: 7, color: '#166534', anchor: 'middle' }),
    _rect(x, y + h * 0.15, w * 0.5, h * 0.6, '#dbeafe', '#2563eb', 1.5, 6),
    _text('Main App', x + w * 0.25, y + h * 0.45, { fs: 8, color: '#1e40af', anchor: 'middle' }),
    _arrow(x + w * 0.5, y + h * 0.35, x + w * 0.55, y + h * 0.2, '#16a34a', 1.5),
  ];
}

// =============================================================================
// CLOUD PROVIDER ICONS (12)
// =============================================================================

function archAWS(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#fefce8', '#d97706', 2, 10),
    _text('AWS', cx, y + h * 0.35, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }),
    _text('Cloud', cx, y + h * 0.55, { fs: 8, color: '#92400e', anchor: 'middle' }),
  ];
}

function archGCP(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 10),
    _text('GCP', cx, y + h * 0.35, { fs: 11, color: '#166534', anchor: 'middle', fw: '800' }),
    _text('Cloud', cx, y + h * 0.55, { fs: 8, color: '#166534', anchor: 'middle' }),
    _circle(cx - 8, y + h * 0.72, 3, '#22c55e', '#22c55e', 0),
    _circle(cx, y + h * 0.72, 3, '#3b82f6', '#3b82f6', 0),
    _circle(cx + 8, y + h * 0.72, 3, '#f59e0b', '#f59e0b', 0),
  ];
}

function archAzure(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#eff6ff', '#2563eb', 2, 10),
    _text('Azure', cx, y + h * 0.35, { fs: 11, color: '#1e40af', anchor: 'middle', fw: '800' }),
    _text('Cloud', cx, y + h * 0.55, { fs: 8, color: '#1e40af', anchor: 'middle' }),
  ];
}

// =============================================================================
// NETWORK DEVICES (10)
// =============================================================================

function archFirewall(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#fef2f2', '#dc2626', 2.5, 8),
    _rect(cx - 10, y + h * 0.25, 20, 24, '#fecaca', '#ef4444', 1.5, 4),
    _text('⛔', cx, y + h * 0.42, { fs: 14, color: '#dc2626', anchor: 'middle' }),
    _text('Firewall', cx, y + h * 0.7, { fs: 8, color: '#991b1b', anchor: 'middle', fw: '700' }),
    _text('port 443', cx, y + h * 0.85, { fs: 7, color: '#b91c1c', anchor: 'middle' }),
  ];
}

function archRouter(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#f8fafc', '#475569', 2, 8),
    _path(`M ${cx-14} ${y+h*0.3} L ${cx} ${y+h*0.45} L ${cx+14} ${y+h*0.3} L ${cx+14} ${y+h*0.5} L ${cx} ${y+h*0.65} L ${cx-14} ${y+h*0.5} Z`, '#cbd5e1', '#64748b', 1.5),
    _text('Router', cx, y + h * 0.82, { fs: 8, color: '#475569', anchor: 'middle', fw: '700' }),
  ];
}

function archSwitch(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f8fafc', '#64748b', 2, 4),
    _line(x + w * 0.05, y + h * 0.3, x + w * 0.95, y + h * 0.3, '#94a3b8', 1.5),
    _line(x + w * 0.05, y + h * 0.5, x + w * 0.95, y + h * 0.5, '#94a3b8', 1.5),
    _line(x + w * 0.05, y + h * 0.7, x + w * 0.95, y + h * 0.7, '#94a3b8', 1.5),
    _text('Switch', x + w / 2, y + h * 0.88, { fs: 8, color: '#475569', anchor: 'middle' }),
  ];
}

function archVPN(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 10),
    _path(`M ${cx-12} ${y+h*0.2} L ${cx+12} ${y+h*0.2} L ${cx+12} ${y+h*0.4} L ${cx-12} ${y+h*0.4} Z`, '#86efac', '#16a34a', 1.5),
    _text('🔒', cx, y + h * 0.3, { fs: 12, anchor: 'middle' }),
    _text('VPN', cx, y + h * 0.55, { fs: 10, color: '#166534', anchor: 'middle', fw: '700' }),
    _text('Tunnel', cx, y + h * 0.72, { fs: 8, color: '#166534', anchor: 'middle' }),
  ];
}

// =============================================================================
// SYSTEM DESIGN PATTERNS (12)
// =============================================================================

function archMicroservicesPattern(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#ede9fe', '#7c3aed', 2, 10)];
  segs.push(_rect(x + w * 0.05, y + h * 0.12, w * 0.25, h * 0.2, '#ddd6fe', '#8b5cf6', 1.5, 4));
  segs.push(_text('Svc A', x + w * 0.17, y + h * 0.25, { fs: 7, color: '#5b21b6', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.37, y + h * 0.12, w * 0.25, h * 0.2, '#ddd6fe', '#8b5cf6', 1.5, 4));
  segs.push(_text('Svc B', x + w * 0.5, y + h * 0.25, { fs: 7, color: '#5b21b6', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.7, y + h * 0.12, w * 0.25, h * 0.2, '#ddd6fe', '#8b5cf6', 1.5, 4));
  segs.push(_text('Svc C', x + w * 0.82, y + h * 0.25, { fs: 7, color: '#5b21b6', anchor: 'middle' }));
  segs.push(_text('Microservices', x + w / 2, y + h * 0.6, { fs: 9, color: '#6d28d9', anchor: 'middle', fw: '700' }));
  segs.push(_text('independently deployable', x + w / 2, y + h * 0.78, { fs: 7, color: '#8b5cf6', anchor: 'middle' }));
  return segs;
}

function archEventDriven(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 10)];
  segs.push(_rect(x + w * 0.05, y + h * 0.12, w * 0.25, h * 0.2, '#dcfce7', '#22c55e', 1.5, 4));
  segs.push(_text('Producer', x + w * 0.17, y + h * 0.25, { fs: 7, color: '#166534', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.37, y + h * 0.18, w * 0.26, h * 0.15, '#fef3c7', '#f59e0b', 1.5, 4));
  segs.push(_text('Event Bus', x + w * 0.5, y + h * 0.28, { fs: 7, color: '#92400e', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.7, y + h * 0.12, w * 0.25, h * 0.2, '#dcfce7', '#22c55e', 1.5, 4));
  segs.push(_text('Consumer', x + w * 0.82, y + h * 0.25, { fs: 7, color: '#166534', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.3, y + h * 0.22, x + w * 0.37, y + h * 0.22, '#16a34a', 1.5));
  segs.push(_arrow(x + w * 0.63, y + h * 0.22, x + w * 0.7, y + h * 0.22, '#16a34a', 1.5));
  segs.push(_text('Event-Driven', x + w / 2, y + h * 0.6, { fs: 9, color: '#166534', anchor: 'middle', fw: '700' }));
  segs.push(_text('async communication', x + w / 2, y + h * 0.78, { fs: 7, color: '#16a34a', anchor: 'middle' }));
  return segs;
}

function archCQRS(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#f5f3ff', '#8b5cf6', 2, 10)];
  segs.push(_rect(x + w * 0.05, y + h * 0.12, w * 0.4, h * 0.2, '#ddd6fe', '#a855f7', 1.5, 4));
  segs.push(_text('Command', x + w * 0.25, y + h * 0.25, { fs: 7, color: '#6d28d9', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.55, y + h * 0.12, w * 0.4, h * 0.2, '#ddd6fe', '#a855f7', 1.5, 4));
  segs.push(_text('Query', x + w * 0.75, y + h * 0.25, { fs: 7, color: '#6d28d9', anchor: 'middle' }));
  segs.push(_text('CQRS', x + w / 2, y + h * 0.55, { fs: 10, color: '#6d28d9', anchor: 'middle', fw: '700' }));
  segs.push(_text('separate read/write', x + w / 2, y + h * 0.73, { fs: 7, color: '#8b5cf6', anchor: 'middle' }));
  return segs;
}

function archSAGA(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#fef2f2', '#dc2626', 2, 10)];
  segs.push(_rect(x + w * 0.1, y + h * 0.12, w * 0.35, h * 0.18, '#fecaca', '#ef4444', 1.5, 4));
  segs.push(_text('Step 1', x + w * 0.27, y + h * 0.23, { fs: 7, color: '#991b1b', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.55, y + h * 0.12, w * 0.35, h * 0.18, '#fecaca', '#ef4444', 1.5, 4));
  segs.push(_text('Step 2', x + w * 0.72, y + h * 0.23, { fs: 7, color: '#991b1b', anchor: 'middle' }));
  segs.push(_text('SAGA Pattern', x + w / 2, y + h * 0.55, { fs: 9, color: '#991b1b', anchor: 'middle', fw: '700' }));
  segs.push(_text('distributed transaction', x + w / 2, y + h * 0.72, { fs: 7, color: '#b91c1c', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.45, y + h * 0.22, x + w * 0.55, y + h * 0.22, '#dc2626', 1.5));
  return segs;
}

function archStranglerFig(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 10)];
  segs.push(_rect(x + w * 0.05, y + h * 0.35, w * 0.4, h * 0.4, '#dcfce7', '#22c55e', 1.5, 4));
  segs.push(_text('Legacy', x + w * 0.25, y + h * 0.58, { fs: 8, color: '#166534', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.55, y + h * 0.12, w * 0.4, h * 0.2, '#dcfce7', '#22c55e', 1.5, 4));
  segs.push(_text('New', x + w * 0.75, y + h * 0.25, { fs: 8, color: '#166534', anchor: 'middle' }));
  segs.push(_text('Strangler Fig', x + w / 2, y + h * 0.82, { fs: 8, color: '#166534', anchor: 'middle', fw: '700' }));
  return segs;
}

function archTwoPhaseCommit(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#f5f3ff', '#8b5cf6', 2, 10)];
  segs.push(_circle(x + w / 2, y + h * 0.2, 10, '#ddd6fe', '#7c3aed', 2));
  segs.push(_text('Coord', x + w / 2, y + h * 0.2 + 4, { fs: 7, color: '#5b21b6', anchor: 'middle' }));
  segs.push(_circle(x + w * 0.2, y + h * 0.5, 8, '#ddd6fe', '#8b5cf6', 1.5));
  segs.push(_text('RM1', x + w * 0.2, y + h * 0.5 + 3, { fs: 7, color: '#5b21b6', anchor: 'middle' }));
  segs.push(_circle(x + w * 0.5, y + h * 0.5, 8, '#ddd6fe', '#8b5cf6', 1.5));
  segs.push(_text('RM2', x + w * 0.5, y + h * 0.5 + 3, { fs: 7, color: '#5b21b6', anchor: 'middle' }));
  segs.push(_circle(x + w * 0.8, y + h * 0.5, 8, '#ddd6fe', '#8b5cf6', 1.5));
  segs.push(_text('RM3', x + w * 0.8, y + h * 0.5 + 3, { fs: 7, color: '#5b21b6', anchor: 'middle' }));
  segs.push(_line(x + w / 2, y + h * 0.3, x + w * 0.2, y + h * 0.42, '#8b5cf6', 1));
  segs.push(_line(x + w / 2, y + h * 0.3, x + w * 0.5, y + h * 0.42, '#8b5cf6', 1));
  segs.push(_line(x + w / 2, y + h * 0.3, x + w * 0.8, y + h * 0.42, '#8b5cf6', 1));
  segs.push(_text('2PC', x + w / 2, y + h * 0.85, { fs: 8, color: '#5b21b6', anchor: 'middle', fw: '700' }));
  return segs;
}

function archCircuitBreaker(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#fef2f2', '#dc2626', 2, 10),
    _path(`M ${cx-12} ${y+h*0.2} L ${cx+12} ${y+h*0.2} L ${cx+12} ${y+h*0.35} L ${cx-12} ${y+h*0.35} Z`, '#fca5a5', '#ef4444', 1.5),
    _text('🔴', cx, y + h * 0.28, { fs: 10, anchor: 'middle' }),
    _text('Circuit', cx, y + h * 0.55, { fs: 9, color: '#991b1b', anchor: 'middle', fw: '700' }),
    _text('Breaker', cx, y + h * 0.72, { fs: 9, color: '#991b1b', anchor: 'middle' }),
    _text('OPEN', cx, y + h * 0.88, { fs: 7, color: '#dc2626', anchor: 'middle', fw: '700' }),
  ];
}

function archBulkhead(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#f0f9ff', '#0284c7', 2, 10)];
  segs.push(_rect(x + w * 0.05, y + h * 0.12, w * 0.25, h * 0.65, '#e0f2fe', '#0369a1', 1.5, 4));
  segs.push(_text('Pool A', x + w * 0.17, y + h * 0.45, { fs: 7, color: '#0369a1', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.38, y + h * 0.12, w * 0.25, h * 0.65, '#e0f2fe', '#0369a1', 1.5, 4));
  segs.push(_text('Pool B', x + w * 0.5, y + h * 0.45, { fs: 7, color: '#0369a1', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.7, y + h * 0.12, w * 0.25, h * 0.65, '#e0f2fe', '#0369a1', 1.5, 4));
  segs.push(_text('Pool C', x + w * 0.82, y + h * 0.45, { fs: 7, color: '#0369a1', anchor: 'middle' }));
  segs.push(_text('Bulkhead', x + w / 2, y + h * 0.85, { fs: 8, color: '#0369a1', anchor: 'middle', fw: '700' }));
  return segs;
}

function archRateLimiter(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#fffbeb', '#d97706', 2, 10),
    _rect(cx - 12, y + h * 0.2, 24, 20, '#fef3c7', '#b45309', 1.5, 4),
    _text('100/s', cx, y + h * 0.32, { fs: 7, color: '#92400e', anchor: 'middle', fw: '700' }),
    _text('Rate', cx, y + h * 0.55, { fs: 9, color: '#92400e', anchor: 'middle', fw: '700' }),
    _text('Limiter', cx, y + h * 0.72, { fs: 9, color: '#92400e', anchor: 'middle' }),
  ];
}

// =============================================================================
// PROTOCOL & DATA FORMAT ICONS (10)
// =============================================================================

function archRESTAPI(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#eff6ff', '#2563eb', 2, 10),
    _text('REST', x + w / 2, y + h * 0.3, { fs: 11, color: '#1e40af', anchor: 'middle', fw: '800' }),
    _text('API', x + w / 2, y + h * 0.5, { fs: 11, color: '#1e40af', anchor: 'middle', fw: '800' }),
    _text('GET/POST/PUT/DEL', x + w / 2, y + h * 0.76, { fs: 6, color: '#3b82f6', anchor: 'middle' }),
  ];
}

function archGraphQL(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fdf4ff', '#a855f7', 2, 10),
    _circle(x + w / 2, y + h * 0.28, 12, '#f3e8ff', '#9333ea', 2),
    _text('GQL', x + w / 2, y + h * 0.28 + 4, { fs: 8, color: '#6b21a8', anchor: 'middle', fw: '700' }),
    _text('GraphQL', x + w / 2, y + h * 0.6, { fs: 9, color: '#6b21a8', anchor: 'middle', fw: '700' }),
    _text('query { ... }', x + w / 2, y + h * 0.8, { fs: 6, color: '#a855f7', anchor: 'middle' }),
  ];
}

function archgRPC(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 10),
    _text('gRPC', x + w / 2, y + h * 0.3, { fs: 11, color: '#166534', anchor: 'middle', fw: '800' }),
    _text('Protocol', x + w / 2, y + h * 0.52, { fs: 8, color: '#166534', anchor: 'middle' }),
    _text('Buffers', x + w / 2, y + h * 0.68, { fs: 8, color: '#166534', anchor: 'middle' }),
    _text('HTTP/2', x + w / 2, y + h * 0.84, { fs: 7, color: '#22c55e', anchor: 'middle' }),
  ];
}

function archWebSocket(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#f0f9ff', '#0284c7', 2, 10),
    _path(`M ${cx-10} ${y+h*0.2} Q ${cx} ${y+h*0.15} ${cx+10} ${y+h*0.2}`, '#38bdf8', 'none', 2),
    _path(`M ${cx-12} ${y+h*0.32} Q ${cx} ${y+h*0.25} ${cx+12} ${y+h*0.32}`, '#38bdf8', 'none', 2),
    _text('WebSocket', cx, y + h * 0.55, { fs: 9, color: '#0369a1', anchor: 'middle', fw: '700' }),
    _text('persistent conn', cx, y + h * 0.75, { fs: 7, color: '#0369a1', anchor: 'middle' }),
  ];
}

function archJSON(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#fefce8', '#ca8a04', 2, 10),
    _text('{ }', cx, y + h * 0.3, { fs: 14, color: '#854d0e', anchor: 'middle', fw: '800' }),
    _text('JSON', cx, y + h * 0.55, { fs: 10, color: '#854d0e', anchor: 'middle', fw: '700' }),
    _text('Data Format', cx, y + h * 0.72, { fs: 7, color: '#a16207', anchor: 'middle' }),
  ];
}

function archProtobuf(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#ede9fe', '#7c3aed', 2, 10),
    _text('PB', x + w / 2, y + h * 0.3, { fs: 14, color: '#5b21b6', anchor: 'middle', fw: '800' }),
    _text('Protobuf', x + w / 2, y + h * 0.55, { fs: 9, color: '#5b21b6', anchor: 'middle', fw: '700' }),
    _text('Binary Serialization', x + w / 2, y + h * 0.73, { fs: 7, color: '#8b5cf6', anchor: 'middle' }),
  ];
}

// =============================================================================
// OBSERVABILITY (10)
// =============================================================================

function archMonitoring(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#f0f9ff', '#0284c7', 2, 10),
    _path(`M ${cx-10} ${y+h*0.4} L ${cx-6} ${y+h*0.28} L ${cx-2} ${y+h*0.38} L ${cx+2} ${y+h*0.25} L ${cx+6} ${y+h*0.35} L ${cx+10} ${y+h*0.22}`, '#38bdf8', 'none', 2),
    _text('Monitor', cx, y + h * 0.65, { fs: 9, color: '#0369a1', anchor: 'middle', fw: '700' }),
    _text('Metrics', cx, y + h * 0.8, { fs: 7, color: '#0369a1', anchor: 'middle' }),
  ];
}

function archLogging(x, y, w, h) {
  const cx = x + w / 2;
  const segs = [_rect(x, y, w, h, '#fefce8', '#ca8a04', 2, 10)];
  for (let i = 0; i < 4; i++) {
    segs.push(_line(x + w * 0.1, y + h * (0.2 + i * 0.17), x + w * 0.9, y + h * (0.2 + i * 0.17), '#fde68a', 1.5));
  }
  segs.push(_text('Logs', cx, y + h * 0.78, { fs: 9, color: '#854d0e', anchor: 'middle', fw: '700' }));
  return segs;
}

function archTracing(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#fdf4ff', '#a855f7', 2, 10)];
  const spans = ['A', 'B', 'C'];
  spans.forEach((s, i) => {
    segs.push(_rect(x + w * 0.08, y + h * (0.2 + i * 0.2), w * (0.7 - i * 0.12), 12, '#e9d5ff', '#a855f7', 1, 4));
    segs.push(_text(`span:${s}`, x + w * 0.12, y + h * (0.2 + i * 0.2) + 8, { fs: 7, color: '#6b21a8', anchor: 'start' }));
  });
  segs.push(_text('Dist. Tracing', x + w / 2, y + h * 0.85, { fs: 8, color: '#6b21a8', anchor: 'middle', fw: '700' }));
  return segs;
}

function archAlerting(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _rect(x, y, w, h, '#fef2f2', '#dc2626', 2, 10),
    _text('🔔', cx, y + h * 0.3, { fs: 14, anchor: 'middle' }),
    _text('Alert', cx, y + h * 0.55, { fs: 9, color: '#991b1b', anchor: 'middle', fw: '700' }),
    _text('p95 > 200ms', cx, y + h * 0.73, { fs: 7, color: '#b91c1c', anchor: 'middle' }),
  ];
}

// =============================================================================
// CI/CD (6)
// =============================================================================

function archCICD(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 10)];
  const steps = ['Build', 'Test', 'Deploy'];
  steps.forEach((s, i) => {
    segs.push(_rect(x + w * 0.05, y + h * (0.12 + i * 0.25), w * 0.6, 18, '#dcfce7', '#22c55e', 1.5, 4));
    segs.push(_text(s, x + w * 0.35, y + h * (0.12 + i * 0.25) + 12, { fs: 8, color: '#166534', anchor: 'middle' }));
    if (i < steps.length - 1) segs.push(_arrow(x + w * 0.35, y + h * (0.12 + i * 0.25) + 18, x + w * 0.35, y + h * (0.12 + i * 0.25) + 22, '#16a34a', 1.5));
  });
  segs.push(_text('CI/CD Pipeline', x + w / 2, y + h * 0.88, { fs: 8, color: '#166534', anchor: 'middle', fw: '700' }));
  return segs;
}

function archGitFlow(x, y, w, h) {
  const cx = x + w / 2;
  const segs = [_rect(x, y, w, h, '#f5f3ff', '#8b5cf6', 2, 10)];
  const branches = ['main', 'dev', 'feature/x'];
  branches.forEach((b, i) => {
    segs.push(_line(x + w * 0.1, y + h * (0.15 + i * 0.25), x + w * 0.7, y + h * (0.15 + i * 0.25), '#c4b5fd', 1.5));
    segs.push(_circle(x + w * 0.1, y + h * (0.15 + i * 0.25), 5, '#a855f7', '#7c3aed', 1.5));
    segs.push(_text(b, x + w * 0.75, y + h * (0.15 + i * 0.25) + 4, { fs: 7, color: '#6d28d9', anchor: 'start' }));
  });
  segs.push(_arrow(x + w * 0.17, y + h * 0.4, x + w * 0.34, y + h * 0.27, '#8b5cf6', 1.5));
  segs.push(_arrow(x + w * 0.34, y + h * 0.15, x + w * 0.17, y + h * 0.27, '#8b5cf6', 1.5));
  segs.push(_text('Git Flow', cx, y + h * 0.88, { fs: 8, color: '#6d28d9', anchor: 'middle', fw: '700' }));
  return segs;
}

// =============================================================================
// EXPORT
// =============================================================================

export const ARCHITECTURE_SHAPES = {
  arch_microservice: archMicroservice,
  arch_api_gateway: archAPIGateway,
  arch_load_balancer: archLoadBalancer,
  arch_message_queue: archMessageQueue,
  arch_message_broker: archMessageBroker,
  arch_cache: archCache,
  arch_service_discovery: archServiceDiscovery,
  arch_config_server: archConfigServer,
  arch_cdn: archCDN,
  arch_reverse_proxy: archReverseProxy,
  arch_database: archDatabase,
  arch_database_replica: archDatabaseReplica,
  arch_sharded_database: archShardedDatabase,
  arch_sql_database: archSQLDatabase,
  arch_nosql_database: archNoSQLDatabase,
  arch_redis: archRedis,
  arch_elasticsearch: archElasticsearch,
  arch_mongodb: archMongoDB,
  arch_postgres: archPostgres,
  arch_object_storage: archObjectStorage,
  arch_blob_storage: archBlobStorage,
  arch_data_warehouse: archDataWarehouse,
  arch_docker: archDocker,
  arch_container: archContainer,
  arch_kubernetes_pod: archKubernetesPod,
  arch_kubernetes_cluster: archKubernetesCluster,
  arch_kubernetes_service: archKubernetesService,
  arch_docker_compose: archDockerCompose,
  arch_ingress: archIngress,
  arch_sidecar: archSidecar,
  arch_aws: archAWS,
  arch_gcp: archGCP,
  arch_azure: archAzure,
  arch_firewall: archFirewall,
  arch_router: archRouter,
  arch_switch: archSwitch,
  arch_vpn: archVPN,
  arch_microservices_pattern: archMicroservicesPattern,
  arch_event_driven: archEventDriven,
  arch_cqrs: archCQRS,
  arch_saga: archSAGA,
  arch_strangler_fig: archStranglerFig,
  arch_two_phase_commit: archTwoPhaseCommit,
  arch_circuit_breaker: archCircuitBreaker,
  arch_bulkhead: archBulkhead,
  arch_rate_limiter: archRateLimiter,
  arch_rest_api: archRESTAPI,
  arch_graphql: archGraphQL,
  arch_grpc: archgRPC,
  arch_websocket: archWebSocket,
  arch_json: archJSON,
  arch_protobuf: archProtobuf,
  arch_monitoring: archMonitoring,
  arch_logging: archLogging,
  arch_tracing: archTracing,
  arch_alerting: archAlerting,
  arch_cicd: archCICD,
  arch_git_flow: archGitFlow,
};

export const ARCHITECTURE_ALIASES = {
  'svc': 'arch_microservice',
  'gateway': 'arch_api_gateway',
  'lb': 'arch_load_balancer',
  'queue': 'arch_message_queue',
  'broker': 'arch_message_broker',
  'cache': 'arch_cache',
  'discovery': 'arch_service_discovery',
  'config': 'arch_config_server',
  'cdn': 'arch_cdn',
  'proxy': 'arch_reverse_proxy',
  'db': 'arch_database',
  'db:replica': 'arch_database_replica',
  'db:sharded': 'arch_sharded_database',
  'sql': 'arch_sql_database',
  'nosql': 'arch_nosql_database',
  'redis': 'arch_redis',
  'es': 'arch_elasticsearch',
  'mongo': 'arch_mongodb',
  'postgres': 'arch_postgres',
  's3': 'arch_object_storage',
  'blob': 'arch_blob_storage',
  'warehouse': 'arch_data_warehouse',
  'docker': 'arch_docker',
  'container': 'arch_container',
  'pod': 'arch_kubernetes_pod',
  'k8s': 'arch_kubernetes_cluster',
  'ingress': 'arch_ingress',
  'sidecar': 'arch_sidecar',
  'aws': 'arch_aws',
  'gcp': 'arch_gcp',
  'azure': 'arch_azure',
  'firewall': 'arch_firewall',
  'router': 'arch_router',
  'vpn': 'arch_vpn',
  'pattern:microservices': 'arch_microservices_pattern',
  'pattern:event': 'arch_event_driven',
  'pattern:cqrs': 'arch_cqrs',
  'pattern:saga': 'arch_saga',
  'pattern:strangler': 'arch_strangler_fig',
  'pattern:2pc': 'arch_two_phase_commit',
  'pattern:circuit': 'arch_circuit_breaker',
  'pattern:bulkhead': 'arch_bulkhead',
  'pattern:ratelimit': 'arch_rate_limiter',
  'rest': 'arch_rest_api',
  'graphql': 'arch_graphql',
  'grpc': 'arch_grpc',
  'ws': 'arch_websocket',
  'json': 'arch_json',
  'protobuf': 'arch_protobuf',
  'monitor': 'arch_monitoring',
  'logs': 'arch_logging',
  'tracing': 'arch_tracing',
  'alert': 'arch_alerting',
  'cicd': 'arch_cicd',
  'git': 'arch_git_flow',
};
