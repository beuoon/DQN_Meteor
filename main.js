
var Scene = function (canvasId) {
	this.canvas = document.getElementById(canvasId);
	this.context = this.canvas.getContext('2d');
    this.scaleCanvas = document.getElementById('scaleCanvas');
    this.scaleContext = this.scaleCanvas.getContext('2d');
	
	this.fpsVal = 60;
	
	this.REWARD_GAMMA = 0.9;
	this.TRAIN_EPOCH = 10;
	
	this.init();
	this.initNetwork();
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
	
	initNetwork: function () {
        this.network = new Network(); // [망구조] http://incredible.ai/artificial-intelligence/2017/06/03/Deep-Reinforcement-Learning/
        this.network.addLayer(new Layer_Convolution({width: 8, height: 8, depth: 4, num: 8}, 4, 1));
        this.network.addLayer(new Layer_Convolution({width: 4, height: 4, depth: 8, num: 16}, 2));
        this.network.addLayer(new Layer_Convolution({width: 3, height: 3, depth: 16, num: 8}, 1));
        this.network.addLayer(new Layer_Flatten());
        this.network.addLayer(new Layer_Linear(72, 50));
        this.network.addLayer(new Layer_ReLU());
        this.network.addLayer(new Layer_Linear(50, 3));
		
		this.network.setErrorLayer(new ErrorLayer_MSE());
		
		this.replayDataList = [];
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
		this.networkUpdate();
		
		if (!this.player.checkLive()) {
			this.networkLearning();
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
        
        let grayData = processImageData(context, this.scaleCanvas.width, this.scaleCanvas.height);
        this.dataList.push(grayData);
        drawImageData(this.scaleContext, grayData);
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
	
	networkUpdate: function () {
		if (!this.player.checkLive()) return ;
		if (this.dataList.length < 4) return ;
		
		let data = [];
		for (let i = 0; i < 4; i++) {
			data[i] = this.dataList.shift();
			data[i] = processData(data[i]);
		}

		let result = this.network.predict(data);
		result = result[0]; // result: Q(s, a)

		let maxIndex = 0;
		for (let i = 1; i < result.length; i++) {
			if (result[i] > result[maxIndex])
				maxIndex = i;
		}
		
		switch (maxIndex) {
			case 0: this.player.setMoveState("LEFT");  break;
			case 1: this.player.setMoveState("STOP");  break;
			case 2: this.player.setMoveState("RIGHT"); break;
		}
			
		// input(prevData), label(prevAction, prev reward, max reward of curr Data)
		if (this.prevData != null) {
			let label = [0, 0, 0];
			label[this.prevMaxIndex] += this.prevReward + this.REWARD_GAMMA * result[maxIndex];
			this.replayDataList.push([this.prevData, label]);
		}
			
		this.prevData = data;
		this.prevReward = this.score;
		this.prevMaxIndex = maxIndex;
	},
	networkLearning: function () {
		//TODO: replayDataList 섞기
		//TODO: 반복 학습
		for (let c = 0; c < this.TRAIN_EPOCH; c++) {
			for (let i = 0; i < this.replayDataList.length; i++) {
				console.log(i);
				let data = this.replayDataList[i][0], label = this.replayDataList[i][1];
				
				data = this.network.forward(data);
				for (let j = 0; j < 3; j++)
					data[0][j] += label[j];
				data = this.network.errorLayer.diff(data, [label]);
				this.network.backward(data);
			}
		}
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