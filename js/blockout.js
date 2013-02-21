/*****************************************************************************************/
// Globals
/*****************************************************************************************/

// canvas dimensions
var WIDTH = 500;
var HEIGHT = 500;

// pit dimensions
var PIT_WIDTH  = 5;
var PIT_HEIGHT = 5;
var PIT_DEPTH  = 10;

// fake perspective
var ZSIZE_X = 30; 
var ZSIZE_Y = 30;

// color constants
var PIECE_COLOR = [50,0,90];
var BG_COLOR = "#000";

// cube rendering style
var CUBE_PLAIN = 0, CUBE_GRADIENT = 1;

var CUBE_STYLE = CUBE_PLAIN;
var CUBE_OUTLINE = "#000";

var FORCE_DEPTH_COLOR = 1;

var LINEWIDTH_CUBE = 0.5;
var LINEWIDTH_PIT = 0.35;

// game speed
var SPEED = 2;
var SPEED_MAP = {
    0:0,
    1:2000,
    2:1000,
    3:500,
    4:250,
}
var AUTOFALL_DELAY = SPEED_MAP[SPEED];

// animation
var ANIM_DURATION = 150;
var FRAME_DELAY = 10;

var DELTA = 1;
var DELTA_ANGLE = Math.PI/2;

// pieces
var SET = "basic";

// piece shapes
var TEMPLATES = {
    
// Polycubes of order three or four
"basic": [
    [ ["x"] ],
    
    [ ["xx"] ],

    [ ["xxx"] ],

    [ ["xx",
       "x "] ],
       
    [ ["xxx",
       " x "] ],
       
    [ ["xx ",
       " xx"] ],

    [ ["xxx",
       "x  "] ],

    [ ["xx",
       "x "],
      [" x",
       "  "] ],

    [ ["xx",
       "x "],
      ["  ",
       "x "] ],

    [ ["xx",
       "x "],
      ["x ",
       "  "] ]
]
};

var KEYMAP_DEFAULT = {
"X+" :39, // right
"X-" :37, // left
"Y+" :40, // down
"Y-" :38, // up
"Z+" :90, // y
"Z-" :88, // x

"A+" :81, // q
"A-" :65, // a
"B+" :87, // w
"B-" :83, // s
"C+" :68, // d
"C-" :69 ,// e

"D"  :32  // space
};

var KEYMAP = {};    
var KEYMAP_TMP = {};
var LAST_KEY_EL = 0;
        
// generated data
var PIECES = { };
var LAYERS = [];
var COUNTS = [];
var COLORS = [];
var ALLOWED = [];

var CACHE_PIT = 0, CACHE_LAYERS = 0, CACHE_SHADOW = 0;

var START, END, ELAPSED;
var ID1 = -1, ID2 = -1;

// game state
var STATE = {"setkeys":0};

// pause
var PAUSE_ANIM = 1;
var PAUSE_WORMS = 1;
var N_ELEMENTS = 250;
var PAUSE_ELEMENTS = [];
var DP = 0;

    
/*****************************************************************************************/
// Pieces
/*****************************************************************************************/
function precompute_pieces() {
    for(var set in TEMPLATES) {
        PIECES[set] = [];
        for(var i=0; i<TEMPLATES[set].length; ++i) {
            var piece3d = generate_piece(TEMPLATES[set][i]);
            var bb = bbox(piece3d.lines);
            
            // center of the piece (middle of bounding box)
            var cx = bb.x[0]+(bb.x[1]-bb.x[0])/2.0;
            var cy = bb.y[0]+(bb.y[1]-bb.y[0])/2.0;
            var cz = bb.z[0]+(bb.z[1]-bb.z[0])/2.0;
            
            // align rotation on full cubes
            cx = Math.floor(cx);
            cy = Math.floor(cy);
            cz = Math.floor(cz);
            
            PIECES[set][i] = {
            'lines' :piece3d.lines,
            'voxels':piece3d.voxels,
            'cx'    :cx,
            'cy'    :cy,
            'cz'    :cz,
            'bb'    :bb
            };
        }
    }
}

function generate_layer(width, height) {
    var layer = [];
    for(var y=0; y<height; ++y) {
        var row = [];
        for(var x=0; x<width; ++x) {
            row[x] = 0;
        }
        layer.push(row);
    }
    return layer;
}

function generate_layers(width, height, depth) {
    var layers = [];
    
    for(var z=0; z<depth; ++z)
        layers.push(generate_layer(width, height));
    
    return layers;
}

function generate_counts(layers) {
    var depth  = layers.length;
    var height = layers[0].length;
    var width  = layers[0][0].length;

    var counts = [];
    
    for(var z=0; z<depth; ++z) {
        counts[z] = 0;
        for(var y=0; y<height; ++y) {
            for(var x=0; x<width; ++x) {
                if(layers[z][y][x] != 0) counts[z] += 1;
            }
        }
    }
    
    return counts;
}

function init_colors(depth) {
    COLORS = [];
    var h,s,l,a;
    var pie = 360/(depth-0.5);
    for(var i=0; i<depth; ++i) {
        h = i*pie;
        s = 90;
        l = 50;
        a = 1.0;
        COLORS.push([h,s,l,a]);
    }
}

function init_layers(layers, type) {
    var depth  = layers.length;
    var height = layers[0].length;
    var width  = layers[0][0].length;
    var c = rand_range(1,depth-1);
    for(var z=0; z<depth; ++z) {        
        for(var y=0; y<height; ++y) {
            for(var x=0; x<width; ++x) {
                layers[z][y][x] = 0;
                
                switch(type) {
                case 1:
                    if(z>depth-3) layers[z][y][x] = (x > 0 || y > 0) ? 1 : 0;
                    break;
                case 2:
                    if(z>depth-2) layers[z][y][x] = (x+y) > 3;
                    break;
                case 3:
                    if(z>=0) layers[z][y][x] = (depth-z) * ((width-x)+(height-y) > z ? 0 : 1);
                    break;
                case 4:
                    if(z>1 && Math.random()>0.95) layers[z][y][x] = c;
                }
            }
        }
    }    
}



/*****************************************************************************************/
// Text
/*****************************************************************************************/
function pretty_number(x) {
    var delimiter = "'";
    var strx = x.toString();
    var pretty = "";
    for(var i=strx.length-1; i>=0; i-- ) {
        if((strx.length-1-i) % 3 == 0 && (strx.length-1-i) > 0)
            pretty = delimiter+pretty;
        pretty = strx[i]+pretty;
    }
    return pretty;
}


/*****************************************************************************************/
// Rendering
/*****************************************************************************************/
function render_layer(canvas, ctx, layer, z, outline, depth) {
    var row = "";
    var color;
    
    var force_color = FORCE_DEPTH_COLOR;
    
    // right,down,left,up sides pass
    var faces = [1,1,1,1,0];
    for(var y=0; y<layer.length; ++y) {
        row = layer[y];
        for(var x=0; x<row.length; ++x) {
            if(row[x]!="0") {
                if(x>0) 
                    faces[2] = !parseInt(row[x-1]);
                if(x<row.length-1) 
                    faces[0] = !parseInt(row[x+1]);
                if(y>0) 
                    faces[3] = !parseInt(layer[y-1][x]);
                if(y<layer.length-1) 
                    faces[1] = !parseInt(layer[y+1][x]);
                
                if(force_color)
                    color = depth-z-1;
                else
                    color = row[x]-1;
                
                render_cube(canvas, ctx, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH, x,y,z, COLORS[color], faces, outline);
                faces = [1,1,1,1,0];
            }
        }
    }
    
    // top sides pass
    faces = [0,0,0,0,1];
    for(var y=0; y<layer.length; ++y) {
        row = layer[y];
        for(var x=0; x<row.length; ++x) {
            if(row[x]!="0") {
                
                if(force_color)
                    color = depth-z-1;
                else
                    color = row[x]-1;
                render_cube(canvas, ctx, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH, x,y,z, COLORS[color], faces, outline);
            }
        }
    }
}

function render_layers(canvas, ctx, layers, refresh_flag) {
    var outline = CUBE_OUTLINE;
    
    if(CACHE_LAYERS == 0 || refresh_flag) {
        //draw_pit(canvas, ctx, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH);
        
        // render bottom->top order
        for(var i=layers.length-1; i>=0; --i)
            render_layer(canvas, ctx, layers[i], i, outline, layers.length);

        if(CACHE_LAYERS == 0) {
            var cache = $("<canvas></canvas>");
            cache.css("display","none");
            $("body").append(cache);
            cache.attr('width', canvas.width).attr('height', canvas.height);
            CACHE_LAYERS = cache.get(0);
        }
        CACHE_LAYERS.getContext("2d").drawImage(canvas,0,0);
        STATE.refresh_layers_flag = 0;
    }
    else {
        ctx.drawImage(CACHE_LAYERS,0,0);
    }
}

function generate_piece(shape) {
    var lines = [];
    var map = {};
        
    var voxels = [];
    
    function add_line(a,b) {
        var linehash1 = "#"+a[0]+"#"+a[1]+"#"+a[2]+"#"+b[0]+"#"+b[1]+"#"+b[2];
        var linehash2 = "#"+b[0]+"#"+b[1]+"#"+b[2]+"#"+a[0]+"#"+a[1]+"#"+a[2];
        if(map[linehash1] == undefined && map[linehash2] == undefined) 
            map[linehash1] = [[a[0],a[1],a[2]], [b[0],b[1],b[2]]];
        else {
            if(map[linehash1] != undefined) delete map[linehash1];
            if(map[linehash2] != undefined) delete map[linehash2];
        }
    }
    
    for(var z=0; z<shape.length; ++z) {
        layer = shape[z];
        for(var y=0; y<layer.length; ++y) {
            row = layer[y];
            for(var x=0; x<row.length; ++x) {
                if(row[x] != " ") {
                    // top face
                    add_line([x,y,z],    [x+1,y,z]);
                    add_line([x+1,y,z],  [x+1,y+1,z]);
                    add_line([x+1,y+1,z],[x,y+1,z]);
                    add_line([x,y+1,z],  [x,y,z]);  
                    
                    // bottom face
                    add_line([x,y,z+1],    [x+1,y,z+1]);
                    add_line([x+1,y,z+1],  [x+1,y+1,z+1]);
                    add_line([x+1,y+1,z+1],[x,y+1,z+1]);
                    add_line([x,y+1,z+1],  [x,y,z+1]);
                    
                    // side faces
                    add_line([x,y,z],    [x,y,z+1]);
                    add_line([x+1,y,z],  [x+1,y,z+1]);
                    add_line([x+1,y+1,z],[x+1,y+1,z+1]);
                    add_line([x,y+1,z],  [x,y+1,z+1]);
                    
                    voxels.push([x+0.5,y+0.5,z+0.5]);
                }
            }
        }
    }
    
    for(var i in map)
        lines.push(map[i]);
    
    return {'lines':lines, 'voxels':voxels };
}

function render_piece(canvas, ctx, width, height, depth, x,y,z, piece, angles, color) {    
    var cwidth = canvas.width;
    var cheight = canvas.height;
    
    var cx = piece.cx;
    var cy = piece.cy;
    var cz = piece.cz;
    
    /*
    var r = g = b = Math.floor(64*(2+2*(depth-z)/depth));
    var c = "rgb("+r+","+g+","+b+")";
    */
    var l = 0.25*(2+2*(depth-z)/depth);
    var c = "hsl("+color[0]+","+color[1]+"%,"+l*color[2]+"%)";
    
    var p1,p2,r1,r2;
    for(var i=0; i<piece.lines.length; ++i) {
        p1 = translate(piece.lines[i][0], [-cx,-cy,-cz]);
        p2 = translate(piece.lines[i][1], [-cx,-cy,-cz]);
        r1 = translate(rotate(p1, angles), [x+cx,y+cy,z+cz]);
        r2 = translate(rotate(p2, angles), [x+cx,y+cy,z+cz]);
        
        //ctx.lineWidth = 0.5+1.5*(depth-0.5*(r1[2]+r2[2]))/depth;
        ctx.lineWidth = 0.5+1.5*(depth-z)/depth;
        line3d(ctx, cwidth,cheight, width,height, r1, r2, c);
    }
    
    
    /*
    // Voxel test
    for(var i=0; i<piece.voxels.length; ++i) {
        var p1 = translate(piece.voxels[i], [-cx,-cy,-cz]);
        var r1 = translate(rotate(p1, angles), [x+cx,y+cy,z+cz]);
        point3d(ctx, cwidth,cheight, width,height, r1, "red", 3);
    }
    */
    
}

function render_pit(canvas, ctx) {
    draw_pit(canvas, ctx, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH, 1);
    render_layers(canvas, ctx, LAYERS, 1);
    
    // transparent overlay layer below shadow
    ctx.fillStyle = "rgba(25,25,25,0.75)";
    ctx.fillRect(0,0, canvas.width, canvas.height);
}

/*****************************************************************************************/
// Voxels
/*****************************************************************************************/
function bbox_piece(shape) {
    var width = shape[0][0].length;
    var height = shape[0].length;
    var depth = shape.length;
    return { 'width':width, 'height':height, 'depth':depth };
}

function project_voxels(piece, x,y,z, angles) {
    var voxels = [];
    var cx = piece.cx;
    var cy = piece.cy;
    var cz = piece.cz;
    for(var i=0; i<piece.voxels.length; ++i) {
        var p = translate(piece.voxels[i], [-cx,-cy,-cz]);
        var r = translate(rotate(p, angles), [x+cx,y+cy,z+cz]);
        r[0] = Math.floor(r[0]);
        r[1] = Math.floor(r[1]);
        r[2] = Math.floor(r[2]);
        voxels.push(r);
    }
    return voxels;
}

function is_overlap_layers(voxels, pwidth, pheight, pdepth, layers) {
    var x,y,z;
    for(var i=0; i<voxels.length; ++i) {
        if(voxels[i][0]<0) return 1;
        if(voxels[i][1]<0) return 1;
        if(voxels[i][2]<0) return 1;
        
        if(voxels[i][0]>=pwidth) return 1;
        if(voxels[i][1]>=pheight) return 1;
        if(voxels[i][2]>=pdepth) return 1;
        
        x = voxels[i][0];
        y = voxels[i][1];
        z = voxels[i][2];
        if(layers[z][y][x]) return 1;
    }
    return 0;
}
    
function is_overlap(voxels, pwidth, pheight, pdepth) {
    for(var i=0; i<voxels.length; ++i) {
        if(voxels[i][0]<0) return 1;
        if(voxels[i][1]<0) return 1;
        if(voxels[i][2]<0) return 1;
        
        if(voxels[i][0]>=pwidth) return 1;
        if(voxels[i][1]>=pheight) return 1;
        if(voxels[i][2]>=pdepth) return 1;
    }
    return 0;
}

function overlap_diff(voxels, pwidth, pheight, pdepth) {
    var dx = 0, dy = 0, dz = 0;
    
    var bbox = bbox_voxels(voxels);
    
    // no delta if voxels are bigger than pit
    if(!(bbox.x[0]<0 && bbox.x[1]>=pwidth)  ||
       !(bbox.y[0]<0 && bbox.y[1]>=pheight) ||
       !(bbox.z[0]<0 && bbox.z[1]>=pdepth))
    {
        if(bbox.x[0]<0) dx = -bbox.x[0];
        if(bbox.x[1]>pwidth-1) dx = (pwidth-1)-bbox.x[1];
        
        if(bbox.y[0]<0) dy = -bbox.y[0];
        if(bbox.y[1]>pheight-1) dy = (pheight-1)-bbox.y[1];
        
        if(bbox.z[0]<0) dz = -bbox.z[0];
        if(bbox.z[1]>pdepth-1) dz = (pdepth-1)-bbox.z[1];
    }

    return [dx,dy,dz];
}

function add_voxels(voxels, layers, counts) {
    var x,y,z;
    var total=0;
    var depth = layers.length;
    for(var i=0; i<voxels.length; ++i) {
        x = voxels[i][0];
        y = voxels[i][1];
        z = voxels[i][2];
        
        if(layers[z][y][x]==0) {
            counts[z] += 1;
            total += 1;
        }
        layers[z][y][x] = depth-z;
    }
    return total;
}

function dump_layers(layers) {
    var depth = layers.length;
    var height = layers[0].length;
    var width = layers[0][0].length;
    
    var tmp = "";
    for(var z=0; z<depth; ++z) {        
        for(var y=0; y<height; ++y) {
            for(var x=0; x<width; ++x) {
                tmp += layers[z][y][x];
            }
            tmp += "<br/>";
        }
        tmp += z+"<br/>";
    }

    $("#layers").html(tmp);
}

function remove_layer(layers, n) {
    var height = layers[0].length;
    var width = layers[0][0].length;
    layers.splice(n,1);
    layers.unshift(generate_layer(width, height));    
}

function check_full_layers(layers, counts) {
    var score = 0;
    var depth = layers.length;
    var height = layers[0].length;
    var width = layers[0][0].length;
    var fullsize = width*height;
    
    var todo = [];
    
    for(var i=0; i<counts.length; ++i) {
        if(counts[i]==fullsize) {
            score += 1;
            remove_layer(layers, i);
            todo.push(i);
        }
    }
    
    for(var i=0; i<todo.length; ++i) {
        counts.splice(todo[i],1);
        counts.unshift(0);
    }
    
    return score*fullsize;
}

/*****************************************************************************************/
// Utils
/*****************************************************************************************/
function log(text) {
    $("#log").css("display", "block");
    $("#log").append(text+"<br/>");
}

/*****************************************************************************************/
// Pause magic
/*****************************************************************************************/
function init_pause_elements() {
    for(var i=0; i<N_ELEMENTS; ++i) {
        var x = rand_range(0, 100*PIT_WIDTH-1)/100;
        var y = rand_range(0, 100*PIT_HEIGHT-1)/100;
        var z = rand_range(0, 100*PIT_DEPTH-1)/100;
        var d = 0.01*rand_range(4, 6);
        PAUSE_ELEMENTS[i] = [x,y,z,d];
    }
}

function pause(canvas, ctx) {
    if(STATE.paused) {
        clearTimeout(ID1);
        
        FORCE_DEPTH_COLOR = 1;
        draw_pit(canvas, ctx, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH);
        render_layers(canvas, ctx, LAYERS, 1);
        
        ID1 = setInterval(function() { game_loop(canvas, ctx) }, FRAME_DELAY);
        if(AUTOFALL_DELAY)
            ID2 = setInterval(function() { autofall(canvas, ctx) }, AUTOFALL_DELAY);
        STATE.paused = 0;
        
        $("#score").css("display","block");
        $("#column").css("display","block");
        $("#pause").css("display","none");
    }
    else {
        clearTimeout(ID1);
        clearTimeout(ID2);
        STATE.paused = 1;
        
        var tmp = generate_layers(PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH);
        init_layers(tmp, 4);
        FORCE_DEPTH_COLOR = 0;
        
        draw_pit(canvas, ctx, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH);
        render_layers(canvas, ctx, tmp, 1);
        
        $("#score").css("display","none");
        $("#column").css("display","none");
        $("#pause").css("display","block");
    }        
}

/*****************************************************************************************/
// Gameplay
/*****************************************************************************************/
function reset_pit(type) {
    LAYERS = generate_layers(PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH);
    init_layers(LAYERS, type);
    COUNTS = generate_counts(LAYERS);
}

function init_game_keys(canvas, ctx) {
    var start_handler = function(e) { 
        if(!STATE.setkeys && e.which==32) {
            LAST_KEY_EL = 0;
            play_game(canvas, ctx, start_handler); 
        }
        if(e.which==27) {
            set_ui_start();
        }
    };
    $(document).keydown(start_handler);
}

function end_game(canvas, ctx) {
    $(document).unbind("keydown");
    
    clearTimeout(ID1);
    clearTimeout(ID2);
    
   
    set_ui_gameover('Wynik:');
    init_game_keys(canvas, ctx);
}

function handle_key(e, canvas, ctx) {
    if(STATE.paused) { pause(canvas, ctx); return }
    
    var translate_flag = 0;
    var rotate_flag = 0;
    var drop_flag = 0;
    var anim_flag = 0; 
    
    var dx = 0, dy = 0, dz = 0;
    var da = [0,0,0];
    
    switch(e.which) {
    // translations
    case KEYMAP["X+"]: translate_flag = 1; dx = DELTA;  break;
    case KEYMAP["X-"]: translate_flag = 1; dx = -DELTA; break;
    case KEYMAP["Y+"]: translate_flag = 1; dy = DELTA;  break;
    case KEYMAP["Y-"]: translate_flag = 1; dy = -DELTA; break;
    case KEYMAP["Z+"]: translate_flag = 1; dz = DELTA;  break;
    case KEYMAP["Z-"]: translate_flag = 1; dz = -DELTA; break;
        
    // rotations
    case KEYMAP["A+"]: rotate_flag = 1; da[0] = DELTA_ANGLE;  break;
    case KEYMAP["A-"]: rotate_flag = 1; da[0] = -DELTA_ANGLE; break;
    case KEYMAP["B+"]: rotate_flag = 1; da[1] = DELTA_ANGLE;  break;
    case KEYMAP["B-"]: rotate_flag = 1; da[1] = -DELTA_ANGLE; break;
    case KEYMAP["C+"]: rotate_flag = 1; da[2] = DELTA_ANGLE;  break;
    case KEYMAP["C-"]: rotate_flag = 1; da[2] = -DELTA_ANGLE; break;
    
    // space
    case KEYMAP["D"]: drop_flag = 1; break;
    
    // pause
    case 80: pause(canvas, ctx); break;
    
    // escape
    case 27: game_over(canvas, ctx); break;
    }
        
    var nvoxels;
    
    if(translate_flag) {
        nvoxels = project_voxels(STATE.piece, STATE.new_x+dx, STATE.new_y+dy, STATE.new_z+dz, STATE.new_angles);
        if(!is_overlap_layers(nvoxels, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH, LAYERS)) {
            STATE.new_x += dx;
            STATE.new_y += dy;
            STATE.new_z += dz;
            anim_flag = 1;
        }
        e.preventDefault();
    }
    
    if(rotate_flag) {
        nvoxels = project_voxels(STATE.piece, STATE.new_x,STATE.new_y,STATE.new_z, [STATE.new_angles[0]+da[0], STATE.new_angles[1]+da[1], STATE.new_angles[2]+da[2]]);
        var deltas = overlap_diff(nvoxels, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH);
        STATE.new_x += deltas[0];
        STATE.new_y += deltas[1];
        STATE.new_z += deltas[2];
        STATE.new_angles[0] += da[0];
        STATE.new_angles[1] += da[1];
        STATE.new_angles[2] += da[2];
        anim_flag = 1;         
    }
    
    if(drop_flag) {
        for(var i=0; i<PIT_DEPTH; ++i) {
            nvoxels = project_voxels(STATE.piece, STATE.new_x,STATE.new_y,STATE.new_z+DELTA, STATE.new_angles);
            if(!is_overlap_layers(nvoxels, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH, LAYERS)) {
                STATE.new_z += DELTA;
                anim_flag = 1;
            }
            else {
                break;
            }
        }
        STATE.touchdown_flag = 1;
        e.preventDefault();
    }
    
    if(anim_flag) set_start();
}

function play_game(canvas, ctx, start_handler) {
    $(document).unbind("keydown", start_handler);
    set_ui_game();
    reset_pit(0);
    refresh_column();
    
    STATE.paused = 0;
    STATE.score = 0;
    refresh_score();
    
    STATE.refresh_layers_flag = 1;
    reset(canvas, ctx);
    STATE.refresh_layers_flag = 0;
    
    START = (new Date).getTime();
    ID1 = setInterval(function() { game_loop(canvas, ctx) }, FRAME_DELAY);
    if(AUTOFALL_DELAY)
        ID2 = setInterval(function() { autofall(canvas, ctx) }, AUTOFALL_DELAY);
    
    $(document).keydown(function(e) { handle_key(e, canvas, ctx); });
}

// fps counter globals
var COUNTER = 0;
var EC = 0; SC = 0, XC = 0;

function game_loop(canvas, ctx) {
    END = (new Date).getTime();
    ELAPSED = END - START;
    START = END;
        
    //if(ELAPSED<FRAME_DELAY) {  log(ELAPSED); ELAPSED = FRAME_DELAY; }

    /*
    // FPS averaged over multiple frames
    // to avoid JS getTime inaccuracies
    //  -- http://ejohn.org/blog/accuracy-of-javascript-time/
    COUNTER += 1;
    if(COUNTER % 50 == 0) {
        EC = (new Date).getTime();
        XC = EC - SC;
        SC = EC;
        $("#fps").text(50*(1000/XC).toFixed(1));
    }
    */
    
    STATE.progress = cap(STATE.progress+ELAPSED/ANIM_DURATION, 1);
    
    if(STATE.touchdown_flag && STATE.progress>=1) {
        touchdown();
        if(STATE.new_z==0) game_over(canvas, ctx);
        else new_piece(canvas, ctx);
    }
   
    // animate
    // STATE.current_x = STATE.start_x + STATE.progress*(STATE.new_x - STATE.start_x);
    // STATE.current_y = STATE.start_y + STATE.progress*(STATE.new_y - STATE.start_y);
    // STATE.current_z = STATE.start_z + STATE.progress*(STATE.new_z - STATE.start_z);
    
    // STATE.current_angles[0] = STATE.start_angles[0] + STATE.progress*(STATE.new_angles[0] - STATE.start_angles[0]);
    // STATE.current_angles[1] = STATE.start_angles[1] + STATE.progress*(STATE.new_angles[1] - STATE.start_angles[1]);
    // STATE.current_angles[2] = STATE.start_angles[2] + STATE.progress*(STATE.new_angles[2] - STATE.start_angles[2]);

    STATE.current_x = lerp(STATE.start_x, STATE.new_x, STATE.progress);
    STATE.current_y = lerp(STATE.start_y, STATE.new_y, STATE.progress);
    STATE.current_z = lerp(STATE.start_z, STATE.new_z, STATE.progress);

    STATE.current_angles[0] = lerp(STATE.start_angles[0], STATE.new_angles[0], STATE.progress);
    STATE.current_angles[1] = lerp(STATE.start_angles[1], STATE.new_angles[1], STATE.progress);
    STATE.current_angles[2] = lerp(STATE.start_angles[2], STATE.new_angles[2], STATE.progress);

    // render
    render_frame(canvas, ctx);
}

function render_frame(canvas, ctx) {
    draw_pit(canvas, ctx, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH);
    render_layers(canvas, ctx, LAYERS, STATE.refresh_layers_flag);
    if(STATE.render_piece_flag)
        render_piece(canvas, ctx, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH, STATE.current_x,STATE.current_y,STATE.current_z, STATE.piece, STATE.current_angles, PIECE_COLOR);
}

function reset(canvas, ctx) {
    STATE.pi = ALLOWED[rand_range(0, ALLOWED.length-1)];
    STATE.piece = PIECES[SET][STATE.pi];
    STATE.current_x = 0;
    STATE.current_y = 0;
    STATE.current_z = 0;
    STATE.current_angles = [0,0,0];

    STATE.new_x = 0;
    STATE.new_y = 0;
    STATE.new_z = 0;
    STATE.new_angles = [0,0,0];
    
    STATE.start_x = 0;
    STATE.start_y = 0;
    STATE.start_z = 0;
    STATE.start_angles = [0,0,0];
    
    STATE.progress = 0;
    
    STATE.render_piece_flag = 1;
    STATE.touchdown_flag = 0;
    
    render_frame(canvas, ctx);
}

function set_start() {
    STATE.start_x = STATE.current_x;
    STATE.start_y = STATE.current_y;
    STATE.start_z = STATE.current_z;
        
    STATE.start_angles[0] = STATE.current_angles[0];
    STATE.start_angles[1] = STATE.current_angles[1];
    STATE.start_angles[2] = STATE.current_angles[2];

    STATE.progress = 0;
}

function touchdown() {
    STATE.render_piece_flag = 0;
    STATE.refresh_layers_flag = 1;
    
    nvoxels = project_voxels(STATE.piece, STATE.new_x,STATE.new_y, STATE.new_z, STATE.new_angles);
    STATE.score += add_voxels(nvoxels, LAYERS, COUNTS);
        
    STATE.score += check_full_layers(LAYERS, COUNTS);
    refresh_score();
    
    refresh_column();
}

function new_piece(canvas, ctx) {
    reset(canvas, ctx);
}

function game_over(canvas, ctx) {
    render_pit(canvas, ctx);
    end_game(canvas, ctx);
}

function autofall(canvas, ctx) {
    var nvoxels = project_voxels(STATE.piece, STATE.new_x,STATE.new_y, STATE.new_z+DELTA, STATE.new_angles);
    if(!is_overlap_layers(nvoxels, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH, LAYERS)) {
        set_start();
        STATE.new_z += DELTA;
    }
    else {
        touchdown();
        if(STATE.new_z==0) game_over(canvas, ctx);
        else new_piece(canvas, ctx);
    }
}

/*****************************************************************************************/
// User interface
/*****************************************************************************************/
function change_set(el) {
    var which = el.innerHTML.toLowerCase();
    SET = which;
    
    save_settings();
    reset_allowed();
}

function change_pit(el, canvas, ctx) {
    var dimensions = el.innerHTML.toLowerCase().split("x");
    PIT_WIDTH  = parseInt(dimensions[0]);
    PIT_HEIGHT = parseInt(dimensions[1]);
    PIT_DEPTH  = parseInt(dimensions[2]);
    
    save_settings();
    
    init_colors(PIT_DEPTH);
    
    reset_pit(3);
    render_pit(canvas, ctx);
    
    reset_allowed();
}

function change_speed(el) {
    var speed = parseInt(el.innerHTML);
    SPEED = speed;
    AUTOFALL_DELAY = SPEED_MAP[SPEED];
    
    save_settings();
}

function reset_allowed() {
    ALLOWED = [];
    for(var i=0; i<PIECES[SET].length; ++i) {
        var bb = PIECES[SET][i].bb;
        if(bb.x[0]>=0 && bb.x[1]<=PIT_WIDTH &&
           bb.y[0]>=0 && bb.y[1]<=PIT_HEIGHT &&
           bb.z[0]>=0 && bb.z[1]<=PIT_DEPTH)
            ALLOWED.push(i);
    }
}

/*****************************************************************************************/
// User interface (macros)
/*****************************************************************************************/
function set_ui_start() {
    STATE.setkeys = 0;
    $(".hud").css("display", "none");
    $("#column").css("display", "none");
    $("#footer").css("display", "block");
    $("#message").css("display", "block");
    $("#difficulty").css("display", "block");
}

function set_ui_game() {
    $(".hud").css("display", "none");
    $("#footer").css("display", "none");
    $("#score").css("display", "block");
    $("#column").css("display", "block");
}

function set_ui_gameover(scorelabel) {
    $("#scorelabel").html(scorelabel);
    $("#finalscore").text(pretty_number(STATE.score));
    $("#column").css("display", "none");
    $(".hud").css("display", "none");
    $("#score").css("display", "none");
    $("#footer").css("display", "block");
    $("#over").css("display", "block");
    $("#difficulty").css("display", "block");
}

function refresh_score() {
    $("#score").text(pretty_number(STATE.score));
}

/*****************************************************************************************/
// Settings
/*****************************************************************************************/
function save_settings() {
    var tmp = SET+":"+PIT_WIDTH+":"+PIT_HEIGHT+":"+PIT_DEPTH+":"+SPEED;
    $.cookie('co_settings', tmp, { expires: 10000 });
}

function load_settings() {
    var tmp = $.cookie('co_settings');
    if(tmp) {
        var chunks = tmp.split(":");
        var set = chunks[0];
        if(TEMPLATES[set] != undefined) SET = set;
        
        PIT_WIDTH  = parseInt(chunks[1]);
        PIT_HEIGHT = parseInt(chunks[2]);
        PIT_DEPTH  = parseInt(chunks[3]);
        
        SPEED = parseInt(chunks[4]);
        AUTOFALL_DELAY = SPEED_MAP[SPEED];
    }
}

/*****************************************************************************************/
// Keys
/*****************************************************************************************/
function copy_keymap(src, dst) {
    for(var i in src)
        dst[i] = src[i];
}


/*****************************************************************************************/
// Colum
/*****************************************************************************************/
function refresh_column() {
    var xcanvas = $("#screen2");
    var canvas = xcanvas.get(0);
    var ctx = canvas.getContext("2d");
    var width = xcanvas.parent().width();
    var height = xcanvas.parent().height();
    
    xcanvas.attr('width',width).attr('height', height);
        
    var i,c,top,bottom,lingrad;
    var unit = width;
    var sy = height-(unit+2)*COUNTS.length+2;
    for(i=0; i<COUNTS.length; ++i) {
        top = sy+i*(unit+2);
        if(COUNTS[i]!=undefined && COUNTS[i]>0) {
            var c = COLORS[COLORS.length-1-i];
            var c2 = "hsla("+c[0]+","+c[1]+"%,"+(c[2]-10)+"%,"+c[3]+")";
            var c1 = "hsla("+c[0]+","+c[1]+"%,"+(c[2]-30)+"%,"+c[3]+")";
            
            bottom = top+unit;
            lingrad = ctx.createLinearGradient(0,top,width,bottom);
            lingrad.addColorStop(0.0, c2);
            lingrad.addColorStop(1.0, c1);
            ctx.fillStyle = lingrad;
            //ctx.fillStyle = c1;
        }
        else {
            ctx.fillStyle = "#050505";
        }
        ctx.fillRect(0,top,unit,unit);
    }
}

/*****************************************************************************************/
// Main
/*****************************************************************************************/
$(document).ready(function(){
    copy_keymap(KEYMAP_DEFAULT, KEYMAP);
    copy_keymap(KEYMAP, KEYMAP_TMP);

    load_settings();
    
    var xcanvas = $("#screen");
    var canvas = xcanvas.get(0);
    var ctx = canvas.getContext("2d");
    xcanvas.attr('width', WIDTH).attr('height', HEIGHT);
    
    precompute_pieces();
    init_colors(PIT_DEPTH);
    
    reset_pit(3); 
    render_pit(canvas, ctx);
    reset_allowed();
    
    init_game_keys(canvas, ctx);
    
    // difficulty settings
    $("#pieces .button").each(function() { if($(this).text().toLowerCase()==SET) $(this).addClass("on");});
    $("#pieces .button").click(function() { change_set($(this).get(0)); $("#pieces .button").removeClass("on"); $(this).addClass("on"); });
    
    var pit_string = PIT_WIDTH+"x"+PIT_HEIGHT+"x"+PIT_DEPTH;
    $("#pit .button").each(function() { if($(this).text().toLowerCase()==pit_string) $(this).addClass("on");});
    $("#pit .button").click(function() { change_pit($(this).get(0), canvas, ctx); $("#pit .button").removeClass("on"); $(this).addClass("on"); });
    
    $("#speed .button").each(function() { if($(this).text().toLowerCase()==SPEED) $(this).addClass("on");});
    $("#speed .button").click(function() { change_speed($(this).get(0)); $("#speed .button").removeClass("on"); $(this).addClass("on"); });
    
    refresh_column();
});
