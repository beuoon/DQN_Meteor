
var Scene = function (canvasId) {
	this.canvas = document.getElementById(canvasId);
	this.context = this.canvas.getContext('2d');
	
	this.fpsVal = 60;
	
	this.REWARD_GAMMA = 0.9;
	this.TRAIN_EPOCH = 10;
	
	this.init();
}
Scene.prototype = {
	init: function () {
        // RL
        this.dataList = [];
		this.prevData = null;
		this.prevReward = -1;
		this.prevMaxIndex = -1;
        
		// 오브젝트
		this.player = new Player();
		
		this.stars = [];
		this.starNum = 10;
		
		for (let i = 0; i < this.starNum; i++)
			this.stars.push(new Stars());
		this.particleObjects = [];
		
		// 화면 위치 및 진동
		this.pos = {x: 0, y: 0};
		this.waveFrame = 0;
		this.wavePower = 0;
	
		// 점수
		this.score = 0;
		this.prevStageScore = 0;
		
		// Frame
		this.fpsTime = clock();
		this.fpsCount = 0;
		this.fpsReal = 0;
		this.frameStartTime = clock();
		this.bFrameClosed = false;
	},
	start: function () {
		this.frame();
	},
	
	frame: function () {
		var currentTime = clock();
		// let frameInterval = (currentTime - this.frameStartTime) / 1000;
		let frameInterval = 1 / this.fpsVal;
        this.frameInterval = frameInterval;
		this.frameStartTime = currentTime;
		this.fpsCount++;
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		// Frame Content
		this.update(frameInterval);
		this.draw();
		
		if (!this.player.checkLive()) {
			this.init();
		}
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		// FPS Calculation
		currentTime = clock();
		if (currentTime - this.fpsTime >= 1000) {
			this.fpsTime = currentTime;
			this.fpsReal = this.fpsCount;
			this.fpsCount = 0;
		}
		
		// FPS Control
		var self = this;
		var delayTime = 1000/this.fpsVal - (currentTime - this.frameStartTime);
		delayTime = (delayTime < 0) ? 0 : delayTime;
		setTimeout(function () { self.frame.call(self) }, delayTime);
		// setTimeout(function () { self.frame.call(self) }, 0); // Non-Sync
	},
	update: function (frameInterval) {        
		this.player.update(frameInterval);
		
		// 점수 및 난이도 조절
		if (this.player.checkLive()) {
			this.score += 100 * frameInterval;
			
			if (this.score - this.prevStageScore > 750) {
				this.starNum++;
				for (let i = this.stars.length; i < this.starNum; i++)
					this.stars.push(new Stars());
				
				this.prevStageScore = this.score;
			}
		}
		
		// 유성
		var stars = this.stars;
		for (let i = stars.length - 1; i >= 0; i--) {
			stars[i].update(frameInterval);
			this.player.collision(stars[i]); // 충돌 확인
			
			this.particleObjects = this.particleObjects.concat(stars[i].popObjetcs());
			
			if (stars[i].checkCollision()) {
				this.wavePower += 5.0;
				if (this.player.live)
					stars[i] = new Stars(); // 플레이어 살아있으면 유성 계속 생성
				else
					stars.splice(i, 1); // 플레이어 죽으면 유성 생성 중단
			}
		}
		
		// 파티클 오브젝트
		for (let i = this.particleObjects.length - 1; i >= 0; i--) {
			this.particleObjects[i].update(frameInterval);
			if (this.particleObjects[i].checkExist())
				this.particleObjects.splice(i, 1);
		}
		
		// 화면 흔들림
		var waveFrame = this.waveFrame;
		this.waveFrame += frameInterval;
		if (this.waveFrame >= 1)
			this.waveFrame -= Math.floor(this.waveFrame);
		
		if (this.wavePower > 0.2)
			this.wavePower *= 0.8;
		else if (this.wavePower > 0)
			this.wavePower = 0;
		
		this.pos.x = Math.sin(this.waveFrame * Math.PI * 2) * this.wavePower; // 좌우 진동
		// this.pos.y = Math.cos(this.waveFrame * Math.PI * 2) * this.wavePower; // 상하 진동
	},
	
	draw: function () {
		var context = this.context;
		
		context.save();
        context.fillStyle = "#FFFFFF";
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.restore();
		
        context.save();
		this.drawFPS(context);
		this.drawScore(context);
		
		context.translate(this.pos.x, this.pos.y);
		
		this.player.draw(context);
		for (let i = 0; i < this.stars.length; i++)
			this.stars[i].draw(context);
		for (let i = 0; i < this.particleObjects.length; i++)
			this.particleObjects[i].draw(context);
		
		context.restore();
	},
	drawFPS: function (context) {
		context.beginPath();
		context.fillText("FPS : " + this.fpsReal, 0, 10);
		context.stroke();
	},
	drawScore: function (context) {
		context.beginPath();
		context.fillText("score : " + Math.floor(this.score), context.canvas.width - 70, 10);
		context.stroke();
	},
	
	keyDown: function (e) {
		this.player.keyDown(e);
	},
	keyPress: function (e) {
	},
	keyUp: function (e) {
		this.player.keyUp(e);
	},
	mouseDown: function (e) {
	}
};

var scene = new Scene("mainCanvas");

document.addEventListener('keydown',	function (e) { scene.keyDown(e); });
document.addEventListener('keypress',	function (e) { scene.keyPress(e); });
document.addEventListener('keyup',		function (e) { scene.keyUp(e); });
document.addEventListener('mousedown',	function (e) { scene.mouseDown(e); });
// mousedown, mousemove, mouseup

scene.start();