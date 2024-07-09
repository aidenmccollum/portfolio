export function determineOrbit(e, Ra, Rp) {
    //in: eccentricity, apogee, and perigee
    //out: x-offset, semi-major axis, semi-minor axis
    let a = (Ra + Rp)/2;
    let x = (Ra-Rp);
    let b = Math.sqrt((1-e^2)*a^2);

    return a, x, b;
}