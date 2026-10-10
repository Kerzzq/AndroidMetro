const assert = require('node:assert/strict');
const { idlePinch, pinchPointers, anchorPinch, updatePinch } = require('../src/domain/mapCamera');
const camera = { scale: .5, x: -100, y: 80 };
const event = (scale, focalX=200, focalY=160, numberOfPointers=2) => ({scale,focalX,focalY,numberOfPointers});
let session = anchorPinch(camera, event(1));
let next = updatePinch(session, camera, event(2), .1);
assert.deepEqual(next.camera, {scale:1,x:-400,y:0});
// The anchored map point remains under a moving two-finger centroid.
assert.deepEqual(updatePinch(session,camera,event(2,230,170),.1).camera,{scale:1,x:-370,y:10});
for (const remainingFocus of [-40,440]) {
  const held = pinchPointers(next.session,1);
  // POINTER_UP payload can still say 2, followed by stationary one-finger MOVE.
  for (const count of [2,1,0]) {
    assert.deepEqual(updatePinch(held,next.camera,event(2,remainingFocus,160,count),.1).camera,next.camera);
  }
  assert.deepEqual(updatePinch(idlePinch(),next.camera,event(2,remainingFocus),.1).camera,next.camera);
}
// Add another finger without lifting the last one: rebase cumulative scale and
// changed focal point, then resume zoom from the retained camera, with no snap.
session=pinchPointers(next.session,2);
let rebased=updatePinch(session,next.camera,event(2,440),.1);
assert.deepEqual(rebased.camera,next.camera);
next=updatePinch(rebased.session,rebased.camera,event(1,440),.1);
assert.deepEqual(next.camera,{scale:.5,x:20,y:80});
assert.equal(updatePinch(next.session,next.camera,event(.01,440),.1).camera.scale,.1);
assert.equal(updatePinch(next.session,next.camera,event(20,440),.1).camera.scale,2);
// A fresh pinch after completion/cancellation never uses the previous anchor.
assert.deepEqual(updatePinch(anchorPinch(camera,event(1)),camera,event(1),.1).camera,camera);
console.log('Map camera: Android 2→1→0, either finger, rebase, focal movement, limits and fresh session OK');
