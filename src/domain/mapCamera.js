// Shared by native worklets and regression tests. Pointer count from touch events
// matters: Android POINTER_UP still reports two pointers in the pinch update.
function idlePinch() {
  'worklet';
  return { active: false, ready: false, pointers: 0 };
}
function pinchPointers(session, pointers) {
  'worklet';
  return { ...session, pointers, ready: false };
}
function anchorPinch(camera, event, pointers = 2) {
  'worklet';
  return { active: true, ready: true, pointers,
    referenceScale: camera.scale / event.scale,
    anchorX: (event.focalX - camera.x) / camera.scale,
    anchorY: (event.focalY - camera.y) / camera.scale };
}
function updatePinch(session, camera, event, minimum, maximum = 2) {
  'worklet';
  if (!session.active || session.pointers < 2 || event.numberOfPointers < 2) return { session, camera };
  // Rebase after any pointer change; its new centroid must not move the camera.
  if (!session.ready) return { session: anchorPinch(camera, event, session.pointers), camera };
  const scale = Math.max(minimum, Math.min(maximum, session.referenceScale * event.scale));
  return { session, camera: { scale,
    x: event.focalX - session.anchorX * scale,
    y: event.focalY - session.anchorY * scale } };
}
module.exports = { idlePinch, pinchPointers, anchorPinch, updatePinch };
