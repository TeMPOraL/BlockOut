function pretty_print_time(val) {
    var minutes = Math.floor(val / 60);
    var seconds = val - (minutes * 60);

    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time = minutes+':'+seconds;
    return time;
}
