// Helper for Centripetal Catmull-Rom Spline interpolation
// This variant produces smoother curves without loops or cusps
export const interpolateCatmullRom = (data: [number, number][], resolution: number = 20, alpha: number = 0.5): [number, number][] => {
    if (data.length < 2) return data;

    const points: [number, number][] = [];

    // Add start/end control points by duplicating
    // For better results, we extend the line linearly instead of just duplicating
    const p0 = [
        data[0][0] - (data[1][0] - data[0][0]),
        data[0][1] - (data[1][1] - data[0][1])
    ] as [number, number];

    const last = data[data.length - 1];
    const secondLast = data[data.length - 2];
    const pN = [
        last[0] + (last[0] - secondLast[0]),
        last[1] + (last[1] - secondLast[1])
    ] as [number, number];

    const P = [p0, ...data, pN];

    const getT = (t: number, p0: [number, number], p1: [number, number]) => {
        const a = Math.pow((p1[0] - p0[0]), 2) + Math.pow((p1[1] - p0[1]), 2);
        const b = Math.pow(a, 0.5);
        const c = Math.pow(b, alpha);
        return c + t;
    };

    for (let i = 0; i < P.length - 3; i++) {
        const p0 = P[i];
        const p1 = P[i + 1];
        const p2 = P[i + 2];
        const p3 = P[i + 3];

        const t0 = 0;
        const t1 = getT(t0, p0, p1);
        const t2 = getT(t1, p1, p2);
        const t3 = getT(t2, p2, p3);

        for (let t = t1; t < t2; t += ((t2 - t1) / resolution)) {
            const A1 = [
                (t1 - t) / (t1 - t0) * p0[0] + (t - t0) / (t1 - t0) * p1[0],
                (t1 - t) / (t1 - t0) * p0[1] + (t - t0) / (t1 - t0) * p1[1]
            ];
            const A2 = [
                (t2 - t) / (t2 - t1) * p1[0] + (t - t1) / (t2 - t1) * p2[0],
                (t2 - t) / (t2 - t1) * p1[1] + (t - t1) / (t2 - t1) * p2[1]
            ];
            const A3 = [
                (t3 - t) / (t3 - t2) * p2[0] + (t - t2) / (t3 - t2) * p3[0],
                (t3 - t) / (t3 - t2) * p2[1] + (t - t2) / (t3 - t2) * p3[1]
            ];

            const B1 = [
                (t2 - t) / (t2 - t0) * A1[0] + (t - t0) / (t2 - t0) * A2[0],
                (t2 - t) / (t2 - t0) * A1[1] + (t - t0) / (t2 - t0) * A2[1]
            ];
            const B2 = [
                (t3 - t) / (t3 - t1) * A2[0] + (t - t1) / (t3 - t1) * A3[0],
                (t3 - t) / (t3 - t1) * A2[1] + (t - t1) / (t3 - t1) * A3[1]
            ];

            const C = [
                (t2 - t) / (t2 - t1) * B1[0] + (t - t1) / (t2 - t1) * B2[0],
                (t2 - t) / (t2 - t1) * B1[1] + (t - t1) / (t2 - t1) * B2[1]
            ];

            points.push(C as [number, number]);
        }
    }
    points.push(data[data.length - 1]);
    return points;
};
