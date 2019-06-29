
var Scene = function (canvasId) {
	this.fpsVal = 60;
	this.gameSize = {width: 50, height: 50};
	this.gamePause = false;
	this.targetX = this.gameSize.width/2;
	
	this.canvas = document.getElementById(canvasId);
	this.canvas.width = this.gameSize.width;
	this.canvas.height = this.gameSize.height;
	this.context = this.canvas.getContext('2d');
	
	// DQN Sample
	this.bSampleCanvas = true;
    this.sampleCanvasList = [];
	this.sampleSizeList = [];
	this.SAMPLE_SCALE_RATE = 5;
	
	// DQN
	this.TRAIN_EPOCH = 50; // 한번 train 할 때 시행할 epoch 값
	this.SKIPPING_FRAME = 4; // 수집하는 프레임 간격
	
	// Init
	this.init();
	this.initNetwork();
}
/*
DQN을 접목할 수 있는 모델: 
예측 가능한 시나리오
→ 같은 state에서 동일한 action을 할 때 무조건 같은 reward와 next state가 나와야 한다.
→ reward가 다른 state는 구분 가능해야한다.
*/
/*
DQN 클래스 모델:
state: {image, image, image, ...}
data: {state, action, reward, nextState}

image → DQN → action
         ↑
	   reward

*/
Scene.prototype = {
	init: function () {
		this.predictList = null; // DQN의 각 Layer에서 forward된 값들
		
		// 오브젝트
		this.player = new Player(this.gameSize);
		
		this.stars = [];
		this.starNum = 1; // 원래는 10
		
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
	},
	start: function () {
		this.frame();
	},
	
	initNetwork: function () {
		let layer, sampleSize;
		
		this.network = new DQN(); // [망구조] http://incredible.ai/artificial-intelligence/2017/06/03/Deep-Reinforcement-Learning/
		
		sampleSize = this.CROPPING_SIZE;
		this.sampleSizeList.push(sampleSize);
		
		layer = new Layer_Convolution({width: 4, height: 4, depth: 4, num: 6}, 4, 1);
		sampleSize = layer.calcSize(sampleSize);
		this.sampleSizeList.push(sampleSize);
		this.network.addLayer(layer);
		
		layer = new Layer_Convolution({width: 3, height: 3, depth: 6, num: 8}, 3, 1);
		sampleSize = layer.calcSize(sampleSize);
		this.sampleSizeList.push(sampleSize);
		this.network.addLayer(layer);
		
		sampleSize = sampleSize.width * sampleSize.height * sampleSize.depth;
		
		this.network.addLayer(new Layer_Flatten());
		this.network.addLayer(new Layer_Linear(sampleSize, 250));
		
		this.network.addLayer(new Layer_LeackyReLU());
		this.network.addLayer(new Layer_Linear(250, 100));
		
		this.network.addLayer(new Layer_LeackyReLU());
		this.network.addLayer(new Layer_Linear(100, 50));
		
		this.network.addLayer(new Layer_LeackyReLU());
		this.network.addLayer(new Layer_Linear(50, 3));
		this.network.setActionNum(3);
		
		
		// 학습
		this.bNetworkAction = true; // 네트워크 액션
		
		// create sample canvas
		if (this.bSampleCanvas) {
			let padding = "   ";
			for (let i = 0; i < this.sampleSizeList.length; i++) {
				let sampleCanvas = [];
				let size = this.sampleSizeList[i];

				for (let j = 0; j < size.depth; j++) {
					let canvas = document.createElement('canvas');

					canvas.width = size.width * this.SAMPLE_SCALE_RATE;
					canvas.height = size.height * this.SAMPLE_SCALE_RATE;
					document.body.append(canvas);
					document.body.append(padding);
					sampleCanvas.push(canvas);
				}
				document.body.append(document.createElement("br"));
				this.sampleCanvasList.push(sampleCanvas);
			}
		}
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
			this.update(frameInterval);
			this.draw();

			if (!this.bEndGame)
				this.networkUpdate();
			else {
				this.networkLearning();
				this.init();
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
		this.player.update(frameInterval);
		
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
				this.reward = 1;
				this.stars.splice(i, 1);
				
				// if (this.player.live)
				// 	this.stars[i] = this.createStar(); // 플레이어 살아있으면 유성 계속 생성
				// else
				// 	this.stars.splice(i, 1); // 플레이어 죽으면 유성 생성 중단
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
			let grayData = processImageData(context, this.CROPPING_SIZE.width, this.CROPPING_SIZE.height);
			this.dataList.push(grayData);
			this.frameCount = 0;
		}
		
		// Draw Sample Image
		if (!this.bSampleCanvas || this.predictList == null) return;
		for (let i = 0; i < this.sampleCanvasList.length; i++) {
			for (let j = 0; j < this.sampleCanvasList[i].length; j++)
				drawImageData_Upsize(this.sampleCanvasList[i][j].getContext('2d'), decodeData(this.predictList[i][j]));
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
	
	networkUpdate: function () {
		if (this.bEndGame) return ;
		
		
		if (this.bNetworkAction) {
			// 선택한 actionNumber에 따라 행동
			switch (actionNumber) {
				case 0: this.player.setMoveState("LEFT");  break;
				case 1: this.player.setMoveState("STOP");  break;
				case 2: this.player.setMoveState("RIGHT"); break;
			}
		}
		else {
			// 플레이어 행동을 기록
			switch (this.player.lastMoveDir) {
				case -1: actionNumber = 0; break;
				case 0: actionNumber = 1; break;
				case 1: actionNumber = 2; break;
			}
		}
	},
	networkLearning: function () {
		console.log("game scroe: " + this.prevReward +  "[" + this.actionEpsilon + "]");
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		for (let c = 0; c < this.TRAIN_EPOCH; c++) {
			// 자료 순서 섞기
			for (let i = 0; i < this.replayDataList.length/2; i++) {
				let p = Math.round(Math.random() * (this.replayDataList.length - 1));
				let q = Math.round(Math.random() * (this.replayDataList.length - 1));

				let temp = this.replayDataList[p];
				this.replayDataList[p] = this.replayDataList[q];
				this.replayDataList[q] = temp;
			}
			
			// 학습
			for (let i = 0; i < this.replayDataList.length; i++) {
				let data = this.replayDataList[i][0].slice(), label = this.replayDataList[i][1].slice();
				
				data = this.network.forward(data);
				// for (let j = 0; j < data.length; j++)
				// 	if (label[j] == 0) label[j] += data[j];
				// console.log(label);
				
				data = this.network.errorLayer.diff(data, label);
				this.network.backward(data);
			}
			// console.log("epoch: " + ++this.epochCount); // TEST
		}
		this.replayDataList = [];
	},
	
	createStar: function () {
		// let x = 0, c = 0;
		let x = Math.random() * this.gameSize.width * 4, c = 0;
		let angle = -(Math.PI/2 - Math.atan2(this.gameSize.height, x));
		
		x += this.targetX;
		c = Math.floor(x / this.gameSize.width);
		x = x - this.gameSize.width * c;
		if (c % 2 == 1)
			x = this.gameSize.width - x;
		angle *= Math.pow(-1, c);
		console.log("star: " + x + " " + angle);
				
		return new Star(x, angle);
	},
	
	keyDown: function (e) {
		switch (e.keyCode) {
			case 90: this.bNetworkAction = !this.bNetworkAction; console.log("networkAction: " + this.bNetworkAction); break; // z
			case 88: this.bRandomAction = !this.bRandomAction; console.log("randomAction: " + this.bRandomAction); break; // x
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