import cv2
from ultralytics import YOLO
import math

# Load YOLOv8 pose model (smallest, fast one)
model = YOLO("yolov8n-pose.pt")

def calculate_angle(a, b, c):
    """Calculate angle between three points (degrees)."""
    ax, ay = a
    bx, by = b
    cx, cy = c

    ab = (ax - bx, ay - by)
    cb = (cx - bx, cy - by)

    dot_product = ab[0] * cb[0] + ab[1] * cb[1]
    ab_magnitude = math.sqrt(ab[0]**2 + ab[1]**2)
    cb_magnitude = math.sqrt(cb[0]**2 + cb[1]**2)

    if ab_magnitude * cb_magnitude == 0:
        return 0

    cos_angle = dot_product / (ab_magnitude * cb_magnitude)
    angle = math.degrees(math.acos(min(1, max(-1, cos_angle))))
    return angle

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, verbose=False)

    for r in results:
        kpts = r.keypoints.xy  # (num_people, num_keypoints, 2)

        if kpts is not None and len(kpts) > 0:
            kpts = kpts[0].cpu().numpy()  # first person

            # YOLOv8 keypoint indices:
            # 0-nose, 5-left_shoulder, 6-right_shoulder, 11-left_hip, 12-right_hip
            nose = tuple(kpts[0])
            left_shoulder = tuple(kpts[5])
            right_shoulder = tuple(kpts[6])
            left_hip = tuple(kpts[11])
            right_hip = tuple(kpts[12])

            # Midpoints
            shoulder_center = ((left_shoulder[0] + right_shoulder[0]) / 2,
                               (left_shoulder[1] + right_shoulder[1]) / 2)
            hip_center = ((left_hip[0] + right_hip[0]) / 2,
                          (left_hip[1] + right_hip[1]) / 2)

            # Angle: shoulders - hips - nose
            spine_angle = calculate_angle(hip_center, shoulder_center, nose)

            # Score posture
            if spine_angle > 150:  # tweak threshold if needed
                text = "✅ Good posture"
                color = (0, 255, 0)
            else:
                text = "⚠️ Slouching"
                color = (0, 0, 255)

            # Draw feedback
            cv2.putText(frame, text, (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

    annotated = results[0].plot()
    cv2.imshow("Posture Detection", annotated)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()