/* Rendering & stuff */
function project(cwidth, cheight, width, height, x,y,z) {        
    var offsetx1 = z*ZSIZE_X-z*z;
    var offsety1 = z*ZSIZE_Y-z*z;
    
    var xsize1 = (cwidth-2*offsetx1)/width;
    var ysize1 = (cheight-2*offsety1)/height;
    
    var px = Math.round(offsetx1 + x*xsize1);
    var py = Math.round(offsety1 + y*ysize1);
    
    return {'x':px, 'y':py};
}

function translate(p, t) {
    return [p[0]+t[0], p[1]+t[1], p[2]+t[2]];
}

function rotate(p, angles) {
    // X-axis
    var cos = Math.cos(angles[0]);
    var sin = Math.sin(angles[0]);
    
    var x = p[0];
    var y = p[1] * cos - p[2] * sin;
    var z = p[1] * sin + p[2] * cos;
    
    // Y-axis
    cos = Math.cos(angles[1]);
    sin = Math.sin(angles[1]);
    
    var a = x * cos - z * sin;
    var b = x * sin + z * cos;
    x = a;
    z = b;
    
    // Z-axis
    cos = Math.cos(angles[2]);
    sin = Math.sin(angles[2]);
        
    a = x * cos - y * sin;
    b = x * sin + y * cos;
    x = a;
    y = b;
    
    return [x,y,z];
}

function bbox(lines) {
    if(lines.length>0) {
        var minx = lines[0][0][0];
        var maxx = minx;
        var miny = lines[0][0][1];
        var maxy = miny;
        var minz = lines[0][0][2];
        var maxz = minz;
        for(var i=0; i<lines.length; ++i) {
            if(lines[i][0][0]<minx) minx = lines[i][0][0];
            else if(lines[i][0][0]>maxx) maxx = lines[i][0][0];
            
            if(lines[i][0][1]<miny) miny = lines[i][0][1];
            else if(lines[i][0][1]>maxy) maxy = lines[i][0][1];
            
            if(lines[i][0][2]<minz) minz = lines[i][0][2];
            else if(lines[i][0][2]>maxz) maxz = lines[i][0][2];
            
            if(lines[i][1][0]<minx) minx = lines[i][1][0];
            else if(lines[i][1][0]>maxx) maxx = lines[i][1][0];
            
            if(lines[i][1][1]<miny) miny = lines[i][1][1];
            else if(lines[i][1][1]>maxy) maxy = lines[i][1][1];
            
            if(lines[i][1][2]<minz) minz = lines[i][1][2];
            else if(lines[i][1][2]>maxz) maxz = lines[i][1][2];
        }
        return {'x':[minx,maxx], 'y':[miny,maxy], 'z':[minz,maxz] };
    }
    else 
        return {'x':[0,0], 'y':[0,0], 'z':[0,0] };
}

function bbox_voxels(points) {
    if(points.length>0) {
        var minx = points[0][0];
        var maxx = minx;
        var miny = points[0][1];
        var maxy = miny;
        var minz = points[0][2];
        var maxz = minz;
        for(var i=1; i<points.length; ++i) {
            if(points[i][0]<minx) minx = points[i][0];
            else if(points[i][0]>maxx) maxx = points[i][0];
            
            if(points[i][1]<miny) miny = points[i][1];
            else if(points[i][1]>maxy) maxy = points[i][1];
            
            if(points[i][2]<minz) minz = points[i][2];
            else if(points[i][2]>maxz) maxz = points[i][2];
        }
        return {'x':[minx,maxx], 'y':[miny,maxy], 'z':[minz,maxz] };
    }
    else 
        return {'x':[0,0], 'y':[0,0], 'z':[0,0] };
}

function line3d(ctx, cwidth, cheight, width, height, s, e, color) {
    var p1 = project(cwidth, cheight, width, height, s[0],s[1],s[2]);
    var p2 = project(cwidth, cheight, width, height, e[0],e[1],e[2]);
    
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
}

function point3d(ctx, cwidth, cheight, width, height, s, color, radius) {
    var p1 = project(cwidth, cheight, width, height, s[0],s[1],s[2]);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, radius, 0, 6.28, 0);
    ctx.fill();
}


function draw_pit(canvas, ctx, width, height, depth, refresh_flag) {
    if(CACHE_PIT == 0 || refresh_flag) {
        
        // colors
        var color1  = "#555555";    // gradient start
        var color2  = "#000000";    // gradient end
        var bgcolor = BG_COLOR;    // pit background    
        
        var cwidth = canvas.width;
        var cheight = canvas.height;
        
        // background
        ctx.fillStyle = bgcolor;
        ctx.fillRect(0,0, cwidth, cheight);
        
        // levels    
        ctx.lineWidth = LINEWIDTH_PIT;
        
        var offsetx = 0, offsety = 0;
        var r,g,b;
        for(var z=1; z<depth+1; ++z) {
            offsetx = z*(ZSIZE_X-z);
            offsety = z*(ZSIZE_Y-z);
            
            r = g = b = Math.floor(64*(0.5+2*(depth-z)/depth));
            ctx.strokeStyle = "rgb("+r+","+g+","+b+")";
            //b = Math.floor(64*(0.1+1*(depth-z)/depth));
            //ctx.strokeStyle = "hsl(0,90%,"+b+"%)";
            
            ctx.strokeRect(offsetx, offsety, cwidth-2*offsetx, cheight-2*offsety);
            if(z==depth) {
                ctx.fillStyle = "#000";
                ctx.fillRect(offsetx, offsety, cwidth-2*offsetx, cheight-2*offsety);  
            }
        }
        
        var xsize_bottom = (cwidth-2*offsetx)/width;
        var ysize_bottom = (cheight-2*offsety)/height;
        var xsize_top = cwidth/width;
        var ysize_top = cheight/height;
                
        // bottom grid
        ctx.beginPath();  
        for(var x=1; x<width; ++x) {
            ctx.moveTo(offsetx+x*xsize_bottom, offsety);
            ctx.lineTo(offsetx+x*xsize_bottom, cheight-offsety);  
        }    
        for(var y=1; y<height; ++y) {
            ctx.moveTo(offsetx, offsety+y*ysize_bottom);
            ctx.lineTo(cwidth-offsetx, offsety+y*ysize_bottom);  
        }
        ctx.stroke();
                
        // top crossing
        var lingrad = ctx.createLinearGradient(0,0,0,cheight/2);
        lingrad.addColorStop(0.0, color1);
        lingrad.addColorStop(1.0, color2);
        ctx.strokeStyle = lingrad;
        
        ctx.beginPath();
        for(var x=0; x<width+1; ++x) {
            ctx.moveTo(x*xsize_top, 0);
            ctx.lineTo(offsetx+x*xsize_bottom, offsety);
        }
        ctx.stroke();
        
        // bottom crossing
        lingrad = ctx.createLinearGradient(0,cheight,0,cheight/2);
        lingrad.addColorStop(0.0, color1);
        lingrad.addColorStop(1.0, color2);
        ctx.strokeStyle = lingrad;
        
        ctx.beginPath();
        for(var x=0; x<width+1; ++x) {
            ctx.moveTo(x*xsize_top, cheight);
            ctx.lineTo(offsetx+x*xsize_bottom, cheight-offsety);  
        }
        ctx.stroke();
        
        // left crossing
        lingrad = ctx.createLinearGradient(0,0,cwidth/2,0);
        lingrad.addColorStop(0.0, color1);
        lingrad.addColorStop(1.0, color2);
        ctx.strokeStyle = lingrad;
        
        ctx.beginPath();
        for(var y=1; y<height; ++y) {
            ctx.moveTo(0, y*ysize_top);
            ctx.lineTo(offsetx, offsety+y*ysize_bottom);  
        }
        ctx.stroke();
        
        // right crossing
        lingrad = ctx.createLinearGradient(cwidth,0,cwidth/2,0);
        lingrad.addColorStop(0.0, color1);
        lingrad.addColorStop(1.0, color2);
        ctx.strokeStyle = lingrad;
        
        ctx.beginPath();
        for(var y=1; y<height; ++y) {
            ctx.moveTo(cwidth, y*ysize_top);
            ctx.lineTo(cwidth-offsetx, offsety+y*ysize_bottom);  
        }        
        ctx.stroke();
        
        if(CACHE_PIT == 0) {
            var cache = $("<canvas></canvas>");
            cache.css("display","none");
            $("body").append(cache);
            cache.attr('width', cwidth).attr('height', cheight);
            CACHE_PIT = cache.get(0);
        }
        CACHE_PIT.getContext("2d").drawImage(canvas,0,0);
    }
    else {
        ctx.drawImage(CACHE_PIT,0,0);
    }
}

function render_cube(canvas, ctx, width, height, depth, x,y,z, color, faces, outline) {
    var cwidth = canvas.width;
    var cheight = canvas.height;
        
    // This breaks Opera, no idea why expanded expressions work
    /* 
    var offsetx1 = z*(ZSIZE_X-z);
    var offsety1 = z*(ZSIZE_Y-z);
    
    var offsetx2 = (z+1)*(ZSIZE_X-(z+1));
    var offsety2 = (z+1)*(ZSIZE_Y-(z+1));    
    */
    var offsetx1 = z*ZSIZE_X-z*z;
    var offsety1 = z*ZSIZE_Y-z*z;
    
    var offsetx2 = z*ZSIZE_X-z*z-z+ZSIZE_X-z-1;
    var offsety2 = z*ZSIZE_Y-z*z-z+ZSIZE_Y-z-1;
    
    var xsize1 = (cwidth-2*offsetx1)/width;
    var ysize1 = (cheight-2*offsety1)/height;
    
    var xsize2 = (cwidth-2*offsetx2)/width;
    var ysize2 = (cheight-2*offsety2)/height;

    var left1   = Math.round(offsetx1 + x*xsize1);
    var top1    = Math.round(offsety1 + y*ysize1);
    var right1  = Math.round(left1 + xsize1);
    var bottom1 = Math.round(top1 + ysize1);
    
    var left2   = Math.round(offsetx2 + x*xsize2);
    var top2    = Math.round(offsety2 + y*ysize2);
    var right2  = Math.round(left2 + xsize2);
    var bottom2 = Math.round(top2 + ysize2);
    
    var cx = 0.5*width;
    var cy = 0.5*height;
    
    /*
    // bottom side
    ctx.fillStyle = "#aaa";
    ctx.strokeStyle = "#000000";
    ctx.fillRect(  left2, top2, xsize2,ysize2);
    ctx.strokeRect(left2, top2, xsize2,ysize2);
    */

    var lightness = (0.3+0.7*(depth-z)/depth)*color[2];
    var topcolor = "hsla("+Math.floor(color[0])+","+Math.floor(color[1])+"%,"+Math.floor(lightness)+"%,"+color[3]+")";
    var sidecolor = "hsla("+Math.floor(color[0])+","+Math.floor(color[1])+"%,"+Math.floor(0.75*lightness)+"%,"+color[3]+")";
    var sidecolor2 = "hsla("+Math.floor(color[0])+","+Math.floor(color[1])+"%,"+Math.floor(0.5*lightness)+"%,"+color[3]+")";
    
    var render_style = CUBE_STYLE;
    
    ctx.lineWidth = LINEWIDTH_CUBE;
    
    // right side
    if(faces[0] && x<cx) {
        
        if(render_style == CUBE_GRADIENT) {
            var lingrad = ctx.createLinearGradient(right1,top1,right2,bottom2);
            lingrad.addColorStop(0.0, sidecolor);
            lingrad.addColorStop(1.0, sidecolor2);
            ctx.fillStyle = lingrad;
        }
        else
            ctx.fillStyle = sidecolor2;
        
        if(outline)
            ctx.strokeStyle = outline;
        else
            ctx.strokeStyle = sidecolor2;
        ctx.beginPath();
        ctx.moveTo(right1, top1);
        ctx.lineTo(right2, top2);
        ctx.lineTo(right2, bottom2);
        ctx.lineTo(right1, bottom1);
        ctx.fill();
        ctx.stroke();
    }
    
    // down side
    if(faces[1] && (y+1)<cy) {
        ctx.fillStyle = sidecolor;
        if(outline)
            ctx.strokeStyle = outline;
        else
            ctx.strokeStyle = sidecolor;
        ctx.beginPath();
        ctx.moveTo(left1, bottom1);
        ctx.lineTo(left2, bottom2);
        ctx.lineTo(right2, bottom2);
        ctx.lineTo(right1, bottom1);
        ctx.fill();
        ctx.stroke();
    }
    
    // left side
    if(faces[2] &&x>cx) {
        ctx.fillStyle = sidecolor2;
        if(outline)
            ctx.strokeStyle = outline;
        else
            ctx.strokeStyle = sidecolor2;
        ctx.beginPath();
        ctx.moveTo(left1, top1);
        ctx.lineTo(left2, top2);
        ctx.lineTo(left2, bottom2);
        ctx.lineTo(left1, bottom1);
        ctx.fill();
        ctx.stroke();
    }
    
    // up side
    if(faces[3] &&y>cy) {
        ctx.fillStyle = sidecolor;
        if(outline)
            ctx.strokeStyle = outline;
        else
            ctx.strokeStyle = sidecolor;
        ctx.beginPath();
        ctx.moveTo(right1, top1);
        ctx.lineTo(right2, top2);
        ctx.lineTo(left2, top2);
        ctx.lineTo(left1, top1);
        ctx.fill();
        ctx.stroke();
    }
    
    // top side
    if(faces[4]) {
        if(render_style == CUBE_GRADIENT) {
            var lingrad = ctx.createLinearGradient(left1,top1,left1+xsize1,top1+ysize1);
            lingrad.addColorStop(0.0, topcolor);
            lingrad.addColorStop(0.5, sidecolor);
            lingrad.addColorStop(1.0, sidecolor2);
            ctx.fillStyle = lingrad;
        }
        else
            ctx.fillStyle = topcolor;

        if(outline)
            ctx.strokeStyle = outline;
        else
            ctx.strokeStyle = topcolor;
        ctx.fillRect  (left1, top1, xsize1,ysize1);
        ctx.strokeRect(left1, top1, xsize1,ysize1);
    }
}
