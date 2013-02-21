//Public Interface

var timer_seconds = 0;
var timer_running = false;
function start_timer(tick_callback) {
    if(timer_running) {
        stop_timer();
        reset_timer();
    }
    timer_running = true;
    if(tick_callback) {
        setTimeout(function() {
            timer_tick_callback(tick_callback);
        });
    }
    else {
        setTimeout(timer_tick, 1000);
    }
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

function timer_tick_callback(callback) {
    if(timer_running) {
        ++timer_seconds;
        callback();
        setTimeout(function() {
            timer_tick_callback(callback);
        }, 1000);
    }
}
