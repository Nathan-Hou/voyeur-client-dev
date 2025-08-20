// 計算 Yaw (適用於影片 1)
export function calculateYawVideo1(sphericalProps) {
    const PI = Math.PI;
    var rst = PI / 180 * sphericalProps.yaw;
    if (rst < PI/2 && 0 <= rst) {
        rst = 180 / PI * Math.atan(0.866025 * Math.tan(rst));
    } else if (rst < 2*PI && 3*PI/2 < rst) {
        rst = 180 / PI * 2 * PI - Math.atan(-0.866025 * Math.tan(rst));
    } else {
        rst = 0;
    }
    return rst;
}

// 計算 Yaw (適用於影片 2)
export function calculateYawVideo2(sphericalProps) {
    const PI = Math.PI;
    var rst = PI / 180 * sphericalProps.yaw;
    if (rst < PI/2 && 0 <= rst) {
        rst = 180 / PI * Math.atan(0.866025 * Math.tan(rst));
    } else if (rst < 2*PI && 3*PI/2 < rst) {
        rst = 180 / PI * 2 * PI - Math.atan(-0.866025 * Math.tan(rst));
    } else {
        rst = 0;
    }
    return rst;
}