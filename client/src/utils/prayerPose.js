// Prayer posture detection from MoveNet keypoints (17 points, pixel coords, image y grows downward).
// Works best with the camera placed to the side of the person (profile view).

export const KEYPOINTS = {
  NOSE: 0, LEFT_EYE: 1, RIGHT_EYE: 2, LEFT_EAR: 3, RIGHT_EAR: 4,
  LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6, LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
  LEFT_WRIST: 9, RIGHT_WRIST: 10, LEFT_HIP: 11, RIGHT_HIP: 12,
  LEFT_KNEE: 13, RIGHT_KNEE: 14, LEFT_ANKLE: 15, RIGHT_ANKLE: 16,
};

const MIN_SCORE = 0.3;

// Angle at b (degrees, 0–180) between b→a and b→c
export function getAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

const ok = (p) => p && p.score >= MIN_SCORE;

// Pick the body side (left/right) the camera sees best
function bestSide(kp) {
  const sideScore = (s, h, k, a) => [s, h, k, a].reduce((sum, i) => sum + (kp[i]?.score || 0), 0);
  const left = sideScore(KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_HIP, KEYPOINTS.LEFT_KNEE, KEYPOINTS.LEFT_ANKLE);
  const right = sideScore(KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_HIP, KEYPOINTS.RIGHT_KNEE, KEYPOINTS.RIGHT_ANKLE);
  return left >= right
    ? { shoulder: kp[KEYPOINTS.LEFT_SHOULDER], hip: kp[KEYPOINTS.LEFT_HIP], knee: kp[KEYPOINTS.LEFT_KNEE], ankle: kp[KEYPOINTS.LEFT_ANKLE] }
    : { shoulder: kp[KEYPOINTS.RIGHT_SHOULDER], hip: kp[KEYPOINTS.RIGHT_HIP], knee: kp[KEYPOINTS.RIGHT_KNEE], ankle: kp[KEYPOINTS.RIGHT_ANKLE] };
}

// Measurements used for classification and feedback (null if the body isn't visible enough)
export function measurePose(kp) {
  if (!kp || kp.length < 17) return null;
  const { shoulder, hip, knee, ankle } = bestSide(kp);
  if (!ok(shoulder) || !ok(hip)) return null;

  // Head point: nose, else an ear/eye
  const head = [KEYPOINTS.NOSE, KEYPOINTS.LEFT_EAR, KEYPOINTS.RIGHT_EAR, KEYPOINTS.LEFT_EYE, KEYPOINTS.RIGHT_EYE]
    .map((i) => kp[i]).find(ok) || null;

  const torsoLen = Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y) || 1;
  // Torso tilt from vertical: 0 = upright, 90 = horizontal, >90 = shoulders below hips
  const torsoTilt = getAngle({ x: hip.x, y: hip.y - 100 }, hip, shoulder);
  const hipAngle = ok(knee) ? getAngle(shoulder, hip, knee) : null;
  const kneeAngle = ok(knee) && ok(ankle) ? getAngle(hip, knee, ankle) : null;
  // How far the head is below the hips, in torso lengths (positive = head lower)
  const headBelowHip = head ? (head.y - hip.y) / torsoLen : null;
  const shoulderTilt = ok(kp[KEYPOINTS.LEFT_SHOULDER]) && ok(kp[KEYPOINTS.RIGHT_SHOULDER])
    ? Math.abs(kp[KEYPOINTS.LEFT_SHOULDER].y - kp[KEYPOINTS.RIGHT_SHOULDER].y) / torsoLen
    : null;

  return { torsoTilt, hipAngle, kneeAngle, headBelowHip, shoulderTilt, kneeVisible: ok(knee) };
}

// Single-frame classification
export function classifyPose(m) {
  if (!m) return 'UNKNOWN';
  const { torsoTilt, hipAngle, kneeAngle, headBelowHip } = m;

  // Sujud: head well below the hips, or below the hips with legs folded (knees bent / hips closed).
  // In ruku the head can dip slightly below hip level too, but the knees stay straight.
  const legsFolded = (kneeAngle !== null && kneeAngle < 120) || (hipAngle !== null && hipAngle < 70);
  if (headBelowHip !== null && torsoTilt > 60 && (headBelowHip > 0.5 || (headBelowHip > 0.15 && legsFolded))) return 'PROSTRATING';
  // Ruku: torso roughly horizontal, legs straight-ish, head not below the hips
  if (torsoTilt >= 50 && torsoTilt <= 120 && (kneeAngle === null || kneeAngle > 140)) return 'BOWING';
  // Upright torso
  if (torsoTilt < 35) {
    if (kneeAngle !== null && kneeAngle < 110) return 'SITTING';      // knees folded
    if (hipAngle !== null && hipAngle < 125) return 'SITTING';        // thighs forward (sitting on heels)
    if (kneeAngle === null || kneeAngle > 150) return 'STANDING';
  }
  return 'UNKNOWN';
}

// Majority vote over recent frames so the label doesn't flicker
export function createSmoother(windowSize = 10, minVotes = 6) {
  const history = [];
  let stable = 'UNKNOWN';
  return (raw) => {
    history.push(raw);
    if (history.length > windowSize) history.shift();
    const counts = {};
    for (const p of history) counts[p] = (counts[p] || 0) + 1;
    const [top, votes] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (votes >= minVotes && top !== 'UNKNOWN') stable = top;
    else if ((counts.UNKNOWN || 0) >= windowSize - 1) stable = 'UNKNOWN';
    return stable;
  };
}

// Counts ruku, sujud and completed rak'ahs from the sequence of stable positions.
// A rak'ah = a ruku followed by two sujud.
export function createPrayerTracker() {
  const stats = { ruku: 0, sujud: 0, rakat: 0, timeIn: { STANDING: 0, BOWING: 0, PROSTRATING: 0, SITTING: 0 } };
  let last = 'UNKNOWN';
  let rukuInRakah = false;
  let sujudInRakah = 0;
  return {
    update(position, dtSeconds) {
      if (stats.timeIn[position] !== undefined) stats.timeIn[position] += dtSeconds;
      if (position === last || position === 'UNKNOWN') return stats;
      if (position === 'BOWING') { stats.ruku++; rukuInRakah = true; sujudInRakah = 0; }
      if (position === 'PROSTRATING') {
        stats.sujud++;
        sujudInRakah++;
        if (rukuInRakah && sujudInRakah === 2) { stats.rakat++; rukuInRakah = false; sujudInRakah = 0; }
      }
      last = position;
      return stats;
    },
    get stats() { return stats; },
  };
}

// Feedback tips for the current position
export function poseFeedback(position, m) {
  if (!m) return [{ type: 'warning', text: 'Step back so your whole body is visible — place the camera at your side.' }];
  const tips = [];
  if (position === 'STANDING') {
    if (m.shoulderTilt !== null && m.shoulderTilt > 0.2) tips.push({ type: 'warning', text: 'Keep your shoulders level.' });
    else tips.push({ type: 'success', text: 'Good standing posture.' });
  } else if (position === 'BOWING') {
    if (m.torsoTilt < 70) tips.push({ type: 'warning', text: 'Bend a little more — back should be close to flat (90°).' });
    else if (m.torsoTilt > 105) tips.push({ type: 'warning', text: 'Don\'t bend too low — keep your back level with your hips.' });
    else tips.push({ type: 'success', text: 'Good ruku — back is level.' });
    if (m.kneeAngle !== null && m.kneeAngle < 155) tips.push({ type: 'warning', text: 'Keep your knees straighter.' });
  } else if (position === 'PROSTRATING') {
    tips.push({ type: 'success', text: 'Sujud detected — forehead and nose on the ground.' });
  } else if (position === 'SITTING') {
    if (m.torsoTilt > 20) tips.push({ type: 'warning', text: 'Sit up straighter.' });
    else tips.push({ type: 'success', text: 'Good sitting posture.' });
  } else {
    tips.push({ type: 'warning', text: 'Position not clear — make sure your whole body is in the frame.' });
  }
  return tips;
}
