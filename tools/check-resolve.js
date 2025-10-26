try {
  const p = require.resolve('@hello-pangea/dnd/package.json');
  console.log('RESOLVED:', p);
} catch (e) {
  console.error('RESOLVE_FAILED:', e && e.message);
  process.exit(1);
}
