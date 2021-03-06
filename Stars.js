
var Stars = function () {
	this.size = {width: 5, height: 5};
	this.pos = {x: Math.random()*400, y: -this.size.height};
	this.angle = 0;
	
	this.dirAngle = Math.random() * (Math.PI/2) - (Math.PI/4); // -45 ~ 45
	this.dir = {x: Math.sin(this.dirAngle), y: Math.cos(this.dirAngle)};
	this.speed = 200; // speed per second
	
	this.traceObjectNum = 1; // 잔흔 개수
	this.objetcs = [];
	
	this.bCollision = false;
}
var Stars = function (posX, angle) {
	this.size = {width: 5, height: 5};
	this.pos = {x: posX, y: -this.size.height};
	this.angle = 0;
	
	this.dirAngle = angle/180 * Math.PI; // -45 ~ 45
	this.dir = {x: Math.sin(this.dirAngle), y: Math.cos(this.dirAngle)};
	this.speed = 200; // speed per second
	
	this.traceObjectNum = 1; // 잔흔 개수
	this.objetcs = [];
	
	this.bCollision = false;
}

Stars.prototype = {
	update: function (frameInterval) {
		var pos = this.pos, size = this.size;
		var speed = this.speed, dir = this.dir;
		// this.speed += 0.45;
		
		pos.x += dir.x * speed * frameInterval;
		pos.y += dir.y * speed * frameInterval;
		
		if (pos.x - size.width/2 <= 0 || pos.x + size.width/2 >= 400) {
			dir.x *= -1;
			this.dirAngle = Math.asin(dir.x);
		}
		
		// TODO: 일정 시간 간격으로 생성되게 바꿔야 함
		// for (let i = 0; i < this.traceObjectNum; i++)
			// this.objetcs.push(new TraceObject(this.pos, this.size, this.dirAngle, this.speed));
		
		if (pos.y + size.height/2 >= 400)
			this.destroy();
 	},
	draw: function (context) {
		var pos = this.pos, angle = this.angle;
		var width = this.size.width, height = this.size.height;
		var traceObjs = this.traceObjs;
		
		context.save();
		context.beginPath();
		
		context.translate(pos.x, pos.y);
		context.rotate(angle);
		
		context.fillRect(-width/2, -height/2, width, height);
		
		context.stroke();
		context.restore();
	},
	destroy: function() {
		this.bCollision = true;
		
		// for (let i = 0; i < 20; i++)
		// 	this.objetcs.push(new ExplosionObject(this.pos, this.size, this.dirAngle, this.speed));
	},
	checkCollision: function () {
		return this.bCollision;
	},
	popObjetcs: function () {
		var objetcs = this.objetcs;
		this.objetcs = [];
		return objetcs;
	}
};

var TraceObject = function (_pos, _size, _dirAngle, _speed) {
	this.pos = {x: _pos.x, y: _pos.y};
	let size = (_size.width + _size.height) / 2;
	this.size = Math.random() * (size/4) + (size/2);
	let dirAngle = _dirAngle + Math.PI + Math.random() * (Math.PI/3*2) - Math.PI/3;
	this.dir = {x: Math.sin(dirAngle), y: Math.cos(dirAngle)};
	this.speed = _speed / 2;
	
	this.bExist = false;
};
TraceObject.prototype = {
	update: function (frameInterval) {
		var pos = this.pos, size = this.size;
		var dir = this.dir, speed = this.speed;
		
		pos.x += dir.x * this.speed * frameInterval;
		pos.y += dir.y * this.speed * frameInterval;
		
		this.speed *= 0.85;
		if (this.speed < 20)
			this.speed = 20;
		
		this.size -= this.speed * 0.2 * frameInterval;
		if (size <= 0)
			this.bExist = true;
	},
	draw: function (context) {
		var pos = this.pos, angle = this.angle;
		var size = this.size;
		var traceObjs = this.traceObjs;
		
		context.save();
		context.beginPath();
		
		context.translate(pos.x, pos.y);
		context.rotate(angle);
		
		context.fillRect(-size/2, -size/2, size, size);
		
		context.stroke();
		context.restore();
	},
	checkExist: function () {
		return this.bExist;
	}
};

var ExplosionObject = function (_pos, _size, _dirAngle, _speed) {
	this.pos = {x: _pos.x, y: _pos.y};
	let size = (_size.width + _size.height) / 2;
	this.size = Math.random() * (size/4) + (size/2);
	let dirAngle = Math.PI * Math.random() + Math.PI/2; // _dirAngle + Math.PI + Math.random() * (Math.PI/3*2) - Math.PI/3;
	this.dir = {x: Math.sin(dirAngle), y: Math.cos(dirAngle)};
	this.speed = _speed / 2;
	
	this.bExist = false;
};
ExplosionObject.prototype = {
	update: function (frameInterval) {
		var pos = this.pos, size = this.size;
		var dir = this.dir, speed = this.speed;
		
		pos.x += dir.x * this.speed * frameInterval;
		pos.y += dir.y * this.speed * frameInterval;
		
		if (this.speed < 30)
			this.speed = 30;
		
		this.size -= this.speed * 0.1 * frameInterval;
		if (size <= 0)
			this.bExist = true;
	},
	draw: function (context) {
		var pos = this.pos, angle = this.angle;
		var size = this.size;
		var traceObjs = this.traceObjs;
		
		context.save();
		context.beginPath();
		
		context.translate(pos.x, pos.y);
		context.rotate(angle); 
		
		context.fillRect(-size/2, -size/2, size, size);
		
		context.stroke();
		context.restore();
	},
	checkExist: function () {
		return this.bExist;
	}
};