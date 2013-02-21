/* Math utilities */

//Return random value in range [lo, hi]
function rand_range(lo, hi) {
    return Math.round(lo + (hi-lo)*Math.random());
}

//Cap
function cap(val, max) {
    return (val > max) ? max : val;
}
