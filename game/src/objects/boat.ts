import { AbstractMesh, Mesh, MeshBuilder, Vector3 } from "@babylonjs/core";

export class Boat {
    private scene: any;
    private boat: AbstractMesh;

    private target: Vector3;
    private intermediatePoints: Vector3[] = [];
    private currentIntermediatePointIndex = -1;
    private speed: number;

    constructor(scene) {
        this.scene = scene;
        this.speed = 0.3;
    }

    fromExistingMesh(mesh: AbstractMesh) {
        this.boat = mesh;
        return this;
    }

    fromBox(boathWidth: number, boatLength: number) {
        this.boat = MeshBuilder.CreateBox(
            "boat",
            { width: boathWidth, height: 1, depth: boatLength },
            this.scene
        );
        return this;
    }

    setSpeed(speed: number) {
        this.speed = speed;
        return this;
    }

    getSpeed() {
        return this.speed;
    }

    accelerate() {
        this.speed += 0.1;
        return this;
    }

    atRiverPosition(x: number, z: number) {
        this.boat.position.x = x;
        this.boat.position.z = z;
        this.boat.position.y = -1.3;
        return this;
    }

    targetToPoint(x: number, z: number) {
        this.target = new Vector3(x, 0, z);
        this.boat.lookAt(this.target);
        this.intermediatePoints = this.calculateIntermediatePoints();
        this.currentIntermediatePointIndex = -1;

        return this;
    }

    flowToTarget(next: { x: number; z: number }) {
        if (this.isOnTarget()) {
            return;
        }

        this.currentIntermediatePointIndex++;

        const nextPoint =
            this.intermediatePoints[this.currentIntermediatePointIndex];

        this.boat.position.x = nextPoint.x;
        this.boat.position.z = nextPoint.z;

        if (this.isCloseToTarget()) {
            // start turning towards the next point (next after target, which is passed in parameters)
            // we need to use boat.lookAt
            // currently it looks at target
            // but we need to start rotating it towards next point
            // calculate how many intermediate points are left till the target
            // and calculate lookAt direction based on that (by substracting next point from target)

            const remainingIntermediatePoints =
                this.intermediatePoints.length -
                this.currentIntermediatePointIndex;

            const pointsBetweenTargetAndNext = this.interpolatePointsBetween(
                this.target,
                new Vector3(next.x, 0, next.z),
                remainingIntermediatePoints
            );

            const lookAtPoint = pointsBetweenTargetAndNext[1];
            if (lookAtPoint) {
                this.boat.lookAt(lookAtPoint);
            }
        }
    }

    lookAt(x: number, z: number) {
        const lookAtPoint = new Vector3(x, 0, z);
        this.boat.lookAt(lookAtPoint);
    }

    turnLeft() {
        this.boat.rotate(Vector3.Up(), Math.PI / 90);
    }

    turnRight() {
        this.boat.rotate(Vector3.Up(), -Math.PI / 90);
    }

    interpolatePointsBetween(point1: Vector3, point2: Vector3, steps: number) {
        const interpolatedPoints = [];
        const dx = point2.x - point1.x;
        const dz = point2.z - point1.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const stepSize = length / steps;

        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const x = point1.x + t * dx;
            const z = point1.z + t * dz;
            interpolatedPoints.push(new Vector3(x, 0, z));
        }

        return interpolatedPoints;
    }

    isOnTarget() {
        return (
            this.currentIntermediatePointIndex ===
            this.intermediatePoints.length - 1
        );
    }

    isCloseToTarget() {
        return (
            this.boat.position.subtract(this.target).length() < 10 * this.speed
        );
    }

    calculateIntermediatePointsWithCurvenesSmoothness(
        targetX: number,
        targetZ: number,
        nextX: number,
        nextZ: number
    ) {
        // Target: The next checkpoint the boat is heading towards
        // Next: The point after target, used to determine curvature

        const intermediatePoints: Vector3[] = [];
        const currentPosition = this.boat.position.clone();
        const targetPosition = new Vector3(targetX, currentPosition.y, targetZ);
        const nextPosition = new Vector3(nextX, currentPosition.y, nextZ);

        const numSteps = 20; // Number of interpolated points
        for (let i = 0; i <= numSteps; i++) {
            const t = i / numSteps;

            // Catmull-Rom interpolation formula (smooth sailing)
            const interpolatedPoint = new Vector3(
                0.5 *
                    (2 * targetPosition.x +
                        (-currentPosition.x + nextPosition.x) * t +
                        (2 * currentPosition.x -
                            5 * targetPosition.x +
                            4 * nextPosition.x -
                            nextPosition.x) *
                            t *
                            t +
                        (-currentPosition.x +
                            3 * targetPosition.x -
                            3 * nextPosition.x +
                            nextPosition.x) *
                            t *
                            t *
                            t),
                currentPosition.y,
                0.5 *
                    (2 * targetPosition.z +
                        (-currentPosition.z + nextPosition.z) * t +
                        (2 * currentPosition.z -
                            5 * targetPosition.z +
                            4 * nextPosition.z -
                            nextPosition.z) *
                            t *
                            t +
                        (-currentPosition.z +
                            3 * targetPosition.z -
                            3 * nextPosition.z +
                            nextPosition.z) *
                            t *
                            t *
                            t)
            );

            intermediatePoints.push(interpolatedPoint);
        }

        return intermediatePoints;
    }

    calculateIntermediatePoints() {
        const intermediatePoints = [];
        const distance = this.boat.position.subtract(this.target).length();

        const steps = Math.ceil(distance / this.speed);
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x =
                this.boat.position.x +
                t * (this.target.x - this.boat.position.x);
            const z =
                this.boat.position.z +
                t * (this.target.z - this.boat.position.z);
            intermediatePoints.push(new Vector3(x, 0, z));
        }

        return intermediatePoints;
    }

    get position() {
        return this.boat.position;
    }

    get forward() {
        return this.boat.forward;
    }
}
