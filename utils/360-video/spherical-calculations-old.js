// export const calculateYawVideo1 = (sphericalProps) => {
//     const h = 140;
//     const l = 164;
//     const PI = Math.PI;
//     let rst = (PI / 180) * sphericalProps.yaw;
//     const r = l / h;
  
//     if (rst < PI / 2 && 0 < rst) {
//       const T = Math.tan(rst);
//       if (r > T) {
//         rst = 360 - (180 / PI) * Math.atan(r - T);
//       } else if (r < T) {
//         rst = (180 / PI) * Math.atan(T - r);
//       }
//     } else if (rst < 2 * PI && (3 * PI) / 2 <= rst) {
//       rst = 360 - (180 / PI) * Math.atan(r + Math.tan(2 * PI - rst));
//     }
    
//     return rst;
//   };
  
//   export const calculateYawVideo2 = (sphericalProps) => {
//     const h = 140;
//     const l = 164;
//     const PI = Math.PI;
//     let rst = (PI / 180) * sphericalProps.yaw;
//     const r = l / h;
  
//     if (rst < PI / 2 && 0 < rst) {
//       rst = (180 / PI) * Math.atan(Math.tan(rst) + r);
//     } else if (rst < 2 * PI && (3 * PI) / 2 <= rst) {
//       const T = Math.tan(2 * PI - rst);
//       if (r > T) {
//         rst = (180 / PI) * Math.atan(r - T);
//       } else if (r < T) {
//         rst = 360 - (180 / PI) * Math.atan(T - r);
//       }
//     }
    
//     return rst;
//   };
  
//   export const calculatePitch = (sphericalProps) => sphericalProps.pitch;
//   export const calculateRoll = (sphericalProps) => sphericalProps.roll;





// spherical-calculations.js

/**
 * 計算 Yaw (適用於影片 1)
 * @param {Object} sphericalProps - 球面屬性對象
 * @returns {number} - 計算後的 Yaw 值
 */
export const calculateYawVideo1 = (sphericalProps) => {
    const h = 140;
    const l = 164;
    const PI = Math.PI;
    let rst = PI / 180 * sphericalProps.yaw;
    const r = l / h;

    if (rst < PI/2 && 0 < rst) {
        const T = Math.tan(rst);
        if (r > T) {
            rst = 360 - 180 / PI * Math.atan(r - T);
        } else if (r < T) {
            rst = 180 / PI * Math.atan(T - r);
        }
    } else if (rst < 2*PI && 3*PI/2 <= rst) {
        rst = 360 - 180 / PI * Math.atan(r + Math.tan(2 * PI - rst));
    } else {
        rst = sphericalProps.yaw;
    }
    
    return rst;
};

/**
 * 計算 Yaw (適用於影片 2)
 * @param {Object} sphericalProps - 球面屬性對象
 * @returns {number} - 計算後的 Yaw 值
 */
export const calculateYawVideo2 = (sphericalProps) => {
    const h = 140;
    const l = 164;
    const PI = Math.PI;
    let rst = PI / 180 * sphericalProps.yaw;
    const r = l / h;

    if (rst < PI/2 && 0 < rst) {
        rst = 180 / PI * Math.atan(Math.tan(rst) + r);
    } else if (rst < 2*PI && 3*PI/2 <= rst) {
        const T = Math.tan(2 * PI - rst);
        if (r > T) {
            rst = 180 / PI * Math.atan(r - T);
        } else if (r < T) {
            rst = 360 - 180 / PI * Math.atan(T - r);
        }
    } else {
        rst = sphericalProps.yaw;
    }
    
    return rst;
};

/**
 * 計算 Pitch 值
 * @param {Object} sphericalProps - 球面屬性對象
 * @returns {number} - Pitch 值
 */
export const calculatePitch = (sphericalProps) => {
    return sphericalProps.pitch;
};

/**
 * 計算 Roll 值
 * @param {Object} sphericalProps - 球面屬性對象
 * @returns {number} - Roll 值
 */
export const calculateRoll = (sphericalProps) => {
    return sphericalProps.roll;
};

/**
 * 計算 FOV 值
 * @param {Object} sphericalProps - 球面屬性對象
 * @returns {number} - FOV 值
 */
export const calculateFov = (sphericalProps) => {
    return sphericalProps.fov;
};

/**
 * 計算完整的球面屬性
 * @param {Object} sphericalProps - 原始球面屬性對象
 * @param {number} direction - 方向 (-1: 向左, 1: 向右)
 * @returns {Object} - 計算後的完整球面屬性
 */
export const calculateSphericalProperties = (sphericalProps, direction) => {
    if (!sphericalProps) {
        console.error('sphericalProps is undefined or null');
        return {
            yaw: 0,
            pitch: 0,
            roll: 0,
            fov: 90
        };
    }

    return {
        yaw: direction === -1 
            ? calculateYawVideo1(sphericalProps)
            : direction === 1 
                ? calculateYawVideo2(sphericalProps)
                : sphericalProps.yaw,
        pitch: calculatePitch(sphericalProps),
        roll: calculateRoll(sphericalProps),
        fov: calculateFov(sphericalProps)
    };
};