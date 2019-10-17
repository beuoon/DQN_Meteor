/*
DQN을 접목할 수 있는 모델: 
예측 가능한 시나리오
→ 같은 state에서 동일한 action을 할 때 무조건 같은 reward와 next state가 나와야 한다.
→ reward가 다른 state는 구분 가능해야한다.?
*/

/*
변경되는 점:
- 움직이면 -0.2 reward 부여
*/
var Scene = function (canvasId) {
	this.fpsVal = 60;
	this.gameSize = {width: 50, height: 50};
	this.gamePause = false;
	this.targetX = this.gameSize.width/2;
	
	this.canvas = document.getElementById(canvasId);
	this.canvas.width = this.gameSize.width;
	this.canvas.height = this.gameSize.height;
	this.context = this.canvas.getContext('2d');
	
	// DQN
	this.TRAIN_EPOCH = 5; // 한번 train 할 때 시행할 epoch 값
	this.SKIPPING_FRAME = 4; // 수집하는 프레임 간격
	
	// Init
	this.init();
	this.initNetwork();
}
Scene.prototype = {
	init: function () {
		// 오브젝트
		this.player = new Player(this.gameSize);
		
		this.stars = [];
		this.starNum = 1; // 원래는 10
		this.bTraceStar = true;
		
		for (let i = 0; i < this.starNum; i++)
			this.stars.push(this.createStar());
		this.particleObjects = [];
		
		// 화면 위치 및 진동
		this.pos = {x: 0, y: 0};
		this.waveFrame = 0;
		this.wavePower = 0;
	
		// 점수
		this.score = 0;
		this.prevStageScore = 0;
		this.bEndGame = false;
		
		// Frame
		this.fpsTime = clock();
		this.fpsCount = 0;
		this.fpsReal = 0;
		this.frameStartTime = clock();
		this.frameCount = 0;
	},
	start: function () {
		this.frame();
	},
	
	initNetwork: function () {
		this.network = new DQN();
		this.image = null;
		this.bNetworkAction = true; // 네트워크 액션
		this.epochCount = 0;
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
		if (!this.gamePause) {
			if (!this.bEndGame) {
				this.update(frameInterval);
				this.draw();
			}
			else {
				if (this.epochCount == 0)
					this.network.reset();
				
				if (this.epochCount++ < this.TRAIN_EPOCH)
					this.network.train();
				else {
					this.init();
					this.epochCount = 0;
				}
			}
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
		if (this.bEndGame) return ;
		
		// DQN
		let actionNumber = 1;
		if (this.image != null) {
			actionNumber = this.network.update(this.image);
			this.image = null;
			
			// 선택한 actionNumber에 따라 행동
			switch (actionNumber) {
				case 0: this.player.setMoveState("LEFT");  break;
				case 1: this.player.setMoveState("STOP");  break;
				case 2: this.player.setMoveState("RIGHT"); break;
			}
		}
		
		// 플레이어
		this.player.update(frameInterval);
		
		// 스테이지
		if (this.player.checkLive()) {
			// 점수 상승
			this.score += 100 * frameInterval;
			
			// 점수에 따른 난이도 증가
			// if (this.score - this.prevStageScore > 750) {
			// 	this.starNum++;
			// 	for (let i = this.stars.length; i < this.starNum; i++)
			// 		this.stars.push(this.createStar());
			
			// 	this.prevStageScore = this.score;
			// }
		}
		
		// 유성
		for (let i = this.stars.length - 1; i >= 0; i--) {
			let star = this.stars[i];
			star.update(frameInterval);
			
			if (star.pos.x - star.size.width/2 <= 0 || star.pos.x + star.size.width/2 >= this.gameSize.width) // 벽에 부딪히면 튕김
				star.reflect();
			if (star.pos.y >= this.gameSize.height) // 지상에 부딪히면 파괴
				star.destroy();
			this.player.collision(star); // 충돌 확인
			
			this.particleObjects = this.particleObjects.concat(star.popObjetcs()); // 잔흔 파티클 처리
			
			if (star.checkCollision()) {
				this.wavePower += 5.0; // 진동 세기 증가
				this.targetX = this.player.pos.x; // 다음번 유성의 목적지
				
				let reward = (actionNumber == 1) ? 0 : -0.2;
				if (this.player.live) {
					reward = 1;
					if (this.bTraceStar)
						this.stars[i] = this.createStar(true); // 플레이어 살아있으면 유성 계속 생성
					else
						this.stars[i] = this.createStar();
					this.bTraceStar = !this.bTraceStar;
				}
				else {
					reward = -1;
					this.stars.splice(i, 1); // 유성 삭제
					this.bEndGame = true;
				}
				this.network.setReward(reward);
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
		
		// this.pos.x = Math.sin(this.waveFrame * Math.PI * 2) * this.wavePower; // 좌우 진동
		// this.pos.y = Math.cos(this.waveFrame * Math.PI * 2) * this.wavePower; // 상하 진동
	},
	
	draw: function () {
		var context = this.context;
		
		context.save();
        context.fillStyle = "#FFFFFF";
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.restore();
		
        context.save();
		// this.drawFPS(context);
		// this.drawScore(context);
		
		context.translate(this.pos.x, this.pos.y);
		
		this.player.draw(context);
		for (let i = 0; i < this.stars.length; i++)
			this.stars[i].draw(context);
		for (let i = 0; i < this.particleObjects.length; i++)
			this.particleObjects[i].draw(context);
		
		context.restore();
		
		// Extract Data
		if (++this.frameCount % this.SKIPPING_FRAME == 0) {
			let grayData = processImageData(context, this.network.IMAGE_SIZE.width, this.network.IMAGE_SIZE.height);
			this.image = encodeData(grayData);
			this.frameCount = 0;
		}
	},
	drawFPS: function (context) {
		context.beginPath();
		context.fillText("FPS : " + this.fpsReal, 0, 10);
		context.stroke();
	},
	drawScore: function (context) {
		context.beginPath();
		context.fillText("score : " + Math.floor(this.score), context.canvas.width - 60, 10);
		context.stroke();
	},
	
	createStar: function (bTrace = false) {
		// let x = 0, c = 0;
		/*
		let x = Math.random() * this.gameSize.width * 4, c = 0;
		let angle = -(Math.PI/2 - Math.atan2(this.gameSize.height, x));
		
		x += this.targetX;
		c = Math.floor(x / this.gameSize.width);
		x = x - this.gameSize.width * c;
		if (c % 2 == 1)
			x = this.gameSize.width - x;
		angle *= Math.pow(-1, c);
		console.log("star: " + x + " " + (angle * 180/Math.PI));
		*/
		let x = Math.random() * this.gameSize.width, angle = 0;
		if (bTrace)
			x = this.targetX;
				
		return new Star(x, angle);
	},
	
	keyDown: function (e) {
		switch (e.keyCode) {
			case 88: this.network.turnRandomAction(!this.network.bRandomAction); console.log("randomAction: " + this.network.bRandomAction); break; // x
			case 32: this.gamePause = !this.gamePause; console.log("Pressed Pause Button"); break;
		}
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