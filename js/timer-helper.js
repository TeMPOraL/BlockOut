//Public Interface

var timer_seconds = 0;
var timer_running = false;
function start_timer() {
    if(timer_running) {
        stop_timer();
        reset_timer();
    }
    timer_running = true;
    setTimeout(timer_tick, 1000);
}

function stop_timer() {
    timer_running = false;
}

function reset_timer() {
    timer_seconds = 0;
}

function get_timer_value() {
    return timer_seconds;
}

//Private parts
function timer_tick() {
    if(timer_running) {
        ++timer_seconds;
        setTimeout(timer_tick, 1000);
    }
}
